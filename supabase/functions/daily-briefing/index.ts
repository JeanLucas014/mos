import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TZ = "America/Sao_Paulo";

/** "Today" in the user's local calendar day, independent of the server's own timezone. */
function todayLocal(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
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
    // Auth via REST direto
    const authHeader = req.headers.get("Authorization") ?? "";
    const userRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/user`, {
      headers: {
        "Authorization": authHeader,
        "apikey": Deno.env.get("SUPABASE_ANON_KEY")!,
      },
    });
    if (!userRes.ok) return json({ error: "Unauthorized" }, 401);
    const user = await userRes.json();
    if (!user?.id) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const today = todayLocal();
    const monthStart = today.slice(0, 7) + "-01";
    const sevenDaysAgo = addDays(today, -7);

    // Buscar dados em paralelo
    const [
      { data: tasksPending },
      { data: tasksOverdue },
      { data: habits },
      { data: habitLogs },
      { data: goals },
      { data: lancamentos },
      { data: sports },
    ] = await Promise.all([
      admin.from("tasks")
        .select("id, title, priority, due_date")
        .eq("user_id", user.id)
        .is("completed_at", null)
        .is("parent_id", null)
        .order("priority", { ascending: false })
        .limit(10),
      admin.from("tasks")
        .select("id, title, due_date")
        .eq("user_id", user.id)
        .is("completed_at", null)
        .lt("due_date", today)
        .limit(5),
      admin.from("habits")
        .select("id, name")
        .eq("user_id", user.id),
      admin.from("habit_logs")
        .select("habit_id, log_date")
        .eq("user_id", user.id)
        .eq("log_date", today),
      admin.from("goals")
        .select("name, progress")
        .eq("user_id", user.id)
        .order("progress", { ascending: true })
        .limit(5),
      admin.from("fin_lancamentos")
        .select("valor, natureza, is_grupo")
        .eq("user_id", user.id)
        .gte("data", monthStart)
        .lte("data", today),
      admin.from("sports")
        .select("sport, distance_m, duration_s, sport_date")
        .eq("user_id", user.id)
        .gte("sport_date", sevenDaysAgo)
        .order("sport_date", { ascending: false }),
    ]);

    // Processar financeiro
    const rows = (lancamentos ?? []).filter((r: any) => !r.is_grupo && r.valor != null);
    const receitas = rows.filter((r: any) => r.natureza === "receita").reduce((s: number, r: any) => s + r.valor, 0);
    const despesas = rows.filter((r: any) => r.natureza !== "receita").reduce((s: number, r: any) => s + r.valor, 0);
    const saldo = receitas - despesas;

    // Processar hábitos
    const doneHabitIds = new Set((habitLogs ?? []).map((l: any) => l.habit_id));
    const habitsDone = (habits ?? []).filter((h: any) => doneHabitIds.has(h.id));
    const habitsPending = (habits ?? []).filter((h: any) => !doneHabitIds.has(h.id));

    // Processar treinos
    const weekWorkouts = sports ?? [];
    const totalKmWeek = weekWorkouts
      .filter((w: any) => w.distance_m)
      .reduce((s: number, w: any) => s + w.distance_m, 0) / 1000;

    // Montar contexto para o Claude
    const context = `
Hoje é ${new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: TZ })}.

TAREFAS:
- Pendentes: ${(tasksPending ?? []).length} tarefas
- Atrasadas: ${(tasksOverdue ?? []).length} tarefas${(tasksOverdue ?? []).length > 0 ? ": " + (tasksOverdue ?? []).map((t: any) => t.title).join(", ") : ""}
- Prioridade alta hoje: ${(tasksPending ?? []).filter((t: any) => t.priority >= 3 && t.due_date === today).map((t: any) => t.title).join(", ") || "nenhuma para hoje"}

HÁBITOS:
- Completados hoje: ${habitsDone.length}/${(habits ?? []).length}${habitsDone.length > 0 ? " (" + habitsDone.map((h: any) => h.name).join(", ") + ")" : ""}
- Pendentes: ${habitsPending.map((h: any) => h.name).join(", ") || "todos feitos!"}

FINANCEIRO (mês atual):
- Receitas: R$ ${receitas.toFixed(2)}
- Despesas: R$ ${despesas.toFixed(2)}
- Saldo: R$ ${saldo.toFixed(2)} (${saldo >= 0 ? "positivo" : "negativo"})

TREINOS (últimos 7 dias):
- ${weekWorkouts.length} treinos realizados
- ${totalKmWeek.toFixed(1)} km rodados
- Último treino: ${weekWorkouts[0]?.sport_date ?? "nenhum recente"}

METAS EM ANDAMENTO:
${(goals ?? []).map((g: any) => `- ${g.name}: ${g.progress}% concluído`).join("\n") || "- Nenhuma meta cadastrada"}
`.trim();

    // Chamar API do Claude
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
        system: `Você é o assistente pessoal do MOS (My Operating System).
Gere um briefing diário conciso e direto ao ponto em português brasileiro.
Formato: 3 a 5 parágrafos curtos sem títulos nem bullets.
Tom: direto, encorajador mas honesto. Como um coach pessoal que conhece bem o usuário.
Foque no que realmente importa hoje e dê 1 ou 2 sugestões práticas baseadas nos dados.
Nunca use emojis. Máximo 250 palavras.`,
        messages: [
          {
            role: "user",
            content: `Com base nos meus dados de hoje, gere meu briefing diário:\n\n${context}`,
          },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text();
      console.error("[daily-briefing] Anthropic error:", err);
      return json({ error: "Falha ao gerar briefing" }, 502);
    }

    const anthropicData = await anthropicRes.json();
    const briefing = anthropicData.content?.[0]?.text ?? "";

    return json({
      briefing,
      generatedAt: new Date().toISOString(),
      context: {
        tasksPending: (tasksPending ?? []).length,
        tasksOverdue: (tasksOverdue ?? []).length,
        habitsDone: habitsDone.length,
        habitsTotal: (habits ?? []).length,
        saldo,
        weekWorkouts: weekWorkouts.length,
      },
    });
  } catch (err) {
    console.error("[daily-briefing]", err);
    return json({ error: String(err) }, 500);
  }
});
