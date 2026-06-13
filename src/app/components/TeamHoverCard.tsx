import { CountryFlag } from './CountryFlag';

interface RecentMatch {
  equipo_a: string;
  equipo_b: string;
  goles_a: number;
  goles_b: number;
  fecha: string;
}

interface TeamHoverCardProps {
  team: string;
  recentMatches?: RecentMatch[];
}

export function TeamHoverCard({ team, recentMatches = [] }: TeamHoverCardProps) {

  if (recentMatches.length === 0) {
    return (
      <div className="bg-card rounded-lg border-2 border-border p-4 shadow-mundial-lg min-w-[250px]">
        <div className="flex items-center gap-2 mb-3">
          <CountryFlag country={team} size="md" />
          <h3 className="font-bold text-sm">{team}</h3>
        </div>
        <p className="text-xs text-muted-foreground">Sin partidos jugados</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border-2 border-primary shadow-mundial-lg min-w-[280px] max-w-[320px]">
      {/* Header */}
      <div className="bg-primary/5 px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <CountryFlag country={team} size="md" />
          <div>
            <h3 className="font-bold text-sm text-foreground">{team}</h3>
            <p className="text-xs text-muted-foreground">Últimos Partidos</p>
          </div>
        </div>
      </div>

      {/* Recent Matches */}
      <div className="p-2 space-y-2">
        {recentMatches.map((match, index) => {
          const isHome = match.equipo_a === team;
          const won = isHome
            ? match.goles_a > match.goles_b
            : match.goles_b > match.goles_a;
          const draw = match.goles_a === match.goles_b;
          const lost = !won && !draw;

          return (
            <div
              key={index}
              className={`flex items-center justify-between p-2 rounded-lg border ${
                won
                  ? 'bg-secondary/10 border-secondary/30'
                  : draw
                  ? 'bg-muted border-border'
                  : 'bg-destructive/10 border-destructive/30'
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className={`w-1 h-8 rounded-full flex-shrink-0 ${
                  won ? 'bg-secondary' : draw ? 'bg-muted-foreground' : 'bg-destructive'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold truncate">
                      {match.equipo_a}
                    </span>
                    <span className="font-score text-sm font-bold flex-shrink-0">
                      {match.goles_a}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold truncate">
                      {match.equipo_b}
                    </span>
                    <span className="font-score text-sm font-bold flex-shrink-0">
                      {match.goles_b}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                {match.fecha}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
