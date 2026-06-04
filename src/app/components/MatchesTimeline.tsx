import { useRef, useEffect } from 'react';
import { format, startOfDay, isSameDay, isToday, isFuture } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from 'lucide-react';
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
  estado?: 'pendiente' | 'en_juego' | 'finalizado';
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
}

export function MatchesTimeline({ matches, predictions, onSavePrediction, onViewGroup, onViewTeam }: MatchesTimelineProps) {
  const todayRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll a la fecha actual o próxima
  useEffect(() => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

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

  // Encontrar la primera fecha actual o futura
  const currentDateIndex = sortedDates.findIndex(dateString => {
    const date = new Date(`${dateString}T12:00:00`);
    return isToday(date) || isFuture(date);
  });

  return (
    <div className="space-y-8">
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
                .map(match => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    prediction={predictions[match.id]}
                    onSavePrediction={onSavePrediction}
                    onViewGroup={onViewGroup}
                    onViewTeam={onViewTeam}
                  />
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
