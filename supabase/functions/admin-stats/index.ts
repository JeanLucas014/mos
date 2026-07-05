import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const JEAN_ID = "64ab5956-18b1-432d-82f0-1ad8bc4761db";
const DEMO_ID = "5bb498d8-e717-4b61-8d14-143529b4c14f";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";

    // Verificar que é o Jean
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user || user.id !== JEAN_ID) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin client com service role
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Buscar todos os usuários
    const { data: { users }, error: usersError } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (usersError) throw usersError;

    const realUsers = users.filter((u) => u.id !== DEMO_ID);
    const now = Date.now();
    const D = (days: number) => new Date(now - days * 86400000);

    const totalUsers = realUsers.length;
    const newThisWeek = realUsers.filter((u) => new Date(u.created_at) >= D(7)).length;
    const newLastWeek = realUsers.filter((u) => new Date(u.created_at) >= D(14) && new Date(u.created_at) < D(7)).length;
    const activeThisWeek = realUsers.filter((u) => u.last_sign_in_at && new Date(u.last_sign_in_at) >= D(7)).length;
    const activeThisMonth = realUsers.filter((u) => u.last_sign_in_at && new Date(u.last_sign_in_at) >= D(30)).length;

    // Cadastros por dia (30 dias)
    const dailyMap: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      dailyMap[D(i).toISOString().slice(0, 10)] = 0;
    }
    realUsers.forEach((u) => {
      const k = u.created_at.slice(0, 10);
      if (k in dailyMap) dailyMap[k]++;
    });
    const dailySignups = Object.entries(dailyMap).map(([date, count]) => ({ date, count }));

    // Cadastros recentes
    const recentSignups = [...realUsers]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 15)
      .map((u) => ({
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        email_confirmed: !!u.email_confirmed_at,
      }));

    // Módulos via user_settings
    const { data: settings } = await admin
      .from("user_settings")
      .select("enabled_modules, onboarding_completed, user_id")
      .neq("user_id", DEMO_ID);

    const moduleCount: Record<string, number> = {};
    let onboardingCompleted = 0;
    (settings ?? []).forEach((s: any) => {
      if (s.onboarding_completed) onboardingCompleted++;
      (s.enabled_modules ?? []).forEach((m: string) => {
        moduleCount[m] = (moduleCount[m] ?? 0) + 1;
      });
    });

    const moduleAdoption = Object.entries(moduleCount)
      .map(([module, count]) => ({ module, count, pct: totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0 }))
      .sort((a, b) => b.count - a.count);

    return new Response(JSON.stringify({
      totalUsers, newThisWeek, newLastWeek, activeThisWeek, activeThisMonth,
      onboardingCompleted,
      onboardingRate: totalUsers > 0 ? Math.round((onboardingCompleted / totalUsers) * 100) : 0,
      dailySignups, moduleAdoption, recentSignups,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
