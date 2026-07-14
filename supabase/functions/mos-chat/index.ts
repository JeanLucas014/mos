import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TZ = "America/Sao_Paulo";

/** "Today" in the user's local calendar day, independent of the server's own timezone. */
function todayLocalParts(): { date: string; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return { date: `${get("year")}-${get("month")}-${get("day")}`, day: Number(get("day")) };
}

/** Pure calendar-day arithmetic on a "YYYY-MM-DD" string — no timezone conversion involved. */
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  try {
    // Auth
    const authHeader = req.headers.get("Authorization") ?? "";
    const userRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/user`, {
      headers: { "Authorization": authHeader, "apikey": Deno.env.get("SUPABASE_ANON_KEY")! },
    });
    if (!userRes.ok) return json({ error: "Unauthorized" }, 401);
    const user = await userRes.json();
    if (!user?.id) return json({ error: "Unauthorized" }, 401);

    const { messages } = await req.json();

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { date: today, day: todayDay } = todayLocalParts();
    const monthStart = today.slice(0, 7) + "-01";

    // Buscar dados em paralelo
    const [
      { data: tasks },
      { data: habits },
      { data: habitLogs },
      { data: goals },
      { data: lancamentos },
      { data: sports },
      { data: recorrentes },
      { data: events },
    ] = await Promise.all([
      admin.from("tasks").select("id, title, priority, due_date, completed_at")
        .eq("user_id", user.id).is("parent_id", null)
        .is("completed_at", null).order("due_date").limit(20),
      admin.from("habits").select("id, name").eq("user_id", user.id),
      admin.from("habit_logs").select("habit_id").eq("user_id", user.id).eq("log_date", today),
      admin.from("goals").select("name, progress").eq("user_id", user.id),
      admin.from("fin_lancamentos").select("valor, natureza, is_grupo")
        .eq("user_id", user.id).gte("data", monthStart).lte("data", today),
      admin.from("sports").select("sport, distance_m, duration_s, sport_date")
        .eq("user_id", user.id).gte("sport_date", addDays(today, -7))
        .order("sport_date", { ascending: false }),
      admin.from("fin_recorrentes").select("nome, valor, dia_previsto")
        .eq("user_id", user.id).eq("ativo", true).eq("natureza", "saida"),
      admin.from("calendar_events").select("title, start_at")
        .eq("user_id", user.id).gte("start_at", new Date().toISOString())
        .order("start_at").limit(5),
    ]);

    // Processar financeiro — natureza real: "entrada" / "saida" / "diario"
    const rows = (lancamentos ?? []).filter((r: any) => !r.is_grupo && r.valor != null);
    const receitas = rows.filter((r: any) => r.natureza === "entrada")
      .reduce((s: number, r: any) => s + Number(r.valor), 0);
    const despesas = rows.filter((r: any) => r.natureza === "saida")
      .reduce((s: number, r: any) => s + Number(r.valor), 0);

    const doneIds = new Set((habitLogs ?? []).map((l: any) => l.habit_id));
    const habitsDone = (habits ?? []).filter((h: any) => doneIds.has(h.id));
    const habitsPending = (habits ?? []).filter((h: any) => !doneIds.has(h.id));

    const overdueDate = today;
    const overdue = (tasks ?? []).filter((t: any) => t.due_date && t.due_date < overdueDate);
    const todayTasks = (tasks ?? []).filter((t: any) => t.due_date === today);
    const contasVencidas = (recorrentes ?? []).filter((r: any) => r.dia_previsto < todayDay);
    const contasHoje = (recorrentes ?? []).filter((r: any) => r.dia_previsto === todayDay);

    const weekKm = (sports ?? [])
      .filter((s: any) => s.distance_m)
      .reduce((sum: number, s: any) => sum + s.distance_m, 0) / 1000;

    const context = `
Você é o assistente pessoal inteligente do MOS (My Operating System) do Jean Lucas.
Você tem acesso em tempo real a todos os dados do Jean e pode responder perguntas e simular ações.

DATA ATUAL: ${new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: TZ })}

FINANCEIRO (${new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: TZ })}):
- Receitas: R$ ${receitas.toFixed(2)}
- Despesas: R$ ${despesas.toFixed(2)}
- Saldo: R$ ${(receitas - despesas).toFixed(2)} (${receitas - despesas >= 0 ? "positivo" : "negativo"})
${contasVencidas.length > 0 ? `- Contas vencidas: ${contasVencidas.map((r: any) => r.nome).join(", ")}` : ""}
${contasHoje.length > 0 ? `- Vence hoje: ${contasHoje.map((r: any) => r.nome).join(", ")}` : ""}

TAREFAS:
- Total pendentes: ${(tasks ?? []).length}
- Atrasadas: ${overdue.length}${overdue.length > 0 ? ` (${overdue.map((t: any) => t.title).join(", ")})` : ""}
- Para hoje: ${todayTasks.length}${todayTasks.length > 0 ? ` (${todayTasks.map((t: any) => t.title).join(", ")})` : ""}
- Pendentes: ${(tasks ?? []).map((t: any) => `${t.title}${t.due_date ? ` (${t.due_date})` : ""}`).join(", ")}

HÁBITOS:
- Completados hoje: ${habitsDone.length}/${(habits ?? []).length}
- Pendentes: ${habitsPending.map((h: any) => h.name).join(", ") || "nenhum"}
- Completos: ${habitsDone.map((h: any) => h.name).join(", ") || "nenhum"}

ESPORTES (últimos 7 dias):
- Treinos: ${(sports ?? []).length}
- Km totais: ${weekKm.toFixed(1)} km

METAS:
${(goals ?? []).map((g: any) => `- ${g.name}: ${g.progress}%`).join("\n") || "- Nenhuma meta"}

AGENDA (próximos eventos):
${(events ?? []).map((e: any) => `- ${new Date(e.start_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} — ${e.title}`).join("\n") || "- Sem eventos próximos"}

REGRAS:
- Responda sempre em português brasileiro
- Seja direto e conciso — máximo 3 parágrafos
- Quando o usuário pedir para criar/registrar algo, confirme que foi feito (a integração real será adicionada depois)
- Nunca use emojis
- Tom: assistente pessoal inteligente, próximo, direto
- Máximo 180 palavras por resposta
- Se o usuário perguntar sobre algo que não está nos dados, diga que não encontrou essa informação
`.trim();

    // Chamar Claude
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        system: context,
        messages,
      }),
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text();
      console.error("[mos-chat] Anthropic error:", err);
      return json({ error: "Falha ao gerar resposta" }, 502);
    }

    const data = await anthropicRes.json();
    const reply = data.content?.[0]?.text ?? "Não consegui processar sua pergunta.";

    return json({ reply });
  } catch (e) {
    console.error("[mos-chat]", e);
    return json({ error: String(e) }, 500);
  }
});
