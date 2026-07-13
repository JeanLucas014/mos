import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const userRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/user`, {
      headers: { "Authorization": authHeader, "apikey": Deno.env.get("SUPABASE_ANON_KEY")! },
    });
    if (!userRes.ok) return json({ error: "Unauthorized" }, 401);
    const user = await userRes.json();

    const { tipo, assunto, mensagem } = await req.json();
    if (!mensagem?.trim()) return json({ error: "Mensagem obrigatória" }, 400);

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) return json({ error: "Email não configurado" }, 500);

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "MOS App <noreply@jlmos.com.br>",
        to: ["contato@jlmos.com.br"],
        subject: `[MOS ${tipo}] ${assunto || "Sem assunto"}`,
        html: `
          <h2>Nova mensagem de suporte</h2>
          <p><strong>Tipo:</strong> ${tipo}</p>
          <p><strong>Usuário:</strong> ${user.email}</p>
          <p><strong>Assunto:</strong> ${assunto || "—"}</p>
          <hr/>
          <p>${mensagem.replace(/\n/g, "<br/>")}</p>
        `,
      }),
    });

    if (!emailRes.ok) {
      const err = await emailRes.text();
      console.error("[send-support] Resend error:", err);
      return json({ error: "Falha ao enviar email" }, 502);
    }

    return json({ ok: true });
  } catch (e) {
    console.error("[send-support]", e);
    return json({ error: String(e) }, 500);
  }
});
