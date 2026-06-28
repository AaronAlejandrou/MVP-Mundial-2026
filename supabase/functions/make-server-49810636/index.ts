import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2.49.8";
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";

let _client: SupabaseClient | null = null;
function getDb(): SupabaseClient {
  if (!_client) {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) throw new Error("Missing env vars");
    _client = createClient(url, key, { auth: { persistSession: false } });
  }
  return _client;
}

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const buf  = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}
function generateToken(): string { return crypto.randomUUID(); }
function generateCode(): string  { return `MUND-${Math.random().toString(36).substring(2,8).toUpperCase()}`; }
function isAdmin(email: string): boolean {
  const adminEmail = Deno.env.get("ADMIN_EMAIL");
  return adminEmail ? email === adminEmail : false;
}

// ── Fechas de partidos — DEBE mantenerse en sync con src/data/groupStageMatches.ts ──
const MATCH_DATES: Record<number, string> = {
  1:'2026-06-11T14:00:00-05:00', 2:'2026-06-11T21:00:00-05:00',
  3:'2026-06-18T11:00:00-05:00', 4:'2026-06-18T20:00:00-05:00',
  5:'2026-06-24T20:00:00-05:00', 6:'2026-06-24T20:00:00-05:00',
  7:'2026-06-12T14:00:00-05:00', 8:'2026-06-13T14:00:00-05:00',
  9:'2026-06-18T14:00:00-05:00', 10:'2026-06-18T17:00:00-05:00',
  11:'2026-06-24T14:00:00-05:00', 12:'2026-06-24T14:00:00-05:00',
  13:'2026-06-13T17:00:00-05:00', 14:'2026-06-13T20:00:00-05:00',
  15:'2026-06-19T17:00:00-05:00', 16:'2026-06-19T19:30:00-05:00',
  17:'2026-06-24T17:00:00-05:00', 18:'2026-06-24T17:00:00-05:00',
  19:'2026-06-12T20:00:00-05:00', 20:'2026-06-13T23:00:00-05:00',
  21:'2026-06-19T14:00:00-05:00', 22:'2026-06-19T22:00:00-05:00',
  23:'2026-06-25T21:00:00-05:00', 24:'2026-06-25T21:00:00-05:00',
  25:'2026-06-14T12:00:00-05:00', 26:'2026-06-14T18:00:00-05:00',
  27:'2026-06-20T15:00:00-05:00', 28:'2026-06-20T19:00:00-05:00',
  29:'2026-06-25T15:00:00-05:00', 30:'2026-06-25T15:00:00-05:00',
  31:'2026-06-14T15:00:00-05:00', 32:'2026-06-14T21:00:00-05:00',
  33:'2026-06-20T12:00:00-05:00', 34:'2026-06-20T23:00:00-05:00',
  35:'2026-06-25T18:00:00-05:00', 36:'2026-06-25T18:00:00-05:00',
  37:'2026-06-15T14:00:00-05:00', 38:'2026-06-15T20:00:00-05:00',
  39:'2026-06-21T14:00:00-05:00', 40:'2026-06-21T20:00:00-05:00',
  41:'2026-06-26T22:00:00-05:00', 42:'2026-06-26T22:00:00-05:00',
  43:'2026-06-15T11:00:00-05:00', 44:'2026-06-15T17:00:00-05:00',
  45:'2026-06-21T11:00:00-05:00', 46:'2026-06-21T17:00:00-05:00',
  47:'2026-06-26T19:00:00-05:00', 48:'2026-06-26T19:00:00-05:00',
  49:'2026-06-16T14:00:00-05:00', 50:'2026-06-16T17:00:00-05:00',
  51:'2026-06-22T16:00:00-05:00', 52:'2026-06-22T19:00:00-05:00',
  53:'2026-06-26T14:00:00-05:00', 54:'2026-06-26T14:00:00-05:00',
  55:'2026-06-16T20:00:00-05:00', 56:'2026-06-16T23:00:00-05:00',
  57:'2026-06-22T12:00:00-05:00', 58:'2026-06-22T22:00:00-05:00',
  59:'2026-06-27T21:00:00-05:00', 60:'2026-06-27T21:00:00-05:00',
  61:'2026-06-17T12:00:00-05:00', 62:'2026-06-17T21:00:00-05:00',
  63:'2026-06-23T12:00:00-05:00', 64:'2026-06-23T21:00:00-05:00',
  65:'2026-06-27T18:30:00-05:00', 66:'2026-06-27T18:30:00-05:00',
  67:'2026-06-17T15:00:00-05:00', 68:'2026-06-17T18:00:00-05:00',
  69:'2026-06-23T15:00:00-05:00', 70:'2026-06-23T18:00:00-05:00',
  71:'2026-06-27T16:00:00-05:00', 72:'2026-06-27T16:00:00-05:00',
  // ── Fase eliminatoria (73-104) — sync con src/data/knockoutMatches.ts ──
  73:'2026-06-28T14:00:00-05:00', 74:'2026-06-29T15:30:00-05:00',
  75:'2026-06-29T20:00:00-05:00', 76:'2026-06-29T12:00:00-05:00',
  77:'2026-06-30T16:00:00-05:00', 78:'2026-06-30T12:00:00-05:00',
  79:'2026-06-30T20:00:00-05:00', 80:'2026-07-01T11:00:00-05:00',
  81:'2026-07-01T19:00:00-05:00', 82:'2026-07-01T15:00:00-05:00',
  83:'2026-07-02T18:00:00-05:00', 84:'2026-07-02T14:00:00-05:00',
  85:'2026-07-02T22:00:00-05:00', 86:'2026-07-03T17:00:00-05:00',
  87:'2026-07-03T20:30:00-05:00', 88:'2026-07-03T13:00:00-05:00',
  89:'2026-07-04T17:00:00-05:00', 90:'2026-07-04T12:00:00-05:00',
  91:'2026-07-05T16:00:00-05:00', 92:'2026-07-05T18:00:00-05:00',
  93:'2026-07-06T14:00:00-05:00', 94:'2026-07-06T17:00:00-05:00',
  95:'2026-07-07T12:00:00-05:00', 96:'2026-07-07T13:00:00-05:00',
  97:'2026-07-09T16:00:00-05:00', 98:'2026-07-10T12:00:00-05:00',
  99:'2026-07-11T17:00:00-05:00', 100:'2026-07-11T20:00:00-05:00',
  101:'2026-07-14T14:00:00-05:00', 102:'2026-07-15T15:00:00-05:00',
  103:'2026-07-18T17:00:00-05:00', 104:'2026-07-19T15:00:00-05:00',
};

function isMatchLocked(matchId: number): boolean {
  const dateStr = MATCH_DATES[matchId];
  if (!dateStr) return true;
  const diffMin = (new Date(dateStr).getTime() - Date.now()) / 60000;
  return diffMin <= 25;
}

const app = new Hono();
app.use("*", logger(console.log));
const ALLOWED_ORIGINS = [
  "https://pollamundial2026-coral.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
];
app.use("/*", cors({
  origin: (origin) => ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  maxAge: 600,
}));

const requireAuth = async (c: any, next: any) => {
  const h = c.req.header("Authorization");
  if (!h?.startsWith("Bearer ")) return c.json({ error: "Unauthorized" }, 401);
  const token = h.split(" ")[1];
  const db = getDb();
  const { data: session } = await db.from("sessions").select("user_id, expires_at").eq("token", token).maybeSingle();
  if (!session) return c.json({ error: "Invalid token" }, 401);
  if (new Date(session.expires_at) < new Date()) {
    await db.from("sessions").delete().eq("token", token);
    return c.json({ error: "Session expired" }, 401);
  }
  const { data: user } = await db.from("users").select("id, email, nombre").eq("id", session.user_id).maybeSingle();
  if (!user) return c.json({ error: "User not found" }, 401);
  c.set("user", user);
  await next();
};

app.get("/make-server-49810636/health", (c) => c.json({ status:"ok", version:"4.0.0-bracket", timestamp: new Date().toISOString() }));

// ── Auth ─────────────────────────────────────────────────────────────────────

app.post("/make-server-49810636/auth/signup", async (c) => {
  try {
    const { email, password, nombre } = await c.req.json();
    if (!email || !password || !nombre) return c.json({ error: "Faltan campos: email, password, nombre" }, 400);
    if (password.length < 6) return c.json({ error: "La contrasena debe tener al menos 6 caracteres" }, 400);
    const db = getDb();
    const { data: existing } = await db.from("users").select("id").eq("email", email).maybeSingle();
    if (existing) return c.json({ error: "Este email ya esta registrado" }, 400);
    const { data: newUser, error } = await db.from("users").insert({ email, nombre, password_hash: await hashPassword(password) }).select("id, email, nombre").single();
    if (error || !newUser) return c.json({ error: "Error al crear la cuenta" }, 500);
    const token = generateToken();
    await db.from("sessions").insert({ token, user_id: newUser.id });
    const { count: adminCount } = await db.from("leagues").select("*", { count:"exact", head:true }).eq("admin_id", newUser.id);
    return c.json({ token, user: { ...newUser, is_admin: isAdmin(newUser.email) || (adminCount ?? 0) > 0 } });
  } catch(err) { return c.json({ error:"Error interno", details:String(err) }, 500); }
});

app.post("/make-server-49810636/auth/signin", async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) return c.json({ error: "Faltan email o contrasena" }, 400);
    const db = getDb();
    const { data: user } = await db.from("users").select("id, email, nombre, password_hash").eq("email", email).maybeSingle();
    if (!user) return c.json({ error: "Email o contrasena incorrectos" }, 401);
    if (await hashPassword(password) !== user.password_hash) return c.json({ error: "Email o contrasena incorrectos" }, 401);
    const token = generateToken();
    await db.from("sessions").insert({ token, user_id: user.id });
    const { count: adminCount } = await db.from("leagues").select("*", { count:"exact", head:true }).eq("admin_id", user.id);
    return c.json({ token, user: { id:user.id, email:user.email, nombre:user.nombre, is_admin: isAdmin(user.email) || (adminCount ?? 0) > 0 } });
  } catch(err) { return c.json({ error:"Error interno", details:String(err) }, 500); }
});

app.get("/make-server-49810636/auth/me", requireAuth, async (c) => {
  const user = c.get("user");
  const db = getDb();
  const { count } = await db.from("leagues").select("*", { count:"exact", head:true }).eq("admin_id", user.id);
  return c.json({ user: { ...user, is_admin: isAdmin(user.email) || (count ?? 0) > 0 } });
});

app.post("/make-server-49810636/auth/logout", requireAuth, async (c) => {
  const token = c.req.header("Authorization")!.split(" ")[1];
  await getDb().from("sessions").delete().eq("token", token);
  return c.json({ message: "Sesion cerrada" });
});

// ── Ligas ─────────────────────────────────────────────────────────────────────

app.get("/make-server-49810636/leagues/any", async (c) => {
  try {
    const { count } = await getDb().from("leagues").select("*", { count:"exact", head:true });
    return c.json({ exists: (count ?? 0) > 0 });
  } catch { return c.json({ exists: false }); }
});

app.post("/make-server-49810636/leagues", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    if (!isAdmin(user.email)) return c.json({ error: "Solo el administrador puede crear la liga." }, 403);
    const db = getDb();
    const { nombre, invitation_code: invCode } = await c.req.json();
    if (!nombre?.trim()) return c.json({ error: "El nombre de la liga es requerido" }, 400);
    if (!invCode?.trim()) return c.json({ error: "El codigo de invitacion es requerido" }, 400);
    const { data: league, error } = await db.from("leagues").insert({ nombre: nombre.trim(), admin_id: user.id, invitation_code: invCode.trim().toUpperCase() }).select("id, nombre, admin_id, invitation_code").single();
    if (error || !league) return c.json({ error: "Error al crear la liga" }, 500);
    await db.from("league_members").insert({ league_id: league.id, user_id: user.id, status: "active" });
    await db.from("scores").insert({ league_id: league.id, user_id: user.id, total: 0 });
    await db.from("league_phase").insert({ league_id: league.id, group_stage_open: true, bracket_locked: false });
    // Auto-sync: copiar resultados ya finalizados de la liga más antigua (sin otorgar puntos)
    const { data: master } = await db.from("leagues").select("id").neq("id", league.id).order("created_at", { ascending: true }).limit(1).maybeSingle();
    if (master) {
      const { data: fin } = await db.from("match_results").select("match_id, goles_a, goles_b, api_status, minuto, segundo_tiempo_inicio").eq("league_id", master.id).eq("estado", "finalizado");
      if (fin?.length) {
        await db.from("match_results").insert(fin.map((r: any) => ({ match_id: r.match_id, league_id: league.id, goles_a: r.goles_a, goles_b: r.goles_b, estado: "finalizado", source: "auto", api_status: r.api_status, minuto: r.minuto, segundo_tiempo_inicio: r.segundo_tiempo_inicio })));
      }
    }
    return c.json({ league: { id: league.id, nombre: league.nombre, admin_id: league.admin_id, invitationCode: league.invitation_code, member_count: 1 } });
  } catch(err) { return c.json({ error:"Error interno", details:String(err) }, 500); }
});

app.post("/make-server-49810636/leagues/:leagueId/sync-results", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const leagueId = c.req.param("leagueId");
    const db = getDb();
    const { data: league } = await db.from("leagues").select("id, admin_id").eq("id", leagueId).maybeSingle();
    if (!league) return c.json({ error: "Liga no encontrada" }, 404);
    if (league.admin_id !== user.id && !isAdmin(user.email)) return c.json({ error: "No autorizado" }, 403);
    const { data: master } = await db.from("leagues").select("id").neq("id", leagueId).order("created_at", { ascending: true }).limit(1).maybeSingle();
    if (!master) return c.json({ synced: 0 });
    const { data: fin } = await db.from("match_results").select("match_id, goles_a, goles_b, api_status, minuto, segundo_tiempo_inicio").eq("league_id", master.id).eq("estado", "finalizado");
    if (!fin?.length) return c.json({ synced: 0 });
    const { data: existing } = await db.from("match_results").select("match_id").eq("league_id", leagueId);
    const existingIds = new Set((existing || []).map((r: any) => r.match_id));
    const toInsert = fin.filter((r: any) => !existingIds.has(r.match_id)).map((r: any) => ({ match_id: r.match_id, league_id: leagueId, goles_a: r.goles_a, goles_b: r.goles_b, estado: "finalizado", source: "auto", api_status: r.api_status, minuto: r.minuto, segundo_tiempo_inicio: r.segundo_tiempo_inicio }));
    if (!toInsert.length) return c.json({ synced: 0 });
    await db.from("match_results").insert(toInsert);
    return c.json({ synced: toInsert.length });
  } catch(err) { return c.json({ error: "Error interno", details: String(err) }, 500); }
});

app.get("/make-server-49810636/leagues/my", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const db = getDb();
    const { data: memberships } = await db.from("league_members").select("league_id, status, leagues(id, nombre, admin_id, invitation_code)").eq("user_id", user.id).eq("status", "active");
    const leagues = await Promise.all((memberships || []).map(async (m: any) => {
      const { count } = await db.from("league_members").select("*", { count:"exact", head:true }).eq("league_id", m.leagues.id).eq("status", "active");
      return { id:m.leagues.id, nombre:m.leagues.nombre, admin_id:m.leagues.admin_id, invitationCode:m.leagues.invitation_code, member_count: count ?? 1 };
    }));
    return c.json({ leagues });
  } catch(err) { return c.json({ error:"Error interno", details:String(err) }, 500); }
});

app.get("/make-server-49810636/leagues/code/:code", async (c) => {
  try {
    const code = c.req.param("code").toUpperCase();
    const { data: league } = await getDb().from("leagues").select("id, nombre, admin_id, invitation_code").eq("invitation_code", code).maybeSingle();
    if (!league) return c.json({ error: "Codigo de invitacion invalido" }, 404);
    return c.json({ league: { id:league.id, nombre:league.nombre, admin_id:league.admin_id, invitationCode:league.invitation_code } });
  } catch(err) { return c.json({ error:"Error interno", details:String(err) }, 500); }
});

app.post("/make-server-49810636/leagues/:leagueId/join", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const leagueId = c.req.param("leagueId");
    const db = getDb();
    const { data: league } = await db.from("leagues").select("id").eq("id", leagueId).maybeSingle();
    if (!league) return c.json({ error: "Liga no encontrada" }, 404);
    const { data: existing } = await db.from("league_members").select("status").eq("league_id", leagueId).eq("user_id", user.id).maybeSingle();
    if (existing?.status === "active") return c.json({ error: "Ya eres miembro" }, 400);
    if (existing?.status === "pending") return c.json({ error: "Solicitud ya pendiente" }, 400);
    await db.from("league_members").insert({ league_id: leagueId, user_id: user.id, status: "pending" });
    return c.json({ message: "Solicitud enviada, esperando aprobacion" });
  } catch(err) { return c.json({ error:"Error interno", details:String(err) }, 500); }
});

app.get("/make-server-49810636/leagues/:leagueId/pending", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const leagueId = c.req.param("leagueId");
    const db = getDb();
    const { data: league } = await db.from("leagues").select("admin_id").eq("id", leagueId).maybeSingle();
    if (!league) return c.json({ error: "Liga no encontrada" }, 404);
    if (league.admin_id !== user.id) return c.json({ error: "Solo el admin" }, 403);
    const { data: pending } = await db.from("league_members").select("user_id, joined_at, users(id, email, nombre)").eq("league_id", leagueId).eq("status", "pending");
    return c.json({ pendingUsers: (pending || []).map((m: any) => ({ id:m.users.id, email:m.users.email, nombre:m.users.nombre, requested_at:m.joined_at })) });
  } catch(err) { return c.json({ error:"Error interno", details:String(err) }, 500); }
});

app.post("/make-server-49810636/leagues/:leagueId/approve", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const leagueId = c.req.param("leagueId");
    const { userId, approved } = await c.req.json();
    const db = getDb();
    const { data: league } = await db.from("leagues").select("admin_id").eq("id", leagueId).maybeSingle();
    if (!league) return c.json({ error: "Liga no encontrada" }, 404);
    if (league.admin_id !== user.id) return c.json({ error: "Solo el admin" }, 403);
    if (approved) {
      await db.from("league_members").update({ status:"active" }).eq("league_id", leagueId).eq("user_id", userId);
      await db.from("scores").upsert({ league_id: leagueId, user_id: userId, total: 0 });
    } else {
      await db.from("league_members").delete().eq("league_id", leagueId).eq("user_id", userId);
    }
    return c.json({ message: approved ? "Usuario aprobado" : "Usuario rechazado" });
  } catch(err) { return c.json({ error:"Error interno", details:String(err) }, 500); }
});

app.get("/make-server-49810636/leagues/:leagueId/leaderboard", requireAuth, async (c) => {
  try {
    const leagueId = c.req.param("leagueId");
    const db = getDb();
    const [{ data: league }, { data: rows }, { data: exactos }] = await Promise.all([
      db.from("leagues").select("admin_id").eq("id", leagueId).maybeSingle(),
      db.from("scores").select("total, users(id, email, nombre)").eq("league_id", leagueId).order("total", { ascending: false }),
      db.from("predictions").select("user_id").eq("league_id", leagueId).eq("puntos_obtenidos", 5),
    ]);
    const exactMap: Record<string, number> = {};
    (exactos || []).forEach((e: any) => { exactMap[e.user_id] = (exactMap[e.user_id] || 0) + 1; });

    // Último partido que afectó el ranking (finalizado o en juego, por momento de actualización)
    const { data: lastMr } = await db.from("match_results")
      .select("match_id")
      .eq("league_id", leagueId)
      .neq("estado", "pendiente")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Puntos que cada usuario obtuvo en ese último partido
    const lastPtsMap: Record<string, number> = {};
    const lastExactMap: Record<string, number> = {};
    if (lastMr) {
      const { data: lastPreds } = await db.from("predictions")
        .select("user_id, puntos_obtenidos")
        .eq("league_id", leagueId)
        .eq("match_id", lastMr.match_id);
      (lastPreds || []).forEach((p: any) => {
        const pts = p.puntos_obtenidos ?? 0;
        lastPtsMap[p.user_id] = pts;
        if (pts === 5) lastExactMap[p.user_id] = 1;
      });
    }

    // Filas (excluyendo admin, igual que la tabla mostrada) con total/exactos actuales y "antes" del último partido
    const built = (rows || [])
      .filter((r: any) => r.users.id !== league?.admin_id)
      .map((r: any) => {
        const uid = r.users.id;
        const total = r.total;
        const ex = exactMap[uid] || 0;
        return {
          uid, nombre: r.users.nombre, email: r.users.email, total, exactos: ex,
          totalBefore: total - (lastPtsMap[uid] || 0),
          exactosBefore: ex - (lastExactMap[uid] || 0),
        };
      });

    // Ranking actual y ranking antes del último partido (mismo desempate: total → exactos)
    const after = [...built].sort((a, b) => b.total - a.total || b.exactos - a.exactos);
    const before = [...built].sort((a, b) => b.totalBefore - a.totalBefore || b.exactosBefore - a.exactosBefore);
    const posBefore: Record<string, number> = {};
    before.forEach((r, i) => { posBefore[r.uid] = i + 1; });

    return c.json({ leaderboard: after.map((r, i) => ({
      userId: r.uid, nombre: r.nombre, email: r.email,
      puntajeTotal: r.total, posicion: i + 1, marcadoresExactos: r.exactos,
      posicionAnterior: posBefore[r.uid],
    })) });
  } catch(err) { return c.json({ error:"Error interno", details:String(err) }, 500); }
});

// ── Partidos / Resultados ─────────────────────────────────────────────────────

app.get("/make-server-49810636/matches/results", async (c) => {
  try {
    const leagueId = c.req.query("leagueId");
    if (!leagueId) return c.json({ error: "leagueId requerido" }, 400);
    const { data: results } = await getDb().from("match_results").select("match_id, goles_a, goles_b, estado, api_status, minuto, updated_at, segundo_tiempo_inicio").eq("league_id", leagueId);
    const map: Record<number, any> = {};
    (results || []).forEach((r: any) => { map[r.match_id] = { matchId:r.match_id, golesA:r.goles_a, golesB:r.goles_b, estado:r.estado, apiStatus:r.api_status, minuto:r.minuto, updatedAt:r.updated_at, segundoTiempoInicio:r.segundo_tiempo_inicio }; });
    return c.json({ results: map });
  } catch(err) { return c.json({ error:"Error interno", details:String(err) }, 500); }
});

const NEXT_MATCH_MAP: Record<number, { match: number, slot: 'team1' | 'team2' }> = {
  74: { match: 89, slot: 'team1' }, 77: { match: 89, slot: 'team2' },
  73: { match: 90, slot: 'team1' }, 75: { match: 90, slot: 'team2' },
  83: { match: 93, slot: 'team1' }, 84: { match: 93, slot: 'team2' },
  81: { match: 94, slot: 'team1' }, 82: { match: 94, slot: 'team2' },
  76: { match: 91, slot: 'team1' }, 78: { match: 91, slot: 'team2' },
  79: { match: 92, slot: 'team1' }, 80: { match: 92, slot: 'team2' },
  86: { match: 95, slot: 'team1' }, 88: { match: 95, slot: 'team2' },
  85: { match: 96, slot: 'team1' }, 87: { match: 96, slot: 'team2' },
  
  89: { match: 97, slot: 'team1' }, 90: { match: 97, slot: 'team2' },
  93: { match: 98, slot: 'team1' }, 94: { match: 98, slot: 'team2' },
  
  91: { match: 99, slot: 'team1' }, 92: { match: 99, slot: 'team2' },
  95: { match: 100, slot: 'team1' }, 96: { match: 100, slot: 'team2' },
  
  97: { match: 101, slot: 'team1' }, 98: { match: 101, slot: 'team2' },
  99: { match: 102, slot: 'team1' }, 100: { match: 102, slot: 'team2' },
  
  101: { match: 104, slot: 'team1' }, 102: { match: 104, slot: 'team2' },
};
const LOSER_MAP: Record<number, { match: number, slot: 'team1' | 'team2' }> = {
  101: { match: 103, slot: 'team1' }, 102: { match: 103, slot: 'team2' },
};

// ── Live Poller — TheSportsDB integration ─────────────────────────────────────

const DICT_ES_EN: Record<string,string> = {
  "México":"Mexico","Sudáfrica":"South Africa","Corea del Sur":"South Korea",
  "República Checa":"Czech Republic","Canadá":"Canada",
  "Bosnia & Herzegovina":"Bosnia-Herzegovina","Catar":"Qatar","Suiza":"Switzerland",
  "Brasil":"Brazil","Marruecos":"Morocco","Haití":"Haiti","Escocia":"Scotland",
  "USA":"USA","Paraguay":"Paraguay","Australia":"Australia","Turquía":"Turkey",
  "Alemania":"Germany","Curazao":"Curaçao","Costa de Marfil":"Ivory Coast","Ecuador":"Ecuador",
  "Países Bajos":"Netherlands","Japón":"Japan","Suecia":"Sweden","Túnez":"Tunisia",
  "Bélgica":"Belgium","Egipto":"Egypt","Irán":"Iran","Nueva Zelanda":"New Zealand",
  "España":"Spain","Cabo Verde":"Cape Verde","Arabia Saudita":"Saudi Arabia","Uruguay":"Uruguay",
  "Francia":"France","Senegal":"Senegal","Iraq":"Iraq","Noruega":"Norway",
  "Argentina":"Argentina","Argelia":"Algeria","Austria":"Austria","Jordania":"Jordan",
  "Portugal":"Portugal","DR Congo":"DR Congo","Uzbekistán":"Uzbekistan","Colombia":"Colombia",
  "Inglaterra":"England","Croacia":"Croatia","Ghana":"Ghana","Panamá":"Panama",
};

// Shared group stage data — used by poller AND bracket/standings-preview
const GROUP_MATCHES_DATA: {id:number;a:string;b:string;grupo:string}[] = [
  {id:1,a:"México",b:"Sudáfrica",grupo:"A"},{id:2,a:"Corea del Sur",b:"República Checa",grupo:"A"},
  {id:3,a:"República Checa",b:"Sudáfrica",grupo:"A"},{id:4,a:"México",b:"Corea del Sur",grupo:"A"},
  {id:5,a:"República Checa",b:"México",grupo:"A"},{id:6,a:"Sudáfrica",b:"Corea del Sur",grupo:"A"},
  {id:7,a:"Canadá",b:"Bosnia & Herzegovina",grupo:"B"},{id:8,a:"Catar",b:"Suiza",grupo:"B"},
  {id:9,a:"Suiza",b:"Bosnia & Herzegovina",grupo:"B"},{id:10,a:"Canadá",b:"Catar",grupo:"B"},
  {id:11,a:"Suiza",b:"Canadá",grupo:"B"},{id:12,a:"Bosnia & Herzegovina",b:"Catar",grupo:"B"},
  {id:13,a:"Brasil",b:"Marruecos",grupo:"C"},{id:14,a:"Haití",b:"Escocia",grupo:"C"},
  {id:15,a:"Escocia",b:"Marruecos",grupo:"C"},{id:16,a:"Brasil",b:"Haití",grupo:"C"},
  {id:17,a:"Escocia",b:"Brasil",grupo:"C"},{id:18,a:"Marruecos",b:"Haití",grupo:"C"},
  {id:19,a:"USA",b:"Paraguay",grupo:"D"},{id:20,a:"Australia",b:"Turquía",grupo:"D"},
  {id:21,a:"USA",b:"Australia",grupo:"D"},{id:22,a:"Turquía",b:"Paraguay",grupo:"D"},
  {id:23,a:"Turquía",b:"USA",grupo:"D"},{id:24,a:"Paraguay",b:"Australia",grupo:"D"},
  {id:25,a:"Alemania",b:"Curazao",grupo:"E"},{id:26,a:"Costa de Marfil",b:"Ecuador",grupo:"E"},
  {id:27,a:"Alemania",b:"Costa de Marfil",grupo:"E"},{id:28,a:"Ecuador",b:"Curazao",grupo:"E"},
  {id:29,a:"Curazao",b:"Costa de Marfil",grupo:"E"},{id:30,a:"Ecuador",b:"Alemania",grupo:"E"},
  {id:31,a:"Países Bajos",b:"Japón",grupo:"F"},{id:32,a:"Suecia",b:"Túnez",grupo:"F"},
  {id:33,a:"Países Bajos",b:"Suecia",grupo:"F"},{id:34,a:"Túnez",b:"Japón",grupo:"F"},
  {id:35,a:"Japón",b:"Suecia",grupo:"F"},{id:36,a:"Túnez",b:"Países Bajos",grupo:"F"},
  {id:37,a:"Bélgica",b:"Egipto",grupo:"G"},{id:38,a:"Irán",b:"Nueva Zelanda",grupo:"G"},
  {id:39,a:"Bélgica",b:"Irán",grupo:"G"},{id:40,a:"Nueva Zelanda",b:"Egipto",grupo:"G"},
  {id:41,a:"Egipto",b:"Irán",grupo:"G"},{id:42,a:"Nueva Zelanda",b:"Bélgica",grupo:"G"},
  {id:43,a:"España",b:"Cabo Verde",grupo:"H"},{id:44,a:"Arabia Saudita",b:"Uruguay",grupo:"H"},
  {id:45,a:"España",b:"Arabia Saudita",grupo:"H"},{id:46,a:"Uruguay",b:"Cabo Verde",grupo:"H"},
  {id:47,a:"Cabo Verde",b:"Arabia Saudita",grupo:"H"},{id:48,a:"Uruguay",b:"España",grupo:"H"},
  {id:49,a:"Francia",b:"Senegal",grupo:"I"},{id:50,a:"Iraq",b:"Noruega",grupo:"I"},
  {id:51,a:"Francia",b:"Iraq",grupo:"I"},{id:52,a:"Noruega",b:"Senegal",grupo:"I"},
  {id:53,a:"Noruega",b:"Francia",grupo:"I"},{id:54,a:"Senegal",b:"Iraq",grupo:"I"},
  {id:55,a:"Argentina",b:"Argelia",grupo:"J"},{id:56,a:"Austria",b:"Jordania",grupo:"J"},
  {id:57,a:"Argentina",b:"Austria",grupo:"J"},{id:58,a:"Jordania",b:"Argelia",grupo:"J"},
  {id:59,a:"Argelia",b:"Austria",grupo:"J"},{id:60,a:"Jordania",b:"Argentina",grupo:"J"},
  {id:61,a:"Portugal",b:"DR Congo",grupo:"K"},{id:62,a:"Uzbekistán",b:"Colombia",grupo:"K"},
  {id:63,a:"Portugal",b:"Uzbekistán",grupo:"K"},{id:64,a:"Colombia",b:"DR Congo",grupo:"K"},
  {id:65,a:"Colombia",b:"Portugal",grupo:"K"},{id:66,a:"DR Congo",b:"Uzbekistán",grupo:"K"},
  {id:67,a:"Inglaterra",b:"Croacia",grupo:"L"},{id:68,a:"Ghana",b:"Panamá",grupo:"L"},
  {id:69,a:"Inglaterra",b:"Ghana",grupo:"L"},{id:70,a:"Panamá",b:"Croacia",grupo:"L"},
  {id:71,a:"Panamá",b:"Inglaterra",grupo:"L"},{id:72,a:"Croacia",b:"Ghana",grupo:"L"},
];

function nmatch(a: string, b: string): boolean {
  const norm = (s: string) =>
    s.toLowerCase()
     .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // ç→c, á→a, ñ→n, etc.
     .replace(/-/g, ' ')                                  // "Bosnia-Herzegovina" → "Bosnia Herzegovina"
     .replace(/[^a-z0-9\s]/g, '')
     .replace(/\s+/g, ' ').trim();
  const na = norm(a), nb = norm(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}

function findGroupMatchByTeams(homeEn: string, awayEn: string): {matchId:number;aEs:string;bEs:string}|null {
  for (const m of GROUP_MATCHES_DATA) {
    const aEn = DICT_ES_EN[m.a]||m.a;
    const bEn = DICT_ES_EN[m.b]||m.b;
    if (nmatch(homeEn,aEn)&&nmatch(awayEn,bEn)) return {matchId:m.id,aEs:m.a,bEs:m.b};
    if (nmatch(homeEn,bEn)&&nmatch(awayEn,aEn)) return {matchId:m.id,aEs:m.b,bEs:m.a};
  }
  return null;
}

function assignScores(
  event: {intHomeScore:any;intAwayScore:any;strHomeTeam:string},
  aEs: string
): {golesA:number;golesB:number} {
  const h = parseInt(String(event.intHomeScore))||0;
  const a = parseInt(String(event.intAwayScore))||0;
  const aEn = DICT_ES_EN[aEs]||aEs;
  return nmatch(event.strHomeTeam,aEn) ? {golesA:h,golesB:a} : {golesA:a,golesB:h};
}

function mapApiStatus(strStatus: string): 'en_curso'|'finalizado' {
  return ['1H','HT','2H'].includes(strStatus) ? 'en_curso' : 'finalizado';
}

async function advanceBracket(matchId:number, leagueId:string, golesA:number, golesB:number, db:any) {
  const {data:mt} = await db.from("knockout_match_teams").select("team1,team2").eq("league_id",leagueId).eq("match_id",matchId).maybeSingle();
  if (!mt) return;
  let winner="", loser="";
  if (golesA>golesB){winner=mt.team1;loser=mt.team2;}
  else if (golesB>golesA){winner=mt.team2;loser=mt.team1;}
  if (!winner) return;
  const nextW=NEXT_MATCH_MAP[matchId];
  if (nextW) {
    const {data:ext}=await db.from("knockout_match_teams").select("*").eq("league_id",leagueId).eq("match_id",nextW.match).maybeSingle();
    if (ext) await db.from("knockout_match_teams").update({[nextW.slot]:winner}).eq("league_id",leagueId).eq("match_id",nextW.match);
    else await db.from("knockout_match_teams").insert({league_id:leagueId,match_id:nextW.match,team1:nextW.slot==='team1'?winner:"",team2:nextW.slot==='team2'?winner:""});
  }
  const nextL=LOSER_MAP[matchId];
  if (nextL&&loser) {
    const {data:ext}=await db.from("knockout_match_teams").select("*").eq("league_id",leagueId).eq("match_id",nextL.match).maybeSingle();
    if (ext) await db.from("knockout_match_teams").update({[nextL.slot]:loser}).eq("league_id",leagueId).eq("match_id",nextL.match);
    else await db.from("knockout_match_teams").insert({league_id:leagueId,match_id:nextL.match,team1:nextL.slot==='team1'?loser:"",team2:nextL.slot==='team2'?loser:""});
  }
}

interface ApplyResultParams {
  matchId:number; leagueId:string; golesA:number; golesB:number;
  estado:'en_curso'|'finalizado'; source:'manual'|'auto';
  updatedBy:string|null; apiStatus:string|null; minuto:string|null;
  rawApiStatus?:string;
}

async function applyResult(p: ApplyResultParams) {
  const db = getDb();
  const { data: ex } = await db.from("match_results")
    .select("id,source,estado,goles_a,goles_b,api_status,segundo_tiempo_inicio")
    .eq("match_id", p.matchId).eq("league_id", p.leagueId).maybeSingle();

  // Guard 1: resultado manual del admin siempre prevalece sobre auto
  if (p.source === 'auto' && ex?.source === 'manual') return;
  // Guard 2: un partido finalizado no puede revertirse a en_curso ni ser pisado por auto
  if (p.source === 'auto' && ex?.estado === 'finalizado') return;

  let golesA = p.golesA, golesB = p.golesB;
  // Guard 3: congelar score en ET/PEN — para la polla solo cuentan los 90 minutos.
  // Si la API ya mandó FT antes de ET, Guard 2 habrá bloqueado esta llamada.
  // Este guard cubre el caso raro en que la API salte de 2H directo a ET sin FT.
  if (p.source === 'auto' && p.rawApiStatus && ['ET','AET','BT','P','PEN'].includes(p.rawApiStatus) && ex) {
    golesA = ex.goles_a ?? 0;
    golesB = ex.goles_b ?? 0;
  }

  // Early exit: si score, estado, source Y fase (api_status) no cambiaron, no hay
  // nada que persistir (cubre el 95% de los ticks sin cambios → 0 writes).
  // IMPORTANTE: api_status debe estar aquí para que las transiciones de fase
  // (1H→HT→2H→FT) se guarden aunque el marcador no cambie; si no, el reloj del
  // cliente se queda pegado en "primer tiempo" para siempre.
  if (ex
    && ex.goles_a    === golesA
    && ex.goles_b    === golesB
    && ex.estado     === p.estado
    && ex.source     === p.source
    && ex.api_status === p.apiStatus) return;

  // ¿Cambió realmente el marcador? Si solo cambió la fase (HT/2H) con el mismo
  // score, persistimos la fila pero evitamos recalcular puntos innecesariamente.
  const scoreChanged = !ex || ex.goles_a !== golesA || ex.goles_b !== golesB;

  const now = new Date().toISOString();
  const row: any = {
    goles_a: golesA, goles_b: golesB, estado: p.estado,
    source: p.source, api_status: p.apiStatus, minuto: p.minuto, updated_at: now,
  };
  if (p.updatedBy) row.updated_by = p.updatedBy;
  // Ancla del 2T: la primera vez que detectamos '2H' guardamos el instante real
  // de inicio del segundo tiempo. No se sobrescribe (un gol en el 2T no lo mueve),
  // así el cliente calcula el minuto exacto: 46 + (ahora − segundo_tiempo_inicio).
  if (p.apiStatus === '2H' && !ex?.segundo_tiempo_inicio) row.segundo_tiempo_inicio = now;

  let writeErr: any = null;
  if (ex) {
    const { error } = await db.from("match_results").update(row).eq("id", ex.id);
    writeErr = error;
  } else {
    const { error } = await db.from("match_results").insert({ ...row, match_id: p.matchId, league_id: p.leagueId });
    writeErr = error;
  }
  if (writeErr) throw new Error(writeErr.message || "Error guardando resultado");

  // Solo recalcular puntos si cambió el marcador o si el partido finaliza.
  // Una transición de fase pura (p. ej. 1H→HT con el mismo score) no toca puntos.
  if (scoreChanged || p.estado === 'finalizado') {
    await calculatePoints(p.matchId, p.leagueId, golesA, golesB);
  }

  if (p.estado === 'finalizado' && p.matchId >= 73) {
    await advanceBracket(p.matchId, p.leagueId, golesA, golesB, db);
  }
}

// ── API helpers (TheSportsDB) ─────────────────────────────────────────────────

const SPORTSDB_API = 'https://www.thesportsdb.com/api/v1/json/123';
const SPORTSDB_LID = '4429';

// Mapa directo matchId → idEvent de TheSportsDB.
// 72/72 partidos de fase de grupos verificados contra la API real (jun-2026).
// Elimina dependencia de eventsday.php (límite 3 eventos/día) y bootstrapMissingEventIds.
const SPORTSDB_EVENT_IDS: Record<number, string> = {
  // ── Jornada 1 — 24/24 ──────────────────────────────────────────────────────
  1:"2391728", 2:"2461103", 7:"2461104", 8:"2391732",
  13:"2391730", 14:"2391731", 19:"2391729", 20:"2461105",
  25:"2391733", 26:"2391734", 31:"2391735", 32:"2461106",
  37:"2391736", 38:"2391737", 43:"2391739", 44:"2391738",
  49:"2391742", 50:"2461107", 55:"2391740", 56:"2391741",
  61:"2461108", 62:"2391745", 67:"2391743", 68:"2391744",
  // ── Jornada 2 — 24/24 ──────────────────────────────────────────────────────
  3:"2461109",  4:"2391747",  9:"2461110",  10:"2391746",
  15:"2391749", 16:"2391748", 21:"2391750", 22:"2461111",
  27:"2391752", 28:"2391751", 33:"2461112", 34:"2391753",
  39:"2391754", 40:"2391755", 45:"2391756", 46:"2391757",
  51:"2461113", 52:"2391760", 57:"2391758", 58:"2391759",
  63:"2391763", 64:"2461114", 69:"2391761", 70:"2391762",
  // ── Jornada 3 — 24/24 ──────────────────────────────────────────────────────
  5:"2461116",  6:"2391766",  11:"2391767", 12:"2461115",
  17:"2391765", 18:"2391764", 23:"2461118", 24:"2391770",
  29:"2391768", 30:"2391769", 35:"2461117", 36:"2391771",
  41:"2391773", 42:"2391774", 47:"2391772", 48:"2391776",
  53:"2391775", 54:"2461119", 59:"2391777", 60:"2391780",
  65:"2391778", 66:"2461120", 71:"2391781", 72:"2391779",
  // ── 16avos (Round of 32) — 16/16 verificados contra eventsround.php?r=32 (jun-2026) ──
  73:"2499618", 74:"2502846", 75:"2499836", 76:"2499835",
  77:"2502847", 78:"2502605", 79:"2503390", 80:"2503391",
  81:"2499837", 82:"2503392", 83:"2503393", 84:"2503636",
  85:"2503635", 86:"2502849", 87:"2503394", 88:"2502848",
};

// Ventana en minutos en la que consideramos un partido "potencialmente en vivo"
const LIVE_WINDOW_BEFORE_MS = 5  * 60 * 1000;  // 5 min antes del kickoff
const LIVE_WINDOW_AFTER_MS  = 135 * 60 * 1000; // 135 min después (2H + margen HT + extra)

// Retorna los matchIds que están actualmente en la ventana de juego
// según MATCH_DATES. No hace ninguna llamada a la API.
function getLiveMatchIds(): number[] {
  const now = Date.now();
  return Object.entries(MATCH_DATES)
    .filter(([, dateStr]) => {
      const kick = new Date(dateStr).getTime();
      return now >= kick - LIVE_WINDOW_BEFORE_MS && now <= kick + LIVE_WINDOW_AFTER_MS;
    })
    .map(([id]) => parseInt(id));
}

function sdbUtcDate(offsetDays = 0): string {
  const d = new Date(); d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

// Descubre idEvent de TheSportsDB para matchIds que aún no están en el mapa.
// Estrategia primaria: eventsseason.php — devuelve TODOS los eventos de la
// temporada en una sola llamada, SIN el límite de 3 eventos/día que tiene
// eventsday.php. Esto garantiza cobertura de la Jornada 3 (6 partidos/día
// simultáneos) y de las eliminatorias. Fallback: eventsday ayer/hoy/mañana.
// Lo encontrado se persiste en SPORTSDB_EVENT_IDS por la vida del isolate.
// koMap (opcional): equipos REALES ya confirmados de la fase eliminatoria
// (match_id 73-104 → {team1, team2}). Permite descubrir el idEvent de los
// partidos de eliminatorias, que no existen en GROUP_MATCHES_DATA. Sin esto,
// las eliminatorias nunca obtienen idEvent y el poller las salta.
async function bootstrapMissingEventIds(
  matchIds: number[],
  koMap?: Record<number, { team1: string; team2: string }>
): Promise<void> {
  const missing = matchIds.filter(id => !SPORTSDB_EVENT_IDS[id]);
  if (!missing.length) return;

  const discovered: any[] = [];

  // Primario: temporada completa (sin límite diario). OJO: con la clave gratuita
  // eventsseason solo devuelve la Jornada 1 (~15 eventos), así que NO basta para
  // J2/J3 ni eliminatorias. Se complementa abajo.
  try {
    const res  = await fetch(`${SPORTSDB_API}/eventsseason.php?id=${SPORTSDB_LID}&s=2026`);
    const json = await res.json();
    discovered.push(...(json.events || json.event || []));
  } catch { /* ignore */ }

  // Eliminatorias: eventsround.php trae TODA la ronda en una sola llamada, SIN el
  // límite de 3/día de eventsday. r=32=16avos (verificado). Octavos/cuartos/semis
  // usan 16/8/4 (aún sin publicar al jun-2026). OJO: r=1,2,3 son las jornadas de
  // GRUPOS, no KO — por eso NO se incluyen aquí. La final y el 3er lugar tienen
  // número incierto pero los cubre eventsday abajo (1 partido/día). Solo se consulta
  // si faltan partidos de KO (≥73); el match real se hace por nombre contra koMap.
  if (missing.some(id => id >= 73)) {
    for (const r of [32, 16, 8, 4]) {
      try {
        const res  = await fetch(`${SPORTSDB_API}/eventsround.php?id=${SPORTSDB_LID}&r=${r}&s=2026`);
        const json = await res.json();
        discovered.push(...(json.events || json.event || []));
      } catch { /* ignore */ }
    }
  }

  // Respaldo final: eventsday de las fechas en ventana (limitado a 3/día, pero en
  // días de KO hay ≤3 partidos). Cubre cualquier evento que eventsround no traiga.
  {
    const days = [sdbUtcDate(-1), sdbUtcDate(0), sdbUtcDate(1)];
    for (const d of days) {
      try {
        const res  = await fetch(`${SPORTSDB_API}/eventsday.php?d=${d}&l=${SPORTSDB_LID}`);
        const json = await res.json();
        discovered.push(...(json.events || json.event || []).filter((e: any) =>
          e.idLeague === SPORTSDB_LID &&
          (e.strSeason === '2026' || (e.strFilename || '').startsWith('FIFA World Cup 2026'))
        ));
      } catch { /* ignore */ }
    }
  }

  for (const ev of discovered) {
    const homeEn = ev.strHomeTeam || '';
    const awayEn = ev.strAwayTeam || '';
    for (const mid of missing) {
      if (SPORTSDB_EVENT_IDS[mid]) continue;
      if (mid < 73) {
        // Fase de grupos: emparejamientos conocidos en GROUP_MATCHES_DATA.
        const gm = findGroupMatchByTeams(homeEn, awayEn);
        if (gm && gm.matchId === mid) {
          SPORTSDB_EVENT_IDS[mid] = ev.idEvent;
          console.log(`[bootstrap] matchId=${mid} → idEvent=${ev.idEvent} (${homeEn} vs ${awayEn})`);
        }
      } else if (koMap?.[mid]) {
        // Eliminatorias: matchear contra los equipos reales ya confirmados.
        const t1 = koMap[mid].team1, t2 = koMap[mid].team2;
        // Saltar slots vacíos o placeholders ("W74", "1ºA"): nmatch("",x) daría
        // true porque todo string incluye "", lo que causaría falsos positivos.
        if (!t1 || !t2 || /^[WL]\d|^[1-4]º/.test(t1) || /^[WL]\d|^[1-4]º/.test(t2)) continue;
        const t1En = DICT_ES_EN[t1] || t1;
        const t2En = DICT_ES_EN[t2] || t2;
        if ((nmatch(homeEn, t1En) && nmatch(awayEn, t2En)) ||
            (nmatch(homeEn, t2En) && nmatch(awayEn, t1En))) {
          SPORTSDB_EVENT_IDS[mid] = ev.idEvent;
          console.log(`[bootstrap] KO matchId=${mid} → idEvent=${ev.idEvent} (${homeEn} vs ${awayEn})`);
        }
      }
    }
  }

  const stillMissing = missing.filter(id => !SPORTSDB_EVENT_IDS[id]);
  if (stillMissing.length) {
    console.log(`[bootstrap] matchIds sin idEvent aún: ${stillMissing.join(',')}`);
  }
}

async function sdbLookup(idEvent: string): Promise<any | null> {
  try {
    const res  = await fetch(`${SPORTSDB_API}/lookupevent.php?id=${idEvent}`);
    const json = await res.json();
    return (json.events || json.event || [])[0] || null;
  } catch { return null; }
}

// Finaliza partidos que llevan >3h en en_curso sin actualización (partidos zombie).
// Solo actúa sobre source='auto'; los resultados manuales del admin son intocables.
async function cleanupStaleMatches(leagueIds: string[]): Promise<void> {
  const db = getDb();
  const cutoff = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
  try {
    const { data: stale } = await db.from("match_results")
      .select("id, match_id, league_id, goles_a, goles_b")
      .eq("estado", "en_curso").eq("source", "auto").lt("updated_at", cutoff);
    for (const row of (stale || [])) {
      if (!leagueIds.includes(row.league_id)) continue;
      await db.from("match_results")
        .update({ estado: 'finalizado', api_status: 'FT', updated_at: new Date().toISOString() })
        .eq("id", row.id);
      await calculatePoints(row.match_id, row.league_id, row.goles_a ?? 0, row.goles_b ?? 0);
      console.log(`[cleanup] matchId=${row.match_id} leagueId=${row.league_id} auto-finalizado`);
    }
  } catch (err) { console.error('[cleanup] error:', err); }
}

// Calcula el minuto estimado del partido basado en MATCH_DATES cuando
// la API no provee strProgress (común con la clave gratuita 123).
function estimateMinuto(matchId: number, strStatus: string): string | null {
  if (!['1H', 'HT', '2H'].includes(strStatus)) return null;
  const dateStr = MATCH_DATES[matchId];
  if (!dateStr) return null;
  const kickMs  = new Date(dateStr).getTime();
  const nowMs   = Date.now();
  const elapsed = Math.floor((nowMs - kickMs) / 60000);
  if (strStatus === '1H')  return String(Math.min(Math.max(elapsed, 1), 45));
  if (strStatus === 'HT')  return '45';
  if (strStatus === '2H') {
    // El segundo tiempo empieza ~60min después del kickoff (45+15 descanso)
    const secondHalfMin = Math.max(elapsed - 60, 46);
    return String(Math.min(secondHalfMin, 90));
  }
  return null;
}

async function pollLiveOnce(leagueIds: string[]): Promise<void> {
  const windowIds = getLiveMatchIds();

  // También incluir cualquier partido que la DB tenga como en_curso (source=auto)
  // pero que ya salió de la ventana horaria. Esto evita que un partido quede zombi
  // si el 2T con añadido supera los 135 min del kickoff: seguimos llamando a la API
  // hasta que nos devuelva FT, sin importar cuánto tiempo haya pasado.
  const db = getDb();
  const { data: activeRows } = await db.from("match_results")
    .select("match_id")
    .eq("estado", "en_curso")
    .eq("source", "auto");
  const dbActiveIds = (activeRows || []).map((r: any) => r.match_id as number);

  const liveIds = [...new Set([...windowIds, ...dbActiveIds])];
  if (!liveIds.length) return;

  // Cargar equipos de fase eliminatoria una vez (para knockout stage).
  // Se construye ANTES del bootstrap para poder descubrir los idEvent de
  // las eliminatorias matcheando contra los equipos reales confirmados.
  const { data: koRows } = await db.from("knockout_match_teams")
    .select("match_id,team1,team2").gte("match_id", 73);
  const koMap: Record<number, { team1: string; team2: string }> = {};
  (koRows || []).forEach((r: any) => {
    if (!koMap[r.match_id]) koMap[r.match_id] = { team1: r.team1, team2: r.team2 };
  });

  // Rellenar IDs desconocidos antes de procesar (J2/J3 no hardcodeados + eliminatorias)
  await bootstrapMissingEventIds(liveIds, koMap);

  for (const matchId of liveIds) {
    const idEvent = SPORTSDB_EVENT_IDS[matchId];
    if (!idEvent) {
      console.log(`[poller] sin idEvent para matchId=${matchId}, saltando`);
      continue;
    }

    const event = await sdbLookup(idEvent);
    if (!event) continue;

    const homeEn    = event.strHomeTeam || '';
    const awayEn    = event.strAwayTeam || '';
    const strStatus = event.strStatus || 'NS';
    if (strStatus === 'NS') continue;

    // Resolver matchId interno desde los nombres (grupo o eliminatoria)
    let resolvedMatchId: number | null = matchId; // Ya lo tenemos del mapa
    let aEs = homeEn;

    const gm = findGroupMatchByTeams(homeEn, awayEn);
    if (gm) {
      // Verificar que coincide con el matchId esperado
      if (gm.matchId !== matchId) {
        console.log(`[poller] mismatch: esperaba matchId=${matchId}, encontró ${gm.matchId} (${homeEn} vs ${awayEn})`);
      }
      resolvedMatchId = gm.matchId;
      aEs = gm.aEs;
    } else if (matchId >= 73) {
      // Fase eliminatoria: buscar en koMap
      const koRow = koMap[matchId];
      if (koRow) {
        const t1En = DICT_ES_EN[koRow.team1] || koRow.team1;
        const t2En = DICT_ES_EN[koRow.team2] || koRow.team2;
        if (nmatch(homeEn, t1En) && nmatch(awayEn, t2En)) {
          aEs = koRow.team1;
        } else if (nmatch(homeEn, t2En) && nmatch(awayEn, t1En)) {
          aEs = koRow.team2;
        } else {
          console.log(`[poller] knockout no match: ${homeEn} vs ${awayEn} (matchId=${matchId})`);
          continue;
        }
      }
    } else {
      console.log(`[poller] group match no encontrado: ${homeEn} vs ${awayEn} (matchId=${matchId})`);
      continue;
    }

    const { golesA, golesB } = assignScores(event, aEs);
    const estado = mapApiStatus(strStatus);
    const minuto = event.strProgress || estimateMinuto(matchId, strStatus);

    for (const leagueId of leagueIds) {
      try {
        await applyResult({
          matchId: resolvedMatchId!,
          leagueId,
          golesA,
          golesB,
          estado,
          source: 'auto',
          updatedBy: null,
          apiStatus: strStatus,
          minuto,
          rawApiStatus: strStatus,
        });
      } catch (err) {
        console.error(`[poller] applyResult error match=${matchId} league=${leagueId}:`, err);
      }
    }
  }
}

async function runPollLoop(leagueIds: string[]) {
  // Limpiar partidos zombie antes de empezar a pollear
  await cleanupStaleMatches(leagueIds);
  // 10 iteraciones × 5s = 50s total — margen seguro dentro del límite de waitUntil
  for (let i = 0; i < 10; i++) {
    try { await pollLiveOnce(leagueIds); } catch (err) { console.error('[poller] iteration error:', err); }
    if (i < 9) await new Promise(r => setTimeout(r, 5000));
  }
}

app.post("/make-server-49810636/matches/:matchId/result", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const matchId = parseInt(c.req.param("matchId"));
    const { leagueId, golesA, golesB, estado } = await c.req.json();
    const db = getDb();
    const { data: league } = await db.from("leagues").select("admin_id").eq("id", leagueId).maybeSingle();
    if (!league) return c.json({ error: "Liga no encontrada" }, 404);
    if (league.admin_id !== user.id) return c.json({ error: "Solo el admin" }, 403);
    await applyResult({
      matchId, leagueId, golesA, golesB,
      estado: (estado||"finalizado") as 'en_curso'|'finalizado',
      source:'manual', updatedBy:user.id,
      apiStatus:null, minuto:null,
    });
    return c.json({ message: "Resultado actualizado" });
  } catch(err) { return c.json({ error:"Error interno", details:String(err) }, 500); }
});

app.get("/make-server-49810636/matches/:matchId/result", async (c) => {
  try {
    const matchId = parseInt(c.req.param("matchId"));
    const leagueId = c.req.query("leagueId");
    let q = getDb().from("match_results").select("match_id, goles_a, goles_b, estado").eq("match_id", matchId);
    if (leagueId) q = q.eq("league_id", leagueId);
    const { data: r } = await q.maybeSingle();
    return c.json({ result: r ? { matchId:r.match_id, golesA:r.goles_a, golesB:r.goles_b, estado:r.estado } : null });
  } catch(err) { return c.json({ error:"Error interno", details:String(err) }, 500); }
});

// ── Predicciones ─────────────────────────────────────────────────────────────

app.post("/make-server-49810636/predictions", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const { matchId, leagueId, golesA, golesB } = await c.req.json();

    // Capa 1 — Validación de inputs
    const mid = Number(matchId);
    if (!mid || mid < 1 || mid > 104) return c.json({ error: "Partido inválido" }, 400);
    if (typeof golesA !== 'number' || typeof golesB !== 'number' || golesA < 0 || golesA > 20 || golesB < 0 || golesB > 20)
      return c.json({ error: "Goles inválidos" }, 400);

    // Capa 2 — Tiempo de bloqueo (25 min antes del partido)
    if (isMatchLocked(mid)) return c.json({ error: "Pronóstico cerrado" }, 423);

    const db = getDb();

    // Capa 3 — Membresía activa en la liga
    const { data: membership } = await db.from("league_members").select("status").eq("league_id", leagueId).eq("user_id", user.id).maybeSingle();
    if (!membership || membership.status !== "active") return c.json({ error: "No eres miembro activo de esta liga" }, 403);

    // Capa 4 — Estado del partido y predicción ya evaluada
    const { data: result } = await db.from("match_results").select("estado").eq("match_id", mid).eq("league_id", leagueId).maybeSingle();
    if (result && result.estado !== "pendiente") return c.json({ error: "Partido ya en curso o finalizado" }, 423);

    const { data: existing } = await db.from("predictions")
      .select("id, puntos_obtenidos")
      .eq("league_id", leagueId)
      .eq("user_id", user.id)
      .eq("match_id", mid)
      .maybeSingle();

    // Capa 4b — Predicción ya evaluada (puntos calculados = partido procesado)
    if (existing && existing.puntos_obtenidos !== null && existing.puntos_obtenidos !== undefined)
      return c.json({ error: "Pronóstico ya evaluado" }, 423);

    let pred, error;
    if (existing) {
      const res = await db.from("predictions")
        .update({ goles_a: golesA, goles_b: golesB, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
        .select("id, match_id, goles_a, goles_b")
        .single();
      pred = res.data;
      error = res.error;
    } else {
      const res = await db.from("predictions")
        .insert({ league_id: leagueId, user_id: user.id, match_id: mid, goles_a: golesA, goles_b: golesB, updated_at: new Date().toISOString() })
        .select("id, match_id, goles_a, goles_b")
        .single();
      pred = res.data;
      error = res.error;
    }

    if (error) return c.json({ error: "Error al guardar", details: error }, 500);
    return c.json({ prediction: { id:pred.id, matchId:pred.match_id, goles_a:pred.goles_a, goles_b:pred.goles_b } });
  } catch(err) { return c.json({ error:"Error interno", details:String(err) }, 500); }
});

app.get("/make-server-49810636/predictions/:leagueId", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const leagueId = c.req.param("leagueId");
    const { data: preds } = await getDb().from("predictions").select("id, match_id, goles_a, goles_b, puntos_obtenidos").eq("league_id", leagueId).eq("user_id", user.id);
    return c.json({ predictions: (preds || []).map((p: any) => ({ id:p.id, matchId:p.match_id, goles_a:p.goles_a, goles_b:p.goles_b, puntosObtenidos:p.puntos_obtenidos })) });
  } catch(err) { return c.json({ error:"Error interno", details:String(err) }, 500); }
});

// GET /match-predictions/summary?matchId=&leagueId= — conteo anónimo por marcador
app.get("/make-server-49810636/match-predictions/summary", async (c) => {
  try {
    const matchId = Number(c.req.query("matchId"));
    const leagueId = c.req.query("leagueId");
    if (!matchId || !leagueId) return c.json({ error: "Parámetros requeridos" }, 400);
    const { data: preds } = await getDb().from("predictions").select("goles_a, goles_b").eq("match_id", matchId).eq("league_id", leagueId);
    const counts: Record<string, { goles_a: number; goles_b: number; count: number }> = {};
    for (const p of (preds || [])) {
      const key = `${p.goles_a}-${p.goles_b}`;
      if (!counts[key]) counts[key] = { goles_a: p.goles_a, goles_b: p.goles_b, count: 0 };
      counts[key].count++;
    }
    const summary = Object.values(counts).sort((a, b) => b.count - a.count);
    return c.json({ summary, total: (preds || []).length });
  } catch(err) { return c.json({ error:"Error interno", details:String(err) }, 500); }
});

// GET /match-predictions/all?matchId=&leagueId= — lista completa con nombres (solo cuando bloqueado)
app.get("/make-server-49810636/match-predictions/all", requireAuth, async (c) => {
  try {
    const matchId = Number(c.req.query("matchId"));
    const leagueId = c.req.query("leagueId");
    if (!matchId || !leagueId) return c.json({ error: "Parámetros requeridos" }, 400);
    if (!isMatchLocked(matchId)) return c.json({ error: "Partido aún no bloqueado" }, 403);
    const { data: preds } = await getDb().from("predictions")
      .select("user_id, goles_a, goles_b, puntos_obtenidos, users(nombre)")
      .eq("match_id", matchId).eq("league_id", leagueId);
    const { data: scores } = await getDb().from("scores").select("user_id, total").eq("league_id", leagueId).order("total", { ascending: false });
    const rankMap: Record<string, number> = {};
    (scores || []).forEach((s: any, i: number) => { rankMap[s.user_id] = i + 1; });
    const result = (preds || []).map((p: any) => ({
      userId: p.user_id,
      nombre: p.users?.nombre || "Usuario",
      goles_a: p.goles_a,
      goles_b: p.goles_b,
      puntos_obtenidos: p.puntos_obtenidos,
      ranking: rankMap[p.user_id] ?? 999,
    })).sort((a: any, b: any) => a.ranking - b.ranking);
    return c.json({ predictions: result });
  } catch(err) { return c.json({ error:"Error interno", details:String(err) }, 500); }
});

// GET /match-predictions/ranking-snapshot?matchId=&leagueId=
// Ranking acumulado exactamente hasta este partido, con el delta de quién subió/bajó por él.
app.get("/make-server-49810636/match-predictions/ranking-snapshot", requireAuth, async (c) => {
  try {
    const matchId = Number(c.req.query("matchId"));
    const leagueId = c.req.query("leagueId");
    if (!matchId || !leagueId) return c.json({ error: "Parámetros requeridos" }, 400);
    const db = getDb();

    const { data: league } = await db.from("leagues").select("admin_id").eq("id", leagueId).maybeSingle();
    if (!league) return c.json({ error: "Liga no encontrada" }, 404);

    const { data: target } = await db.from("match_results")
      .select("estado")
      .eq("match_id", matchId).eq("league_id", leagueId).maybeSingle();
    if (!target) return c.json({ snapshot: [], hasData: false });

    const targetScheduled = MATCH_DATES[matchId];
    if (!targetScheduled) return c.json({ snapshot: [], hasData: false });
    const targetDate = new Date(targetScheduled);

    // Partidos finalizados de la liga (máx 104 filas, sin riesgo de límite)
    const { data: allFinals } = await db.from("match_results")
      .select("match_id")
      .eq("league_id", leagueId)
      .eq("estado", "finalizado");

    // IDs en scope = finalizados con fecha programada ≤ partido objetivo
    const inScopeSet = new Set<number>(
      (allFinals || [])
        .map((r: any) => r.match_id as number)
        .filter(mid => {
          const d = MATCH_DATES[mid];
          return d && new Date(d) <= targetDate;
        })
    );
    inScopeSet.add(matchId); // siempre incluir el objetivo (live o finalizado)
    const otherScopeIds = Array.from(inScopeSet).filter(mid => mid !== matchId);

    // Una query por partido en scope — cada una retorna ≤ miembros filas (sin riesgo de límite).
    // Todas corren en paralelo. Evita el límite de 1000 filas de PostgREST en una sola query.
    const queries: Promise<any>[] = [
      db.from("scores").select("user_id, users(nombre)").eq("league_id", leagueId) as any,
      db.from("predictions").select("user_id, puntos_obtenidos")
        .eq("league_id", leagueId).eq("match_id", matchId) as any,
      ...otherScopeIds.map(mid =>
        db.from("predictions").select("user_id, puntos_obtenidos")
          .eq("league_id", leagueId).eq("match_id", mid) as any
      ),
    ];
    const allResults = await Promise.all(queries);
    const membersData = (allResults[0] as any).data || [];
    const thisMatchData = (allResults[1] as any).data || [];
    const otherMatchData = allResults.slice(2).flatMap((r: any) => r.data || []);

    type Agg = { nombre: string; totalAfter: number; exactosAfter: number; ptsMatch: number; exactMatch: number };
    const agg: Record<string, Agg> = {};
    for (const m of membersData) {
      if ((m as any).user_id === league.admin_id) continue;
      agg[(m as any).user_id] = { nombre: (m as any).users?.nombre || "Usuario", totalAfter: 0, exactosAfter: 0, ptsMatch: 0, exactMatch: 0 };
    }

    // Acumular este partido primero (para rastrear ptsMatch por separado)
    for (const p of thisMatchData) {
      const a = agg[(p as any).user_id];
      if (!a) continue;
      const pts = (p as any).puntos_obtenidos ?? 0;
      a.totalAfter += pts;
      a.ptsMatch = pts;
      if (pts === 5) { a.exactosAfter += 1; a.exactMatch = 1; }
    }
    // Acumular el resto de partidos en scope
    for (const p of otherMatchData) {
      const a = agg[(p as any).user_id];
      if (!a) continue;
      const pts = (p as any).puntos_obtenidos ?? 0;
      a.totalAfter += pts;
      if (pts === 5) a.exactosAfter += 1;
    }

    const rows = Object.entries(agg).map(([userId, a]) => ({
      userId, nombre: a.nombre,
      total: a.totalAfter, exactos: a.exactosAfter,
      totalBefore: a.totalAfter - a.ptsMatch,
      exactosBefore: a.exactosAfter - a.exactMatch,
      puntosEstePartido: a.ptsMatch,
    }));

    const after = [...rows].sort((x, y) => y.total - x.total || y.exactos - x.exactos);
    const posAfter: Record<string, number> = {};
    after.forEach((r, i) => { posAfter[r.userId] = i + 1; });

    const before = [...rows].sort((x, y) => y.totalBefore - x.totalBefore || y.exactosBefore - x.exactosBefore);
    const posBefore: Record<string, number> = {};
    before.forEach((r, i) => { posBefore[r.userId] = i + 1; });

    const snapshot = after.map(r => ({
      userId: r.userId,
      nombre: r.nombre,
      total: r.total,
      posicion: posAfter[r.userId],
      posicionAnterior: posBefore[r.userId],
      delta: posBefore[r.userId] - posAfter[r.userId],
      puntosEstePartido: r.puntosEstePartido,
    }));

    return c.json({ snapshot, hasData: true, estado: target.estado });
  } catch(err) { return c.json({ error:"Error interno", details:String(err) }, 500); }
});

// GET /player-predictions/locked?userId=&leagueId= — predicciones de un jugador (partidos bloqueados/finalizados)
app.get("/make-server-49810636/player-predictions/locked", requireAuth, async (c) => {
  try {
    const targetUserId = c.req.query("userId");
    const leagueId = c.req.query("leagueId");
    if (!targetUserId || !leagueId) return c.json({ error: "Parámetros requeridos" }, 400);
    const { data: preds } = await getDb().from("predictions")
      .select("match_id, goles_a, goles_b, puntos_obtenidos, updated_at")
      .eq("league_id", leagueId).eq("user_id", targetUserId);
    const { data: results } = await getDb().from("match_results").select("match_id, estado, goles_a, goles_b").eq("league_id", leagueId);
    const resultMap: Record<number, any> = {};
    (results || []).forEach((r: any) => { resultMap[r.match_id] = r; });
    const lockedPreds = (preds || []).filter((p: any) => {
      const hasResult = resultMap[p.match_id];
      return isMatchLocked(p.match_id) || hasResult;
    }).map((p: any) => ({
      matchId: p.match_id,
      goles_a: p.goles_a,
      goles_b: p.goles_b,
      puntos_obtenidos: p.puntos_obtenidos,
      predictedAt: p.updated_at ?? null,
      resultado: resultMap[p.match_id] ? { goles_a: resultMap[p.match_id].goles_a, goles_b: resultMap[p.match_id].goles_b, estado: resultMap[p.match_id].estado } : null,
    }));
    return c.json({ predictions: lockedPreds });
  } catch(err) { return c.json({ error:"Error interno", details:String(err) }, 500); }
});

// ── Bracket / Fase Eliminatoria ───────────────────────────────────────────────

/**
 * GET /bracket/phase?leagueId=...
 * Devuelve el estado actual de la fase (grupo abierta / bracket bloqueado)
 */
app.get("/make-server-49810636/bracket/phase", async (c) => {
  try {
    const leagueId = c.req.query("leagueId");
    if (!leagueId) return c.json({ error: "leagueId requerido" }, 400);
    const db = getDb();
    const { data: phase } = await db.from("league_phase").select("*").eq("league_id", leagueId).maybeSingle();
    const { data: cg } = await db.from("group_standings_final").select("grupo").eq("league_id", leagueId).eq("posicion", 1);
    // Si no existe el registro aún, la fase de grupos está abierta
    return c.json({
      groupStageOpen: phase?.group_stage_open ?? true,
      bracketLocked:  phase?.bracket_locked  ?? false,
      lockedAt:       phase?.locked_at       ?? null,
      confirmedGroups: (cg || []).map((g: any) => g.grupo),
    });
  } catch(err) { return c.json({ error:"Error interno", details:String(err) }, 500); }
});

/**
 * GET /bracket/standings-preview?leagueId=...
 * Calcula automáticamente la tabla de posiciones de cada grupo
 * basado en los resultados de match_results (IDs 1-72).
 * Devuelve la tabla ordenada por Pts → DG → GF, lista para que el admin revise.
 */
app.get("/make-server-49810636/bracket/standings-preview", requireAuth, async (c) => {
  try {
    const leagueId = c.req.query("leagueId");
    if (!leagueId) return c.json({ error: "leagueId requerido" }, 400);
    const db = getDb();

    // Traer todos los resultados finalizados de la fase de grupos (matchId 1-72)
    const { data: results } = await db.from("match_results")
      .select("match_id, goles_a, goles_b, estado")
      .eq("league_id", leagueId)
      .lte("match_id", 72)
      .eq("estado", "finalizado");

    const MATCHES = GROUP_MATCHES_DATA;

    // Construir mapa de resultados
    const resultMap: Record<number, { ga: number; gb: number }> = {};
    (results || []).forEach((r: any) => { resultMap[r.match_id] = { ga: r.goles_a, gb: r.goles_b }; });

    // Acumular stats por grupo y equipo
    const groupStats: Record<string, Record<string, { pj:number;pg:number;pe:number;pp:number;gf:number;gc:number;dif:number;pts:number }>> = {};

    for (const m of MATCHES) {
      if (!groupStats[m.grupo]) groupStats[m.grupo] = {};
      for (const eq of [m.a, m.b]) {
        if (!groupStats[m.grupo][eq]) {
          groupStats[m.grupo][eq] = { pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, dif:0, pts:0 };
        }
      }
      const r = resultMap[m.id];
      if (!r) continue;
      const s = groupStats[m.grupo];
      s[m.a].pj++; s[m.b].pj++;
      s[m.a].gf += r.ga; s[m.a].gc += r.gb;
      s[m.b].gf += r.gb; s[m.b].gc += r.ga;
      if (r.ga > r.gb) {
        s[m.a].pg++; s[m.a].pts += 3; s[m.b].pp++;
      } else if (r.ga < r.gb) {
        s[m.b].pg++; s[m.b].pts += 3; s[m.a].pp++;
      } else {
        s[m.a].pe++; s[m.a].pts++; s[m.b].pe++; s[m.b].pts++;
      }
      s[m.a].dif = s[m.a].gf - s[m.a].gc;
      s[m.b].dif = s[m.b].gf - s[m.b].gc;
    }

    // Ordenar cada grupo: Pts → DG → GF
    const grupos: any[] = [];
    for (const [grupo, teams] of Object.entries(groupStats)) {
      const equipos = Object.entries(teams)
        .map(([equipo, s]) => ({ equipo, ...s }))
        .sort((a, b) => b.pts - a.pts || b.dif - a.dif || b.gf - a.gf);
      grupos.push({ grupo, equipos });
    }
    // Ordenar grupos alfabéticamente
    grupos.sort((a, b) => a.grupo.localeCompare(b.grupo));

    return c.json({ standings: grupos });
  } catch(err) { return c.json({ error:"Error interno", details:String(err) }, 500); }
});

/** POST /bracket/confirm-group */
app.post("/make-server-49810636/bracket/confirm-group", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const { leagueId, grupo, equipos } = await c.req.json();
    if (!leagueId || !grupo || !equipos) return c.json({ error: "Datos requeridos" }, 400);
    const db = getDb();
    const { data: league } = await db.from("leagues").select("admin_id").eq("id", leagueId).maybeSingle();
    if (!league || league.admin_id !== user.id) return c.json({ error: "No autorizado" }, 403);

    const now = new Date().toISOString();
    // Insertar standings para este grupo
    await db.from("group_standings_final").delete().eq("league_id", leagueId).eq("grupo", grupo);
    
    const rows = equipos.map((e: any, idx: number) => ({
      league_id: leagueId, grupo, posicion: idx + 1, equipo: e.equipo,
      pts: e.pts ?? 0, gf: e.gf ?? 0, gc: e.gc ?? 0, dif: e.dif ?? 0,
      pj: e.pj ?? 0, pg: e.pg ?? 0, pe: e.pe ?? 0, pp: e.pp ?? 0,
      confirmed_at: now, confirmed_by: user.id
    }));
    await db.from("group_standings_final").insert(rows);

    const getPos = (pos: number) => equipos[pos - 1]?.equipo ?? `${pos}º${grupo}`;
    const t1 = getPos(1);
    const t2 = getPos(2);

    const matchUpdates = [];
    if (grupo === 'A') { matchUpdates.push({ m:73, s:'team1', v:t2 }, { m:79, s:'team1', v:t1 }); }
    if (grupo === 'B') { matchUpdates.push({ m:73, s:'team2', v:t2 }, { m:85, s:'team1', v:t1 }); }
    if (grupo === 'C') { matchUpdates.push({ m:75, s:'team2', v:t2 }, { m:76, s:'team1', v:t1 }); }
    if (grupo === 'D') { matchUpdates.push({ m:81, s:'team1', v:t1 }, { m:88, s:'team1', v:t2 }); }
    if (grupo === 'E') { matchUpdates.push({ m:74, s:'team1', v:t1 }, { m:78, s:'team1', v:t2 }); }
    if (grupo === 'F') { matchUpdates.push({ m:75, s:'team1', v:t1 }, { m:76, s:'team2', v:t2 }); }
    if (grupo === 'G') { matchUpdates.push({ m:82, s:'team1', v:t1 }, { m:88, s:'team2', v:t2 }); }
    if (grupo === 'H') { matchUpdates.push({ m:84, s:'team1', v:t1 }, { m:86, s:'team2', v:t2 }); }
    if (grupo === 'I') { matchUpdates.push({ m:77, s:'team1', v:t1 }, { m:78, s:'team2', v:t2 }); }
    if (grupo === 'J') { matchUpdates.push({ m:84, s:'team2', v:t2 }, { m:86, s:'team1', v:t1 }); }
    if (grupo === 'K') { matchUpdates.push({ m:83, s:'team1', v:t2 }, { m:87, s:'team1', v:t1 }); }
    if (grupo === 'L') { matchUpdates.push({ m:80, s:'team1', v:t1 }, { m:83, s:'team2', v:t2 }); }

    for (const update of matchUpdates) {
      const { data: ext } = await db.from("knockout_match_teams").select("*").eq("league_id", leagueId).eq("match_id", update.m).maybeSingle();
      if (ext) {
        await db.from("knockout_match_teams").update({ [update.s]: update.v }).eq("league_id", leagueId).eq("match_id", update.m);
      } else {
        await db.from("knockout_match_teams").insert({
          league_id: leagueId, match_id: update.m, 
          team1: update.s === 'team1' ? update.v : "",
          team2: update.s === 'team2' ? update.v : ""
        });
      }
    }

    return c.json({ message: "Grupo confirmado", grupo });
  } catch(err) { return c.json({ error:"Error interno", details:String(err) }, 500); }
});

app.post("/make-server-49810636/bracket/confirm-thirds", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const { leagueId, thirdMappings } = await c.req.json();
    if (!leagueId || !thirdMappings || Object.keys(thirdMappings).length !== 8) return c.json({ error: "Faltan los mapeos de los 8 terceros" }, 400);
    const db = getDb();
    const { data: league } = await db.from("leagues").select("admin_id").eq("id", leagueId).maybeSingle();
    if (!league || league.admin_id !== user.id) return c.json({ error: "No autorizado" }, 403);

    const thirdUpdates = Object.entries(thirdMappings).map(([matchId, teamName]) => ({
      m: parseInt(matchId),
      s: 'team2',
      v: teamName
    }));

    for (const update of thirdUpdates) {
      const { data: ext } = await db.from("knockout_match_teams").select("*").eq("league_id", leagueId).eq("match_id", update.m).maybeSingle();
      if (ext) {
        await db.from("knockout_match_teams").update({ [update.s]: update.v }).eq("league_id", leagueId).eq("match_id", update.m);
      } else {
        await db.from("knockout_match_teams").insert({
          league_id: leagueId, match_id: update.m, 
          team1: "", team2: update.v
        });
      }
    }

    const now = new Date().toISOString();
    await db.from("league_phase").upsert({
      league_id: leagueId, group_stage_open: false, bracket_locked: true,
      locked_at: now, locked_by: user.id, updated_at: now,
    });

    return c.json({ message: "Terceros confirmados y bracket bloqueado" });
  } catch(err) { return c.json({ error:"Error interno", details:String(err) }, 500); }
});

/**
 * GET /bracket/knockout-teams?leagueId=...
 * Devuelve los equipos reales de los partidos eliminatorios (una vez confirmado el bracket).
 */
app.get("/make-server-49810636/bracket/knockout-teams", async (c) => {
  try {
    const leagueId = c.req.query("leagueId");
    if (!leagueId) return c.json({ error: "leagueId requerido" }, 400);
    const { data: teams } = await getDb().from("knockout_match_teams")
      .select("match_id, team1, team2")
      .eq("league_id", leagueId)
      .order("match_id");
    const map: Record<number, { team1: string; team2: string }> = {};
    (teams || []).forEach((t: any) => { map[t.match_id] = { team1: t.team1, team2: t.team2 }; });
    return c.json({ teams: map });
  } catch(err) { return c.json({ error:"Error interno", details:String(err) }, 500); }
});

/**
 * GET /bracket/group-standings-final?leagueId=...
 * Devuelve la tabla de posiciones confirmada por el admin.
 */
app.get("/make-server-49810636/bracket/group-standings-final", async (c) => {
  try {
    const leagueId = c.req.query("leagueId");
    if (!leagueId) return c.json({ error: "leagueId requerido" }, 400);
    const { data: rows } = await getDb().from("group_standings_final")
      .select("grupo, posicion, equipo, pts, gf, gc, dif, pj, pg, pe, pp")
      .eq("league_id", leagueId)
      .order("grupo").order("posicion");
    // Agrupar por grupo
    const grouped: Record<string, any[]> = {};
    (rows || []).forEach((r: any) => {
      if (!grouped[r.grupo]) grouped[r.grupo] = [];
      grouped[r.grupo].push(r);
    });
    const standings = Object.entries(grouped).map(([grupo, equipos]) => ({ grupo, equipos }));
    return c.json({ standings });
  } catch(err) { return c.json({ error:"Error interno", details:String(err) }, 500); }
});

// ── Cálculo de puntos ─────────────────────────────────────────────────────────

// Lógica de puntos: exacto=5, resultado correcto=2, fallo=0.
// Usa SUM de TODAS las predicciones del usuario (no delta) para garantizar
// consistencia incluso con 2 partidos simultáneos procesados secuencialmente.
async function calculatePoints(matchId: number, leagueId: string, actualA: number, actualB: number) {
  try {
    const db = getDb();

    // Paso 1: fetch todas las predicciones del partido en 1 query
    const { data: preds } = await db.from("predictions")
      .select("id, user_id, goles_a, goles_b, puntos_obtenidos")
      .eq("match_id", matchId).eq("league_id", leagueId);
    if (!preds?.length) return;

    // Paso 2: calcular nuevos puntos en memoria para cada predicción
    const updates: { id: string; userId: string; pts: number; oldPts: number | null }[] = [];
    for (const p of preds) {
      let pts = 0;
      if (p.goles_a === actualA && p.goles_b === actualB) {
        pts = 5;
      } else if (Math.sign(p.goles_a - p.goles_b) === Math.sign(actualA - actualB)) {
        pts = 2;
      }
      updates.push({ id: p.id, userId: p.user_id, pts, oldPts: p.puntos_obtenidos });
    }

    // Paso 3: actualizar SOLO las predicciones que cambiaron (evita writes innecesarios)
    const changed = updates.filter(u => u.pts !== u.oldPts);
    for (const u of changed) {
      await db.from("predictions").update({ puntos_obtenidos: u.pts }).eq("id", u.id);
    }

    // Paso 4: si ninguna predicción cambió de puntos, no recalcular totales
    if (!changed.length) return;

    // Paso 5: recalcular total de cada usuario afectado de forma ATÓMICA.
    // El RPC recompute_user_score (migración 004) toma un advisory lock por
    // (league, user) que abarca la lectura del SUM y la escritura del total,
    // de modo que el poller automático y un resultado manual del admin nunca
    // se pisan aunque corran simultáneamente. Esto elimina la race condition
    // del incidente. NO escribe marcadores_exactos (columna inexistente; el
    // leaderboard deriva los exactos contando predictions con puntos = 5).
    const affectedUsers = [...new Set(changed.map(u => u.userId))];
    for (const userId of affectedUsers) {
      const { error } = await db.rpc("recompute_user_score", {
        p_league: leagueId,
        p_user: userId,
      });
      if (error) console.error("[calculatePoints] recompute_user_score error:", error);
    }
  } catch (err) { console.error("[calculatePoints] error:", err); }
}

// ── Cron / Live Poller ────────────────────────────────────────────────────────

app.post("/make-server-49810636/cron/poll-live", async (c) => {
  try {
    const db = getDb();
    const { data: leagues } = await db.from("leagues").select("id");
    const leagueIds = (leagues||[]).map((l:any)=>l.id);
    if (!leagueIds.length) return c.json({ message:"Sin ligas" });
    // Fire-and-forget: respond immediately, loop runs in background
    const pollPromise = runPollLoop(leagueIds);
    try { (globalThis as any).EdgeRuntime?.waitUntil(pollPromise); } catch {}
    pollPromise.catch((err:any)=>console.error('[poller] loop error:',err));
    return c.json({ message:"Poll iniciado", leagues:leagueIds.length });
  } catch(err) { return c.json({ error:"Error interno", details:String(err) }, 500); }
});

// GET /live/scores — endpoint ultraligero para polling de 5s desde el frontend.
// Devuelve solo las filas en_curso del league; payload mínimo (~200 bytes).
// Requiere auth (requireAuth) y acota por leagueId en query.
app.get("/make-server-49810636/live/scores", requireAuth, async (c) => {
  try {
    const leagueId = c.req.query("leagueId");
    if (!leagueId) return c.json({ scores: [] });
    const db = getDb();
    const { data } = await db.from("match_results")
      .select("match_id, goles_a, goles_b, estado, minuto, api_status, updated_at, segundo_tiempo_inicio")
      .eq("league_id", leagueId)
      .eq("estado", "en_curso");
    return c.json({ scores: data || [] });
  } catch (err) { return c.json({ error: "Error interno", details: String(err) }, 500); }
});

// POST /matches/:matchId/knockout-winner — advance bracket for ET/PEN draw matches
app.post("/make-server-49810636/matches/:matchId/knockout-winner", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const matchId = parseInt(c.req.param("matchId"));
    const { leagueId, winner } = await c.req.json();
    if (!leagueId||!winner) return c.json({ error:"leagueId y winner requeridos" }, 400);
    if (matchId<73) return c.json({ error:"Solo para partidos eliminatorios" }, 400);
    const db = getDb();
    const { data: league } = await db.from("leagues").select("admin_id").eq("id",leagueId).maybeSingle();
    if (!league||league.admin_id!==user.id) return c.json({ error:"No autorizado" }, 403);
    const { data: mt } = await db.from("knockout_match_teams").select("team1,team2").eq("league_id",leagueId).eq("match_id",matchId).maybeSingle();
    if (!mt) return c.json({ error:"Equipos no encontrados" }, 404);
    const loser = winner===mt.team1 ? mt.team2 : mt.team1;
    const nextW=NEXT_MATCH_MAP[matchId];
    if (nextW) {
      const {data:ext}=await db.from("knockout_match_teams").select("*").eq("league_id",leagueId).eq("match_id",nextW.match).maybeSingle();
      if (ext) await db.from("knockout_match_teams").update({[nextW.slot]:winner}).eq("league_id",leagueId).eq("match_id",nextW.match);
      else await db.from("knockout_match_teams").insert({league_id:leagueId,match_id:nextW.match,team1:nextW.slot==='team1'?winner:"",team2:nextW.slot==='team2'?winner:""});
    }
    const nextL=LOSER_MAP[matchId];
    if (nextL&&loser) {
      const {data:ext}=await db.from("knockout_match_teams").select("*").eq("league_id",leagueId).eq("match_id",nextL.match).maybeSingle();
      if (ext) await db.from("knockout_match_teams").update({[nextL.slot]:loser}).eq("league_id",leagueId).eq("match_id",nextL.match);
      else await db.from("knockout_match_teams").insert({league_id:leagueId,match_id:nextL.match,team1:nextL.slot==='team1'?loser:"",team2:nextL.slot==='team2'?loser:""});
    }
    return c.json({ message:"Bracket avanzado", winner, loser });
  } catch(err) { return c.json({ error:"Error interno", details:String(err) }, 500); }
});

Deno.serve(app.fetch);