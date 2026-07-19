import { useState, useEffect, useMemo, useRef } from 'react';
import { Trophy, X, ChevronDown, Play } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CountryFlag, flagUrlFor } from './CountryFlag';
import { MatchCard } from './MatchCard';
import { teamColors } from './teamColors';

interface FinalIntroProps {
  match: any;
  prediction?: any;
  /** Todas tus predicciones — alimenta el historial dentro de la escena. */
  predictions?: Record<number, any>;
  onSavePrediction?: (matchId: number, golesA: number, golesB: number) => Promise<void>;
  leagueId?: string;
  accessToken?: string;
  currentUserId?: string;
  allMatches?: any[];
  /** Modo anclado: la escena queda como vista Inicio con el nav visible.
      Anclada = ya se vio la intro → arranca directo en la card. */
  docked?: boolean;
  /** "Continuar": mantiene la escena y revela el nav (opciones). */
  onContinue?: () => void;
  /** Reproduce la intro completa otra vez (botón play). */
  onReplay?: () => void;
  onClose: () => void;
}

/**
 * Experiencia "LA GRAN FINAL" en TRES fases sobre el mismo fondo (lavados de
 * bandera + aurora + polvo dorado). Se avanza con un scroll mínimo o un tap:
 *   1. HERO   — presenta el duelo con countdown.
 *   2. CAMINO — los resultados de playoffs de cada finalista, con banderas.
 *   3. CARD   — la MatchCard real (skin gala) para pronosticar ahí mismo.
 * La X (o "Ver todos los partidos") sale a la app. 100% CSS/GPU.
 */
export function FinalIntro({ match, prediction, predictions, onSavePrediction, leagueId, accessToken, currentUserId, allMatches, docked = false, onContinue, onReplay, onClose }: FinalIntroProps) {
  // Anclada (intro ya vista) → directo a la card. Si no, arranca la intro.
  const [phase, setPhase] = useState<'hero' | 'road' | 'card' | 'history'>(docked ? 'card' : 'hero');
  const [closing, setClosing] = useState(false);
  const [, setTick] = useState(0);
  // Historial: pestaña activa (Playoffs por defecto) — filtra qué partidos ver.
  const [histTab, setHistTab] = useState<'playoffs' | 'grupos'>('playoffs');
  const touchY = useRef<number | null>(null);
  // Morph del botón inferior: "Continuar" se desvanece y en su lugar entra
  // "Ver todos mis pronósticos" + la invitación a Mis Stats.
  const [morphing, setMorphing] = useState(false);
  const [invite, setInvite] = useState(false);

  const handleContinue = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (morphing) return;
    setMorphing(true);
    setTimeout(() => {
      onContinue?.();
      setInvite(true);
      setTimeout(() => setInvite(false), 8000);
    }, 260);
  };

  // ── Celebración por lado: quién va ganando en TU pronóstico ──────────────
  const [pick, setPick] = useState<{ a: number; b: number } | null>(null);
  const [drawWinner, setDrawWinner] = useState<string | null>(null);
  const celebTeam = pick
    ? (pick.a > pick.b ? match.equipo_a : pick.b > pick.a ? match.equipo_b : drawWinner)
    : null;
  const celebSide: 'a' | 'b' | null =
    celebTeam === match.equipo_a ? 'a' : celebTeam === match.equipo_b ? 'b' : null;

  // Confeti ambiente CONSTANTE: si elegiste ganador, brota de SU lado; si aún
  // no hay ganador (0-0 / empate sin elegir), brota alternando de AMBOS lados
  // con los colores de cada selección — el duelo sigue abierto.
  useEffect(() => {
    if (phase !== 'card' || closing) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let confettiFn: any = null;
    import('canvas-confetti').then(m => { confettiFn = m.default; }).catch(() => {});
    let flip = false;
    const id = setInterval(() => {
      if (!confettiFn) return;
      const base = { zIndex: 50, useWorker: false, disableForReducedMotion: true };
      const side: 'a' | 'b' = celebSide ?? (flip ? 'a' : 'b');
      flip = !flip;
      const fromLeft = side === 'a';
      confettiFn({
        ...base,
        particleCount: celebSide ? 12 : 9,
        angle: fromLeft ? 60 : 120,
        spread: 58,
        startVelocity: 40,
        ticks: 175,
        scalar: 0.9,
        colors: teamColors(fromLeft ? match.equipo_a : match.equipo_b),
        zIndex: 260,
        origin: { x: fromLeft ? 0.02 : 0.98, y: 0.5 + Math.random() * 0.35 },
      });
    }, celebSide ? 550 : 700);
    return () => clearInterval(id);
  }, [celebSide, phase, closing, match.equipo_a, match.equipo_b]);

  // Historial: TODOS los partidos jugados (aunque no los hayas pronosticado),
  // filtrados por pestaña (Playoffs = id≥73 · Grupos = id<73), agrupados por día
  // y ordenados de más reciente a más antiguo.
  const historyGroups = useMemo(() => {
    const min = histTab === 'playoffs' ? 73 : 0;
    const max = histTab === 'playoffs' ? 999 : 72;
    const past = (allMatches || []).filter(
      (m: any) => m.estado === 'finalizado' && m.id >= min && m.id <= max
    );
    past.sort((x: any, y: any) => new Date(y.fecha_hora).getTime() - new Date(x.fecha_hora).getTime());
    const groups: { label: string; items: any[] }[] = [];
    past.forEach((m: any) => {
      const label = format(new Date(m.fecha_hora), "EEEE d 'de' MMMM", { locale: es });
      const g = groups[groups.length - 1];
      if (g && g.label === label) g.items.push(m);
      else groups.push({ label, items: [m] });
    });
    return groups;
  }, [allMatches, histTab]);

  // Reloj del countdown
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const close = () => {
    setClosing(true);
    setTimeout(onClose, 450);
  };
  // Solo hero→road→card avanzan con gesto; card e history navegan con botones.
  const advance = () => setPhase(p => (p === 'hero' ? 'road' : p === 'road' ? 'card' : p));
  const openHistory = (e: React.MouseEvent) => { e.stopPropagation(); setPhase('history'); };

  const diffS = Math.max(0, Math.floor((new Date(match.fecha_hora).getTime() - Date.now()) / 1000));
  const dd = Math.floor(diffS / 86400);
  const hh = Math.floor((diffS % 86400) / 3600);
  const mm = Math.floor((diffS % 3600) / 60);
  const ss = diffS % 60;
  const p2 = (n: number) => String(n).padStart(2, '0');
  const countdown = dd > 0 ? `${dd}d ${p2(hh)}h ${p2(mm)}m` : `${p2(hh)}:${p2(mm)}:${p2(ss)}`;

  const flagA = flagUrlFor(match.equipo_a);
  const flagB = flagUrlFor(match.equipo_b);

  // Camino a la final: resultados de eliminatorias de cada finalista (16avos →
  // semis), calculados de los partidos ya jugados.
  const roadFor = (team: string) => {
    if (!allMatches) return [];
    return allMatches
      .filter((m: any) =>
        m.id >= 73 && m.id !== match.id && m.estado === 'finalizado' &&
        (m.equipo_a === team || m.equipo_b === team))
      .sort((a: any, b: any) => a.id - b.id)
      .map((m: any) => {
        const home = m.equipo_a === team;
        return {
          fase: m.id <= 88 ? '16avos' : m.id <= 96 ? 'Octavos' : m.id <= 100 ? 'Cuartos' : 'Semis',
          gf: home ? m.goles_a : m.goles_b,
          gc: home ? m.goles_b : m.goles_a,
          rival: home ? m.equipo_b : m.equipo_a,
        };
      });
  };
  const roadA = roadFor(match.equipo_a);
  const roadB = roadFor(match.equipo_b);
  // Filas espejo: la fase al centro, el resultado de cada finalista a los lados.
  // Orden invertido: Semis arriba (lo más reciente primero) → 16avos abajo.
  const roadRows = Array.from({ length: Math.max(roadA.length, roadB.length) }, (_, i) => ({
    label: (roadA[i] ?? roadB[i]).fase,
    a: roadA[i],
    b: roadB[i],
  })).reverse();

  const hint = (
    <div className="fi-hint flex flex-col items-center gap-0.5 text-white/60">
      <span className="text-xs font-bold">Desliza para continuar</span>
      <ChevronDown className="fi-chevron w-4 h-4" />
    </div>
  );

  const fiwMid = celebSide === 'a' ? 70 : celebSide === 'b' ? 30 : 50;
  // The wrapper is inset: -50% (200% width). To move the cut by X% of screen, we translate the wrapper by X/2 %.
  const washTranslate = (fiwMid - 50) / 2;

  return (
    <div
      className={`final-intro ${docked ? 'final-intro-docked' : ''} ${closing ? 'final-intro-out' : ''}`}
      onWheel={(e) => { if ((phase === 'hero' || phase === 'road') && e.deltaY > 8) advance(); }}
      onTouchStart={(e) => { touchY.current = e.touches[0].clientY; }}
      onTouchMove={(e) => {
        if ((phase !== 'hero' && phase !== 'road') || touchY.current == null) return;
        if (touchY.current - e.touches[0].clientY > 24) {
          touchY.current = null;
          advance();
        }
      }}
    >
      {/* Lavados gigantes con los colores de cada finalista. El lado del
          ganador que elijas PREDOMINA (el corte se desplaza con transición de translate, sin animar máscara). */}
      <div className="fi-wash" aria-hidden="true">
        {flagA && (
          <div
            style={{
              position: 'absolute',
              inset: '-50%', // 200% wide/tall to allow translation without showing edges
              WebkitMaskImage: 'linear-gradient(104deg, #000 40%, transparent 60%)',
              maskImage: 'linear-gradient(104deg, #000 40%, transparent 60%)',
              transform: `translateX(${washTranslate}%) translateZ(0)`,
              transition: 'transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)',
              willChange: 'transform'
            }}
          >
            <div
              className="fi-wash-flag"
              style={{
                backgroundImage: `url("${flagA}")`,
                transform: `translateX(${-washTranslate}%) translateZ(0)`,
                transition: 'transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)',
                willChange: 'transform'
              }}
            />
          </div>
        )}
        {flagB && (
          <div
            style={{
              position: 'absolute',
              inset: '-50%',
              WebkitMaskImage: 'linear-gradient(104deg, transparent 40%, #000 60%)',
              maskImage: 'linear-gradient(104deg, transparent 40%, #000 60%)',
              transform: `translateX(${washTranslate}%) translateZ(0)`,
              transition: 'transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)',
              willChange: 'transform'
            }}
          >
            <div
              className="fi-wash-flag"
              style={{
                backgroundImage: `url("${flagB}")`,
                transform: `translateX(${-washTranslate}%) translateZ(0)`,
                transition: 'transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)',
                willChange: 'transform'
              }}
            />
          </div>
        )}
      </div>
      <div className="fi-aurora" aria-hidden="true" />
      {/* Polvo dorado ascendiendo (todas las fases) */}
      <div className="fi-dust" aria-hidden="true">
        <span /><span /><span /><span /><span /><span />
      </div>

      {/* Salir a la app (solo en modo inmersivo; anclada, navega con el nav) */}
      {!docked && (
        <button
          onClick={close}
          aria-label="Cerrar presentación"
          className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Botón PLAY: reproduce la intro completa otra vez (solo estando anclada
          en la card — la intro ya se vio). */}
      {docked && phase === 'card' && onReplay && (
        <button
          onClick={(e) => { e.stopPropagation(); onReplay(); }}
          aria-label="Ver la presentación otra vez"
          title="Ver la presentación otra vez"
          className="absolute top-4 left-4 z-30 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-[#F1D07C] flex items-center justify-center transition-colors"
        >
          <Play className="w-4 h-4" fill="currentColor" />
        </button>
      )}

      {/* FASE 1 · HERO */}
      <div
        className={`fi-stage ${phase !== 'hero' ? 'fi-stage-up' : ''} relative z-10 flex flex-col items-center gap-6 px-6 text-center cursor-pointer`}
        onClick={phase === 'hero' ? advance : undefined}
        role="button"
        aria-label="Continuar"
      >
        <div className="fi-eyebrow flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em] text-white/70">
          <Trophy className="w-3.5 h-3.5 text-[#F1D07C]" />
          <span>Domingo 19 de Julio{match.estadio ? ` · ${match.estadio}` : ''}</span>
        </div>

        <h1 className="fi-title font-score text-6xl sm:text-8xl font-bold leading-none">
          LA GRAN<br />FINAL
        </h1>

        <div className="flex items-center gap-5 sm:gap-8 mt-2">
          <div className="fi-team-l flex flex-col items-center gap-2">
            <CountryFlag country={match.equipo_a} size="xl" />
            <span className="text-sm font-black text-white">{match.equipo_a}</span>
          </div>
          <span className="fi-vs font-score text-3xl sm:text-4xl font-bold text-white/50">VS</span>
          <div className="fi-team-r flex flex-col items-center gap-2">
            <CountryFlag country={match.equipo_b} size="xl" />
            <span className="text-sm font-black text-white">{match.equipo_b}</span>
          </div>
        </div>

        <div className="fi-count flex flex-col items-center gap-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/50">Comienza en</span>
          <span className="font-score text-3xl font-bold text-[#F1D07C] tabular-nums">{countdown}</span>
        </div>

        {hint}
      </div>

      {/* FASE 2 · EL CAMINO A LA FINAL */}
      <div
        className={`fi-card ${phase === 'road' ? 'fi-card-in cursor-pointer' : phase === 'card' ? 'fi-out-up' : ''}`}
        onClick={phase === 'road' ? advance : undefined}
      >
        <div className="flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em] text-white/70 mb-4">
          <Trophy className="w-3.5 h-3.5 text-[#F1D07C]" />
          El camino a la final
        </div>

        {/* Bracket convergente: fases al centro, resultados espejados a los
            lados, todo converge en el trofeo de la Final. */}
        <div className="fi-road2 mb-5">
          {/* Cabecera: los dos finalistas frente a frente */}
          <div className="fi-road2-head fi-road2-row">
            <div className="flex flex-col items-center gap-1.5">
              <div className="fi-flag-glow">
                <CountryFlag country={match.equipo_a} size="lg" />
              </div>
              <span className="text-sm font-black text-white">{match.equipo_a}</span>
            </div>
            <span className="fi-road2-vs font-score text-xl font-bold text-white/40">VS</span>
            <div className="flex flex-col items-center gap-1.5">
              <div className="fi-flag-glow">
                <CountryFlag country={match.equipo_b} size="lg" />
              </div>
              <span className="text-sm font-black text-white">{match.equipo_b}</span>
            </div>
          </div>

          <div className="fi-road2-body">
            <div className="fi-road2-spine" aria-hidden="true" />
            {roadRows.map((row, i) => (
              <div key={row.label} className="fi-road2-row" style={{ animationDelay: `${0.2 + i * 0.09}s` }}>
                <div className="fi-road2-cell justify-end">
                  {row.a && (
                    <>
                      <CountryFlag country={row.a.rival} size="sm" />
                      <span className="fi-road2-score font-score">{row.a.gf}–{row.a.gc}</span>
                    </>
                  )}
                </div>
                <span className="fi-road2-fase">{row.label}</span>
                <div className="fi-road2-cell justify-start">
                  {row.b && (
                    <>
                      <span className="fi-road2-score font-score">{row.b.gf}–{row.b.gc}</span>
                      <CountryFlag country={row.b.rival} size="sm" />
                    </>
                  )}
                </div>
              </div>
            ))}

            {/* Convergencia: todo el camino desemboca en la copa */}
            <div className="fi-road2-end" style={{ animationDelay: '0.65s' }}>
              <div className="fi-road2-cup">
                <Trophy className="w-5 h-5" strokeWidth={2.2} />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/60">
                19 de Julio{match.estadio ? ` · ${match.estadio}` : ''}
              </span>
            </div>
          </div>
        </div>

        {hint}
      </div>

      {/* FASE 3 · PRONOSTICAR (MatchCard real con skin gala) */}
      <div className={`fi-card ${phase === 'card' ? 'fi-card-in' : phase === 'history' ? 'fi-out-up' : ''}`}>
        <div className="flex flex-col items-center gap-2 mb-4">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em] text-white/70">
            <Trophy className="w-3.5 h-3.5 text-[#F1D07C]" />
            La Gran Final
          </div>
          <div className="flex items-center gap-3 px-5 py-2 rounded-full bg-white/10 border border-white/15">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Cierra en</span>
            <span className="font-score text-4xl font-bold text-[#F1D07C] tabular-nums leading-none">{countdown}</span>
          </div>
        </div>

        {/* Duelo flotante */}
        <div className="fi-duel mb-4">
          <div className="fi-float fi-float-a">
            <div className="fi-flag-glow">
              <CountryFlag country={match.equipo_a} size="xl" />
            </div>
            <span className="text-sm font-black text-white">{match.equipo_a}</span>
          </div>
          <span className="fi-duel-vs font-score text-2xl font-bold text-white/40 mt-6">VS</span>
          <div className="fi-float fi-float-b">
            <div className="fi-flag-glow">
              <CountryFlag country={match.equipo_b} size="xl" />
            </div>
            <span className="text-sm font-black text-white">{match.equipo_b}</span>
          </div>
        </div>

        {/* La MatchCard real, con marco limpio */}
        <div className="fi-card-frame" onClick={(e) => e.stopPropagation()}>
          <MatchCard
            match={match}
            prediction={prediction}
            onSavePrediction={onSavePrediction}
            leagueId={leagueId}
            accessToken={accessToken}
            currentUserId={currentUserId}
            allMatches={allMatches}
            premium
            askWinnerOnDraw
            onScoreChange={(a, b) => {
              setPick({ a, b });
              if (a !== b) setDrawWinner(null);
            }}
            onDrawWinner={setDrawWinner}
          />
        </div>

      </div>

      {/* FASE HISTORIAL · TODOS los partidos jugados (con o sin pronóstico),
          alineados arriba y desplazables. Pestañas Playoffs / Fase de grupos.
          La lista solo se monta al entrar (eficiencia). */}
      <div className={`fi-card fi-card-history ${phase === 'history' ? 'fi-card-in' : ''}`}>
        {/* Encabezado FIJO: se mantiene arriba al hacer scroll. */}
        <div className="fi-hist-header sticky top-0 z-10 flex flex-col items-center gap-3 pt-14 pb-3 mb-2">
          <button
            onClick={(e) => { e.stopPropagation(); setPhase('card'); }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold text-white/80 bg-white/10 border border-white/15 hover:bg-white/18 backdrop-blur-md transition-colors"
          >
            <Trophy className="w-3 h-3 text-[#F1D07C]" />
            Volver a la Final
          </button>
          {/* Segmentado: Playoffs (default) · Fase de grupos */}
          <div className="flex items-center gap-1 p-1 rounded-full bg-white/8 border border-white/12 w-full max-w-[300px] backdrop-blur-md">
            {([['playoffs', 'Playoffs'], ['grupos', 'Fase de grupos']] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={(e) => { e.stopPropagation(); setHistTab(key); }}
                className={`flex-1 py-2 rounded-full text-xs font-black transition-colors ${
                  histTab === key ? 'bg-[#EAC65E] text-[#221703]' : 'text-white/60 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {phase === 'history' && (
          <div className="space-y-7 w-full max-w-7xl px-4" style={{ maxWidth: '1280px' }}>
            {historyGroups.map(g => (
              <div key={g.label}>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/50 mb-3 text-center capitalize">{g.label}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {g.items.map((m: any) => (
                    <MatchCard
                      key={m.id}
                      match={m}
                      prediction={predictions?.[m.id]}
                      onSavePrediction={onSavePrediction}
                      leagueId={leagueId}
                      accessToken={accessToken}
                      currentUserId={currentUserId}
                      allMatches={allMatches}
                    />
                  ))}
                </div>
              </div>
            ))}
            {historyGroups.length === 0 && (
              <p className="text-center text-sm font-bold text-white/50 py-10">
                {histTab === 'playoffs' ? 'Aún no hay partidos de playoffs jugados' : 'Aún no hay partidos de grupos'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Botonera inferior FIJA (sobre el nav en modo anclado). "Continuar" se
          transforma en "Ver todos mis pronósticos" con una transición suave y
          aparece la invitación a Mis Stats. */}
      {phase === 'card' && (
        <div className="fi-bottom" onClick={(e) => e.stopPropagation()}>
          {!docked ? (
            <button
              onClick={handleContinue}
              className={`fi-bottom-btn fi-next ${morphing ? 'fi-btn-fade' : ''}`}
            >
              Continuar →
            </button>
          ) : (
            <>
              <button onClick={openHistory} className="fi-bottom-btn fi-ghost-btn">
                Ver todos mis pronósticos →
              </button>
              {invite && (
                <div className="fi-invite">
                  Descubre tus números en <b>Mis Stats</b>
                  <ChevronDown className="fi-chevron w-3.5 h-3.5" />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
