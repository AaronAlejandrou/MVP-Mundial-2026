import { useState, useEffect, useMemo, useRef } from 'react';
import { Trophy, Target, CheckCircle2, TrendingUp, ArrowUp, ArrowDown, Minus, Crown, Sparkles, ChevronDown, Play } from 'lucide-react';
import { CountryFlag } from './CountryFlag';
import { apiFetch } from '../../lib/api';

interface MyStatsProps {
  userName?: string;
  predictions: Record<number, { goles_a: number; goles_b: number; puntos_obtenidos?: number }>;
  matches: any[];
  leaderboard: any[];
  currentUserId?: string;
  leagueId?: string;
  accessToken?: string;
}

// Un partido donde fuiste "de los únicos": guardamos el detalle para poder
// mostrarlo con banderas y su etiqueta exacta.
interface SpecialMatch {
  matchId: number;
  others: number;       // cuántos MÁS sumaron contigo
  onlyScorer: boolean;  // solo tú sumaste
  onlyExact: boolean;   // solo tú clavaste el +5
}

interface UniqueData {
  loading: boolean;
  done: number;
  total: number;
  specials: SpecialMatch[];
  othersMap: Record<number, number>;
  exactOnlyMap: Record<number, boolean>;
  topArriesgados: { id: string; batacazos: number; matches: { mid: number; goles_a: number; goles_b: number; puntos: number }[] }[];
}

const uniqueCache: Record<string, { total: number; specials: SpecialMatch[]; othersMap: Record<number, number>; exactOnlyMap: Record<number, boolean>; topArriesgados: any[] }> = {};

const SEEN_KEY = 'polla_mystats_seen';

/**
 * "Mis Stats" — el espacio personal. La PRIMERA vez es una experiencia de
 * slides (desliza/tap para avanzar, como el Inicio); después queda la vista
 * resumen. Métricas: puntos, puesto, aciertos, exactos, "de los únicos en
 * sumar" (con desglose), rendimiento POR PARTIDO por fase, talismán y tus
 * mejores partidos.
 */
export function MyStats({ userName, predictions, matches, leaderboard, currentUserId, leagueId, accessToken }: MyStatsProps) {
  // ── Cálculos base ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const byId: Record<number, any> = {};
    matches.forEach(m => { byId[m.id] = m; });

    const entries = Object.entries(predictions)
      .map(([id, p]) => ({ matchId: Number(id), pred: p, match: byId[Number(id)] }))
      .filter(e => e.match);

    const jugadas = entries.filter(e => e.match.estado === 'finalizado' && e.pred.puntos_obtenidos !== undefined);
    const aciertos = jugadas.filter(e => (e.pred.puntos_obtenidos ?? 0) > 0);
    const exactos = jugadas.filter(e => e.pred.puntos_obtenidos === 5);

    const grupo = jugadas.filter(e => e.matchId < 73);
    const elim = jugadas.filter(e => e.matchId >= 73);
    const grupoPts = grupo.reduce((n, e) => n + (e.pred.puntos_obtenidos ?? 0), 0);
    const elimPts = elim.reduce((n, e) => n + (e.pred.puntos_obtenidos ?? 0), 0);
    // PROPORCIONAL: puntos por partido jugado en cada fase (grupos tiene muchos
    // más partidos, comparar totales sería injusto).
    const grupoAvg = grupo.length ? grupoPts / grupo.length : 0;
    const elimAvg = elim.length ? elimPts / elim.length : 0;

    // 1. La Gran Pifia (mayor error en diferencia de goles)
    let pifiaMaxError = -1;
    let pifiaPartidos: any[] = [];
    jugadas.forEach(e => {
      const error = Math.abs((e.pred.goles_a ?? 0) - e.match.goles_a) + Math.abs((e.pred.goles_b ?? 0) - e.match.goles_b);
      if (error > pifiaMaxError) {
        pifiaMaxError = error;
        pifiaPartidos = [e];
      } else if (error === pifiaMaxError) {
        pifiaPartidos.push(e);
      }
    });

    // 2. Selección Mejor y Peor Conocida
    const teamPts: Record<string, number> = {};
    const teamMatchesPlayed: Record<string, number> = {};
    jugadas.forEach(e => {
      const pts = e.pred.puntos_obtenidos ?? 0;
      [e.match.equipo_a, e.match.equipo_b].forEach((t: string) => {
        teamPts[t] = (teamPts[t] ?? 0) + pts;
        teamMatchesPlayed[t] = (teamMatchesPlayed[t] ?? 0) + 1;
      });
    });
    // Solo consideramos equipos que el usuario haya pronosticado al menos 2 veces para que "peor selección" tenga sentido
    const validTeams = Object.keys(teamPts).filter(t => teamMatchesPlayed[t] >= 2);
    if (validTeams.length === 0) validTeams.push(...Object.keys(teamPts)); // fallback
    const sortedTeams = validTeams.sort((a, b) => teamPts[b] - teamPts[a]);
    const mejorSeleccion = sortedTeams.length > 0 ? { equipo: sortedTeams[0], pts: teamPts[sortedTeams[0]] } : null;
    const peorSeleccion = sortedTeams.length > 1 ? { equipo: sortedTeams[sortedTeams.length - 1], pts: teamPts[sortedTeams[sortedTeams.length - 1]] } : null;

    // 3. Tus Mejores Partidos (solo los exactos +5)
    const mejores = [...exactos]
      .sort((a, b) => b.matchId - a.matchId)
      .slice(0, 3);

    // 4. Tu Día de Suerte (agrupar por fecha local sin hora)
    const ptsPorDia: Record<string, { pts: number; matches: any[] }> = {};
    jugadas.forEach(e => {
      const d = new Date(e.match.fecha_hora);
      // Formato simple YYYY-MM-DD local
      const dateKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      if (!ptsPorDia[dateKey]) ptsPorDia[dateKey] = { pts: 0, matches: [] };
      ptsPorDia[dateKey].pts += (e.pred.puntos_obtenidos ?? 0);
      ptsPorDia[dateKey].matches.push(e);
    });
    let mejorDia: { fecha: Date; pts: number; matches: any[] } | null = null;
    Object.entries(ptsPorDia).forEach(([k, v]) => {
      if (!mejorDia || v.pts > mejorDia.pts) {
        const parts = k.split('-');
        mejorDia = { fecha: new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])), pts: v.pts, matches: v.matches };
      }
    });

    const efectividad = jugadas.length > 0 ? Math.round((aciertos.length / jugadas.length) * 100) : 0;

    const idx = leaderboard.findIndex((p: any) => p.id === currentUserId);
    const pos = idx !== -1 ? idx + 1 : null;
    const prev = idx !== -1 ? leaderboard[idx].posicion_anterior : null;
    const delta = pos != null && prev != null ? prev - pos : 0;
    const mejorPuesto = pos != null ? Math.min(pos, prev ?? pos) : null;
    const totalPts = idx !== -1 ? leaderboard[idx].puntaje_total : jugadas.reduce((n, e) => n + (e.pred.puntos_obtenidos ?? 0), 0);

    return {
      jugadas: jugadas.length, aciertos: aciertos.length, exactos: exactos.length,
      grupoN: grupo.length, elimN: elim.length, grupoPts, elimPts, grupoAvg, elimAvg,
      mejorSeleccion, peorSeleccion, mejores, pifiaPartidos, mejorDia, efectividad, pos, delta, mejorPuesto, totalPts,
      scoredIds: aciertos.map(e => e.matchId),
    };
  }, [predictions, matches, leaderboard, currentUserId]);

  // ── Análisis de "Únicos" y "Top Arriesgados" (Liga) ───────────────────────
  const cacheKey = `${leagueId}:${currentUserId}:all_finished`;
  const [unique, setUnique] = useState<UniqueData>(() => {
    const c = uniqueCache[cacheKey];
    return c
      ? { loading: false, done: c.total, total: c.total, specials: c.specials, othersMap: c.othersMap, exactOnlyMap: c.exactOnlyMap, topArriesgados: c.topArriesgados }
      : { loading: true, done: 0, total: matches.filter(m => m.estado === 'finalizado').length, specials: [], othersMap: {}, exactOnlyMap: {}, topArriesgados: [] };
  });

  useEffect(() => {
    if (!leagueId || !accessToken || uniqueCache[cacheKey]) return;
    let alive = true;
    const finishedMatches = matches.filter(m => m.estado === 'finalizado');
    const queue = finishedMatches.map(m => m.id);
    const total = queue.length;
    const specials: SpecialMatch[] = [];
    const othersMap: Record<number, number> = {};
    const exactOnlyMap: Record<number, boolean> = {};
              const userBatacazos: Record<string, { batacazos: number; matches: { mid: number; goles_a: number; goles_b: number; puntos: number }[] }> = {};
              let done = 0;

    (async () => {
      await Promise.all(Array.from({ length: 20 }, async () => {
        while (queue.length && alive) {
          const mid = queue.shift()!;
          try {
            const res = await apiFetch(`/match-predictions/all?matchId=${mid}&leagueId=${leagueId}`, { token: accessToken });
            if (res.ok) {
              const data = await res.json();
              const preds = data.predictions || [];
              const scorers = preds.filter((p: any) => (p.puntos_obtenidos ?? 0) > 0);
              const exacts = preds.filter((p: any) => p.puntos_obtenidos === 5);
              
              // Batacazo logic for everyone in the league
              const wasBatacazoScore = scorers.length > 0 && scorers.length <= 3;
              const wasBatacazoExact = exacts.length === 1;

              preds.forEach((p: any) => {
                const isExact = p.puntos_obtenidos === 5;
                const hitBatacazo = (wasBatacazoExact && isExact);
                
                if (hitBatacazo) {
                  if (!userBatacazos[p.userId]) userBatacazos[p.userId] = { batacazos: 0, matches: [] };
                  userBatacazos[p.userId].batacazos++;
                  userBatacazos[p.userId].matches.push({
                    mid,
                    goles_a: p.goles_a ?? 0,
                    goles_b: p.goles_b ?? 0,
                    puntos: p.puntos_obtenidos ?? 0
                  });
                }
              });

              // Stats for current user
              const others = Math.max(0, scorers.length - 1);
              const mine = predictions[mid];
              if (mine && (mine.puntos_obtenidos ?? 0) > 0) {
                const onlyScorer = others === 0;
                const onlyExact = mine.puntos_obtenidos === 5 && exacts.length === 1;
                othersMap[mid] = others;
                exactOnlyMap[mid] = onlyExact;
                
                if (onlyScorer || others <= 2 || onlyExact) {
                  specials.push({ matchId: mid, others, onlyScorer, onlyExact });
                }
              }
            }
          } catch { /* silent */ }
          done++;
          if (alive) {
            setUnique(u => ({ ...u, loading: true, done, total }));
          }
        }
      }));
      if (alive) {
        specials.sort((a, b) => b.matchId - a.matchId);
        
        // Calculate Top Arriesgados (all)
        const topArriesgados = Object.entries(userBatacazos)
          .map(([id, data]) => ({ id, ...data }))
          .filter(u => u.batacazos > 0)
          .sort((a, b) => {
            const idxA = leaderboard.findIndex(l => l.id === a.id);
            const idxB = leaderboard.findIndex(l => l.id === b.id);
            if (idxA === -1 && idxB === -1) return 0;
            if (idxA === -1) return 1;
            if (idxB === -1) return -1;
            return idxA - idxB;
          });

        uniqueCache[cacheKey] = { total, specials, othersMap, exactOnlyMap, topArriesgados };
        setUnique({ loading: false, done: total, total, specials, othersMap, exactOnlyMap, topArriesgados });
      }
    })();

    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, leagueId, accessToken]);

  const uniqueTotal = unique.specials.length;

  // ── Modo: slides (solo la PRIMERA vez) o resumen ─────────────────────────
  const [mode, setMode] = useState<'slides' | 'summary'>(() =>
    localStorage.getItem(SEEN_KEY) ? 'summary' : 'slides');
  const [slide, setSlide] = useState(0);
  const touchY = useRef<number | null>(null);
  const SLIDES = 9;

  const finish = () => {
    localStorage.setItem(SEEN_KEY, '1');
    setMode('summary');
    setSlide(0);
  };
  const advance = () => setSlide(s => {
    if (s >= SLIDES - 1) { finish(); return s; }
    return s + 1;
  });

  const faseGanadora = stats.grupoAvg === stats.elimAvg ? null : stats.grupoAvg > stats.elimAvg ? 'grupos' : 'eliminatorias';
  const maxAvg = Math.max(stats.grupoAvg, stats.elimAvg, 0.01);

  const matchById = useMemo(() => {
    const m: Record<number, any> = {};
    matches.forEach(x => { m[x.id] = x; });
    return m;
  }, [matches]);

  // ══ Bloques reutilizables ═════════════════════════════════════════════════
  // Lista de los partidos donde fuiste "de los únicos": banderas + marcador +
  // etiqueta exacta de por qué calificó. Sin emojis.
  const uniqueList = (dark: boolean, limit?: number) => {
    const shown = limit ? unique.specials.slice(0, limit) : unique.specials;
    const rest = unique.specials.length - shown.length;
    return (
      <div className="space-y-2 w-full">
        {shown.map(s => {
          const m = matchById[s.matchId];
          if (!m) return null;
          const myPts = predictions[s.matchId]?.puntos_obtenidos ?? 0;
          const tag = s.onlyScorer
            ? 'Único en sumar'
            : s.onlyExact
            ? 'Único con el +5'
            : `Sumaste con ${s.others} más`;
          const highlight = s.onlyScorer || s.onlyExact;
          return (
            <div key={s.matchId} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl ${dark ? 'bg-white/8 border border-white/12' : 'bg-muted/40 border border-border'}`}>
              <CountryFlag country={m.equipo_a} size="sm" />
              <span className={`font-score text-lg font-bold ${dark ? 'text-white' : 'text-foreground'}`}>
                {m.goles_a}–{m.goles_b}
              </span>
              <CountryFlag country={m.equipo_b} size="sm" />
              <span className={`text-[10px] font-bold truncate flex-1 text-left ${
                highlight
                  ? (dark ? 'text-[#F1D07C]' : 'text-amber-600 dark:text-amber-400')
                  : (dark ? 'text-white/55' : 'text-muted-foreground')
              }`}>
                {tag}
              </span>
              <span className={`text-xs font-black px-2 py-0.5 rounded-full flex-shrink-0 ${
                myPts === 5
                  ? (dark ? 'bg-[#F1D07C]/20 text-[#F1D07C]' : 'bg-amber-500/15 text-amber-500')
                  : (dark ? 'bg-emerald-400/20 text-emerald-300' : 'bg-emerald-500/15 text-emerald-500')
              }`}>
                +{myPts}
              </span>
            </div>
          );
        })}
        {rest > 0 && (
          <p className={`text-[10px] font-bold ${dark ? 'text-white/45' : 'text-muted-foreground/70'}`}>+{rest} más en el resumen</p>
        )}
      </div>
    );
  };

  const faseBars = (dark: boolean) => (
    <div className="space-y-2.5 w-full">
      {[
        { name: 'Fase de grupos', avg: stats.grupoAvg, pts: stats.grupoPts, n: stats.grupoN, win: faseGanadora === 'grupos' },
        { name: 'Eliminatorias', avg: stats.elimAvg, pts: stats.elimPts, n: stats.elimN, win: faseGanadora === 'eliminatorias' },
      ].map(f => (
        <div key={f.name}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-bold ${dark ? (f.win ? 'text-white' : 'text-white/50') : (f.win ? 'text-foreground' : 'text-muted-foreground')}`}>{f.name}</span>
            <span className={`text-xs font-black ${f.win ? (dark ? 'text-[#F1D07C]' : 'text-primary') : (dark ? 'text-white/50' : 'text-muted-foreground')}`}>
              {f.avg.toFixed(2)} pts/partido
            </span>
          </div>
          <div className={`h-2.5 rounded-full overflow-hidden ${dark ? 'bg-white/10' : 'bg-muted'}`}>
            <div
              className={`h-full rounded-full transition-all duration-700 ${f.win ? (dark ? 'bg-[#F1D07C]' : 'bg-primary') : (dark ? 'bg-white/30' : 'bg-muted-foreground/40')}`}
              style={{ width: `${(f.avg / maxAvg) * 100}%` }}
            />
          </div>
          <p className={`text-[10px] font-bold mt-0.5 ${dark ? 'text-white/40' : 'text-muted-foreground/70'}`}>{f.pts} pts en {f.n} partidos</p>
        </div>
      ))}
    </div>
  );

  const bestRows = (dark: boolean) => (
    <div className="space-y-2 w-full">
      {stats.mejores.map(e => {
        // El "por qué" es tu mejor partido: cuántos sumaron contigo (del
        // análisis) o, mientras carga, el tipo de acierto.
        const others = unique.othersMap[e.matchId];
        const reason = others === undefined
          ? (e.pred.puntos_obtenidos === 5 ? 'Marcador exacto' : 'Acertaste el resultado')
          : others === 0
          ? 'Único en sumar'
          : unique.exactOnlyMap[e.matchId]
          ? `Único con el +5 · ${others} más sumaron`
          : `Sumaron ${others} contigo`;
        const special = others === 0 || unique.exactOnlyMap[e.matchId];
        return (
        <div key={e.matchId} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl ${dark ? 'bg-white/8 border border-white/12' : 'bg-muted/40 border border-border'}`}>
          <CountryFlag country={e.match.equipo_a} size="sm" />
          <span className={`font-score text-lg font-bold ${dark ? 'text-white' : 'text-foreground'}`}>
            {e.match.goles_a}–{e.match.goles_b}
          </span>
          <CountryFlag country={e.match.equipo_b} size="sm" />
          <span className="flex-1 min-w-0 flex flex-col text-left">
            <span className={`text-[10px] font-bold truncate ${dark ? 'text-white/50' : 'text-muted-foreground'}`}>
              Pronosticaste {e.pred.goles_a}–{e.pred.goles_b}
            </span>
            <span className={`text-[10px] font-bold truncate ${
              special
                ? (dark ? 'text-[#F1D07C]' : 'text-amber-600 dark:text-amber-400')
                : (dark ? 'text-white/60' : 'text-muted-foreground')
            }`}>
              {reason}
            </span>
          </span>
          <span className={`text-xs font-black px-2 py-0.5 rounded-full flex-shrink-0 ${
            e.pred.puntos_obtenidos === 5
              ? (dark ? 'bg-[#F1D07C]/20 text-[#F1D07C]' : 'bg-amber-500/15 text-amber-500')
              : (dark ? 'bg-emerald-400/20 text-emerald-300' : 'bg-emerald-500/15 text-emerald-500')
          }`}>
            +{e.pred.puntos_obtenidos}
          </span>
        </div>
        );
      })}
      {stats.mejores.length === 0 && (
        <p className={`text-sm font-bold ${dark ? 'text-white/50' : 'text-muted-foreground'}`}>Aún no tienes partidos con puntos</p>
      )}
    </div>
  );

  // ══ MODO SLIDES (primera vez) ═════════════════════════════════════════════
  if (mode === 'slides') {
    const slideCls = (i: number) =>
      `mss-slide ${i === slide ? 'is-active' : i < slide ? 'is-past' : ''}`;
    const hint = (last: boolean) => (
      <div className="fi-hint flex flex-col items-center gap-0.5 text-white/60 mt-2">
        <span className="text-xs font-bold">{last ? 'Desliza para terminar' : 'Desliza para continuar'}</span>
        <ChevronDown className="fi-chevron w-4 h-4" />
      </div>
    );
    const eyebrow = (text: string) => (
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em] text-white/70">
        <Sparkles className="w-3.5 h-3.5 text-[#F1D07C]" />
        {text}
      </div>
    );

    return (
      <div
        className="mss"
        onClick={advance}
        onWheel={(e) => { if (e.deltaY > 8) advance(); }}
        onTouchStart={(e) => { touchY.current = e.touches[0].clientY; }}
        onTouchMove={(e) => {
          if (touchY.current == null) return;
          if (touchY.current - e.touches[0].clientY > 24) { touchY.current = null; advance(); }
        }}
        role="button"
        aria-label="Avanzar"
      >
        <div className="fi-aurora" aria-hidden="true" />
        <div className="fi-dust" aria-hidden="true"><span /><span /><span /><span /><span /><span /></div>

        {/* Slide 1 · Bienvenida: stats base + Efectividad */}
        <div className={slideCls(0)}>
          {eyebrow('Mis Stats')}
          <h1 className="fi-title font-score text-5xl sm:text-7xl font-bold leading-none">TU MUNDIAL<br />EN NÚMEROS</h1>
          {userName && <p className="text-sm font-bold text-white/60">{userName}</p>}
          <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
            <div className="mss-card">
              <span className="mss-label">Puntos totales</span>
              <div className="font-score text-5xl font-bold text-[#F1D07C]">{stats.totalPts}</div>
            </div>
            <div className="mss-card">
              <span className="mss-label">Puesto actual</span>
              <div className="flex items-end justify-center gap-1.5">
                <div className="font-score text-5xl font-bold text-white">{stats.pos ?? '–'}°</div>
                {stats.delta > 0 && <span className="flex items-center text-xs font-black text-emerald-300 mb-2"><ArrowUp className="w-3.5 h-3.5" />{stats.delta}</span>}
                {stats.delta < 0 && <span className="flex items-center text-xs font-black text-rose-400 mb-2"><ArrowDown className="w-3.5 h-3.5" />{Math.abs(stats.delta)}</span>}
              </div>
              {stats.mejorPuesto != null && stats.mejorPuesto < (stats.pos ?? Infinity) && (
                <span className="text-[10px] font-bold text-white/50">Mejor puesto: {stats.mejorPuesto}°</span>
              )}
            </div>
            <div className="mss-card col-span-2">
              <span className="mss-label">Efectividad Global</span>
              <div className="font-score text-5xl font-bold text-white">{stats.efectividad}%</div>
              <span className="text-[10px] font-bold text-white/50">de partidos donde sumaste puntos</span>
            </div>
          </div>
          {hint(false)}
        </div>

        {/* Slide 2 · Puntería */}
        <div className={slideCls(1)}>
          {eyebrow('Tu puntería')}
          <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
            <div className="mss-card">
              <CheckCircle2 className="w-5 h-5 text-emerald-300 mx-auto mb-1" />
              <span className="mss-label">Aciertos</span>
              <div className="font-score text-5xl font-bold text-white">{stats.aciertos}</div>
              <span className="text-[10px] font-bold text-white/50">de {stats.jugadas} que pronosticaste</span>
            </div>
            <div className="mss-card">
              <Target className="w-5 h-5 text-[#F1D07C] mx-auto mb-1" />
              <span className="mss-label">Plenos exactos</span>
              <div className="font-score text-5xl font-bold text-[#F1D07C]">{stats.exactos}</div>
              <span className="text-[10px] font-bold text-white/50">+5 pts cada uno</span>
            </div>
          </div>
          {hint(false)}
        </div>

        {/* Slide 3 · La Gran Pifia */}
        <div className={slideCls(2)}>
          {eyebrow('Ups...')}
          <h2 className="font-score text-3xl sm:text-4xl font-bold text-white leading-tight">TU MAYOR<br />TROPIEZO</h2>
          <div className="w-full max-w-sm space-y-3 mt-4">
            {stats.pifiaPartidos.map(p => (
              <div key={p.matchId} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/8 border border-white/12">
                <div className="flex items-center gap-3 w-full">
                  <CountryFlag country={p.match.equipo_a} size="sm" />
                  <div className="flex-1 text-center font-score text-xl font-bold text-white">
                    {p.match.goles_a}–{p.match.goles_b}
                  </div>
                  <CountryFlag country={p.match.equipo_b} size="sm" />
                </div>
                <div className="text-xs font-bold text-rose-400">
                  Tú pronosticaste {p.pred.goles_a}–{p.pred.goles_b}
                </div>
              </div>
            ))}
            {stats.pifiaPartidos.length === 0 && (
              <p className="text-sm font-bold text-white/50">Aún no hay pifias registradas.</p>
            )}
          </div>
          {hint(false)}
        </div>

        {/* Slide 4 · Día de Suerte */}
        <div className={slideCls(3)}>
          {eyebrow('El mejor día')}
          <h2 className="font-score text-3xl sm:text-4xl font-bold text-white leading-tight">TU DÍA DE<br />SUERTE</h2>
          {stats.mejorDia ? (
            <div className="mss-card max-w-sm w-full mt-4">
              <span className="mss-label">El {stats.mejorDia.fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })} sumaste:</span>
              <div className="font-score text-5xl font-bold text-[#F1D07C] mb-2">{stats.mejorDia.pts} pts</div>
              <div className="space-y-2 mt-4">
                {stats.mejorDia.matches.map(m => (
                  <div key={m.matchId} className="flex items-center justify-between text-xs font-bold text-white/80 py-1 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-2">
                      <CountryFlag country={m.match.equipo_a} size="xs" />
                      <span>vs</span>
                      <CountryFlag country={m.match.equipo_b} size="xs" />
                    </div>
                    <span className={m.pred.puntos_obtenidos === 5 ? 'text-[#F1D07C]' : 'text-emerald-300'}>
                      +{m.pred.puntos_obtenidos} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm font-bold text-white/50 mt-4">Aún no tienes un día de suerte.</p>
          )}
          {hint(false)}
        </div>

        {/* Slide 5 · Selección Mejor y Peor Conocida */}
        <div className={slideCls(4)}>
          {eyebrow('Conocimiento')}
          <h2 className="font-score text-3xl sm:text-4xl font-bold text-white leading-tight">TUS SELECCIONES</h2>
          <div className="grid grid-cols-2 gap-3 w-full max-w-sm mt-4">
            {stats.mejorSeleccion && (
              <div className="mss-card">
                <span className="mss-label">Mejor conoces a</span>
                <CountryFlag country={stats.mejorSeleccion.equipo} size="md" className="mx-auto my-2" />
                <p className="font-score text-xl font-bold text-emerald-300">{stats.mejorSeleccion.equipo}</p>
                <p className="text-[10px] font-bold text-white/50">+{stats.mejorSeleccion.pts} pts ganados</p>
              </div>
            )}
            {stats.peorSeleccion && (
              <div className="mss-card">
                <span className="mss-label">Menos conoces a</span>
                <CountryFlag country={stats.peorSeleccion.equipo} size="md" className="mx-auto my-2" />
                <p className="font-score text-xl font-bold text-rose-400">{stats.peorSeleccion.equipo}</p>
                <p className="text-[10px] font-bold text-white/50">Solo {stats.peorSeleccion.pts} pts ganados</p>
              </div>
            )}
          </div>
          {hint(false)}
        </div>

        {/* Slide 6 · De los únicos en sumar */}
        <div className={slideCls(5)}>
          {eyebrow('La joya')}
          <h2 className="font-score text-3xl sm:text-4xl font-bold text-white leading-tight">DE LOS ÚNICOS<br />EN SUMAR</h2>
          <div className="mss-card max-w-sm w-full">
            <Crown className="w-6 h-6 text-[#F1D07C] mx-auto mb-1.5" />
            {unique.loading ? (
              <div className="flex flex-col items-center gap-2 py-2">
                <div className="w-5 h-5 border-2 border-[#F1D07C]/30 border-t-[#F1D07C] rounded-full animate-spin" />
                <p className="text-xs font-bold text-white/60">Analizando tus partidos… {unique.done}/{unique.total}</p>
              </div>
            ) : (
              <>
                <div className="font-score text-6xl font-bold text-[#F1D07C] leading-none">{uniqueTotal}</div>
                <p className="text-xs font-bold text-white/70 mt-1 mb-3">
                  {uniqueTotal === 1 ? 'partido donde fuiste de los únicos en sumar' : 'partidos donde fuiste de los únicos en sumar'}
                </p>
                {uniqueList(true, 3)}
              </>
            )}
          </div>
          {hint(false)}
        </div>

        {/* Slide 7 · Fases (proporcional) */}
        <div className={slideCls(6)}>
          {eyebrow('Tu rendimiento')}
          <h2 className="font-score text-3xl sm:text-4xl font-bold text-white leading-tight">¿DÓNDE BRILLASTE MÁS?</h2>
          <div className="mss-card max-w-sm w-full">
            {faseBars(true)}
            {faseGanadora && (
              <p className="text-[11px] font-bold text-white/70 mt-3">
                Por promedio, te fue mejor en <span className="text-[#F1D07C]">{faseGanadora === 'grupos' ? 'la fase de grupos' : 'las eliminatorias'}</span>.
              </p>
            )}
          </div>
          {hint(false)}
        </div>

        {/* Slide 8 · Plenos exactos */}
        <div className={slideCls(7)}>
          {eyebrow('Para el recuerdo')}
          <h2 className="font-score text-3xl sm:text-4xl font-bold text-white leading-tight">TUS PLENOS<br />EXACTOS</h2>
          <div className="w-full max-w-sm">{bestRows(true)}</div>
          {hint(false)}
        </div>

        {/* Slide 9 · Top Arriesgados */}
        <div className={slideCls(8)}>
          {eyebrow('Stats de la Liga')}
          <h2 className="font-score text-3xl sm:text-4xl font-bold text-[#F1D07C] leading-tight">MÁS<br />ARRIESGADOS</h2>
          <p className="text-xs font-bold text-white/60 mb-4">Los que más atinaron batacazos en toda la liga.</p>
          <div 
            className="w-full max-w-sm space-y-2 flex-1 overflow-y-auto pr-1 pb-4 custom-scrollbar"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            {unique.loading ? (
              <div className="flex flex-col items-center gap-2 py-4">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <p className="text-xs font-bold text-white/60">Calculando stats de la liga... {unique.done}/{unique.total}</p>
              </div>
            ) : unique.topArriesgados.length > 0 ? (
              unique.topArriesgados.map((u) => {
                const userL = leaderboard.find(l => l.id === u.id);
                const name = userL?.nombre || 'Jugador';
                const isMe = u.id === currentUserId;
                return (
                  <div key={u.id} className={`flex flex-col gap-2 p-3 rounded-xl ${isMe ? 'bg-[#F1D07C]/10 border border-[#F1D07C]/30' : 'bg-white/8 border border-white/12'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 text-left min-w-0">
                        <p className={`font-bold text-sm truncate ${isMe ? 'text-[#F1D07C]' : 'text-white'}`}>{name}</p>
                        <p className="text-[10px] font-bold text-white/50">{u.batacazos} {u.batacazos === 1 ? 'batacazo' : 'batacazos'}</p>
                      </div>
                      <div className="font-score text-xl font-bold text-[#F1D07C] pl-2">+{u.batacazos * 5}</div>
                    </div>
                    {/* Partidos, marcador */}
                    <div className="flex flex-col gap-1.5 mt-2">
                      {u.matches.map((m: any) => {
                        const matchObj = matchById[m.mid];
                        if (!matchObj) return null;
                        return (
                          <div key={m.mid} className="flex items-center justify-center gap-2 bg-black/20 rounded-md px-2 py-1.5 border border-white/5">
                            <CountryFlag country={matchObj.equipo_a} size="xs" />
                            <span className="text-[10px] font-bold text-white/60 truncate max-w-[60px]">{matchObj.equipo_a}</span>
                            <span className="text-sm font-score font-bold text-white">{m.goles_a}-{m.goles_b}</span>
                            <span className="text-[10px] font-bold text-white/60 truncate max-w-[60px] text-right">{matchObj.equipo_b}</span>
                            <CountryFlag country={matchObj.equipo_b} size="xs" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm font-bold text-white/50 text-center">Nadie ha atinado batacazos aún.</p>
            )}
          </div>
          {hint(true)}
        </div>
      </div>
    );
  }

  // ══ MODO RESUMEN (vista permanente) ═══════════════════════════════════════
  const tile = 'bg-card border border-border rounded-2xl p-4 shadow-mundial';
  const label = 'text-[10px] font-bold uppercase tracking-widest text-muted-foreground';

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="ms-rise text-center py-2 relative" style={{ animationDelay: '0s' }}>
        <h2 className="text-2xl font-black text-gradient-mundial">Mis Stats</h2>
        <p className="text-sm font-medium text-muted-foreground">{userName ? `${userName} · ` : ''}Tu Mundial en números</p>
        <button
          onClick={() => { setSlide(0); setMode('slides'); }}
          className="absolute left-0 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors"
          title="Ver la presentación de nuevo"
          aria-label="Ver la presentación de nuevo"
        >
          <Play className="w-4 h-4" fill="currentColor" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={`${tile} ms-rise`} style={{ animationDelay: '0.08s' }}>
          <div className="flex items-center gap-2 mb-1"><Trophy className="w-4 h-4 text-primary" /><span className={label}>Puntos totales</span></div>
          <div className="font-score text-4xl font-bold text-foreground">{stats.totalPts}</div>
        </div>
        <div className={`${tile} ms-rise`} style={{ animationDelay: '0.14s' }}>
          <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-4 h-4 text-primary" /><span className={label}>Puesto actual</span></div>
          <div className="flex items-end gap-2">
            <div className="font-score text-4xl font-bold text-foreground">{stats.pos ?? '–'}</div>
            {stats.delta > 0 ? (
              <span className="flex items-center text-xs font-black text-emerald-500 mb-1.5"><ArrowUp className="w-3.5 h-3.5" />{stats.delta}</span>
            ) : stats.delta < 0 ? (
              <span className="flex items-center text-xs font-black text-rose-500 mb-1.5"><ArrowDown className="w-3.5 h-3.5" />{Math.abs(stats.delta)}</span>
            ) : (
              <Minus className="w-3.5 h-3.5 text-muted-foreground/40 mb-2" />
            )}
          </div>
          {stats.mejorPuesto != null && stats.mejorPuesto < (stats.pos ?? Infinity) && (
            <p className="text-[10px] font-bold text-muted-foreground mt-0.5">Mejor puesto: {stats.mejorPuesto}°</p>
          )}
        </div>
        <div className={`${tile} ms-rise col-span-2`} style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-2 mb-1"><Target className="w-4 h-4 text-accent" /><span className={label}>Efectividad Global</span></div>
          <div className="font-score text-4xl font-bold text-foreground">{stats.efectividad}%</div>
          <p className="text-[10px] font-bold text-muted-foreground mt-0.5">de {stats.jugadas} partidos que pronosticaste</p>
        </div>
        <div className={`${tile} ms-rise`} style={{ animationDelay: '0.23s' }}>
          <div className="flex items-center gap-2 mb-1"><CheckCircle2 className="w-4 h-4 text-secondary" /><span className={label}>Aciertos</span></div>
          <div className="font-score text-4xl font-bold text-foreground">{stats.aciertos}</div>
          <p className="text-[10px] font-bold text-muted-foreground mt-0.5">sumaste puntos</p>
        </div>
        <div className={`${tile} ms-rise`} style={{ animationDelay: '0.26s' }}>
          <div className="flex items-center gap-2 mb-1"><Target className="w-4 h-4 text-accent" /><span className={label}>Plenos Exactos</span></div>
          <div className="font-score text-4xl font-bold text-foreground">{stats.exactos}</div>
          <p className="text-[10px] font-bold text-muted-foreground mt-0.5">+5 pts cada uno</p>
        </div>
      </div>

      {/* De los únicos en sumar */}
      <div className="ms-rise rounded-2xl p-4 border border-amber-500/30 bg-gradient-to-br from-amber-500/15 to-amber-500/[0.04] shadow-mundial" style={{ animationDelay: '0.32s' }}>
        <div className="flex items-center gap-2 mb-2">
          <Crown className="w-4 h-4 text-amber-500" />
          <span className={label}>De los únicos en sumar</span>
        </div>
        {unique.loading ? (
          <div className="flex items-center gap-3 py-1">
            <div className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin flex-shrink-0" />
            <p className="text-xs font-bold text-muted-foreground">Analizando tus partidos… {unique.done}/{unique.total}</p>
          </div>
        ) : (
          <>
            <div className="flex items-end gap-3 mb-2.5">
              <div className="font-score text-5xl font-bold text-amber-500 leading-none">{uniqueTotal}</div>
              <p className="text-xs font-bold text-muted-foreground mb-1">
                {uniqueTotal === 1 ? 'partido donde fuiste de los únicos en sumar' : 'partidos donde fuiste de los únicos en sumar'}
              </p>
            </div>
            {uniqueList(false)}
          </>
        )}
      </div>

      {/* Fases: proporcional */}
      <div className={`${tile} ms-rise`} style={{ animationDelay: '0.38s' }}>
        <div className="flex items-center gap-2 mb-3"><Sparkles className="w-4 h-4 text-primary" /><span className={label}>¿Dónde brillaste más? · por partido</span></div>
        {faseBars(false)}
        {faseGanadora && (
          <p className="text-[11px] font-bold text-muted-foreground mt-2.5">
            Por promedio, te fue mejor en <span className="text-primary">{faseGanadora === 'grupos' ? 'la fase de grupos' : 'las eliminatorias'}</span>.
          </p>
        )}
      </div>

      {/* La Gran Pifia & Día de Suerte */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ms-rise" style={{ animationDelay: '0.4s' }}>
        <div className={tile}>
          <span className={label}>Tu mayor tropiezo</span>
          <div className="mt-3 space-y-3">
            {stats.pifiaPartidos.map(p => (
              <div key={p.matchId} className="flex flex-col gap-2 p-3 rounded-xl bg-muted/40 border border-border">
                <div className="flex items-center gap-3">
                  <CountryFlag country={p.match.equipo_a} size="xs" />
                  <div className="flex-1 text-center font-score text-lg font-bold text-foreground">
                    {p.match.goles_a}–{p.match.goles_b}
                  </div>
                  <CountryFlag country={p.match.equipo_b} size="xs" />
                </div>
                <div className="text-xs font-bold text-rose-500 text-center">
                  Tú pronosticaste {p.pred.goles_a}–{p.pred.goles_b}
                </div>
              </div>
            ))}
            {stats.pifiaPartidos.length === 0 && <p className="text-xs text-muted-foreground">Aún no hay pifias registradas.</p>}
          </div>
        </div>

        <div className={tile}>
          <span className={label}>Tu día de suerte</span>
          {stats.mejorDia ? (
            <div className="mt-2">
              <p className="text-xs font-bold text-muted-foreground mb-1">
                El {stats.mejorDia.fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
              </p>
              <div className="font-score text-4xl font-bold text-foreground mb-3">{stats.mejorDia.pts} pts</div>
              <div className="space-y-2 mt-2">
                {stats.mejorDia.matches.map(m => (
                  <div key={m.matchId} className="flex items-center justify-between text-[11px] font-bold py-1 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-2">
                      <CountryFlag country={m.match.equipo_a} size="xs" />
                      <span className="text-muted-foreground">vs</span>
                      <CountryFlag country={m.match.equipo_b} size="xs" />
                    </div>
                    <span className={m.pred.puntos_obtenidos === 5 ? 'text-accent' : 'text-emerald-500'}>
                      +{m.pred.puntos_obtenidos} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-2">Aún no tienes un día de suerte.</p>
          )}
        </div>
      </div>

      {/* Selecciones */}
      <div className="grid grid-cols-2 gap-3 ms-rise" style={{ animationDelay: '0.45s' }}>
        {stats.mejorSeleccion && (
          <div className={tile}>
            <span className={label}>Mejor conoces a</span>
            <div className="flex flex-col items-center mt-3">
              <CountryFlag country={stats.mejorSeleccion.equipo} size="md" />
              <p className="font-score text-xl font-bold text-foreground mt-2">{stats.mejorSeleccion.equipo}</p>
              <p className="text-[10px] font-bold text-emerald-500">+{stats.mejorSeleccion.pts} pts ganados</p>
            </div>
          </div>
        )}
        {stats.peorSeleccion && (
          <div className={tile}>
            <span className={label}>Menos conoces a</span>
            <div className="flex flex-col items-center mt-3">
              <CountryFlag country={stats.peorSeleccion.equipo} size="md" />
              <p className="font-score text-xl font-bold text-foreground mt-2">{stats.peorSeleccion.equipo}</p>
              <p className="text-[10px] font-bold text-rose-500">Solo {stats.peorSeleccion.pts} pts ganados</p>
            </div>
          </div>
        )}
      </div>

      {/* Top Arriesgados */}
      <div className={`${tile} ms-rise`} style={{ animationDelay: '0.5s' }}>
        <div className="flex items-center gap-2 mb-3">
          <Crown className="w-4 h-4 text-accent" />
          <span className={label}>Top Arriesgados (Liga)</span>
        </div>
        {unique.loading ? (
          <div className="flex items-center gap-2">
             <div className="w-4 h-4 border-2 border-border border-t-foreground rounded-full animate-spin" />
             <span className="text-xs text-muted-foreground">Calculando...</span>
          </div>
        ) : (
          <div className="space-y-2">
            {unique.topArriesgados.map((u) => {
              const userL = leaderboard.find(l => l.id === u.id);
              const name = userL?.nombre || 'Jugador';
              const isMe = u.id === currentUserId;
              return (
                <div key={u.id} className={`flex flex-col gap-2 p-2.5 rounded-lg ${isMe ? 'bg-accent/10 border border-accent/30' : 'bg-muted/40 border border-border'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 text-left min-w-0">
                      <p className={`font-bold text-xs truncate ${isMe ? 'text-accent' : 'text-foreground'}`}>{name}</p>
                      <p className="text-[10px] font-bold text-muted-foreground">{u.batacazos} {u.batacazos === 1 ? 'batacazo' : 'batacazos'}</p>
                    </div>
                    <div className="font-score text-xl font-bold text-accent pl-2">+{u.batacazos * 5}</div>
                  </div>
                  <div className="flex flex-col gap-1.5 mt-1">
                    {u.matches.map((m: any) => {
                      const matchObj = matchById[m.mid];
                      if (!matchObj) return null;
                      return (
                        <div key={m.mid} className="flex items-center justify-center gap-2 bg-background/50 rounded-md px-2 py-1.5 border border-border/50">
                          <CountryFlag country={matchObj.equipo_a} size="xs" />
                          <span className="text-[10px] font-bold text-foreground/60 truncate max-w-[60px]">{matchObj.equipo_a}</span>
                          <span className="text-sm font-score font-bold text-foreground/80">{m.goles_a}-{m.goles_b}</span>
                          <span className="text-[10px] font-bold text-foreground/60 truncate max-w-[60px] text-right">{matchObj.equipo_b}</span>
                          <CountryFlag country={matchObj.equipo_b} size="xs" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {unique.topArriesgados.length === 0 && <p className="text-xs text-muted-foreground">Nadie ha atinado batacazos aún.</p>}
          </div>
        )}
      </div>

      <div className={`${tile} ms-rise`} style={{ animationDelay: '0.55s' }}>
        <span className={label}>Tus plenos exactos</span>
        <div className="mt-2">{bestRows(false)}</div>
      </div>
    </div>
  );
}
