// ===== db.tsx inlined =====
/**
 * db.tsx – Cliente Supabase singleton para la Edge Function.
 * Usa service_role key para bypassear RLS en operaciones del servidor.
 */
import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2.49.8";

let _client: SupabaseClient | null = null;

export function getDb(): SupabaseClient {
  if (!_client) {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) {
      throw new Error("SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos");
    }
    _client = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return _client;
}


// ===== index.tsx =====
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
// getDb imported from above

const app = new Hono();

// ============================================================
// Utilidades
// ============================================================

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateToken(): string {
  return crypto.randomUUID();
}

function generateInvitationCode(): string {
  return `MUND-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

// ============================================================
// Middleware de autenticación
// ============================================================

const requireAuth = async (c: any, next: any) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "No autorizado: falta el token" }, 401);
  }

  const token = authHeader.split(" ")[1];
  const db = getDb();

  const { data: session, error } = await db
    .from("sessions")
    .select("user_id, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (error || !session) {
    return c.json({ error: "No autorizado: token inválido" }, 401);
  }

  if (new Date(session.expires_at) < new Date()) {
    await db.from("sessions").delete().eq("token", token);
    return c.json({ error: "No autorizado: sesión expirada" }, 401);
  }

  const { data: user } = await db
    .from("users")
    .select("id, email, nombre")
    .eq("id", session.user_id)
    .maybeSingle();

  if (!user) {
    return c.json({ error: "No autorizado: usuario no encontrado" }, 401);
  }

  c.set("user", user);
  await next();
};

// ============================================================
// Middleware globales
// ============================================================

app.use("*", logger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  })
);

// ============================================================
// Health check
// ============================================================

app.get("/make-server-49810636/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "3.0.0-relational",
    message: "Servidor con base de datos relacional",
  });
});

// ============================================================
// AUTH
// ============================================================

// POST /auth/signup
app.post("/make-server-49810636/auth/signup", async (c) => {
  try {
    const { email, password, nombre } = await c.req.json();

    if (!email || !password || !nombre) {
      return c.json({ error: "Faltan campos requeridos: email, password, nombre" }, 400);
    }
    if (password.length < 6) {
      return c.json({ error: "La contraseña debe tener al menos 6 caracteres" }, 400);
    }

    const db = getDb();

    // Verificar si el email ya existe
    const { data: existing } = await db
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return c.json({ error: "Este email ya está registrado" }, 400);
    }

    const passwordHash = await hashPassword(password);

    const { data: newUser, error: insertError } = await db
      .from("users")
      .insert({ email, nombre, password_hash: passwordHash })
      .select("id, email, nombre")
      .single();

    if (insertError || !newUser) {
      console.error("Error creando usuario:", insertError);
      return c.json({ error: "Error al crear la cuenta" }, 500);
    }

    // Crear sesión
    const token = generateToken();
    await db.from("sessions").insert({
      token,
      user_id: newUser.id,
    });

    return c.json({ token, user: newUser });
  } catch (error) {
    console.error("Signup error:", error);
    return c.json({ error: "Error interno", details: String(error) }, 500);
  }
});

// POST /auth/signin
app.post("/make-server-49810636/auth/signin", async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: "Faltan email o contraseña" }, 400);
    }

    const db = getDb();

    const { data: user } = await db
      .from("users")
      .select("id, email, nombre, password_hash")
      .eq("email", email)
      .maybeSingle();

    if (!user) {
      return c.json({ error: "Email o contraseña incorrectos" }, 401);
    }

    const passwordHash = await hashPassword(password);
    if (passwordHash !== user.password_hash) {
      return c.json({ error: "Email o contraseña incorrectos" }, 401);
    }

    const token = generateToken();
    await db.from("sessions").insert({ token, user_id: user.id });

    return c.json({
      token,
      user: { id: user.id, email: user.email, nombre: user.nombre },
    });
  } catch (error) {
    console.error("Signin error:", error);
    return c.json({ error: "Error interno", details: String(error) }, 500);
  }
});

// GET /auth/me
app.get("/make-server-49810636/auth/me", requireAuth, (c) => {
  const user = c.get("user");
  return c.json({ user });
});

// POST /auth/logout
app.post("/make-server-49810636/auth/logout", requireAuth, async (c) => {
  const token = c.req.header("Authorization")!.split(" ")[1];
  await getDb().from("sessions").delete().eq("token", token);
  return c.json({ message: "Sesión cerrada" });
});

// ============================================================
// LEAGUES
// ============================================================

// GET /leagues/any — ¿Existe alguna liga? (para controlar acceso a creación)
app.get("/make-server-49810636/leagues/any", async (c) => {
  try {
    const db = getDb();
    const { count } = await db
      .from("leagues")
      .select("*", { count: "exact", head: true });

    return c.json({ exists: (count ?? 0) > 0 });
  } catch (error) {
    return c.json({ exists: false });
  }
});

// POST /leagues — Crear liga (solo si no existe ninguna)
app.post("/make-server-49810636/leagues", requireAuth, async (c) => {
  // Enforce: solo puede existir una liga en toda la app
  const db2 = getDb();
  const { count } = await db2.from("leagues").select("*", { count: "exact", head: true });
  if ((count ?? 0) > 0) {
    return c.json({ error: "Ya existe una liga activa. Solo puede existir una liga por evento." }, 400);
  }
  try {
    const user = c.get("user");
    const { nombre } = await c.req.json();

    if (!nombre?.trim()) {
      return c.json({ error: "El nombre de la liga es requerido" }, 400);
    }

    const db = getDb();
    const invitationCode = generateInvitationCode();

    const { data: league, error } = await db
      .from("leagues")
      .insert({ nombre: nombre.trim(), admin_id: user.id, invitation_code: invitationCode })
      .select("id, nombre, admin_id, invitation_code, created_at")
      .single();

    if (error || !league) {
      console.error("Error creando liga:", error);
      return c.json({ error: "Error al crear la liga" }, 500);
    }

    // El admin es miembro activo desde el inicio
    await db.from("league_members").insert({
      league_id: league.id,
      user_id: user.id,
      status: "active",
    });

    // Inicializar score del admin
    await db.from("scores").insert({ league_id: league.id, user_id: user.id, total: 0 });

    return c.json({
      league: {
        id: league.id,
        nombre: league.nombre,
        admin_id: league.admin_id,
        invitationCode: league.invitation_code,
        created_at: league.created_at,
      },
    });
  } catch (error) {
    console.error("Create league error:", error);
    return c.json({ error: "Error interno" }, 500);
  }
});

// GET /leagues/my — Ligas del usuario
app.get("/make-server-49810636/leagues/my", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const db = getDb();

    const { data: memberships, error } = await db
      .from("league_members")
      .select("league_id, status, leagues(id, nombre, admin_id, invitation_code, created_at)")
      .eq("user_id", user.id)
      .eq("status", "active");

    if (error) {
      console.error("Error cargando ligas:", error);
      return c.json({ error: "Error al obtener ligas" }, 500);
    }

    // Para cada liga, contar miembros activos
    const leagues = await Promise.all(
      (memberships || []).map(async (m: any) => {
        const { count } = await db
          .from("league_members")
          .select("*", { count: "exact", head: true })
          .eq("league_id", m.leagues.id)
          .eq("status", "active");

        return {
          id: m.leagues.id,
          nombre: m.leagues.nombre,
          admin_id: m.leagues.admin_id,
          invitationCode: m.leagues.invitation_code,
          member_count: count ?? 1,
          created_at: m.leagues.created_at,
        };
      })
    );

    return c.json({ leagues });
  } catch (error) {
    console.error("Get my leagues error:", error);
    return c.json({ error: "Error interno" }, 500);
  }
});

// GET /leagues/code/:code — Buscar liga por código
app.get("/make-server-49810636/leagues/code/:code", async (c) => {
  try {
    const code = c.req.param("code").toUpperCase();
    const db = getDb();

    const { data: league, error } = await db
      .from("leagues")
      .select("id, nombre, admin_id, invitation_code, created_at")
      .eq("invitation_code", code)
      .maybeSingle();

    if (error || !league) {
      return c.json({ error: "Código de invitación inválido" }, 404);
    }

    return c.json({
      league: {
        id: league.id,
        nombre: league.nombre,
        admin_id: league.admin_id,
        invitationCode: league.invitation_code,
      },
    });
  } catch (error) {
    console.error("Get league by code error:", error);
    return c.json({ error: "Error interno" }, 500);
  }
});

// POST /leagues/:leagueId/join — Solicitar unirse
app.post("/make-server-49810636/leagues/:leagueId/join", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const leagueId = c.req.param("leagueId");
    const db = getDb();

    // Verificar que la liga existe
    const { data: league } = await db
      .from("leagues")
      .select("id, nombre")
      .eq("id", leagueId)
      .maybeSingle();

    if (!league) {
      return c.json({ error: "Liga no encontrada" }, 404);
    }

    // Verificar si ya es miembro o tiene solicitud pendiente
    const { data: existing } = await db
      .from("league_members")
      .select("status")
      .eq("league_id", leagueId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing?.status === "active") {
      return c.json({ error: "Ya eres miembro de esta liga" }, 400);
    }
    if (existing?.status === "pending") {
      return c.json({ error: "Tu solicitud ya está pendiente de aprobación" }, 400);
    }

    await db.from("league_members").insert({
      league_id: leagueId,
      user_id: user.id,
      status: "pending",
    });

    return c.json({ message: "Solicitud enviada, esperando aprobación del administrador" });
  } catch (error) {
    console.error("Join league error:", error);
    return c.json({ error: "Error interno" }, 500);
  }
});

// GET /leagues/:leagueId/pending — Solicitudes pendientes (solo admin)
app.get("/make-server-49810636/leagues/:leagueId/pending", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const leagueId = c.req.param("leagueId");
    const db = getDb();

    // Verificar que es admin
    const { data: league } = await db
      .from("leagues")
      .select("admin_id")
      .eq("id", leagueId)
      .maybeSingle();

    if (!league) return c.json({ error: "Liga no encontrada" }, 404);
    if (league.admin_id !== user.id) {
      return c.json({ error: "Solo el administrador puede ver solicitudes" }, 403);
    }

    const { data: pending, error } = await db
      .from("league_members")
      .select("user_id, joined_at, users(id, email, nombre)")
      .eq("league_id", leagueId)
      .eq("status", "pending");

    if (error) {
      return c.json({ error: "Error al obtener solicitudes" }, 500);
    }

    const pendingUsers = (pending || []).map((m: any) => ({
      id: m.users.id,
      email: m.users.email,
      nombre: m.users.nombre,
      requested_at: m.joined_at,
    }));

    return c.json({ pendingUsers });
  } catch (error) {
    console.error("Get pending error:", error);
    return c.json({ error: "Error interno" }, 500);
  }
});

// POST /leagues/:leagueId/approve — Aprobar o rechazar usuario (solo admin)
app.post("/make-server-49810636/leagues/:leagueId/approve", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const leagueId = c.req.param("leagueId");
    const { userId, approved } = await c.req.json();
    const db = getDb();

    // Verificar que es admin
    const { data: league } = await db
      .from("leagues")
      .select("admin_id")
      .eq("id", leagueId)
      .maybeSingle();

    if (!league) return c.json({ error: "Liga no encontrada" }, 404);
    if (league.admin_id !== user.id) {
      return c.json({ error: "Solo el administrador puede aprobar usuarios" }, 403);
    }

    if (approved) {
      // Activar membresía
      await db
        .from("league_members")
        .update({ status: "active" })
        .eq("league_id", leagueId)
        .eq("user_id", userId);

      // Inicializar score del nuevo miembro
      await db
        .from("scores")
        .upsert({ league_id: leagueId, user_id: userId, total: 0 });
    } else {
      // Rechazar: eliminar la solicitud
      await db
        .from("league_members")
        .delete()
        .eq("league_id", leagueId)
        .eq("user_id", userId);
    }

    return c.json({ message: approved ? "Usuario aprobado" : "Usuario rechazado" });
  } catch (error) {
    console.error("Approve user error:", error);
    return c.json({ error: "Error interno" }, 500);
  }
});

// GET /leagues/:leagueId/leaderboard — Tabla de posiciones
app.get("/make-server-49810636/leagues/:leagueId/leaderboard", requireAuth, async (c) => {
  try {
    const leagueId = c.req.param("leagueId");
    const db = getDb();

    const { data: rows, error } = await db
      .from("scores")
      .select("total, users(id, email, nombre)")
      .eq("league_id", leagueId)
      .order("total", { ascending: false });

    if (error) {
      return c.json({ error: "Error al obtener leaderboard" }, 500);
    }

    const leaderboard = (rows || []).map((row: any, index: number) => ({
      userId: row.users.id,
      nombre: row.users.nombre,
      email: row.users.email,
      puntajeTotal: row.total,
      posicion: index + 1,
    }));

    return c.json({ leaderboard });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return c.json({ error: "Error interno" }, 500);
  }
});

// ============================================================
// BRACKET
// ============================================================

// GET /bracket/phase
app.get("/make-server-49810636/bracket/phase", async (c) => {
  try {
    const leagueId = c.req.query("leagueId");
    if (!leagueId) return c.json({ error: "leagueId es requerido" }, 400);

    const db = getDb();
    const { data: league, error } = await db
      .from("leagues")
      .select("bracket_locked, bracket_locked_at")
      .eq("id", leagueId)
      .maybeSingle();

    if (error || !league) return c.json({ bracketLocked: false, lockedAt: null });

    return c.json({
      bracketLocked: league.bracket_locked ?? false,
      lockedAt: league.bracket_locked_at ?? null,
    });
  } catch (error) {
    console.error("Get phase error:", error);
    return c.json({ bracketLocked: false, lockedAt: null });
  }
});

// GET /bracket/knockout-teams
app.get("/make-server-49810636/bracket/knockout-teams", async (c) => {
  try {
    const leagueId = c.req.query("leagueId");
    if (!leagueId) return c.json({ error: "leagueId es requerido" }, 400);

    const db = getDb();
    const { data: league, error } = await db
      .from("leagues")
      .select("knockout_teams")
      .eq("id", leagueId)
      .maybeSingle();

    if (error || !league) return c.json({ teams: {} });

    return c.json({ teams: league.knockout_teams ?? {} });
  } catch (error) {
    console.error("Get knockout teams error:", error);
    return c.json({ error: "Error interno" }, 500);
  }
});

// POST /bracket/confirm-standings
app.post("/make-server-49810636/bracket/confirm-standings", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const { leagueId, standings } = await c.req.json();

    if (!leagueId || !standings) {
      return c.json({ error: "Faltan datos requeridos" }, 400);
    }

    const db = getDb();

    // Verify admin
    const { data: league } = await db
      .from("leagues")
      .select("admin_id, bracket_locked")
      .eq("id", leagueId)
      .maybeSingle();

    if (!league) return c.json({ error: "Liga no encontrada" }, 404);
    if (league.admin_id !== user.id) return c.json({ error: "Solo el admin puede confirmar el bracket" }, 403);
    if (league.bracket_locked) return c.json({ error: "El bracket ya está bloqueado" }, 400);

    // Mapear los nombres de los equipos desde el array enviado
    // standings tiene el formato: [{ grupo: 'A', equipos: [{equipo: 'Mexico'}, ...] }, ...]
    const groupMap: Record<string, any[]> = {};
    standings.forEach((g: any) => {
      groupMap[g.grupo] = g.equipos;
    });

    // Función auxiliar segura
    const getTeam = (groupChar: string, positionIdx: number) => {
      return groupMap[groupChar]?.[positionIdx]?.equipo ?? `${positionIdx + 1}º${groupChar}`;
    };

    // Calcular los mejores 3ros
    // Necesitamos juntar a los 3ros de todos los grupos y ordenarlos por Pts -> Dif -> GF
    const todos3ros = standings.map((g: any) => ({
      grupo: g.grupo,
      team: g.equipos[2]
    })).filter((x: any) => x.team);

    // Ordenar de mejor a peor
    todos3ros.sort((a: any, b: any) => {
      if (b.team.pts !== a.team.pts) return b.team.pts - a.team.pts;
      if (b.team.dif !== a.team.dif) return b.team.dif - a.team.dif;
      return b.team.gf - a.team.gf;
    });

    // Tomamos los 8 mejores
    const bestThirds = todos3ros.slice(0, 8);
    // Para simplificar la matemática en el backend, asignaremos directamente los equipos
    // Si queremos la lógica FIFA real con combinaciones exactas, es complejo.
    // Usaremos un mapeo simplificado basado en el orden que entraron:
    // 3º A/B/C/D/F -> bestThirds[0].team.equipo, etc.

    const t3 = (idx: number, fallback: string) => bestThirds[idx]?.team?.equipo ?? fallback;

    const knockoutTeams: Record<number, {team1: string, team2: string}> = {
      // R32_L
      73: { team1: getTeam('A', 1), team2: getTeam('B', 1) },
      74: { team1: getTeam('E', 0), team2: t3(0, '3º A/B/C/D/F') },
      75: { team1: getTeam('F', 0), team2: getTeam('C', 1) },
      76: { team1: getTeam('C', 0), team2: getTeam('F', 1) },
      77: { team1: getTeam('I', 0), team2: t3(1, '3º C/D/F/G/H') },
      78: { team1: getTeam('E', 1), team2: getTeam('I', 1) },
      79: { team1: getTeam('A', 0), team2: t3(2, '3º C/E/F/H/I') },
      80: { team1: getTeam('L', 0), team2: t3(3, '3º E/H/I/J/K') },
      
      // R32_R
      81: { team1: getTeam('D', 0), team2: t3(4, '3º B/E/F/I/J') },
      82: { team1: getTeam('G', 0), team2: t3(5, '3º A/E/H/I/J') },
      83: { team1: getTeam('K', 1), team2: getTeam('L', 1) },
      84: { team1: getTeam('H', 0), team2: getTeam('J', 1) },
      85: { team1: getTeam('B', 0), team2: t3(6, '3º E/F/G/I/J') },
      86: { team1: getTeam('J', 0), team2: getTeam('H', 1) },
      87: { team1: getTeam('K', 0), team2: t3(7, '3º D/E/I/J/L') },
      88: { team1: getTeam('D', 1), team2: getTeam('G', 1) },
    };

    const { error } = await db
      .from("leagues")
      .update({
        bracket_locked: true,
        bracket_locked_at: new Date().toISOString(),
        knockout_teams: knockoutTeams
      })
      .eq("id", leagueId);

    if (error) return c.json({ error: "Error al actualizar liga en la base de datos" }, 500);

    return c.json({ message: "Bracket bloqueado y llaves generadas correctamente" });
  } catch (error) {
    console.error("Confirm standings error:", error);
    return c.json({ error: "Error interno" }, 500);
  }
});

// ============================================================
// RESULTADOS DE PARTIDOS
// ============================================================

// GET /matches/results — Obtener todos los resultados de una liga (DEBE ir antes de /:matchId)
app.get("/make-server-49810636/matches/results", async (c) => {
  try {
    const leagueId = c.req.query("leagueId");
    if (!leagueId) return c.json({ error: "leagueId es requerido" }, 400);

    const db = getDb();
    const { data: results, error } = await db
      .from("match_results")
      .select("match_id, goles_a, goles_b, estado, updated_at")
      .eq("league_id", leagueId);

    if (error) return c.json({ error: "Error al obtener resultados" }, 500);

    const resultsMap: Record<number, any> = {};
    (results || []).forEach((r: any) => {
      resultsMap[r.match_id] = {
        matchId: r.match_id,
        golesA: r.goles_a,
        golesB: r.goles_b,
        estado: r.estado,
        updatedAt: r.updated_at,
      };
    });

    return c.json({ results: resultsMap });
  } catch (error) {
    console.error("Get all results error:", error);
    return c.json({ error: "Error interno" }, 500);
  }
});

// POST /matches/:matchId/result — Actualizar resultado (solo admin)
app.post("/make-server-49810636/matches/:matchId/result", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const matchId = parseInt(c.req.param("matchId"));
    const { leagueId, golesA, golesB, estado } = await c.req.json();

    if (isNaN(matchId) || golesA === undefined || golesB === undefined) {
      return c.json({ error: "Datos inválidos" }, 400);
    }

    const db = getDb();

    // Verificar que es admin de la liga
    const { data: league } = await db
      .from("leagues")
      .select("admin_id")
      .eq("id", leagueId)
      .maybeSingle();

    if (!league) return c.json({ error: "Liga no encontrada" }, 404);
    if (league.admin_id !== user.id) {
      return c.json({ error: "Solo el administrador puede actualizar resultados" }, 403);
    }

    // Upsert del resultado
    const { error } = await db.from("match_results").upsert({
      match_id: matchId,
      league_id: leagueId,
      goles_a: golesA,
      goles_b: golesB,
      estado: estado || "finalizado",
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error guardando resultado:", error);
      return c.json({ error: "Error al guardar el resultado" }, 500);
    }

    // Calcular puntos si el partido está finalizado
    if (estado === "finalizado") {
      await calculatePoints(matchId, leagueId, golesA, golesB);
    }

    return c.json({ message: "Resultado actualizado exitosamente" });
  } catch (error) {
    console.error("Update result error:", error);
    return c.json({ error: "Error interno" }, 500);
  }
});

// GET /matches/:matchId/result — Obtener resultado de un partido
app.get("/make-server-49810636/matches/:matchId/result", async (c) => {
  try {
    const matchId = parseInt(c.req.param("matchId"));
    const leagueId = c.req.query("leagueId");

    if (isNaN(matchId)) {
      return c.json({ error: "matchId inválido" }, 400);
    }

    const db = getDb();
    let query = db
      .from("match_results")
      .select("match_id, goles_a, goles_b, estado, updated_at")
      .eq("match_id", matchId);

    if (leagueId) {
      query = query.eq("league_id", leagueId);
    }

    const { data: result } = await query.maybeSingle();

    return c.json({
      result: result
        ? {
            matchId: result.match_id,
            golesA: result.goles_a,
            golesB: result.goles_b,
            estado: result.estado,
            updatedAt: result.updated_at,
          }
        : null,
    });
  } catch (error) {
    console.error("Get result error:", error);
    return c.json({ error: "Error interno" }, 500);
  }
});


// ============================================================
// PREDICCIONES
// ============================================================

// POST /predictions — Guardar o actualizar predicción
app.post("/make-server-49810636/predictions", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const { matchId, leagueId, golesA, golesB } = await c.req.json();

    if (!matchId || !leagueId || golesA === undefined || golesB === undefined) {
      return c.json({ error: "Faltan campos: matchId, leagueId, golesA, golesB" }, 400);
    }

    const db = getDb();

    // Verificar que el partido no tiene resultado final todavía
    const { data: result } = await db
      .from("match_results")
      .select("estado")
      .eq("match_id", matchId)
      .eq("league_id", leagueId)
      .maybeSingle();

    if (result?.estado === "finalizado") {
      return c.json({ error: "No puedes modificar predicciones de un partido ya finalizado" }, 400);
    }

    const { data: prediction, error } = await db
      .from("predictions")
      .upsert({
        league_id: leagueId,
        user_id: user.id,
        match_id: matchId,
        goles_a: golesA,
        goles_b: golesB,
        updated_at: new Date().toISOString(),
      })
      .select("id, match_id, goles_a, goles_b, created_at")
      .single();

    if (error) {
      console.error("Error guardando predicción:", error);
      return c.json({ error: "Error al guardar la predicción" }, 500);
    }

    return c.json({
      prediction: {
        id: prediction.id,
        matchId: prediction.match_id,
        goles_a: prediction.goles_a,
        goles_b: prediction.goles_b,
      },
    });
  } catch (error) {
    console.error("Save prediction error:", error);
    return c.json({ error: "Error interno" }, 500);
  }
});

// GET /predictions/:leagueId — Predicciones del usuario en una liga
app.get("/make-server-49810636/predictions/:leagueId", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const leagueId = c.req.param("leagueId");
    const db = getDb();

    const { data: predictions, error } = await db
      .from("predictions")
      .select("id, match_id, goles_a, goles_b, puntos_obtenidos, created_at")
      .eq("league_id", leagueId)
      .eq("user_id", user.id);

    if (error) return c.json({ error: "Error al obtener predicciones" }, 500);

    const mapped = (predictions || []).map((p: any) => ({
      id: p.id,
      matchId: p.match_id,
      goles_a: p.goles_a,
      goles_b: p.goles_b,
      puntosObtenidos: p.puntos_obtenidos,
    }));

    return c.json({ predictions: mapped });
  } catch (error) {
    console.error("Get predictions error:", error);
    return c.json({ error: "Error interno" }, 500);
  }
});

// ============================================================
// FUNCIÓN AUXILIAR: Calcular puntos
// ============================================================

async function calculatePoints(
  matchId: number,
  leagueId: string,
  actualGolesA: number,
  actualGolesB: number
) {
  try {
    const db = getDb();

    // Obtener todas las predicciones del partido en esta liga
    const { data: predictions, error } = await db
      .from("predictions")
      .select("id, user_id, goles_a, goles_b")
      .eq("match_id", matchId)
      .eq("league_id", leagueId);

    if (error || !predictions?.length) return;

    for (const pred of predictions) {
      let points = 0;
      const predA = pred.goles_a;
      const predB = pred.goles_b;

      // Marcador exacto: 5 puntos
      if (predA === actualGolesA && predB === actualGolesB) {
        points = 5;
      }
      // Solo ganador correcto o empate: 2 puntos
      else if (Math.sign(predA - predB) === Math.sign(actualGolesA - actualGolesB)) {
        points = 2;
      }

      // Actualizar puntos en la predicción
      await db
        .from("predictions")
        .update({ puntos_obtenidos: points })
        .eq("id", pred.id);

      // Actualizar puntaje total en scores (incrementar)
      const { data: score } = await db
        .from("scores")
        .select("total")
        .eq("league_id", leagueId)
        .eq("user_id", pred.user_id)
        .maybeSingle();

      const newTotal = (score?.total || 0) + points;

      await db.from("scores").upsert({
        league_id: leagueId,
        user_id: pred.user_id,
        total: newTotal,
        updated_at: new Date().toISOString(),
      });
    }

    console.log(`Puntos calculados para partido ${matchId} en liga ${leagueId}`);
  } catch (error) {
    console.error("Calculate points error:", error);
  }
}

Deno.serve(app.fetch);

