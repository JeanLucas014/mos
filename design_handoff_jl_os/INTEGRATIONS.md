# INTEGRATIONS.md — JL OS

Como conectar as integrações de verdade e como tratar o cofre de senhas com segurança.

> **Regra de ouro de segurança:** segredos de OAuth (client secrets, access/refresh tokens)
> **NUNCA** ficam no frontend. Use **Supabase Edge Functions** (Deno) com secrets do projeto
> para qualquer troca de token. O frontend só fala com suas Edge Functions, nunca com a API
> do provider usando o secret.

Padrão recomendado para todas as integrações OAuth:
1. Frontend chama Edge Function `oauth-start?provider=X` → recebe a URL de autorização.
2. Usuário autoriza no provider → redireciona para `oauth-callback` (Edge Function).
3. A Edge Function troca o `code` por tokens, cifra e grava em `integrations`.
4. Frontend só lê `integrations.connected` e dados já normalizados.

Prioridade sugerida (MVP): **Google Agenda → GitHub → Vercel** (mais úteis no dia a dia).
Drive, Notion e Supabase podem ser fase 2.

---

## 1. Supabase (base — não é "integração", é o backend)
Já é o coração do sistema. No card de Integrações, mostre apenas como "conectado" (status do
projeto). Nada a fazer além do setup do `SETUP.md`.

---

## 2. Google Drive  (módulo Estudos / arquivos)
- **API:** Google Drive API v3. **Escopo:** `drive.readonly` (ou `drive.file`).
- **Fluxo:** OAuth 2.0 (mesmo app do Google Agenda — um único projeto no Google Cloud).
- **Uso no app:** listar arquivos de uma pasta específica ("JL OS / Estudos") e popular
  `study_files` (nome, tipo, `external_url` = webViewLink). Sincronização sob demanda
  (botão "atualizar") ou via Edge Function agendada.
- **Edge Function:** `drive-list` → recebe `folderId`, retorna arquivos normalizados.

---

## 3. Google Agenda  (módulo Agenda) — PRIORITÁRIO
- **API:** Google Calendar API v3. **Escopo:** `calendar.readonly` (ou `calendar.events` p/ escrever).
- **Mesmo projeto Google Cloud** do Drive (reaproveita client id/secret e tela de consentimento).
- **Sync de leitura:** Edge Function `gcal-sync` busca eventos do intervalo visível e faz
  upsert em `events` com `source='gcal'` e `external_id` (para não duplicar).
- **Cor da barra** por `category` (mapeie do `colorId`/summary do Google se quiser).
- **Escrita (opcional):** criar evento local com `source='gcal'` → empurrar para o Google.
- **Google Cloud Console:** criar OAuth Client (tipo Web), redirect URI = sua Edge Function
  `oauth-callback`. Ativar Calendar API e Drive API.

---

## 4. GitHub  (módulo Projetos / Dashboard) — PRIORITÁRIO
- **Auth:** GitHub OAuth App **ou** Personal Access Token (PAT) para single-user (mais simples no MVP).
  - MVP rápido: Jean gera um PAT (escopo `repo`, `read:user`) e cola nas configurações →
    cifrar e salvar em `integrations.access_token_cipher`.
- **API:** REST `https://api.github.com`. Útil:
  - `GET /user/repos?sort=updated` → repositórios recentes.
  - `GET /repos/{owner}/{repo}/commits` → últimos commits (mostrar em Projetos).
  - `GET /user` → avatar/login.
- **Edge Function:** `github-proxy` injeta o token (do `integrations`) e repassa a chamada,
  para o token nunca tocar o frontend.

---

## 5. Vercel  (módulo Projetos / status de deploy) — PRIORITÁRIO
- **Auth:** Vercel Access Token (criar em Vercel → Account Settings → Tokens). Cifrar e salvar.
- **API:** `https://api.vercel.com`. Útil:
  - `GET /v6/deployments?limit=10` → últimos deploys (estado: READY/ERROR/BUILDING).
  - `GET /v9/projects` → lista de projetos.
- **Uso:** mostrar status do último deploy de cada app do Jean num projeto/dashboard.
- **Edge Function:** `vercel-proxy` (mesmo padrão do GitHub).

---

## 6. Cofre de Senhas — criptografia (módulo Senhas) ⚠️
**Modelo zero-knowledge no cliente:**
1. Jean define um **master password** (não é a senha do login). Ele nunca vai ao servidor.
2. Derivar chave AES com **PBKDF2** (Web Crypto): `crypto.subtle.deriveKey` a partir do
   master password + salt (salt pode ser guardado no `profiles`).
3. Ao salvar uma senha: gerar IV aleatório (12 bytes), cifrar com **AES-GCM**, guardar
   `password_cipher` (base64) + `password_iv` (base64) em `vault_items`.
4. Ao revelar: decifrar no cliente sob demanda. O servidor só vê ciphertext.
5. A chave derivada vive só em memória durante a sessão (não em localStorage).

Esqueleto (`src/lib/crypto.ts`):
```ts
export async function deriveKey(master: string, saltB64: string) {
  const enc = new TextEncoder();
  const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
  const baseKey = await crypto.subtle.importKey('raw', enc.encode(master), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 150_000, hash: 'SHA-256' },
    baseKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export async function encrypt(key: CryptoKey, text: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(text));
  return { cipher: btoa(String.fromCharCode(...new Uint8Array(ct))), iv: btoa(String.fromCharCode(...iv)) };
}
export async function decrypt(key: CryptoKey, cipherB64: string, ivB64: string) {
  const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
  const ct = Uint8Array.from(atob(cipherB64), c => c.charCodeAt(0));
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return new TextDecoder().decode(pt);
}
```

---

## 7. Notion  (módulo Notas — opcional, fase 2)
- **API:** Notion API (`https://api.notion.com/v1`). Integração interna + token.
- **Uso:** importar páginas/bases para `notes` ou listar como referência em Estudos.
- **Edge Function:** `notion-proxy`. Escopo conforme o que o Jean compartilhar com a integração.

---

## 8. App Finanças do Jean (opcional)
O Jean já tem o **App Finanças** (React+Vite) em `financeiro-2026.vercel.app`. Duas opções:
- **Compartilhar banco:** se aquele app já usa Supabase, apontar `transactions` para o mesmo
  projeto/tabela (cuidado com schema/RLS).
- **Manter separado:** o módulo Financeiro do JL OS é independente e o card só linka para o app.
Decidir com o Jean — no MVP, manter separado é mais simples.

---

## Resumo de Edge Functions a criar
| Function | Faz |
|----------|-----|
| `oauth-start` | gera URL de autorização (Google) |
| `oauth-callback` | troca code→token, cifra, grava em `integrations` |
| `gcal-sync` | importa eventos do Google Calendar → `events` |
| `drive-list` | lista arquivos de uma pasta do Drive |
| `github-proxy` | chamadas à API do GitHub com token injetado |
| `vercel-proxy` | chamadas à API da Vercel com token injetado |
| `notion-proxy` | (fase 2) chamadas à API do Notion |

Secrets via `supabase secrets set NOME=valor` (ver SETUP.md §5).
