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

const app = new Hono();
app.use("*", logger(console.log));
app.use("/*", cors({ origin:"*", allowHeaders:["Content-Type","Authorization"], allowMethods:["GET","POST","PUT","DELETE","OPTIONS"], maxAge:600 }));

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
    return c.json({ token, user: { ...newUser, is_admin: isAdmin(newUser.email) } });
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
    return c.json({ token, user: { id:user.id, email:user.email, nombre:user.nombre, is_admin: isAdmin(user.email) } });
  } catch(err) { return c.json({ error:"Error interno", details:String(err) }, 500); }
});

app.get("/make-server-49810636/auth/me", requireAuth, (c) => {
  const user = c.get("user");
  return c.json({ user: { ...user, is_admin: isAdmin(user.email) } });
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
    const { count } = await db.from("leagues").select("*", { count:"exact", head:true });
    if ((count ?? 0) > 0) return c.json({ error: "Ya existe una liga activa." }, 400);
    const { nombre } = await c.req.json();
    if (!nombre?.trim()) return c.json({ error: "El nombre de la liga es requerido" }, 400);
    const { data: league, error } = await db.from("leagues").insert({ nombre: nombre.trim(), admin_id: user.id, invitation_code: "INTERSEGURO" }).select("id, nombre, admin_id, invitation_code").single();
    if (error || !league) return c.json({ error: "Error al crear la liga" }, 500);
    await db.from("league_members").insert({ league_id: league.id, user_id: user.id, status: "active" });
    await db.from("scores").insert({ league_id: league.id, user_id: user.id, total: 0 });
    // Inicializar league_phase
    await db.from("league_phase").insert({ league_id: league.id, group_stage_open: true, bracket_locked: false });
    return c.json({ league: { id: league.id, nombre: league.nombre, admin_id: league.admin_id, invitationCode: league.invitation_code, member_count: 1 } });
  } catch(err) { return c.json({ error:"Error interno", details:String(err) }, 500); }
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
    const { data: rows } = await getDb().from("scores").select("total, users(id, email, nombre)").eq("league_id", leagueId).order("total", { ascending: false });
    return c.json({ leaderboard: (rows || []).map((r: any, i: number) => ({ userId:r.users.id, nombre:r.users.nombre, email:r.users.email, puntajeTotal:r.total, posicion:i+1 })) });
  } catch(err) { return c.json({ error:"Error interno", details:String(err) }, 500); }
});

// ── Partidos / Resultados ─────────────────────────────────────────────────────

app.get("/make-server-49810636/matches/results", async (c) => {
  try {
    const leagueId = c.req.query("leagueId");
    if (!leagueId) return c.json({ error: "leagueId requerido" }, 400);
    const { data: results } = await getDb().from("match_results").select("match_id, goles_a, goles_b, estado, updated_at").eq("league_id", leagueId);
    const map: Record<number, any> = {};
    (results || []).forEach((r: any) => { map[r.match_id] = { matchId:r.match_id, golesA:r.goles_a, golesB:r.goles_b, estado:r.estado, updatedAt:r.updated_at }; });
    return c.json({ results: map });
  } catch(err) { return c.json({ error:"Error interno", details:String(err) }, 500); }
});

app.post("/make-server-49810636/matches/:matchId/result", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const matchId = parseInt(c.req.param("matchId"));
    const { leagueId, golesA, golesB, estado } = await c.req.json();
    const db = getDb();
    const { data: league } = await db.from("leagues").select("admin_id").eq("id", leagueId).maybeSingle();
    if (!league) return c.json({ error: "Liga no encontrada" }, 404);
    if (league.admin_id !== user.id) return c.json({ error: "Solo el admin" }, 403);
    await db.from("match_results").upsert({ match_id:matchId, league_id:leagueId, goles_a:golesA, goles_b:golesB, estado:estado||"finalizado", updated_by:user.id, updated_at:new Date().toISOString() });
    if (estado === "finalizado") await calculatePoints(matchId, leagueId, golesA, golesB);
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
    const db = getDb();
    const { data: result } = await db.from("match_results").select("estado").eq("match_id", matchId).eq("league_id", leagueId).maybeSingle();
    if (result?.estado === "finalizado") return c.json({ error: "Partido ya finalizado" }, 400);
    const { data: existing } = await db.from("predictions")
      .select("id")
      .eq("league_id", leagueId)
      .eq("user_id", user.id)
      .eq("match_id", matchId)
      .maybeSingle();

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
        .insert({ league_id: leagueId, user_id: user.id, match_id: matchId, goles_a: golesA, goles_b: golesB, updated_at: new Date().toISOString() })
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

    // Definición estática de los grupos (igual que groupStageMatches.ts)
    const MATCHES: { id: number; a: string; b: string; grupo: string }[] = [
      // Grupo A
      { id:1,  a:"México",          b:"Sudáfrica",           grupo:"A" },
      { id:2,  a:"Corea del Sur",   b:"República Checa",     grupo:"A" },
      { id:3,  a:"República Checa", b:"Sudáfrica",           grupo:"A" },
      { id:4,  a:"México",          b:"Corea del Sur",       grupo:"A" },
      { id:5,  a:"República Checa", b:"México",              grupo:"A" },
      { id:6,  a:"Sudáfrica",       b:"Corea del Sur",       grupo:"A" },
      // Grupo B
      { id:7,  a:"Canadá",          b:"Bosnia & Herzegovina",grupo:"B" },
      { id:8,  a:"Catar",           b:"Suiza",               grupo:"B" },
      { id:9,  a:"Suiza",           b:"Bosnia & Herzegovina",grupo:"B" },
      { id:10, a:"Canadá",          b:"Catar",               grupo:"B" },
      { id:11, a:"Suiza",           b:"Canadá",              grupo:"B" },
      { id:12, a:"Bosnia & Herzegovina", b:"Catar",          grupo:"B" },
      // Grupo C
      { id:13, a:"Brasil",          b:"Marruecos",           grupo:"C" },
      { id:14, a:"Haití",           b:"Escocia",             grupo:"C" },
      { id:15, a:"Escocia",         b:"Marruecos",           grupo:"C" },
      { id:16, a:"Brasil",          b:"Haití",               grupo:"C" },
      { id:17, a:"Escocia",         b:"Brasil",              grupo:"C" },
      { id:18, a:"Marruecos",       b:"Haití",               grupo:"C" },
      // Grupo D
      { id:19, a:"USA",             b:"Paraguay",            grupo:"D" },
      { id:20, a:"Australia",       b:"Turquía",             grupo:"D" },
      { id:21, a:"USA",             b:"Australia",           grupo:"D" },
      { id:22, a:"Turquía",         b:"Paraguay",            grupo:"D" },
      { id:23, a:"Turquía",         b:"USA",                 grupo:"D" },
      { id:24, a:"Paraguay",        b:"Australia",           grupo:"D" },
      // Grupo E
      { id:25, a:"Alemania",        b:"Curazao",             grupo:"E" },
      { id:26, a:"Costa de Marfil", b:"Ecuador",             grupo:"E" },
      { id:27, a:"Alemania",        b:"Costa de Marfil",     grupo:"E" },
      { id:28, a:"Ecuador",         b:"Curazao",             grupo:"E" },
      { id:29, a:"Curazao",         b:"Costa de Marfil",     grupo:"E" },
      { id:30, a:"Ecuador",         b:"Alemania",            grupo:"E" },
      // Grupo F
      { id:31, a:"Países Bajos",    b:"Japón",               grupo:"F" },
      { id:32, a:"Suecia",          b:"Túnez",               grupo:"F" },
      { id:33, a:"Países Bajos",    b:"Suecia",              grupo:"F" },
      { id:34, a:"Túnez",           b:"Japón",               grupo:"F" },
      { id:35, a:"Japón",           b:"Suecia",              grupo:"F" },
      { id:36, a:"Túnez",           b:"Países Bajos",        grupo:"F" },
      // Grupo G
      { id:37, a:"Bélgica",         b:"Egipto",              grupo:"G" },
      { id:38, a:"Irán",            b:"Nueva Zelanda",       grupo:"G" },
      { id:39, a:"Bélgica",         b:"Irán",                grupo:"G" },
      { id:40, a:"Nueva Zelanda",   b:"Egipto",              grupo:"G" },
      { id:41, a:"Egipto",          b:"Irán",                grupo:"G" },
      { id:42, a:"Nueva Zelanda",   b:"Bélgica",             grupo:"G" },
      // Grupo H
      { id:43, a:"España",          b:"Cabo Verde",          grupo:"H" },
      { id:44, a:"Arabia Saudita",  b:"Uruguay",             grupo:"H" },
      { id:45, a:"España",          b:"Arabia Saudita",      grupo:"H" },
      { id:46, a:"Uruguay",         b:"Cabo Verde",          grupo:"H" },
      { id:47, a:"Cabo Verde",      b:"Arabia Saudita",      grupo:"H" },
      { id:48, a:"Uruguay",         b:"España",              grupo:"H" },
      // Grupo I
      { id:49, a:"Francia",         b:"Senegal",             grupo:"I" },
      { id:50, a:"Iraq",            b:"Noruega",             grupo:"I" },
      { id:51, a:"Francia",         b:"Iraq",                grupo:"I" },
      { id:52, a:"Noruega",         b:"Senegal",             grupo:"I" },
      { id:53, a:"Noruega",         b:"Francia",             grupo:"I" },
      { id:54, a:"Senegal",         b:"Iraq",                grupo:"I" },
      // Grupo J
      { id:55, a:"Argentina",       b:"Argelia",             grupo:"J" },
      { id:56, a:"Austria",         b:"Jordania",            grupo:"J" },
      { id:57, a:"Argentina",       b:"Austria",             grupo:"J" },
      { id:58, a:"Jordania",        b:"Argelia",             grupo:"J" },
      { id:59, a:"Argelia",         b:"Austria",             grupo:"J" },
      { id:60, a:"Jordania",        b:"Argentina",           grupo:"J" },
      // Grupo K
      { id:61, a:"Portugal",        b:"DR Congo",            grupo:"K" },
      { id:62, a:"Uzbekistán",      b:"Colombia",            grupo:"K" },
      { id:63, a:"Portugal",        b:"Uzbekistán",          grupo:"K" },
      { id:64, a:"Colombia",        b:"DR Congo",            grupo:"K" },
      { id:65, a:"Colombia",        b:"Portugal",            grupo:"K" },
      { id:66, a:"DR Congo",        b:"Uzbekistán",          grupo:"K" },
      // Grupo L
      { id:67, a:"Inglaterra",      b:"Croacia",             grupo:"L" },
      { id:68, a:"Ghana",           b:"Panamá",              grupo:"L" },
      { id:69, a:"Inglaterra",      b:"Ghana",               grupo:"L" },
      { id:70, a:"Panamá",          b:"Croacia",             grupo:"L" },
      { id:71, a:"Panamá",          b:"Inglaterra",          grupo:"L" },
      { id:72, a:"Croacia",         b:"Ghana",               grupo:"L" },
    ];

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

app.get("/make-server-49810636/bracket/debug-knockout", async (c) => {
  const db = getDb();
  const res = await db.from("knockout_match_teams").insert({
    league_id: "be1a0128-f18b-4385-b624-6efa46ab03eb",
    match_id: 73,
    team1: "A",
    team2: "B"
  });
  return c.json({ data: res.data, error: res.error });
});

app.get("/make-server-49810636/bracket/fix-knockout", async (c) => {
  try {
    const db = getDb();
    const { data: rows } = await db.from("group_standings_final").select("*");
    if (!rows || rows.length === 0) return c.json({ error: "No rows", rows });

    const byLeague: Record<string, Record<string, any[]>> = {};
    for (const r of rows) {
      if (!byLeague[r.league_id]) byLeague[r.league_id] = {};
      if (!byLeague[r.league_id][r.grupo]) byLeague[r.league_id][r.grupo] = [];
      byLeague[r.league_id][r.grupo].push(r);
    }

    const updates = [];
    for (const [leagueId, grouped] of Object.entries(byLeague)) {
      for (const [grupo, equipos] of Object.entries(grouped)) {
        equipos.sort((a,b) => a.posicion - b.posicion);
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
      }
      updates.push({ leagueId, grupos: Object.keys(grouped) });
    }
    return c.json({ fixed: true, updates });
  } catch(err) { return c.json({ error: String(err) }, 500); }
});

// ── Cálculo de puntos ─────────────────────────────────────────────────────────

async function calculatePoints(matchId: number, leagueId: string, actualA: number, actualB: number) {
  try {
    const db = getDb();
    const { data: preds } = await db.from("predictions").select("id, user_id, goles_a, goles_b").eq("match_id", matchId).eq("league_id", leagueId);
    if (!preds?.length) return;
    for (const p of preds) {
      let pts = 0;
      if (p.goles_a === actualA && p.goles_b === actualB) { pts = 5; }
      else if (Math.sign(p.goles_a - p.goles_b) === Math.sign(actualA - actualB)) { pts = 2; }
      await db.from("predictions").update({ puntos_obtenidos: pts }).eq("id", p.id);
      const { data: score } = await db.from("scores").select("total").eq("league_id", leagueId).eq("user_id", p.user_id).maybeSingle();
      await db.from("scores").upsert({ league_id:leagueId, user_id:p.user_id, total:(score?.total||0)+pts, updated_at:new Date().toISOString() });
    }
  } catch(err) { console.error("calculatePoints error:", err); }
}

Deno.serve(app.fetch);