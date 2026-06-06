import { useState, useMemo } from 'react';
import { GroupTable } from './GroupTable';
import { List, Grid3x3, Calendar } from 'lucide-react';
import { MatchCard } from './MatchCard';

interface GroupStandingsProps {
  selectedGroup?: string;
  highlightTeam?: string;
  matches?: any[];
  predictions?: Record<number, any>;
  onSavePrediction?: (matchId: number, golesA: number, golesB: number) => Promise<void>;
  onViewGroup?: (grupo: string) => void;
}

export function GroupStandings({ 
  selectedGroup, 
  highlightTeam,
  matches = [],
  predictions = {},
  onSavePrediction,
  onViewGroup
}: GroupStandingsProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const dynamicStandings = useMemo(() => {
    const gruposMap: Record<string, Record<string, any>> = {};

    matches.forEach(m => {
      // Solo considerar grupos de la primera fase (A-L)
      if (!/^[A-L]$/.test(m.grupo)) return;

      if (!gruposMap[m.grupo]) gruposMap[m.grupo] = {};
      if (!gruposMap[m.grupo][m.equipo_a]) {
        gruposMap[m.grupo][m.equipo_a] = { equipo: m.equipo_a, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dif: 0, pts: 0 };
      }
      if (!gruposMap[m.grupo][m.equipo_b]) {
        gruposMap[m.grupo][m.equipo_b] = { equipo: m.equipo_b, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dif: 0, pts: 0 };
      }

      if (m.estado === 'finalizado' && m.goles_a !== null && m.goles_b !== null) {
        const tA = gruposMap[m.grupo][m.equipo_a];
        const tB = gruposMap[m.grupo][m.equipo_b];
        const ga = m.goles_a;
        const gb = m.goles_b;

        tA.pj++; tB.pj++;
        tA.gf += ga; tA.gc += gb; tA.dif = tA.gf - tA.gc;
        tB.gf += gb; tB.gc += ga; tB.dif = tB.gf - tB.gc;

        if (ga > gb) { tA.pg++; tA.pts += 3; tB.pp++; }
        else if (gb > ga) { tB.pg++; tB.pts += 3; tA.pp++; }
        else { tA.pe++; tB.pe++; tA.pts += 1; tB.pts += 1; }
      }
    });

    return Object.keys(gruposMap).sort().map(grupo => {
      const equipos = Object.values(gruposMap[grupo]).sort((a: any, b: any) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.dif !== a.dif) return b.dif - a.dif;
        return b.gf - a.gf;
      });
      return { grupo, equipos };
    });
  }, [matches]);

  // Si hay un grupo seleccionado, mostrar solo ese grupo
  const groupsToShow = selectedGroup
    ? dynamicStandings.filter(g => g.grupo === selectedGroup)
    : dynamicStandings;

  const groupMatches = selectedGroup 
    ? matches.filter(m => m.grupo === selectedGroup)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient-mundial mb-1">
            {selectedGroup ? `Grupo ${selectedGroup}` : 'Tabla de Posiciones'}
          </h2>
          <p className="text-sm text-muted-foreground font-medium">
            Fase de Grupos - Mundial 2026
          </p>
        </div>

        {/* View Mode Toggle */}
        {!selectedGroup && (
          <div className="hidden sm:flex items-center gap-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 rounded-md transition-all flex items-center gap-2 ${
                viewMode === 'grid'
                  ? 'bg-card shadow-sm text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
              <span className="text-xs font-bold">Cuadrícula</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-md transition-all flex items-center gap-2 ${
                viewMode === 'list'
                  ? 'bg-card shadow-sm text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="text-xs font-bold">Lista</span>
            </button>
          </div>
        )}
      </div>

      {/* Groups Grid/List */}
      <div
        className={
          viewMode === 'grid' && !selectedGroup
            ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6'
            : 'space-y-6 max-w-4xl mx-auto'
        }
      >
        {groupsToShow.map((group) => (
          <GroupTable
            key={group.grupo}
            grupo={group.grupo}
            equipos={group.equipos}
            highlightTeam={highlightTeam}
            compact={viewMode === 'grid' && !selectedGroup}
            onViewGroup={!selectedGroup ? onViewGroup : undefined}
          />
        ))}
      </div>

      {/* Group Matches section (only when a specific group is selected) */}
      {selectedGroup && groupMatches.length > 0 && (
        <div className="max-w-4xl mx-auto mt-10">
          <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
            <Calendar className="w-6 h-6 text-primary" />
            <h3 className="text-xl sm:text-2xl font-bold text-foreground">
              Partidos del Grupo {selectedGroup}
            </h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {groupMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                prediction={predictions[match.id]}
                onSavePrediction={onSavePrediction!}
              />
            ))}
          </div>
        </div>
      )}

      {/* Best Third Places */}
      {!selectedGroup && (
        <div className="max-w-4xl mx-auto mt-8">
          <div className="bg-accent/10 rounded-xl border-2 border-accent p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-accent mb-3 flex items-center gap-2">
              Mejores Terceros Lugares
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Los 8 mejores terceros lugares de los 12 grupos clasifican a la fase de 16avos de final.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-card rounded-lg p-3 border border-accent/20">
                <div className="text-xs font-bold text-muted-foreground mb-2">Criterios de Desempate:</div>
                <ol className="text-xs space-y-1 text-foreground">
                  <li>1. Mayor cantidad de puntos</li>
                  <li>2. Mejor diferencia de goles</li>
                  <li>3. Mayor cantidad de goles a favor</li>
                  <li>4. Fair Play (menor tarjetas)</li>
                </ol>
              </div>
              <div className="bg-card rounded-lg p-3 border border-accent/20">
                <div className="text-xs font-bold text-muted-foreground mb-2">Clasificación:</div>
                <ul className="text-xs space-y-1 text-foreground">
                  <li>• 1º y 2º de cada grupo → 16avos (24 equipos)</li>
                  <li>• 8 mejores 3º lugares → 16avos (8 equipos)</li>
                  <li>• Total: 32 equipos en fase eliminatoria</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
