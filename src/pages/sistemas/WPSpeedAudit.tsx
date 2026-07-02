import { useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Gauge,
  Zap,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Search,
  Smartphone,
  Monitor,
  ExternalLink,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Esforco = "baixo" | "medio" | "alto";
type Categoria = "opportunity" | "diagnostic";

interface PlaybookEntry {
  titulo: string;
  wp: string;
  esforco: Esforco;
  categoria: Categoria;
}

interface ResultItem extends PlaybookEntry {
  id: string;
  detalhe: string;
  displayValue: string | undefined;
  economiaMs: number;
  economiaBytes: number;
  scoreAudit: number | null;
}

interface CWVMetric {
  key: string;
  label: string;
  value: string | undefined;
  score: number | null;
}

interface AuditResult {
  score: number;
  finalUrl: string;
  metricas: CWVMetric[];
  opportunities: ResultItem[];
  diagnostics: ResultItem[];
  passou: ResultItem[];
}

// ─── Playbook ─────────────────────────────────────────────────────────────────

const WP_PLAYBOOK: Record<string, PlaybookEntry> = {
  "uses-optimized-images": {
    titulo: "Imagens sem compressão",
    wp: "Instale um plugin de otimização (ShortPixel, Imagify ou EWWW). Ative compressão automática no upload e recomprima a biblioteca de mídia inteira em lote.",
    esforco: "baixo",
    categoria: "opportunity",
  },
  "modern-image-formats": {
    titulo: "Servir imagens em WebP/AVIF",
    wp: "No ShortPixel/Imagify ative a entrega em WebP e AVIF. Se usar cache (WP Rocket / LiteSpeed), ligue a reescrita para servir WebP automaticamente sem quebrar o fallback.",
    esforco: "baixo",
    categoria: "opportunity",
  },
  "offscreen-images": {
    titulo: "Imagens fora da tela carregando cedo demais",
    wp: "Ative lazy load nativo (o WordPress já traz loading=\"lazy\"). Se o tema desativa, use WP Rocket ou o Perfmatters. Nunca aplique lazy load na imagem do LCP (topo da página).",
    esforco: "baixo",
    categoria: "opportunity",
  },
  "unminified-css": {
    titulo: "CSS não minificado",
    wp: "Ative minificação de CSS no WP Rocket, LiteSpeed Cache ou Autoptimize. Teste o layout depois — minificação raramente quebra, mas verifique o Elementor/Divi.",
    esforco: "baixo",
    categoria: "opportunity",
  },
  "unminified-javascript": {
    titulo: "JavaScript não minificado",
    wp: "Ative minificação de JS no plugin de cache. Comece por aqui antes de mexer em 'defer', que é mais arriscado.",
    esforco: "baixo",
    categoria: "opportunity",
  },
  "unused-css-rules": {
    titulo: "CSS não utilizado (grande em Elementor/Divi)",
    wp: "Use 'Remove Unused CSS' do WP Rocket ou do Perfmatters. Em sites Elementor isso costuma cortar 200–600 KB. Teste páginas-chave depois, pois pode remover estilos usados dinamicamente.",
    esforco: "medio",
    categoria: "opportunity",
  },
  "unused-javascript": {
    titulo: "JavaScript não utilizado",
    wp: "Use o Script Manager do Perfmatters para carregar scripts só nas páginas que precisam (ex.: plugin de formulário só na página de contato). Reduz muito o JS em páginas simples.",
    esforco: "medio",
    categoria: "opportunity",
  },
  "render-blocking-resources": {
    titulo: "Recursos que bloqueiam a renderização",
    wp: "Ative 'Optimize CSS Delivery' (Critical CSS) e defer de JS no WP Rocket / LiteSpeed. Este é geralmente o maior ganho de FCP/LCP em WordPress.",
    esforco: "medio",
    categoria: "opportunity",
  },
  "uses-text-compression": {
    titulo: "Compressão de texto (Gzip/Brotli) desligada",
    wp: "Ligue Gzip ou Brotli no servidor. Em LiteSpeed já vem no plugin. Em Apache/Nginx peça ao suporte da hospedagem ou ative via cache. Ganho grande e sem risco.",
    esforco: "baixo",
    categoria: "opportunity",
  },
  "uses-responsive-images": {
    titulo: "Imagens maiores que o necessário",
    wp: "Garanta que o tema usa srcset (padrão no WP). Redimensione uploads gigantes antes de subir. Defina tamanhos de imagem coerentes em Configurações > Mídia.",
    esforco: "medio",
    categoria: "opportunity",
  },
  "efficient-animated-content": {
    titulo: "GIFs pesados",
    wp: "Troque GIFs por vídeo MP4/WebM. GIFs de banner são frequentemente 5–10x maiores que o vídeo equivalente.",
    esforco: "medio",
    categoria: "opportunity",
  },
  "efficiently-encoded-images": {
    titulo: "Imagens com encoding ineficiente",
    wp: "Além de comprimir com ShortPixel/Imagify, garanta que JPEGs estão entre 70–85% de qualidade e que PNGs sem transparência foram convertidos para JPEG.",
    esforco: "baixo",
    categoria: "opportunity",
  },
  "uses-long-cache-ttl": {
    titulo: "Cache de recursos estáticos muito curto",
    wp: "Configure cabeçalhos de cache de longo prazo (1 ano) para CSS, JS, fontes e imagens. WP Rocket tem 'Browser Caching'. Em Apache edite o .htaccess ou use W3 Total Cache.",
    esforco: "baixo",
    categoria: "opportunity",
  },
  "third-party-facades": {
    titulo: "Scripts de terceiros sem facade",
    wp: "Use facades para YouTube, Vimeo, chat e mapas. WP Rocket tem 'Lazy Load para YouTube'. Adia o carregamento do player até o usuário clicar — economiza centenas de KB.",
    esforco: "medio",
    categoria: "opportunity",
  },
  "server-response-time": {
    titulo: "TTFB alto (servidor lento)",
    wp: "Ative cache de página (WP Rocket / LiteSpeed). Se o TTFB continuar alto, o gargalo é a hospedagem — considere um host melhor ou adicione object cache (Redis). Um CDN (Cloudflare) também ajuda.",
    esforco: "medio",
    categoria: "diagnostic",
  },
  "redirects": {
    titulo: "Redirecionamentos em cadeia",
    wp: "Aponte links internos direto para a URL final. Configure http→https e www→não-www em uma única regra no servidor, não empilhados.",
    esforco: "baixo",
    categoria: "diagnostic",
  },
  "uses-rel-preconnect": {
    titulo: "Faltam preconnect para domínios externos",
    wp: "Adicione preconnect para Google Fonts, Analytics e CDNs via Perfmatters ou WP Rocket (aba Preload). Reduz o tempo de conexão de terceiros.",
    esforco: "baixo",
    categoria: "diagnostic",
  },
  "font-display": {
    titulo: "Fontes bloqueando texto (FOIT)",
    wp: "Hospede fontes localmente (OMGF plugin) e force font-display: swap. Em vez de carregar do Google Fonts, sirva do seu próprio domínio.",
    esforco: "medio",
    categoria: "diagnostic",
  },
  "third-party-summary": {
    titulo: "Scripts de terceiros pesados",
    wp: "Adie chat, pixels e widgets com 'Delay JavaScript Execution' (WP Rocket) ou o Perfmatters. Carregam só após interação do usuário. Grande ganho sem remover funcionalidade.",
    esforco: "medio",
    categoria: "diagnostic",
  },
  "total-byte-weight": {
    titulo: "Página muito pesada no total",
    wp: "Ataque as três maiores fontes de peso: imagens (comprima), CSS não usado (remova) e scripts de terceiros (adie). Some os ganhos dos itens acima.",
    esforco: "medio",
    categoria: "diagnostic",
  },
  "dom-size": {
    titulo: "DOM excessivo (comum em Elementor/Divi)",
    wp: "Reduza aninhamento de seções/colunas no builder. Cada wrapper vazio conta. Considere blocos nativos ou GenerateBlocks em páginas críticas.",
    esforco: "alto",
    categoria: "diagnostic",
  },
  "largest-contentful-paint-element": {
    titulo: "Elemento LCP lento",
    wp: "Identifique o elemento do topo (geralmente a imagem hero). Faça preload dele, remova lazy load, e sirva em WebP já dimensionado. Este é o item que mais move a nota Core Web Vitals.",
    esforco: "medio",
    categoria: "diagnostic",
  },
  "layout-shift-elements": {
    titulo: "Layout instável (CLS)",
    wp: "Defina width e height em todas as imagens. Reserve espaço para banners de anúncio e embeds. Carregue fontes com swap + fallback de tamanho parecido.",
    esforco: "medio",
    categoria: "diagnostic",
  },
  "bootup-time": {
    titulo: "Tempo de execução de JS alto",
    wp: "Desative plugins que carregam JS em todo o site (use Perfmatters 'Script Manager' para carregar só onde precisa — ex.: contact form só na página de contato).",
    esforco: "medio",
    categoria: "diagnostic",
  },
  "mainthread-work-breakdown": {
    titulo: "Thread principal sobrecarregada",
    wp: "Mesma solução do item acima: reduza JS ativo por página com Script Manager e adie terceiros. Menos plugins ativos globalmente.",
    esforco: "medio",
    categoria: "diagnostic",
  },
  "non-composited-animations": {
    titulo: "Animações não compostas (travamentos visuais)",
    wp: "Use apenas CSS transform e opacity para animações — rodam na GPU sem bloquear a thread principal. Evite animar height, width, top, left ou margin.",
    esforco: "alto",
    categoria: "diagnostic",
  },
  "unsized-images": {
    titulo: "Imagens sem dimensões definidas",
    wp: "Adicione width e height em todas as tags img e nas imagens do tema/Elementor. Previne CLS e permite o browser reservar espaço antes do carregamento.",
    esforco: "baixo",
    categoria: "diagnostic",
  },
  "legacy-javascript": {
    titulo: "JavaScript legado desnecessário",
    wp: "Verifique se tema e plugins têm versões otimizadas para browsers modernos. Use o Safe Mode do WP Rocket para identificar qual plugin está gerando o JS legado.",
    esforco: "alto",
    categoria: "diagnostic",
  },
  "network-requests": {
    titulo: "Excesso de requisições HTTP",
    wp: "Combine CSS/JS para reduzir o número de arquivos. WP Rocket tem 'Combinar arquivos CSS' e 'Combinar arquivos JS'. Cada requisição tem overhead de latência.",
    esforco: "medio",
    categoria: "diagnostic",
  },
};

// ─── Constants ────────────────────────────────────────────────────────────────

const ESFORCO_COR: Record<Esforco, { bg: string; border: string; text: string; label: string }> = {
  baixo: { bg: "#0d2818", border: "#1a5c38", text: "#4ade80", label: "Rápido" },
  medio: { bg: "#2a2410", border: "#5c4d1a", text: "#fbbf24", label: "Médio" },
  alto: { bg: "#2a1210", border: "#5c241a", text: "#f87171", label: "Trabalhoso" },
};

const CWV_IDS = [
  { key: "largest-contentful-paint", label: "LCP" },
  { key: "first-contentful-paint", label: "FCP" },
  { key: "total-blocking-time", label: "TBT" },
  { key: "cumulative-layout-shift", label: "CLS" },
  { key: "speed-index", label: "SI" },
  { key: "interactive", label: "TTI" },
];

function cwvStatus(score: number | null): { label: string; color: string; bg: string; border: string } {
  if (score === null) return { label: "–", color: "#6b7280", bg: "#111111", border: "#1f1f1f" };
  if (score >= 0.9) return { label: "Bom", color: "#22c55e", bg: "#0d2818", border: "#1a5c38" };
  if (score >= 0.5) return { label: "Melhorar", color: "#f59e0b", bg: "#2a2410", border: "#5c4d1a" };
  return { label: "Crítico", color: "#ef4444", bg: "#2a1210", border: "#5c241a" };
}

function scoreColor(s: number | null): string {
  if (s === null || s === undefined) return "#6b7280";
  if (s >= 90) return "#22c55e";
  if (s >= 50) return "#f59e0b";
  return "#ef4444";
}

function scoreLabel(s: number | null): string {
  if (s === null) return "";
  if (s >= 90) return "Bom";
  if (s >= 50) return "Melhorar";
  return "Ruim";
}

function fmtBytes(b: number): string | null {
  if (!b) return null;
  if (b > 1024 * 1024) return (b / 1024 / 1024).toFixed(1) + " MB";
  return Math.round(b / 1024) + " KB";
}

function fmtMs(ms: number): string {
  return ms >= 1000 ? (ms / 1000).toFixed(1) + "s" : ms + "ms";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreGauge({ score, strategy }: { score: number; strategy: string }) {
  const color = scoreColor(score);
  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const r = 60;
  const strokeW = 10;

  // Arc: 270° from 135° to 405° (= 45° in standard coords)
  const startDeg = 135;
  const totalDeg = 270;
  const progressDeg = (score / 100) * totalDeg;

  function polarToXY(deg: number, radius: number) {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  function arcPath(fromDeg: number, toDeg: number) {
    const start = polarToXY(fromDeg, r);
    const end = polarToXY(toDeg, r);
    const large = toDeg - fromDeg > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background arc */}
        <path
          d={arcPath(startDeg, startDeg + totalDeg)}
          fill="none"
          stroke="#262626"
          strokeWidth={strokeW}
          strokeLinecap="round"
        />
        {/* Progress arc */}
        {score > 0 && (
          <path
            d={arcPath(startDeg, startDeg + progressDeg)}
            fill="none"
            stroke={color}
            strokeWidth={strokeW}
            strokeLinecap="round"
          />
        )}
        {/* Score text */}
        <text
          x={cx}
          y={cy + 6}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={color}
          fontSize={36}
          fontWeight={800}
          fontFamily="'Sora', sans-serif"
        >
          {score}
        </text>
      </svg>
      <div style={{ fontSize: 13, fontWeight: 700, color, marginTop: -8, fontFamily: "'Sora', sans-serif" }}>
        {scoreLabel(score)}
      </div>
      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
        {strategy === "mobile" ? <Smartphone size={11} /> : <Monitor size={11} />}
        {strategy === "mobile" ? "Mobile" : "Desktop"}
      </div>
    </div>
  );
}

function CWVCard({ metric }: { metric: CWVMetric }) {
  const st = cwvStatus(metric.score);
  return (
    <div style={{ background: st.bg, border: `1px solid ${st.border}`, borderRadius: 12, padding: "14px 14px" }}>
      <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {metric.label}
      </div>
      <div style={{ fontSize: 19, fontWeight: 700, fontFamily: "'Sora', sans-serif", color: "#e5e5e5", marginBottom: 4 }}>
        {metric.value ?? "–"}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: st.color }}>{metric.score !== null ? st.label : "–"}</div>
    </div>
  );
}

function QuickWins({ items }: { items: ResultItem[] }) {
  const wins = items.filter((p) => p.esforco === "baixo").slice(0, 3);
  if (wins.length === 0) return null;
  return (
    <div style={{ background: "#091520", border: "1px solid #0c3450", borderRadius: 12, padding: "18px 20px", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Zap size={15} color="#0ea5e9" fill="#0ea5e9" />
        <span style={{ fontSize: 13, fontWeight: 700, color: "#0ea5e9", fontFamily: "'Sora', sans-serif" }}>
          Vitórias rápidas — comece por aqui
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {wins.map((p, i) => (
          <div key={p.id} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#0ea5e9", fontFamily: "'Sora', sans-serif", minWidth: 18, paddingTop: 1 }}>
              {i + 1}.
            </span>
            <div>
              <span style={{ fontSize: 14, color: "#e5e5e5", fontWeight: 600 }}>{p.titulo}</span>
              {p.economiaMs > 0 && (
                <span style={{ fontSize: 12, color: "#0ea5e9", marginLeft: 8 }}>~{fmtMs(p.economiaMs)} mais rápido</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProblemItem({
  item,
  index,
  expanded,
  onToggle,
}: {
  item: ResultItem;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const cor = ESFORCO_COR[item.esforco];
  return (
    <div style={{ background: "#111111", border: "1px solid #1f1f1f", borderRadius: 12, overflow: "hidden" }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "16px 18px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          textAlign: "left",
          fontFamily: "inherit",
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: "#6b7280", fontFamily: "'Sora', sans-serif", minWidth: 20 }}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#f5f5f5", marginBottom: 4 }}>{item.titulo}</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 6,
                background: cor.bg,
                border: `1px solid ${cor.border}`,
                color: cor.text,
              }}
            >
              {cor.label}
            </span>
            {item.economiaMs > 0 && (
              <span style={{ fontSize: 12, color: "#0ea5e9", fontWeight: 600 }}>~{fmtMs(item.economiaMs)} mais rápido</span>
            )}
            {fmtBytes(item.economiaBytes) && (
              <span style={{ fontSize: 12, color: "#9ca3af" }}>economiza {fmtBytes(item.economiaBytes)}</span>
            )}
          </div>
        </div>
        {expanded ? <ChevronDown size={18} color="#6b7280" /> : <ChevronRight size={18} color="#6b7280" />}
      </button>
      {expanded && (
        <div style={{ padding: "0 18px 18px 52px" }}>
          <div style={{ background: "#0a0a0a", border: "1px solid #1f1f1f", borderRadius: 10, padding: 16 }}>
            <div
              style={{
                fontSize: 12,
                color: "#6b7280",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 8,
              }}
            >
              Como resolver no WordPress
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "#d4d4d4", margin: 0 }}>{item.wp}</p>
            {item.displayValue && (
              <p style={{ fontSize: 12.5, color: "#6b7280", marginTop: 12, marginBottom: 0 }}>
                Diagnóstico do Google: {item.displayValue}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type TabId = "oportunidades" | "diagnosticos" | "passou";

export default function WPSpeedAudit() {
  const [url, setUrl] = useState("");
  const [strategy, setStrategy] = useState<"mobile" | "desktop">("mobile");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<TabId>("oportunidades");

  async function runAudit() {
    setError(null);
    setResult(null);
    let target = url.trim();
    if (!target) { setError("Cole a URL do site."); return; }
    if (!/^https?:\/\//i.test(target)) target = "https://" + target;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pagespeed-proxy`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token ?? ""}`,
            "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ url: target, strategy }),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body?.error ?? `Erro ${res.status}`);
      }

      const data = await res.json();
      if (data?.error) throw new Error(data.error);

      const typedData = data as {
        lighthouseResult: {
          audits: Record<string, {
            score: number | null;
            scoreDisplayMode: string;
            displayValue?: string;
            title: string;
            details?: { overallSavingsMs?: number; overallSavingsBytes?: number };
            metricSavings?: { LCP?: number };
          }>;
          categories: { performance: { score: number | null } };
          finalDisplayedUrl?: string;
        };
      };
      const lh = typedData.lighthouseResult;
      const audits = lh.audits;
      const score = Math.round((lh.categories.performance.score ?? 0) * 100);

      const metricas: CWVMetric[] = CWV_IDS.map(({ key, label }) => ({
        key,
        label,
        value: audits[key]?.displayValue,
        score: audits[key]?.score ?? null,
      }));

      const sortItems = (a: ResultItem, b: ResultItem) => {
        if (b.economiaMs !== a.economiaMs) return b.economiaMs - a.economiaMs;
        const ord: Record<Esforco, number> = { baixo: 0, medio: 1, alto: 2 };
        return ord[a.esforco] - ord[b.esforco];
      };

      const opportunities: ResultItem[] = [];
      const diagnostics: ResultItem[] = [];
      const passou: ResultItem[] = [];

      for (const [id, guia] of Object.entries(WP_PLAYBOOK)) {
        const a = audits[id];
        if (!a) continue;
        const naoAplicavel = a.scoreDisplayMode === "notApplicable";
        if (naoAplicavel) continue;

        const economiaMs = Math.round(a.details?.overallSavingsMs ?? a.metricSavings?.LCP ?? 0);
        const economiaBytes = a.details?.overallSavingsBytes ?? 0;

        const item: ResultItem = {
          id,
          ...guia,
          detalhe: a.title,
          displayValue: a.displayValue,
          economiaMs,
          economiaBytes,
          scoreAudit: a.score,
        };

        if (a.score === 1) {
          passou.push(item);
        } else if (guia.categoria === "opportunity") {
          opportunities.push(item);
        } else {
          diagnostics.push(item);
        }
      }

      opportunities.sort(sortItems);
      diagnostics.sort(sortItems);

      setResult({
        score,
        finalUrl: lh.finalDisplayedUrl || target,
        metricas,
        opportunities,
        diagnostics,
        passou,
      });
      setActiveTab("oportunidades");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao auditar.";
      if (msg.toLowerCase().includes("failed to fetch") || msg.toLowerCase().includes("network")) {
        setError(
          "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente."
        );
      } else {
        setError(msg || "Falha ao auditar. Verifique a URL ou tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  function toggle(id: string) {
    setExpanded((p) => ({ ...p, [id]: !p[id] }));
  }

  const tabs: { id: TabId; label: string; count: number }[] = result
    ? [
        { id: "oportunidades", label: "Oportunidades", count: result.opportunities.length },
        { id: "diagnosticos", label: "Diagnósticos", count: result.diagnostics.length },
        { id: "passou", label: "Passou", count: result.passou.length },
      ]
    : [];

  const activeItems =
    result && activeTab === "oportunidades"
      ? result.opportunities
      : result && activeTab === "diagnosticos"
      ? result.diagnostics
      : result && activeTab === "passou"
      ? result.passou
      : [];

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: "24px 20px 80px" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "#0ea5e9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Zap size={22} color="#0a0a0a" fill="#0a0a0a" />
          </div>
          <h1
            style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: 24,
              fontWeight: 700,
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            WP Speed Audit
          </h1>
        </div>
        <p style={{ color: "#9ca3af", fontSize: 14, margin: 0, lineHeight: 1.5 }}>
          Analisa qualquer site WordPress com o PageSpeed Insights do Google e devolve um plano de ação — o que
          corrigir, em qual plugin, ordenado por impacto.
        </p>
      </div>

      {/* Form */}
      <div
        style={{
          background: "#111111",
          border: "1px solid #1f1f1f",
          borderRadius: 14,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <label style={{ fontSize: 13, color: "#9ca3af", display: "block", marginBottom: 8, fontWeight: 600 }}>
          URL do site
        </label>
        <div style={{ position: "relative", marginBottom: 16 }}>
          <Search size={16} color="#6b7280" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && runAudit()}
            placeholder="exemplo.com.br"
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "#0a0a0a",
              border: "1px solid #262626",
              borderRadius: 10,
              padding: "12px 14px 12px 40px",
              color: "#fff",
              fontSize: 15,
              outline: "none",
              fontFamily: "inherit",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {(["mobile", "desktop"] as const).map((val) => (
            <button
              key={val}
              onClick={() => setStrategy(val)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "9px 16px",
                borderRadius: 9,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "inherit",
                background: strategy === val ? "#0ea5e9" : "#0a0a0a",
                color: strategy === val ? "#0a0a0a" : "#9ca3af",
                border: `1px solid ${strategy === val ? "#0ea5e9" : "#262626"}`,
              }}
            >
              {val === "mobile" ? <Smartphone size={15} /> : <Monitor size={15} />}
              {val === "mobile" ? "Mobile" : "Desktop"}
            </button>
          ))}
        </div>

        <button
          onClick={runAudit}
          disabled={loading}
          style={{
            width: "100%",
            padding: "13px",
            borderRadius: 10,
            border: "none",
            cursor: loading ? "default" : "pointer",
            fontSize: 15,
            fontWeight: 700,
            fontFamily: "'Sora', sans-serif",
            background: loading ? "#1f1f1f" : "#0ea5e9",
            color: loading ? "#6b7280" : "#0a0a0a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 9,
          }}
        >
          {loading ? (
            <>
              <Loader2 size={17} className="spin" /> Analisando…
            </>
          ) : (
            <>
              <Gauge size={17} /> Auditar velocidade
            </>
          )}
        </button>
        {loading && (
          <p style={{ textAlign: "center", fontSize: 12.5, color: "#6b7280", marginTop: 12, marginBottom: 0 }}>
            O Google leva 10–30s para rodar o teste real na página.
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            background: "#2a1210",
            border: "1px solid #5c241a",
            borderRadius: 10,
            padding: 16,
            marginBottom: 24,
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <AlertTriangle size={18} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 14, color: "#fca5a5" }}>{error}</span>
        </div>
      )}

      {/* Results */}
      {result && (
        <div>
          {/* Score gauge + CWV cards */}
          <div style={{ display: "flex", gap: 20, marginBottom: 28, flexWrap: "wrap", alignItems: "flex-start" }}>
            <div
              style={{
                background: "#111111",
                border: "1px solid #1f1f1f",
                borderRadius: 14,
                padding: "24px 28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ScoreGauge score={result.score} strategy={strategy} />
            </div>
            <div
              style={{
                flex: 1,
                minWidth: 240,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(88px, 1fr))",
                gap: 10,
              }}
            >
              {result.metricas.filter((m) => m.value).map((m) => (
                <CWVCard key={m.key} metric={m} />
              ))}
            </div>
          </div>

          {/* Quick wins */}
          <QuickWins items={[...result.opportunities, ...result.diagnostics]} />

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #1f1f1f", marginBottom: 20 }}>
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    background: "none",
                    border: "none",
                    borderBottom: active ? "2px solid #0ea5e9" : "2px solid transparent",
                    cursor: "pointer",
                    padding: "10px 18px",
                    fontSize: 14,
                    fontWeight: 600,
                    color: active ? "#0ea5e9" : "#6b7280",
                    fontFamily: "inherit",
                    marginBottom: -1,
                    whiteSpace: "nowrap",
                  }}
                >
                  {tab.label}
                  <span
                    style={{
                      marginLeft: 6,
                      fontSize: 12,
                      background: active ? "#0c3450" : "#1f1f1f",
                      color: active ? "#0ea5e9" : "#6b7280",
                      borderRadius: 10,
                      padding: "1px 7px",
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          {activeTab === "passou" ? (
            activeItems.length === 0 ? (
              <div
                style={{
                  background: "#111111",
                  border: "1px solid #1f1f1f",
                  borderRadius: 12,
                  padding: 24,
                  color: "#6b7280",
                  fontSize: 14,
                  textAlign: "center",
                }}
              >
                Nenhum item do playbook marcado como aprovado nesta análise.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {activeItems.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      background: "#0d2818",
                      border: "1px solid #1a5c38",
                      borderRadius: 10,
                      padding: "12px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <CheckCircle2 size={16} color="#4ade80" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: "#86efac" }}>{p.titulo}</span>
                  </div>
                ))}
              </div>
            )
          ) : activeItems.length === 0 ? (
            <div
              style={{
                background: "#0d2818",
                border: "1px solid #1a5c38",
                borderRadius: 12,
                padding: 24,
                display: "flex",
                gap: 12,
                alignItems: "center",
              }}
            >
              <CheckCircle2 size={22} color="#4ade80" />
              <span style={{ color: "#86efac", fontSize: 15 }}>
                Nenhum problema detectado nesta categoria. Ótimo trabalho!
              </span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {activeItems.map((p, i) => (
                <ProblemItem
                  key={p.id}
                  item={p}
                  index={i}
                  expanded={!!expanded[p.id]}
                  onToggle={() => toggle(p.id)}
                />
              ))}
            </div>
          )}

          <a
            href={`https://pagespeed.web.dev/analysis?url=${encodeURIComponent(result.finalUrl)}`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginTop: 24,
              fontSize: 13,
              color: "#0ea5e9",
              textDecoration: "none",
            }}
          >
            Ver relatório completo no PageSpeed Insights <ExternalLink size={13} />
          </a>
        </div>
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #4b5563; }
        summary::-webkit-details-marker { display: none; }
      `}</style>
    </div>
  );
}
