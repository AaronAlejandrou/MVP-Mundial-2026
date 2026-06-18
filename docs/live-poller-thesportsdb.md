# Resultados en Vivo — TheSportsDB Integration

Guía completa de la funcionalidad de marcador en vivo del Mundial 2026.
Cubre arquitectura, todos los cambios realizados, cómo verificar que funciona y cómo debuggear errores en partido.

---

## Índice

1. [Arquitectura general](#1-arquitectura-general)
2. [Base de datos — Migración 003](#2-base-de-datos--migración-003)
3. [Backend — index.ts](#3-backend--indexts)
4. [Frontend](#4-frontend)
5. [Infraestructura — pg_cron](#5-infraestructura--pg_cron)
6. [Cómo verificar que todo funciona](#6-cómo-verificar-que-todo-funciona)
7. [Diagnóstico rápido en partido](#7-diagnóstico-rápido-en-partido)
8. [Errores conocidos y sus fixes](#8-errores-conocidos-y-sus-fixes)
9. [Override manual de emergencia](#9-override-manual-de-emergencia)
10. [Referencia rápida de SQL](#10-referencia-rápida-de-sql)

---

## 1. Arquitectura general

```
pg_cron (cada 1 min)
    │
    └─► POST /cron/poll-live  (edge function)
            │
            ├─► EdgeRuntime.waitUntil(runPollLoop)   ← mantiene la función viva 60s
            │
            └─► pollLiveOnce() × 12 iteraciones, cada 5 s
                    │
                    ├─► TheSportsDB eventsday.php?d=HOY&l=4429   (descubrir partidos activos)
                    ├─► TheSportsDB lookupevent.php?id={idEvent} (datos en tiempo real)
                    │
                    ├─► findGroupMatchByTeams()  → matchId numérico
                    ├─► assignScores()           → golesA, golesB (por nombre, no posición)
                    ├─► mapApiStatus()           → 'en_curso' | 'finalizado'
                    │
                    └─► applyResult()
                            ├─► GUARD: source='auto' no pisa source='manual'
                            ├─► GUARD: source='auto' no pisa estado='finalizado'
                            ├─► GUARD: ET/AET/PEN congela al marcador de 2H en DB
                            ├─► Escribe en match_results
                            ├─► calculatePoints() → actualiza puntos provisionales/finales
                            └─► advanceBracket() → avanza knockout si es partido ≥73 y finalizado

Frontend (App.tsx)
    └─► Polling cada 30 s cuando cualquier partido está 'en_curso' o en ventana horaria
            └─► GET /matches/results?leagueId=... → lee match_results completo
                    └─► enrichedMatches → MatchCard muestra score + label en vivo
```

**Proyecto Supabase:** `nbfkvpqaosisyuhilrsu` (MVP Polla Deportiva 2026)

**TheSportsDB:** API key `123`, `idLeague=4429`, `strSeason=2026`

---

## 2. Base de datos — Migración 003

Archivo: [`supabase/migrations/003_live_poller.sql`](../supabase/migrations/003_live_poller.sql)

```sql
-- source: 'manual' (admin) o 'auto' (poller). Poller nunca sobreescribe 'manual'.
ALTER TABLE match_results
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual';

-- api_status: strStatus crudo de TheSportsDB ('1H','HT','2H','FT','ET','AET','PEN',...)
ALTER TABLE match_results
  ADD COLUMN IF NOT EXISTS api_status TEXT;

-- minuto: strProgress crudo ('34', '90+2', ...)
ALTER TABLE match_results
  ADD COLUMN IF NOT EXISTS minuto TEXT;

-- updated_by ahora nullable para permitir filas automáticas sin user_id
ALTER TABLE match_results
  ALTER COLUMN updated_by DROP NOT NULL;
```

**Estado:** aplicada en producción. Ejecutar en Supabase SQL Editor si no está aplicada:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'match_results'
  AND column_name IN ('source','api_status','minuto');
-- Debe devolver 3 filas. Si devuelve menos, re-ejecutar la migración.
```

---

## 3. Backend — index.ts

Archivo: [`supabase/functions/make-server-49810636/index.ts`](../supabase/functions/make-server-49810636/index.ts)

Deploy: `npx supabase@2.107.0 functions deploy make-server-49810636`

### 3.1 Constantes nuevas

#### `DICT_ES_EN` — Diccionario español→inglés (48 equipos)
```typescript
const DICT_ES_EN: Record<string,string> = {
  "México":"Mexico", "Sudáfrica":"South Africa", "Corea del Sur":"South Korea",
  "República Checa":"Czech Republic", "Canadá":"Canada",
  "Bosnia & Herzegovina":"Bosnia and Herzegovina", "Catar":"Qatar", "Suiza":"Switzerland",
  // ... 48 entradas
};
```
Necesario porque TheSportsDB devuelve nombres en inglés y la DB los tiene en español.

#### `GROUP_MATCHES_DATA` — 72 partidos de grupo
```typescript
const GROUP_MATCHES_DATA: {id:number; a:string; b:string; grupo:string}[] = [
  {id:1, a:"México", b:"Sudáfrica", grupo:"A"},
  // ... 72 entradas, ids 1-72
];
```
Usado tanto por el poller como por el handler `bracket/standings-preview`.

---

### 3.2 Funciones helper

#### `nmatch(a, b): boolean`
Comparación de nombres insensible a mayúsculas y diacríticos. Usa `includes` bilateral.
```typescript
function nmatch(a: string, b: string): boolean {
  const na = a.toLowerCase().replace(/[^a-z0-9\s]/g,'').trim();
  const nb = b.toLowerCase().replace(/[^a-z0-9\s]/g,'').trim();
  return na===nb || na.includes(nb) || nb.includes(na);
}
```

#### `findGroupMatchByTeams(homeEn, awayEn)`
Recibe los nombres en inglés de TheSportsDB. Busca en `GROUP_MATCHES_DATA` usando `nmatch`.
Devuelve `{matchId, aEs, bEs}` (matchId numérico, nombres en español del equipo A y B de la DB).

#### `assignScores(event, aEs)`
Asigna `golesA`/`golesB` por comparación de nombres, nunca por posición.
Crucial para partidos donde el equipo "A" (de la DB) es el equipo visitante en TheSportsDB.
```typescript
function assignScores(event, aEs): {golesA, golesB} {
  const h = parseInt(event.intHomeScore) || 0;
  const a = parseInt(event.intAwayScore) || 0;
  const aEn = DICT_ES_EN[aEs] || aEs;
  // Si equipo A de la DB es el local → golesA=h, golesB=a; si es visitante → invertir
  return nmatch(event.strHomeTeam, aEn) ? {golesA:h, golesB:a} : {golesA:a, golesB:h};
}
```

#### `mapApiStatus(strStatus)`
```
'1H' | 'HT' | '2H'  →  'en_curso'
todo lo demás        →  'finalizado'
```

---

### 3.3 `applyResult(params)` — función central

```typescript
interface ApplyResultParams {
  matchId: number;
  leagueId: string;
  golesA: number;
  golesB: number;
  estado: 'en_curso' | 'finalizado';
  source: 'manual' | 'auto';
  updatedBy: string | null;
  apiStatus: string | null;    // strStatus crudo ('1H','HT','2H','FT',...)
  minuto: string | null;       // strProgress crudo ('34', '90+2', ...)
  rawApiStatus?: string;       // alias de apiStatus, usado para guards de ET/PEN
}
```

**Guards en orden:**

| # | Condición | Acción |
|---|-----------|--------|
| 1 | `source='auto'` + fila existente tiene `source='manual'` | `return` — no toca nada |
| 2 | `source='auto'` + fila existente tiene `estado='finalizado'` | `return` — no toca nada |
| 3 | `source='auto'` + `rawApiStatus` ∈ `['ET','AET','BT','P','PEN']` | Congela `golesA/golesB` con el valor que ya hay en DB (descarta los goles de ET/penales) |

**Flujo post-escritura:**
1. `calculatePoints(matchId, leagueId, golesA, golesB)` — siempre que `estado` sea `en_curso` o `finalizado`
2. `advanceBracket(matchId, leagueId, golesA, golesB, db)` — solo si `finalizado` y `matchId ≥ 73`

---

### 3.4 `pollLiveOnce(leagueIds)`

1. Llama `sdbDiscover()` → `GET eventsday.php?d=HOY&d=MAÑANA&l=4429` para el día UTC actual y siguiente
   - Filtra: `strStatus !== 'NS'` (no "Not Started") + `strSeason='2026'`
2. Por cada stub descubierto, llama `sdbLookup(idEvent)` → `GET lookupevent.php?id={idEvent}`
3. Intenta hacer match con `findGroupMatchByTeams()` primero; si falla, busca en `knockout_match_teams`
4. Si no encuentra match: `console.log('[poller] no match: equipo vs equipo')` y continúa
5. Por cada `leagueId` activa: llama `applyResult()` con `source:'auto'`

---

### 3.5 `runPollLoop(leagueIds)`

Ejecuta 12 iteraciones de `pollLiveOnce` con 5 segundos entre cada una.
Total: ~60 segundos de actividad por invocación de pg_cron.

```typescript
async function runPollLoop(leagueIds: string[]) {
  for (let i = 0; i < 12; i++) {
    try { await pollLiveOnce(leagueIds); } catch(err) { console.error('[poller] iteration error:', err); }
    if (i < 11) await new Promise(r => setTimeout(r, 5000));
  }
}
```

---

### 3.6 Endpoint `POST /cron/poll-live`

```
POST /make-server-49810636/cron/poll-live
Authorization: no requiere (llamado por pg_cron)
```

```typescript
app.post("/make-server-49810636/cron/poll-live", async (c) => {
  const { data: leagues } = await db.from("leagues").select("id");
  const leagueIds = (leagues || []).map((l: any) => l.id);
  const pollPromise = runPollLoop(leagueIds);
  try { (globalThis as any).EdgeRuntime?.waitUntil(pollPromise); } catch {}
  pollPromise.catch((err: any) => console.error('[poller] loop error:', err));
  return c.json({ message: "Poll iniciado", leagues: leagueIds.length });
});
```

`EdgeRuntime.waitUntil()` mantiene la función edge viva aunque ya se devolvió la respuesta HTTP.

---

### 3.7 Endpoint `POST /matches/:matchId/knockout-winner`

Para partidos de eliminatoria que terminan en empate tras ET/penales.
Admin selecciona manualmente cuál equipo avanzó sin cambiar el marcador.

```
POST /make-server-49810636/matches/:matchId/knockout-winner
Authorization: Bearer <token-admin>
Body: { "leagueId": "...", "winner": "Argentina" }
```

---

### 3.8 `GET /matches/results` — actualizado

Ahora incluye `api_status` y `minuto` en la respuesta:
```typescript
select("match_id, goles_a, goles_b, estado, api_status, minuto, updated_at")
// Mapea: apiStatus, minuto → enviados al frontend
```

---

### 3.9 `POST /matches/:matchId/result` — simplificado

El endpoint manual del admin ahora usa `applyResult()` con `source:'manual'`.
Esto garantiza que la escritura manual siempre gana sobre el poller.
```typescript
await applyResult({
  matchId, leagueId, golesA, golesB,
  estado: (estado || "finalizado") as 'en_curso' | 'finalizado',
  source: 'manual',
  updatedBy: user.id,
  apiStatus: null,
  minuto: null,
});
```

---

## 4. Frontend

### 4.1 `src/app/types/index.ts`

Dos campos opcionales añadidos a la interfaz `Match`:
```typescript
export interface Match {
  // ... campos existentes ...
  api_status?: string | null;   // '1H','HT','2H','FT','ET','AET','PEN',...
  minuto?: string | null;       // '34', '90+2', ...
}
```

---

### 4.2 `src/app/App.tsx` — enrichedMatches

Los campos se propagan desde `matchResults` a cada partido:
```typescript
const enrichedMatches = baseMatches.map(m => ({
  ...m,
  goles_a: matchResults[m.id]?.golesA ?? null,
  goles_b: matchResults[m.id]?.golesB ?? null,
  estado: (matchResults[m.id]?.estado ?? m.estado ?? 'pendiente') as MatchStatus,
  api_status: matchResults[m.id]?.apiStatus ?? null,   // NUEVO
  minuto:     matchResults[m.id]?.minuto ?? null,       // NUEVO
}));
```

**Trigger del polling 30s:** `anyLive` es `true` cuando algún partido tiene `estado='en_curso'`
o está dentro de la ventana horaria activa. Cuando es `true`, el intervalo baja a 30s.

---

### 4.3 `src/app/components/MatchCard.tsx`

**Interfaz local actualizada:**
```typescript
interface Match {
  // ... campos existentes ...
  api_status?: string | null;
  minuto?: string | null;
}
```

**Nueva función `getPhaseLabel()`:**
```typescript
function getPhaseLabel(
  apiStatus: string | null | undefined,
  minuto: string | null | undefined,
  isLive: boolean,
  estado: string
): React.ReactNode {
  if (estado === 'finalizado') return 'Resultado final';
  if (!apiStatus) return isLive
    ? <> Resultado <span className="text-rose-500">en vivo</span></>
    : 'Resultado';
  if (apiStatus === 'HT')  return '⏸ Medio tiempo';
  if (apiStatus === '1H')  return <>Primer tiempo{minuto
    ? <> · <span className="text-rose-500">{minuto}'</span></> : null}</>;
  if (apiStatus === '2H')  return <>Segundo tiempo{minuto
    ? <> · <span className="text-rose-500">{minuto}'</span></> : null}</>;
  if (['FT','ET','AET','BT','P','PEN'].includes(apiStatus)) return 'Resultado final';
  return isLive
    ? <> Resultado <span className="text-rose-500">en vivo</span></>
    : 'Resultado';
}
```

**Mapeo de `api_status` → label visible:**

| `api_status` | Label mostrado |
|---|---|
| `null` (pendiente/no hay dato API) | "Resultado" o "Resultado en vivo" |
| `1H` | "Primer tiempo · 34'" |
| `HT` | "⏸ Medio tiempo" |
| `2H` | "Segundo tiempo · 67'" |
| `FT` / `ET` / `AET` / `PEN` | "Resultado final" |

**Lo que NO cambió:** controles +/-, botón "Guardar Pronóstico", countdown, flags, header, colores.
El label de fase solo aparece cuando `goles_a !== null` (partido con resultado).

---

### 4.4 `src/app/components/MatchesTimeline.tsx`

Interfaz local `Match` actualizada con los mismos campos opcionales.
Sin cambios de lógica.

---

### 4.5 `src/app/components/AdminPanel.tsx`

**`handleKnockoutWinner(matchId, winner)`** — llama `POST /matches/:matchId/knockout-winner`.

**Botón "Avanzó via ET/PEN"** visible en `MatchResultsTab` cuando:
- `match.id >= 73` (partido de eliminatoria)
- `result?.estado === 'finalizado'`
- `result?.golesA === result?.golesB` (empate)
- El partido tiene ambos equipos asignados

```tsx
{match.id >= 73 && result?.estado === 'finalizado' &&
 result?.golesA === result?.golesB &&
 match.equipo_a && match.equipo_b && (
  <div className="flex flex-col gap-1 w-full mt-1 pt-1 border-t border-border/40">
    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide">
      Avanzó via ET/PEN:
    </span>
    <div className="flex gap-1.5">
      <button onClick={() => onKnockoutWinner(match.id, match.equipo_a)}>
        {match.equipo_a}
      </button>
      <button onClick={() => onKnockoutWinner(match.id, match.equipo_b)}>
        {match.equipo_b}
      </button>
    </div>
  </div>
)}
```

---

## 5. Infraestructura — pg_cron

### 5.1 Job activo

El job se ejecuta cada minuto en producción:

```sql
-- Verificar que el job existe y está activo
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname = 'poll-live-matches';
-- Esperado: schedule='* * * * *', active=true
```

### 5.2 SQL completo para re-crear el job (si se pierde)

```sql
-- PASO 1: obtener la anon key del proyecto
-- Dashboard → Settings → API → anon public

-- PASO 2: crear el job
SELECT cron.schedule(
  'poll-live-matches',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://nbfkvpqaosisyuhilrsu.supabase.co/functions/v1/make-server-49810636/cron/poll-live',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'TU_ANON_KEY_AQUI'
    ),
    body := '{}'::jsonb
  )
  $$
);
```

### 5.3 Verificar ejecuciones recientes

```sql
SELECT
  runid,
  jobid,
  status,
  start_time,
  end_time,
  return_message
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'poll-live-matches')
ORDER BY start_time DESC
LIMIT 10;
-- status debe ser 'succeeded' cada minuto
```

---

## 6. Cómo verificar que todo funciona

### Verificación completa antes de un partido

**1. pg_cron activo:**
```sql
SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'poll-live-matches';
-- active = true
```

**2. Job ejecutándose sin errores:**
```sql
SELECT status, start_time FROM cron.job_run_details
ORDER BY start_time DESC LIMIT 5;
-- status = 'succeeded'
```

**3. Edge function responde:**
```bash
curl -X POST \
  https://nbfkvpqaosisyuhilrsu.supabase.co/functions/v1/make-server-49810636/cron/poll-live \
  -H "Content-Type: application/json" \
  -H "apikey: TU_ANON_KEY" \
  -d '{}'
# Esperado: {"message":"Poll iniciado","leagues":1}
```

**4. Logs de la edge function:**
Dashboard Supabase → Edge Functions → `make-server-49810636` → Logs
- Buscar `[poller]` — si hay `no match: X vs Y` es que TheSportsDB no encontró ese partido aún
- Si ves datos de score → el poller está escribiendo correctamente

**5. match_results con datos en vivo:**
```sql
SELECT match_id, goles_a, goles_b, estado, source, api_status, minuto, updated_at
FROM match_results
WHERE source = 'auto'
ORDER BY updated_at DESC
LIMIT 5;
```

**6. Puntos calculados:**
```sql
SELECT p.user_id, u.nombre, p.match_id, p.puntos_obtenidos
FROM predictions p
JOIN users u ON u.id = p.user_id
WHERE p.match_id = 3  -- reemplazar con el matchId del partido actual
ORDER BY p.puntos_obtenidos DESC NULLS LAST;
```

---

## 7. Diagnóstico rápido en partido

### El poller funciona pero no encuentra el partido

**Síntoma:** Logs muestran `[poller] no match: Czech Republic vs South Africa`

**Causa:** TheSportsDB usa un nombre distinto al del `DICT_ES_EN`.

**Fix:**
1. Ir a `https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d=HOY&l=4429`
2. Ver el `strHomeTeam` / `strAwayTeam` exactos en el JSON
3. Actualizar `DICT_ES_EN` en `index.ts` con el nombre exacto
4. Re-deployar: `npx supabase@2.107.0 functions deploy make-server-49810636`

### Los goles están invertidos

**Causa:** `assignScores()` no está reconociendo cuál equipo es el local.

**Fix:** Verificar que el nombre inglés en `DICT_ES_EN` coincide exactamente con `strHomeTeam` en la API.
Usar `nmatch()` es case-insensitive y usa `includes`, así que suele funcionar. Si no:
- Revisar el `console.log` en los logs del edge function
- Hacer override manual desde AdminPanel (source='manual' gana siempre)

### El frontend no actualiza

**Síntoma:** Los datos están en `match_results` pero la card no cambia.

**Verificar:**
1. `GET /matches/results?leagueId=...` devuelve `apiStatus` y `minuto` — abrir en Network tab
2. El polling de 30s está activo — `anyLive` debe ser `true` cuando hay un partido en curso

**Fix rápido:** Recargar la página.

### Los puntos no se actualizan

**Síntoma:** `match_results` tiene el score correcto pero `predictions.puntos_obtenidos` sigue en NULL.

**Causa probable:** `calculatePoints()` lanzó error.

**Verificar:**
```sql
SELECT * FROM predictions WHERE match_id = 3 AND puntos_obtenidos IS NULL;
```

**Fix:** Llamar manualmente al endpoint admin:
```
POST /matches/3/result
Body: { "leagueId": "...", "golesA": 1, "golesB": 0, "estado": "finalizado" }
```
Esto usa `source='manual'` y re-ejecuta `calculatePoints()`.

---

## 8. Errores conocidos y sus fixes

### `ERROR: could not find valid entry for job 'poll-live-matches'`
Aparece al hacer `cron.unschedule()` de un job inexistente.
**Fix:** No usar `unschedule`. Usar `cron.schedule()` directamente — si el job ya existe con ese nombre, lo actualiza.

### Edge function devuelve 401 desde pg_cron
**Causa:** Falta el header `apikey` en el `net.http_post`.
**Fix:** Añadir `'apikey', 'TU_ANON_KEY'` al `jsonb_build_object` de headers en el SQL de pg_cron.

### `EdgeRuntime.waitUntil is not a function`
No es un error real — el `try/catch` lo absorbe. La función sigue ejecutando el poll loop aunque falle el `waitUntil`. El loop puede cortarse antes de los 60s si la función edge se congela.
**Fix:** No se necesita fix; es el comportamiento esperado en entornos que no soportan `waitUntil`.

### `strStatus = 'NS'` para partidos que ya deberían haber empezado
**Causa:** TheSportsDB puede tardar 3-5 minutos en cambiar el estado de un partido.
**Comportamiento esperado:** El poller skippea partidos con `NS`. En cuanto la API cambia a `1H`, el siguiente tick lo procesa.
**Fix:** Ninguno necesario. Si urge, hacer override manual desde AdminPanel.

### Partido de ET/Penales muestra goles incorrectos
**Causa:** TheSportsDB puede reportar goles de penales en `intHomeScore`/`intAwayScore` durante el status `PEN`.
**Comportamiento protegido:** `applyResult()` congela el score al último valor de `2H` que tenía la DB cuando detecta `rawApiStatus ∈ ['ET','AET','BT','P','PEN']`.
**Si aun así sale mal:** Override manual desde AdminPanel (score sin penales) + botón "Avanzó via ET/PEN" para avanzar el bracket.

---

## 9. Override manual de emergencia

Si el poller falla completamente, el admin puede ingresar resultados manualmente desde **AdminPanel → Resultados**.

- Los resultados manuales tienen `source='manual'`
- El poller **nunca** pisa una fila con `source='manual'`
- Una vez puesto manual, **no se vuelve automático** — el admin debe volver a modificarlo si quiere que el poller tome control (borrando la fila o cambiando source a 'auto' desde SQL)

**Cambiar una fila manual de vuelta a auto (SQL):**
```sql
UPDATE match_results
SET source = 'auto'
WHERE match_id = 3
  AND league_id = 'TU_LEAGUE_ID';
```

**Borrar resultado para que el poller lo re-cree desde cero:**
```sql
DELETE FROM match_results
WHERE match_id = 3
  AND league_id = 'TU_LEAGUE_ID';
```
> Atención: esto borra puntos calculados. El poller los recalcula en el siguiente tick.

---

## 10. Referencia rápida de SQL

```sql
-- Ver estado de todos los partidos de hoy
SELECT match_id, goles_a, goles_b, estado, source, api_status, minuto, updated_at
FROM match_results
ORDER BY updated_at DESC;

-- Ver job pg_cron
SELECT jobname, schedule, active FROM cron.job;

-- Ver últimas 10 ejecuciones del poller
SELECT status, start_time, end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'poll-live-matches')
ORDER BY start_time DESC LIMIT 10;

-- Ver puntos del partido N en todas las ligas
SELECT u.nombre, p.match_id, p.goles_a, p.goles_b, p.puntos_obtenidos
FROM predictions p
JOIN users u ON u.id = p.user_id
WHERE p.match_id = 3
ORDER BY p.puntos_obtenidos DESC NULLS LAST;

-- Forzar source='auto' en una fila manual
UPDATE match_results SET source = 'auto' WHERE match_id = ? AND league_id = '?';

-- Borrar resultado y que el poller lo re-cree
DELETE FROM match_results WHERE match_id = ? AND league_id = '?';

-- Ver ranking actual de una liga
SELECT u.nombre, s.total
FROM scores s
JOIN users u ON u.id = s.user_id
WHERE s.league_id = 'TU_LEAGUE_ID'
ORDER BY s.total DESC;
```

---

## Archivos modificados en este feature

| Archivo | Tipo de cambio |
|---------|----------------|
| `supabase/migrations/003_live_poller.sql` | Nuevo — migración DB |
| `supabase/functions/make-server-49810636/index.ts` | Modificado — poller completo |
| `src/app/types/index.ts` | Modificado — campos `api_status`, `minuto` en Match |
| `src/app/App.tsx` | Modificado — `enrichedMatches` propaga campos en vivo |
| `src/app/components/MatchCard.tsx` | Modificado — `getPhaseLabel()`, interfaz local |
| `src/app/components/MatchesTimeline.tsx` | Modificado — interfaz local |
| `src/app/components/AdminPanel.tsx` | Modificado — `handleKnockoutWinner`, botón ET/PEN |
