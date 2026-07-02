import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { format, startOfDay, isSameDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Trophy, ArrowDown } from 'lucide-react';
import { MatchCard } from './MatchCard';

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
}

interface Prediction {
  goles_a: number;
  goles_b: number;
  puntos_obtenidos?: number;
}

interface MatchesTimelineProps {
  matches: Match[];
  predictions: Record<number, Prediction>;
  onSavePrediction: (matchId: number, golesA: number, golesB: number) => Promise<void>;
  onViewGroup?: (grupo: string) => void;
  onViewTeam?: (team: string, grupo: string) => void;
  leagueId?: string;
  accessToken?: string;
  currentUserId?: string;
  predictionsLoaded?: boolean;
}

export function MatchesTimeline({ matches, predictions, onSavePrediction, onViewGroup, onViewTeam, leagueId, accessToken, currentUserId, predictionsLoaded }: MatchesTimelineProps) {
  const todayRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);

  // Re-render periódico para refrescar la detección de "en vivo"/"hoy" (cambios por
  // tiempo, sin depender solo del polling del padre).
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  // Si el destino (hoy o el vivo) ya está en pantalla, ocultamos el botón: solo sirve
  // cuando estás lejos de él.
  const [targetInView, setTargetInView] = useState(false);

  // Agrupar partidos por fecha
  const groupedMatches = matches.reduce((acc, match) => {
    const dateKey = format(startOfDay(new Date(match.fecha_hora)), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  // Ordenar fechas
  const sortedDates = Object.keys(groupedMatches).sort();

  // Auto-scroll a la fecha actual o próxima — espera a que las predicciones estén
  // cargadas para que el layout sea estable antes de calcular la posición de scroll.
  const hasScrolled = useRef(false);
  useEffect(() => {
    if (!predictionsLoaded || hasScrolled.current) return;
    if (!todayRef.current) return;
    // Esperar al paint: en F5 los partidos suelen montarse DESPUÉS de que
    // predictionsLoaded se vuelve true, así que dependemos también de matches.length
    // y hacemos el scroll en el siguiente frame (cuando el grupo de hoy ya existe y
    // está medido). Antes el efecto corría con todayRef todavía null y no reintentaba.
    const raf = requestAnimationFrame(() => {
      if (todayRef.current) {
        todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        hasScrolled.current = true;
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [predictionsLoaded, matches.length]);

  const getDateLabel = (dateString: string) => {
    // Apend T12:00:00 to force local time interpretation and prevent UTC midnight backwards shifting
    const date = new Date(`${dateString}T12:00:00`);
    if (isToday(date)) {
      return 'Hoy';
    }
    return format(date, "EEEE d 'de' MMMM", { locale: es });
  };

  const getDateColor = (dateString: string) => {
    const date = new Date(`${dateString}T12:00:00`);
    const matchesOnDate = groupedMatches[dateString];
    const allPast = matchesOnDate.every(m => m.estado === 'finalizado');

    if (isToday(date)) {
      return {
        bg: 'var(--primary)',
        text: 'var(--primary-foreground)',
        border: 'var(--primary)'
      };
    }

    if (allPast) {
      return {
        bg: 'var(--muted)',
        text: 'var(--muted-foreground)',
        border: 'var(--border)'
      };
    }

    return {
      bg: 'var(--secondary)',
      text: 'var(--secondary-foreground)',
      border: 'var(--secondary)'
    };
  };

  // Encontrar la primera fecha actual o futura comparando strings ISO directamente
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const currentDateIndex = sortedDates.findIndex(ds => ds >= todayStr);

  // Primer partido en vivo (en_curso, o dentro de la ventana de 120' desde el kickoff).
  const nowMs = Date.now();
  const liveMatch = [...matches]
    .sort((a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime())
    .find(m => {
      if (m.estado === 'en_curso') return true;
      if (m.estado === 'finalizado') return false;
      const k = new Date(m.fecha_hora).getTime();
      return nowMs >= k && nowMs < k + 120 * 60 * 1000;
    });
  const liveMatchId = liveMatch?.id ?? null;

  // Observa el destino (vivo o el grupo de hoy) y marca si está a la vista. Se re-crea
  // cuando cambia el destino o cuando cargan los partidos.
  useEffect(() => {
    const el = liveMatchId != null ? liveRef.current : todayRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setTargetInView(false);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => setTargetInView(entry.isIntersecting),
      { rootMargin: '-20% 0px -20% 0px', threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [liveMatchId, matches.length, predictionsLoaded]);

  // Botón flotante contextual: si hay vivo va al vivo, si no al día de hoy. Se oculta
  // cuando el destino ya está en pantalla (no tiene sentido saltar a donde ya estás).
  const showJumpButton = (liveMatchId != null || currentDateIndex !== -1) && !targetInView;
  const jumpToNow = () => {
    const target = liveMatchId != null ? liveRef.current : todayRef.current;
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-8">
      {/* Sistema de Puntuación */}
      <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 rounded-xl p-4 sm:p-5 border-2 border-border shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex-1 text-center md:text-left">
          <h3 className="font-bold text-foreground flex items-center justify-center md:justify-start gap-2 mb-1.5 text-lg">
            <Trophy className="w-5 h-5 text-accent" />
            Sistema de Puntuación Oficial
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Suma puntos automáticamente cuando finalicen los partidos.
            <br />
            <span className="inline-block mt-1.5 px-2 py-0.5 bg-background rounded border border-border text-xs font-bold text-foreground">
              Tus pronósticos se bloquean 1 minuto antes de cada partido
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
          <div className="flex flex-col items-center p-2 rounded-lg bg-card border-2 border-accent/40 shadow-sm min-w-[100px] hover:scale-105 transition-transform">
            <span className="font-score text-2xl font-bold text-accent">+5</span>
            <span className="text-[10px] font-bold uppercase text-muted-foreground text-center">Marcador<br/>Exacto</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-lg bg-card border-2 border-secondary/40 shadow-sm min-w-[100px] hover:scale-105 transition-transform">
            <span className="font-score text-2xl font-bold text-secondary">+2</span>
            <span className="text-[10px] font-bold uppercase text-muted-foreground text-center">Acierto al Ganador<br/>O Empate</span>
          </div>
        </div>
      </div>

      {sortedDates.map((dateString, index) => {
        const dateMatches = groupedMatches[dateString];
        const colors = getDateColor(dateString);
        const isCurrentOrNext = index === currentDateIndex;

        return (
          <div
            key={dateString}
            ref={isCurrentOrNext ? todayRef : null}
            className="scroll-mt-24"
          >
            {/* Date Header */}
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl shadow-sm border-2"
                style={{
                  background: colors.bg,
                  color: colors.text,
                  borderColor: colors.border
                }}
              >
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="font-bold text-xs sm:text-sm capitalize">
                  {getDateLabel(dateString)}
                </span>
                <span className="text-xs opacity-75 hidden sm:inline">
                  ({dateMatches.length} {dateMatches.length === 1 ? 'partido' : 'partidos'})
                </span>
              </div>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Matches Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {dateMatches
                .sort((a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime())
                .map(match => {
                  const card = (
                    <MatchCard
                      match={match}
                      prediction={predictions[match.id]}
                      onSavePrediction={onSavePrediction}
                      onViewGroup={onViewGroup}
                      onViewTeam={onViewTeam}
                      leagueId={leagueId}
                      accessToken={accessToken}
                      currentUserId={currentUserId}
                      allMatches={matches}
                    />
                  );
                  // El partido en vivo lleva un wrapper con ref (destino del botón flotante).
                  return match.id === liveMatchId ? (
                    <div key={match.id} ref={liveRef} className="scroll-mt-24">{card}</div>
                  ) : (
                    <div key={match.id}>{card}</div>
                  );
                })}
            </div>
          </div>
        );
      })}

      {/* Botón flotante contextual: salta al partido en vivo, o al día de hoy si no hay.
          Va por PORTAL a <body> para que `fixed` sea relativo al viewport (algún
          ancestro con blur/transform rompía el esquinado). */}
      {showJumpButton && createPortal(
        <button
          onClick={jumpToNow}
          title={liveMatchId != null ? 'Ir al partido en vivo' : 'Ir a los partidos de hoy'}
          aria-label={liveMatchId != null ? 'Ir al partido en vivo' : 'Ir a los partidos de hoy'}
          className={`jump-fab ${liveMatchId != null ? 'jump-fab-live' : 'jump-fab-today'} fixed z-40 bottom-24 right-4 md:bottom-8 md:right-8 flex items-center gap-1.5 rounded-full font-bold transition-transform hover:scale-105 active:scale-95
            px-3 py-2 text-xs
            md:px-4 md:py-2.5 md:text-sm md:gap-2`}
        >
          {liveMatchId != null ? (
            <>
              <span className="relative flex h-2 w-2 md:h-2.5 md:w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 md:h-2.5 md:w-2.5 bg-white" />
              </span>
              En vivo
            </>
          ) : (
            <>
              <ArrowDown className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="md:hidden">Hoy</span>
              <span className="hidden md:inline">Ir a Hoy</span>
            </>
          )}
        </button>,
        document.body
      )}
    </div>
  );
}
