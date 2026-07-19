import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Lock, Check, Clock, MapPin, Trophy, Plus, Minus, Table2, ChevronRight, BarChart2, Users } from 'lucide-react';
import { format } from 'date-fns';
import { CountryFlag, flagUrlFor } from './CountryFlag';
import { teamColors } from './teamColors';
import { GroupHoverCard } from './GroupHoverCard';
import { TeamHoverCard } from './TeamHoverCard';
import { MatchPredictionsModal } from './MatchPredictionsModal';

// Trazo del logo de TikTok (nota musical). Se reutiliza en las 3 capas del glitch.
const TIKTOK_PATH = "M16.6 5.82A4.28 4.28 0 0 1 15.56 3h-3.05v12.43a2.4 2.4 0 1 1-2.4-2.4c.2 0 .39.03.57.07v-3.1a5.5 5.5 0 1 0 4.88 5.46V8.9a7.28 7.28 0 0 0 4.27 1.37V7.2a4.28 4.28 0 0 1-3.23-1.38z";

interface Match {
  id: number;
  equipo_a: string;
  equipo_b: string;
  fecha_hora: string;
  estadio: string;
  grupo: string;
  goles_a?: number | null;
  goles_b?: number | null;
  estado?: 'pendiente' | 'en_curso' | 'finalizado';
  api_status?: string | null;
  minuto?: string | null;
  segundo_tiempo_inicio?: string | null;
}

// Instante (ms epoch) a partir del cual mostramos el botón "Resumen" de YouTube.
// El resumen no se publica al instante del pitazo: en promedio ~1-2h después.
// Como el tipo Match no trae timestamp de finalización, aproximamos el fin del
// partido como kickoff + 2h (90' + entretiempo + descuento) y le sumamos el buffer:
//   • Resultado decisivo → +1h  (≈ kickoff + 3h)
//   • Empate en eliminatoria (id ≥ 73) → +2h  (≈ kickoff + 4h): hubo prórroga y
//     quizá penales, así que el partido REAL dura más y el resumen tarda más.
//   Los empates de fase de grupos NO van a prórroga → usan el buffer normal (+1h).
function getResumenShowAt(match: { id: number; fecha_hora: string; goles_a?: number | null; goles_b?: number | null }): number {
  const isKnockout = match.id >= 73;
  const isDraw = match.goles_a != null && match.goles_b != null && match.goles_a === match.goles_b;
  const bufferHours = (isKnockout && isDraw) ? 4 : 3;
  return new Date(match.fecha_hora).getTime() + bufferHours * 3_600_000;
}

// Calcula el minuto de juego en vivo. Es 100% client-side y usa instantes
// absolutos (Date.now() y fechas con offset explícito), por lo que da el MISMO
// resultado en cualquier zona horaria — no depende de la hora de pared del usuario.
//
// 2T EXACTO: si tenemos el ancla `segundoTiempoInicio` (instante real en que el
// poller detectó el paso a 2H), el minuto se cuenta desde ahí (46 + transcurrido),
// inmune a descansos largos, arranques tardíos y añadido del 1T. Si no está
// disponible, cae a una estimación desde el kickoff (asume 15' de descanso).
// Maneja el tiempo añadido del 1T (45+X) y del 2T (90+X).
function computeLiveMinute(
  fechaHora: string,
  apiStatus: string | null | undefined,
  segundoTiempoInicio?: string | null,
): { min: string; sec: number } | null {
  if (apiStatus !== '1H' && apiStatus !== '2H') return null;
  const kickMs = new Date(fechaHora).getTime();
  if (Number.isNaN(kickMs)) return null;
  const nowMs = Date.now();
  const totalMs = nowMs - kickMs;
  if (totalMs < 0) return null;
  const totalSecs = Math.floor(totalMs / 1000);
  const elapsed = Math.floor(totalSecs / 60);
  const sec = totalSecs % 60;

  if (apiStatus === '1H') {
    if (elapsed <= 45) return { min: String(Math.max(elapsed, 1)), sec };
    // Tiempo añadido del primer tiempo (cap a +15 por si la API tarda en pasar a HT)
    return { min: `45+${Math.min(elapsed - 45, 15)}`, sec };
  }

  // 2T — preferimos el ancla real del inicio del segundo tiempo.
  if (segundoTiempoInicio) {
    const startMs = new Date(segundoTiempoInicio).getTime();
    if (!Number.isNaN(startMs)) {
      const secsFromStart = Math.floor((nowMs - startMs) / 1000);
      const mFromStart = Math.floor(secsFromStart / 60);
      const secInMin = secsFromStart % 60;
      const m = 46 + mFromStart;
      if (m <= 90) return { min: String(Math.max(m, 46)), sec: secInMin };
      return { min: `90+${Math.min(m - 90, 20)}`, sec: secInMin };
    }
  }
  // Fallback: estimación desde el kickoff (asume 15' de descanso).
  const play = elapsed - 15;
  if (play < 46) return { min: '46', sec };
  if (play <= 90) return { min: String(play), sec };
  return { min: `90+${Math.min(play - 90, 20)}`, sec };
}

function getPhaseLabel(apiStatus: string | null | undefined, liveTime: { min: string; sec: number } | null | undefined, isLive: boolean, estado: string | undefined): React.ReactNode {
  if (estado === 'finalizado') return 'Resultado final';
  if (!apiStatus) return isLive ? <>Resultado <span className="text-rose-500">en vivo</span></> : 'Resultado';
  if (apiStatus === 'HT') return 'Medio tiempo';
  const clock = liveTime
    ? <> · <span className="text-rose-500 animate-pulse tabular-nums">{liveTime.min}'<span className="text-[0.85em] opacity-70">{String(liveTime.sec).padStart(2, '0')}"</span></span></>
    : null;
  if (apiStatus === '1H') return <>Primer tiempo{clock}</>;
  if (apiStatus === '2H') return <>Segundo tiempo{clock}</>;
  if (['FT','ET','AET','BT','P','PEN'].includes(apiStatus)) return 'Resultado final';
  return isLive ? <>Resultado <span className="text-rose-500">en vivo</span></> : 'Resultado';
}

interface Prediction {
  goles_a: number;
  goles_b: number;
  puntos_obtenidos?: number;
}

interface MatchCardProps {
  match: Match;
  prediction?: Prediction;
  onSavePrediction?: (matchId: number, golesA: number, golesB: number) => Promise<void>;
  onViewGroup?: (grupo: string) => void;
  onViewTeam?: (team: string, grupo: string) => void;
  leagueId?: string;
  accessToken?: string;
  currentUserId?: string;
  allMatches?: Match[];
  /** Skin "gala" (escena de la Gran Final): vidrio oscuro + controles dorados. */
  premium?: boolean;
  /** Notifica cada cambio del marcador elegido (para efectos del contenedor). */
  onScoreChange?: (golesA: number, golesB: number) => void;
  /** En empate, pregunta "¿quién gana?" antes de guardar (solo celebración). */
  askWinnerOnDraw?: boolean;
  /** El equipo elegido como ganador en el popup de empate. */
  onDrawWinner?: (team: string) => void;
}

export function MatchCard({ match, prediction, onSavePrediction, onViewGroup, onViewTeam, leagueId, accessToken, currentUserId, allMatches, premium = false, onScoreChange, askWinnerOnDraw = false, onDrawWinner }: MatchCardProps) {
  const [golesA, setGolesA] = useState<number>(0);
  const [golesB, setGolesB] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  // El usuario tocó el marcador de ESTA card: activa el efecto reactivo de las
  // banderas de fondo aun antes de guardar.
  const [touched, setTouched] = useState(false);
  // Popup "¿quién gana la final?" al guardar un empate (solo celebración).
  const [askWinner, setAskWinner] = useState(false);

  // Reporta cada cambio del marcador al contenedor (efectos de la escena).
  useEffect(() => {
    onScoreChange?.(golesA, golesB);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [golesA, golesB]);
  const [showGroupHover, setShowGroupHover] = useState(false);
  const [showTeamAHover, setShowTeamAHover] = useState(false);
  const [showTeamBHover, setShowTeamBHover] = useState(false);
  const [tick, setTick] = useState(0);
  const [modalMode, setModalMode] = useState<'summary' | 'full' | 'winners' | null>(null);
  const [seenStats, setSeenStats] = useState(() => localStorage.getItem('polla_seen_stats') === '1');
  const [seenGrupo, setSeenGrupo] = useState(() => localStorage.getItem('polla_seen_grupo') === '1');
  const [seenVerTodos, setSeenVerTodos] = useState(() => localStorage.getItem('polla_seen_ver_todos') === '1');

  const groupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const teamATimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const teamBTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const groupBtnRef = useRef<HTMLDivElement>(null);

  const showGroup  = () => { if (groupTimer.current)  clearTimeout(groupTimer.current);  setShowGroupHover(true); };
  const hideGroup  = () => { groupTimer.current  = setTimeout(() => setShowGroupHover(false), 150); };
  const showTeamA  = () => { if (teamATimer.current)  clearTimeout(teamATimer.current);  setShowTeamAHover(true); };
  const hideTeamA  = () => { teamATimer.current  = setTimeout(() => setShowTeamAHover(false), 150); };
  const showTeamB  = () => { if (teamBTimer.current)  clearTimeout(teamBTimer.current);  setShowTeamBHover(true); };
  const hideTeamB  = () => { teamBTimer.current  = setTimeout(() => setShowTeamBHover(false), 150); };

  const getTeamRecent = (team: string) => {
    if (!allMatches) return [];
    return allMatches
      .filter(m => (m.equipo_a === team || m.equipo_b === team) && m.estado === 'finalizado')
      .sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime())
      .slice(0, 2)
      .map(m => ({
        equipo_a: m.equipo_a,
        equipo_b: m.equipo_b,
        goles_a: m.goles_a ?? 0,
        goles_b: m.goles_b ?? 0,
        fecha: format(new Date(m.fecha_hora), 'dd/MM'),
      }));
  };

  useEffect(() => {
    if (match.estado !== 'pendiente') return;
    const id = setInterval(() => setTick(t => t + 1), 1_000);
    return () => clearInterval(id);
  }, [match.estado]);

  // Ticker del reloj en vivo: re-render cada 1s para mostrar minuto y segundos.
  useEffect(() => {
    if (match.estado !== 'en_curso') return;
    const id = setInterval(() => setTick(t => t + 1), 1_000);
    return () => clearInterval(id);
  }, [match.estado]);

  // Sincroniza dots entre todas las instancias de MatchCard cuando una descarta
  useEffect(() => {
    const sync = () => {
      setSeenStats(localStorage.getItem('polla_seen_stats') === '1');
      setSeenGrupo(localStorage.getItem('polla_seen_grupo') === '1');
      setSeenVerTodos(localStorage.getItem('polla_seen_ver_todos') === '1');
    };
    window.addEventListener('polla_dot_dismissed', sync);
    return () => window.removeEventListener('polla_dot_dismissed', sync);
  }, []);

  // Dispara re-render exactamente al cumplir 120 min del kickoff para quitar el pill EN VIVO
  useEffect(() => {
    if (match.estado === 'finalizado') return;
    const matchEndMs = new Date(match.fecha_hora).getTime() + 120 * 60 * 1000;
    const msUntilEnd = matchEndMs - Date.now();
    if (msUntilEnd <= 0) return;
    const id = setTimeout(() => setTick(t => t + 1), msUntilEnd);
    return () => clearTimeout(id);
  }, [match.fecha_hora, match.estado]);

  // Muestra el botón "Resumen" sin necesidad de F5: agenda un re-render exacto en el
  // instante en que se cumple el buffer post-partido (ver getResumenShowAt).
  useEffect(() => {
    if (match.estado !== 'finalizado') return;
    const msUntil = getResumenShowAt(match) - Date.now();
    if (msUntil <= 0) return;
    const id = setTimeout(() => setTick(t => t + 1), msUntil);
    return () => clearTimeout(id);
  }, [match.estado, match.id, match.fecha_hora, match.goles_a, match.goles_b]);

  // ¿Ya se puede mostrar el resumen? (finalizado + buffer cumplido). Depende de `tick`
  // para recomputarse cuando el setTimeout de arriba dispara.
  const showResumen = useMemo(
    () => match.estado === 'finalizado' && Date.now() >= getResumenShowAt(match),
    [match.estado, match.id, match.fecha_hora, match.goles_a, match.goles_b, tick]
  );

  const { minutesUntilMatch, secondsUntilMatch, isLocked, isLive, formattedTime } = useMemo(() => {
    const matchDate = new Date(match.fecha_hora);
    const now = new Date();
    const diffMs = matchDate.getTime() - now.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    // Cierre exacto al inicio del partido (T-0), sin redondeo de minutos: el usuario
    // puede pronosticar hasta el último instante antes del kickoff. Coincide con el backend.
    const locked = diffMs <= 0 || match.estado !== 'pendiente';
    const matchEndMs = matchDate.getTime() + 120 * 60 * 1000;
    const isLive = diffSeconds <= 0 && now.getTime() < matchEndMs && match.estado !== 'finalizado';
    return {
      minutesUntilMatch: diffMinutes,
      secondsUntilMatch: diffSeconds,
      isLocked: locked,
      isLive,
      formattedTime: format(matchDate, 'HH:mm'),
    };
  }, [match.fecha_hora, match.estado, tick]);

  const formatCountdown = (totalSeconds: number): string => {
    if (totalSeconds <= 0) return '';
    const d = Math.floor(totalSeconds / 86400);
    const h = Math.floor((totalSeconds % 86400) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m ${String(s).padStart(2, '0')}s`;
    return `${m}m ${String(s).padStart(2, '0')}s`;
  };

  const countdownClass = useMemo(() => {
    if (isLocked || minutesUntilMatch <= 0) return '';
    if (prediction) return 'text-muted-foreground/40';
    if (minutesUntilMatch > 1440) return 'text-muted-foreground/40';
    if (minutesUntilMatch > 360)  return 'text-muted-foreground/60';
    if (minutesUntilMatch > 180)  return 'text-amber-400/70';
    return 'text-rose-400/90';
  }, [minutesUntilMatch, isLocked, prediction]);


  const dismissDot = (key: string, setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    localStorage.setItem(key, '1');
    setter(true);
    window.dispatchEvent(new Event('polla_dot_dismissed'));
  };

  // Confeti de celebración al guardar: colores de la selección ganadora (o de
  // ambas si es empate sin elección). Import dinámico — no pesa hasta usarse.
  const fireConfetti = async (team?: string | null) => {
    try {
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
      const confetti = (await import('canvas-confetti')).default;
      const colors = team
        ? teamColors(team)
        : [...teamColors(match.equipo_a), ...teamColors(match.equipo_b)];
      const base = { spread: 78, ticks: 240, scalar: 0.95, colors, zIndex: 400, useWorker: false, disableForReducedMotion: true };
      confetti({ ...base, particleCount: 110, origin: { x: 0.5, y: 0.7 }, startVelocity: 45 });
      confetti({ ...base, particleCount: 60, angle: 60, origin: { x: 0.08, y: 0.85 } });
      confetti({ ...base, particleCount: 60, angle: 120, origin: { x: 0.92, y: 0.85 } });
    } catch { /* silent */ }
  };

  const doSave = async (celebrationTeam?: string | null) => {
    if (!onSavePrediction) return;
    setIsSaving(true);
    try {
      await onSavePrediction(match.id, golesA, golesB);
      setIsSaved(true);
      setHasSavedSession(true);
      fireConfetti(celebrationTeam);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (error) {
      console.error('Error saving prediction:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    if (!onSavePrediction || isLocked) return;
    // Empate + modo pregunta: primero elige al campeón (solo celebración).
    if (askWinnerOnDraw && golesA === golesB) {
      setAskWinner(true);
      return;
    }
    doSave(golesA > golesB ? match.equipo_a : golesB > golesA ? match.equipo_b : null);
  };

  const hasChanges = () => {
    if (!prediction) return true;
    return golesA !== prediction.goles_a || golesB !== prediction.goles_b;
  };

  const [hasSavedSession, setHasSavedSession] = useState(false);
  const canSave = !isLocked && (!hasSavedSession || hasChanges()) && !isSaving;

  const increment = (team: 'a' | 'b') => {
    if (isLocked) return;
    setTouched(true);
    if (team === 'a') setGolesA(prev => Math.min(prev + 1, 99));
    else setGolesB(prev => Math.min(prev + 1, 99));
  };

  const decrement = (team: 'a' | 'b') => {
    if (isLocked) return;
    setTouched(true);
    if (team === 'a') setGolesA(prev => Math.max(prev - 1, 0));
    else setGolesB(prev => Math.max(prev - 1, 0));
  };

  const canShowModal = !!(leagueId && accessToken);

  // Abre la búsqueda del partido: en móvil intenta la app de TikTok (esquema
  // snssdk1233://); si no abre (sin app) o estamos en web, cae a búsqueda de Google.
  const openTikTok = (e: React.MouseEvent) => {
    e.stopPropagation();
    const query = `${match.equipo_a} vs ${match.equipo_b}`;
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
    if (!isMobile) { window.open(googleUrl, '_blank', 'noopener'); return; }
    const scheme = `snssdk1233://search?keyword=${encodeURIComponent(query)}`;
    let leftPage = false;
    const onHide = () => { leftPage = true; };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onHide);
    window.location.href = scheme;
    // Si la app no abrió (seguimos en la página tras 1.2s), vamos a Google.
    setTimeout(() => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onHide);
      if (!leftPage && document.visibilityState === 'visible') {
        window.location.href = googleUrl;
      }
    }, 1200);
  };

  // Abre la búsqueda del resumen en YouTube. Igual en móvil y web: el enlace https
  // abre la app de YouTube en el celular y el sitio en desktop.
  const openYouTube = (e: React.MouseEvent) => {
    e.stopPropagation();
    const query = `${match.equipo_a} vs ${match.equipo_b} resumen`;
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    window.open(url, '_blank', 'noopener');
  };

  // ── Banderas de fondo con corte reactivo al marcador ──────────────────────
  const flagAUrl = flagUrlFor(match.equipo_a);
  const flagBUrl = flagUrlFor(match.equipo_b);

  const predDiff = golesA - golesB;             // >0 gana A (izq), <0 gana B (der)
  // Tres estados por lado: empate = medio (50). Ganar por 1–2 goles = invade
  // 3/4 (75/25). Ganar por 3+ = toma la card completa (106/-6 empuja el corte
  // fuera de la card).
  const winnerMid = (d: number) =>
    d === 0 ? 50 : d > 0 ? (d >= 3 ? 106 : 75) : (d <= -3 ? -6 : 25);

  // En una eliminatoria ya jugada, "el que clasificó" = el equipo de esta llave
  // que aparece en una ronda posterior (el bracket avanza al ganador).
  const knockoutQualifier = (): string | null => {
    if (match.id < 73 || !allMatches) return null;
    for (const m of allMatches) {
      if (m.id <= match.id || m.id < 73) continue;
      // El 3er lugar (103) es la llave de PERDEDORES de semis: aparecer ahí
      // significa que NO clasificaste — no cuenta como avance.
      if (m.id === 103) continue;
      if (m.equipo_a === match.equipo_a || m.equipo_b === match.equipo_a) return match.equipo_a;
      if (m.equipo_a === match.equipo_b || m.equipo_b === match.equipo_b) return match.equipo_b;
    }
    return null;
  };

  let vsMid = 50;
  if (match.estado === 'finalizado') {
    // Congelado en el resultado real.
    const rDiff = (match.goles_a ?? 0) - (match.goles_b ?? 0);
    if (rDiff !== 0) vsMid = winnerMid(rDiff);
    else if (match.id >= 73) {
      // Empate al 90' en eliminatoria → manda quién clasificó.
      const q = knockoutQualifier();
      vsMid = q === match.equipo_a ? 75 : q === match.equipo_b ? 25 : 50;
    }
    // Empate real en fase de grupos → queda al medio.
  } else if (touched || prediction) {
    // Refleja el marcador que estás pronosticando.
    vsMid = winnerMid(predDiff);
  }

  const translateMask = (vsMid - 50) / 3;

  return (
    <div className="match-cv relative w-full">
      <div className={`relative isolate bg-card rounded-xl shadow-mundial border border-border overflow-hidden transition-all duration-300 hover:shadow-mundial-lg max-w-full ${premium ? 'mc-gala' : ''}`}>
        {!premium && (
          <div
            className={`vs-bg ${match.estado === 'finalizado' ? 'vs-finished' : ''}`}
            aria-hidden="true"
          >
            {flagAUrl && (
              <div 
                className="vs-bg-flag" 
                style={{ 
                  backgroundImage: `url("${flagAUrl}")`,
                  filter: match.estado === 'finalizado' ? 'blur(10px) saturate(1.08)' : 'none',
                  transform: `scale(${match.estado === 'finalizado' ? 1.16 : 1}) translateZ(0)`,
                }} 
              />
            )}
            
            {flagBUrl && (
              <div
                style={{
                  position: 'absolute',
                  inset: '0 -100%',
                  WebkitMaskImage: 'linear-gradient(104deg, transparent calc(50% - 1.5px), #000 calc(50% + 1.5px))',
                  maskImage: 'linear-gradient(104deg, transparent calc(50% - 1.5px), #000 calc(50% + 1.5px))',
                  transform: `translateX(${translateMask}%) translateZ(0)`,
                  transition: 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
                  willChange: 'transform'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0, bottom: 0, left: '33.333333%', width: '33.333333%',
                    transform: `translateX(${-(translateMask * 3)}%) scale(${match.estado === 'finalizado' ? 1.16 : 1}) translateZ(0)`,
                    transition: 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
                    willChange: 'transform',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundImage: `url("${flagBUrl}")`,
                    filter: match.estado === 'finalizado' ? 'blur(10px) saturate(1.08)' : 'none',
                  }}
                />
              </div>
            )}
            
            <div className="vs-bg-veil" />
            
            {match.estado !== 'finalizado' && (
              <div
                className="vs-seam-layer"
                style={{
                  position: 'absolute',
                  inset: '0 -100%',
                  background: 'linear-gradient(104deg, transparent calc(50% - 1.5px), #fff 50%, transparent calc(50% + 1.5px))',
                  transform: `translateX(${translateMask}%) translateZ(0)`,
                  transition: 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
                  willChange: 'transform'
                }}
              />
            )}
          </div>
        )}

        <div className="relative z-10">
        {/* Header */}
        <div className="px-3 sm:px-5 py-2 sm:py-3 border-b border-border/50 bg-background/80">
          <div className="flex items-center justify-between flex-wrap gap-1 sm:gap-2">
            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm flex-1 min-w-0">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
              <span className="font-bold text-foreground flex-shrink-0">{formattedTime}</span>
              <span className="text-muted-foreground">•</span>
              <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground text-xs truncate">{match.estadio}</span>
              {match.estado === 'pendiente' && !isLocked && secondsUntilMatch > 0 && (
                <>
                  <span className="text-muted-foreground/40 flex-shrink-0">•</span>
                  <span className={`text-[10px] font-semibold tabular-nums flex-shrink-0 transition-colors duration-1000 ${countdownClass}`}>
                    {formatCountdown(secondsUntilMatch)}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Pill EN VIVO — basado en tiempo, desaparece al finalizar */}
              {isLive && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400">
                  <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-wider">En vivo</span>
                </div>
              )}
              {/* Botón stats anónimas — siempre visible */}
              {canShowModal && (
                <div className="relative">
                  <button
                    onClick={() => { dismissDot('polla_seen_stats', setSeenStats); setModalMode('summary'); }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors text-[10px] font-bold"
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    Stats
                  </button>
                  {!seenStats && (
                    <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-rose-500 animate-pulse pointer-events-none" />
                  )}
                </div>
              )}
              {/* Fase de grupos: botón a la tabla del grupo.
                  Eliminatorias (id ≥ 73): chip estático con la fase, sin "GRUPO". */}
              {match.id >= 73 ? (
                <div className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold bg-muted text-foreground flex items-center gap-1.5 border border-border">
                  <Trophy className="w-3 h-3 text-primary" />
                  <span>{match.grupo}</span>
                </div>
              ) : (
                <div className="relative" ref={groupBtnRef} id={`group-btn-${match.id}`}>
                  <button
                    onMouseEnter={showGroup}
                    onMouseLeave={hideGroup}
                    onClick={() => { dismissDot('polla_seen_grupo', setSeenGrupo); onViewGroup?.(match.grupo); }}
                    className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold bg-muted hover:bg-primary hover:text-white text-foreground transition-all flex items-center gap-1.5 border border-border hover:border-primary group"
                    title={`Ver tabla y partidos del Grupo ${match.grupo}`}
                  >
                    <Table2 className="w-3 h-3 text-primary group-hover:text-white transition-colors" />
                    <span>GRUPO {match.grupo}</span>
                    <ChevronRight className="w-3 h-3 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </button>
                  {!seenGrupo && (
                    <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-rose-500 animate-pulse pointer-events-none" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Match Body */}
        <div className="relative px-3 sm:px-5 py-4 sm:py-6">
          {/* Botón TikTok — busca el partido en la app (móvil) o Google (web).
              Absolute para no desplazar banderas/marcador. */}
          {/* El borde es el gradiente animado (.tiktok-beam) y el span interior negro
              cubre el centro, dejando ver solo una franja luminosa que recorre el
              contorno. El glitch del logo se sincroniza con esa franja. */}
          <button
            onClick={openTikTok}
            title={`Ver ${match.equipo_a} vs ${match.equipo_b} en TikTok`}
            aria-label={`Ver ${match.equipo_a} vs ${match.equipo_b} en TikTok`}
            className="tiktok-beam group absolute top-2 right-3 sm:top-3 sm:right-5 z-10 rounded-full p-[1.5px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_14px_-3px_rgba(37,244,238,0.75)]"
          >
            <span className="flex items-center gap-1.5 rounded-full bg-black px-2.5 py-1 text-white">
              {/* Logo TikTok con glitch en loop: capas cian y rosa desfasadas bajo la blanca */}
              <span className="relative inline-block w-3.5 h-3.5 flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="#25F4EE" aria-hidden="true"
                  className="tiktok-glitch-cyan absolute inset-0 w-full h-full">
                  <path d={TIKTOK_PATH} />
                </svg>
                <svg viewBox="0 0 24 24" fill="#FE2C55" aria-hidden="true"
                  className="tiktok-glitch-pink absolute inset-0 w-full h-full">
                  <path d={TIKTOK_PATH} />
                </svg>
                <svg viewBox="0 0 24 24" fill="#ffffff" aria-hidden="true"
                  className="absolute inset-0 w-full h-full">
                  <path d={TIKTOK_PATH} />
                </svg>
              </span>
              <span className="text-[10px] font-bold">Ver más</span>
            </span>
          </button>
          {/* Botón YouTube — busca el resumen del partido. Aparece un tiempo DESPUÉS de
              finalizar (el resumen no se publica al instante; ver getResumenShowAt).
              Espejo del botón TikTok (izquierda). Mismo comportamiento móvil/web. */}
          {showResumen && (
            <button
              onClick={openYouTube}
              title={`Ver resumen de ${match.equipo_a} vs ${match.equipo_b} en YouTube`}
              aria-label={`Ver resumen de ${match.equipo_a} vs ${match.equipo_b} en YouTube`}
              className="youtube-beam group absolute top-2 left-3 sm:top-3 sm:left-5 z-10 rounded-full p-[1.5px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_14px_-3px_rgba(255,0,0,0.75)]"
            >
              <span className="flex items-center gap-1.5 rounded-full bg-black px-2.5 py-1 text-white">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="w-4 h-4 flex-shrink-0">
                  <path fill="#FF0000" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.1 31.1 0 0 0 0 12a31.1 31.1 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.1 31.1 0 0 0 24 12a31.1 31.1 0 0 0-.5-5.8z"/>
                  <path fill="#ffffff" d="M9.5 15.5v-7l6.3 3.5-6.3 3.5z"/>
                </svg>
                <span className="text-[10px] font-bold">Resumen</span>
              </span>
            </button>
          )}
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Team A */}
            <div className="flex flex-col items-center flex-1 min-w-0 relative" id={`team-a-${match.id}`}>
              <button
                onMouseEnter={showTeamA}
                onMouseLeave={hideTeamA}
                onClick={() => onViewTeam?.(match.equipo_a, match.grupo)}
                className="flex flex-col items-center w-full cursor-pointer group relative p-2 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <CountryFlag country={match.equipo_a} size="md" className="mb-1 sm:mb-2 transition-transform group-hover:scale-110" />
                <span className="text-xs font-bold text-foreground group-hover:text-primary text-center leading-tight truncate w-full px-1 transition-colors">
                  {match.equipo_a}
                </span>
              </button>
            </div>

            {/* Score Controls */}
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex flex-col items-center gap-1 sm:gap-2">
                <button onClick={() => increment('a')} disabled={isLocked}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 shadow-sm bg-primary text-primary-foreground">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center font-score text-3xl sm:text-4xl font-bold shadow-sm bg-background border-2 border-border text-foreground">
                  {golesA}
                </div>
                <button onClick={() => decrement('a')} disabled={isLocked || golesA === 0}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 shadow-sm bg-destructive text-destructive-foreground">
                  <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              <span className="text-xl sm:text-2xl font-bold text-muted-foreground">-</span>

              <div className="flex flex-col items-center gap-1 sm:gap-2">
                <button onClick={() => increment('b')} disabled={isLocked}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 shadow-sm bg-primary text-primary-foreground">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center font-score text-3xl sm:text-4xl font-bold shadow-sm bg-background border-2 border-border text-foreground">
                  {golesB}
                </div>
                <button onClick={() => decrement('b')} disabled={isLocked || golesB === 0}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 shadow-sm bg-destructive text-destructive-foreground">
                  <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* Team B */}
            <div className="flex flex-col items-center flex-1 min-w-0 relative" id={`team-b-${match.id}`}>
              <button
                onMouseEnter={showTeamB}
                onMouseLeave={hideTeamB}
                onClick={() => onViewTeam?.(match.equipo_b, match.grupo)}
                className="flex flex-col items-center w-full cursor-pointer group relative p-2 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <CountryFlag country={match.equipo_b} size="md" className="mb-1 sm:mb-2 transition-transform group-hover:scale-110" />
                <span className="text-xs font-bold text-foreground group-hover:text-primary text-center leading-tight truncate w-full px-1 transition-colors">
                  {match.equipo_b}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer: Guardar pronóstico */}
        {!isLocked && (
          <div className="px-3 sm:px-5 pb-3 sm:pb-5">
            <button
              onClick={handleSave}
              disabled={!canSave}
              className={`w-full py-2 sm:py-3 px-4 sm:px-6 rounded-lg font-bold text-xs sm:text-sm transition-all duration-300 shadow-sm ${
                isSaved
                  ? 'bg-green-500 text-white shadow-green-500/25'
                  : canSave
                  ? 'bg-primary text-primary-foreground hover:opacity-90 hover:-translate-y-0.5'
                  : prediction && prediction.goles_a === golesA && prediction.goles_b === golesB
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-default'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  Guardando...
                </span>
              ) : isSaved ? (
                <span className="flex items-center justify-center gap-2">
                  <Check className="w-5 h-5" />
                  ¡Guardado!
                </span>
              ) : !canSave && prediction && prediction.goles_a === golesA && prediction.goles_b === golesB ? (
                <span className="flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />
                  Pronóstico Guardado
                </span>
              ) : (
                'Guardar Pronóstico'
              )}
            </button>
          </div>
        )}

        {/* Resultado — aparece siempre que el partido esté en_curso o finalizado,
            incluso si los goles son null (muestra 0-0 conectando al inicio del partido) */}
        {(match.estado === 'finalizado' || match.estado === 'en_curso' || isLive) && (
          <div className="px-3 sm:px-5 pb-3 sm:pb-5 space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-foreground/5 border border-border">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  {match.goles_a === null && (match.estado === 'en_curso' || isLive)
                    ? 'En vivo'
                    : getPhaseLabel(match.api_status, computeLiveMinute(match.fecha_hora, match.api_status, match.segundo_tiempo_inicio), isLive, match.estado)}
                </span>
                <span className="font-score text-xl font-bold text-foreground">
                  {match.goles_a !== null && match.goles_b !== null
                    ? `${match.goles_a} – ${match.goles_b}`
                    : <span className="text-sm text-muted-foreground animate-pulse">0 – 0</span>
                  }
                </span>
              </div>
              {prediction && (
                <div className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-primary/5 border border-primary/20">
                  <span className="text-xs font-bold text-primary uppercase tracking-wide">Tu pronóstico</span>
                  <span className="font-score text-xl font-bold text-primary">
                    {prediction.goles_a} – {prediction.goles_b}
                  </span>
                </div>
              )}
            </div>

            {(prediction?.puntos_obtenidos !== undefined || canShowModal) && (
              <div className="flex gap-2 items-stretch min-h-[88px]">
                {/* Points box — takes remaining width */}
                {prediction?.puntos_obtenidos !== undefined && (
                  <div className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all shadow-sm ${
                    prediction.puntos_obtenidos === 5
                      ? 'bg-accent/10 border-accent/40 text-accent'
                      : prediction.puntos_obtenidos > 0
                      ? 'bg-secondary/10 border-secondary/40 text-secondary'
                      : 'bg-muted/50 border-border text-muted-foreground'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      <span className="font-score text-2xl font-bold">+{prediction.puntos_obtenidos} Pts</span>
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-center mt-0.5">
                      {prediction.puntos_obtenidos === 5
                        ? 'Marcador exacto'
                        : prediction.puntos_obtenidos === 2
                        ? 'Resultado ganador / Empate'
                        : 'Ningún acierto'}
                    </span>
                    {match.estado !== 'finalizado' && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-rose-500 mt-1">Provisional · por ahora</span>
                    )}
                  </div>
                )}

                {/* Results button box — ~20% width when alongside points, full when alone */}
                {canShowModal && (
                  <div className={`relative ${prediction?.puntos_obtenidos !== undefined ? 'w-1/5 flex-shrink-0' : 'flex-1'}`}>
                    <button
                      onClick={() => { dismissDot('polla_seen_ver_todos', setSeenVerTodos); setModalMode('winners'); }}
                      className={`w-full h-full flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors ${
                        prediction?.puntos_obtenidos !== undefined ? '' : 'py-3'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span className="text-[9px] font-bold">Resultados</span>
                    </button>
                    {!seenVerTodos && (
                      <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-rose-500 animate-pulse pointer-events-none" />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Partido bloqueado — solo cuando no está en_curso/finalizado (en esos ya se muestra resultado) */}
        {isLocked && match.estado !== 'finalizado' && match.estado !== 'en_curso' && !isLive && (
          <div className="px-3 sm:px-5 pb-3 sm:pb-5">
            <div className={`flex items-center gap-2 rounded-lg border-2 border-destructive/40 overflow-hidden ${canShowModal ? '' : ''}`}>
              <div className="flex items-center justify-center gap-2 py-2 sm:py-3 px-3 sm:px-4 flex-1 bg-destructive/5 text-destructive">
                <Lock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-bold">Pronóstico cerrado</span>
              </div>
              {canShowModal && (
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => { dismissDot('polla_seen_ver_todos', setSeenVerTodos); setModalMode('full'); }}
                    className="flex items-center justify-center gap-1.5 py-2 sm:py-3 px-3 sm:px-4 bg-primary/10 hover:bg-primary/20 text-primary transition-colors border-l border-destructive/40"
                    title="Ver todos los pronósticos"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold hidden sm:inline">Ver todos</span>
                  </button>
                  {!seenVerTodos && (
                    <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-rose-500 animate-pulse pointer-events-none" />
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Hover Cards */}
      {showGroupHover && groupBtnRef.current && createPortal(
        <div
          className="fixed z-[9999] pointer-events-auto"
          style={{
            top: groupBtnRef.current.getBoundingClientRect().bottom + 4,
            right: window.innerWidth - groupBtnRef.current.getBoundingClientRect().right,
          }}
          onMouseEnter={showGroup}
          onMouseLeave={hideGroup}
        >
          <GroupHoverCard grupo={match.grupo} allMatches={allMatches} />
        </div>,
        document.body
      )}
      {showTeamAHover && (
        <div className="absolute top-32 left-0 sm:left-8 z-[100] hidden sm:block pointer-events-auto"
          onMouseEnter={showTeamA} onMouseLeave={hideTeamA}
          style={{ animation: 'fadeIn 0.2s ease-out, zoomIn 0.2s ease-out' }}>
          <TeamHoverCard team={match.equipo_a} recentMatches={getTeamRecent(match.equipo_a)} />
        </div>
      )}
      {showTeamBHover && (
        <div className="absolute top-32 right-0 sm:right-8 z-[100] hidden sm:block pointer-events-auto"
          onMouseEnter={showTeamB} onMouseLeave={hideTeamB}
          style={{ animation: 'fadeIn 0.2s ease-out, zoomIn 0.2s ease-out' }}>
          <TeamHoverCard team={match.equipo_b} recentMatches={getTeamRecent(match.equipo_b)} />
        </div>
      )}

      {/* Popup empate: elige al campeón para la celebración (el pronóstico se
          guarda igual con el marcador empatado) */}
      {askWinner && createPortal(
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6" onClick={() => setAskWinner(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="ms-rise relative w-full max-w-sm rounded-3xl border border-white/15 bg-[#12102A]/95 p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/60 mb-1">
              Empataste {golesA}–{golesB}
            </p>
            <p className="text-xl font-black text-white mb-5">¿Y quién levanta la copa?</p>
            <div className="grid grid-cols-2 gap-3">
              {[match.equipo_a, match.equipo_b].map(team => (
                <button
                  key={team}
                  onClick={() => { setAskWinner(false); onDrawWinner?.(team); doSave(team); }}
                  className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-white/8 border border-white/15 hover:bg-white/15 transition-colors"
                >
                  <CountryFlag country={team} size="lg" />
                  <span className="text-sm font-black text-white">{team}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] font-bold text-white/40 mt-4">
              Tu pronóstico se guarda {golesA}–{golesB} · esto es solo para la celebración
            </p>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de predicciones */}
      {modalMode && canShowModal && (
        <MatchPredictionsModal
          match={match}
          leagueId={leagueId!}
          accessToken={accessToken!}
          currentUserId={currentUserId}
          mode={modalMode}
          onClose={() => setModalMode(null)}
        />
      )}
    </div>
  );
}
