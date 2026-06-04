import { useState, useEffect } from 'react';
import { Shield, Check, X, Users, Trophy, Calendar, GitBranch } from 'lucide-react';
import { GROUP_STAGE_MATCHES } from '../../data/groupStageMatches';
import { CountryFlag } from './CountryFlag';
import { apiFetch } from '../../lib/api';
import { BracketManager } from './BracketManager';

interface AdminPanelProps {
  league: any;
  accessToken: string;
  onClose: () => void;
  onResultUpdated?: () => void;
  onApproveUser?: (userId: string, approved: boolean) => Promise<void>;
  pendingUsers?: any[];
}

export function AdminPanel({ league, accessToken, onClose, onResultUpdated, onApproveUser, pendingUsers: externalPending }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'results' | 'approvals' | 'bracket'>('results');
  const [pendingUsers, setPendingUsers] = useState<any[]>(externalPending || []);
  const [matchResults, setMatchResults] = useState<Record<number, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [resultSaved, setResultSaved] = useState<number | null>(null);
  const [resultError, setResultError] = useState<string | null>(null);

  useEffect(() => {
    if (!externalPending) loadPendingUsers();
    loadMatchResults();
  }, []);

  useEffect(() => {
    if (externalPending) setPendingUsers(externalPending);
  }, [externalPending]);

  const loadPendingUsers = async () => {
    try {
      const response = await apiFetch(`/leagues/${league.id}/pending`, { token: accessToken });
      if (response.ok) {
        const data = await response.json();
        setPendingUsers(data.pendingUsers || []);
      }
    } catch { /* silent */ }
  };

  const loadMatchResults = async () => {
    try {
      const response = await apiFetch(`/matches/results?leagueId=${league.id}`);
      if (response.ok) {
        const data = await response.json();
        setMatchResults(data.results || {});
      }
    } catch { /* silent */ }
  };

  const handleApproveUser = async (userId: string, approved: boolean) => {
    setIsLoading(true);
    try {
      if (onApproveUser) {
        await onApproveUser(userId, approved);
        setPendingUsers(prev => prev.filter(u => u.id !== userId));
      } else {
        const response = await apiFetch(`/leagues/${league.id}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
          body: JSON.stringify({ userId, approved }),
        });
        if (response.ok) {
          setPendingUsers(prev => prev.filter(u => u.id !== userId));
        }
      }
    } catch (error) {
      console.error('Error approving user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateResult = async (matchId: number, golesA: number, golesB: number, estado: string) => {
    setIsLoading(true);
    try {
      const response = await apiFetch(`/matches/${matchId}/result`, {
        method: 'POST',
        token: accessToken,
        body: { leagueId: league.id, golesA, golesB, estado },
      });

      if (response.ok) {
        setMatchResults({
          ...matchResults,
          [matchId]: { golesA, golesB, estado }
        });
        // Notificar al App.tsx para que refresque el timeline y el leaderboard
        onResultUpdated?.();
        setResultSaved(matchId);
        setTimeout(() => setResultSaved(null), 2500);
      } else {
        const data = await response.json();
        setResultError(data.error || 'Error al actualizar resultado');
        setTimeout(() => setResultError(null), 3000);
      }
    } catch (error) {
      setResultError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b-2 border-border bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Panel de Administración</h2>
                <p className="text-sm text-muted-foreground">{league.nombre}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border bg-muted/30">
          <button
            onClick={() => setActiveTab('results')}
            className={`flex-1 px-4 py-3 font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'results'
                ? 'bg-white text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Resultados</span>
              <span className="sm:hidden">Partidos</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            className={`flex-1 px-4 py-3 font-bold text-xs sm:text-sm transition-all relative ${
              activeTab === 'approvals'
                ? 'bg-white text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <Users className="w-4 h-4" />
              Aprobaciones
              {pendingUsers.length > 0 && (
                <span className="absolute top-1 right-2 bg-destructive text-destructive-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingUsers.length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('bracket')}
            className={`flex-1 px-4 py-3 font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'bracket'
                ? 'bg-white text-accent border-b-2 border-accent'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <GitBranch className="w-4 h-4" />
              Bracket
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Feedback inline */}
          {resultSaved !== null && (
            <div className="mx-6 mb-2 px-4 py-2.5 bg-secondary/10 border border-secondary/30 rounded-lg text-sm font-medium text-secondary flex items-center gap-2">
              <Check className="w-4 h-4" /> Resultado del partido #{resultSaved} guardado correctamente
            </div>
          )}
          {resultError && (
            <div className="mx-6 mb-2 px-4 py-2.5 bg-destructive/10 border border-destructive/30 rounded-lg text-sm font-medium text-destructive flex items-center gap-2">
              <X className="w-4 h-4" /> {resultError}
            </div>
          )}

        {activeTab === 'results' && (
            <MatchResultsTab
              matchResults={matchResults}
              onUpdateResult={handleUpdateResult}
              isLoading={isLoading}
            />
          )}

          {activeTab === 'approvals' && (
            <ApprovalsTab
              pendingUsers={pendingUsers}
              onApprove={handleApproveUser}
              isLoading={isLoading}
            />
          )}

          {activeTab === 'bracket' && (
            <BracketManager
              league={league}
              accessToken={accessToken}
              onBracketConfirmed={() => {
                onResultUpdated?.();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function MatchResultsTab({ matchResults, onUpdateResult, isLoading }: any) {
  const [editingMatch, setEditingMatch] = useState<number | null>(null);
  const [golesA, setGolesA] = useState(0);
  const [golesB, setGolesB] = useState(0);
  const [filterEstado, setFilterEstado] = useState<'todos' | 'pendiente' | 'finalizado'>('todos');

  const startEdit = (matchId: number) => {
    const result = matchResults[matchId];
    setEditingMatch(matchId);
    setGolesA(result?.golesA ?? 0);
    setGolesB(result?.golesB ?? 0);
  };

  const saveResult = (matchId: number) => {
    onUpdateResult(matchId, golesA, golesB, 'finalizado');
    setEditingMatch(null);
  };

  const getEstadoBadge = (result: any) => {
    if (!result) return { label: 'Pendiente', class: 'bg-muted text-muted-foreground' };
    if (result.estado === 'finalizado') return { label: 'Finalizado', class: 'bg-secondary/20 text-secondary-foreground' };
    if (result.estado === 'en_curso') return { label: 'En juego', class: 'bg-accent/20 text-accent-foreground' };
    return { label: 'Pendiente', class: 'bg-muted text-muted-foreground' };
  };

  const filteredMatches = GROUP_STAGE_MATCHES.filter(m => {
    if (filterEstado === 'todos') return true;
    const result = matchResults[m.id];
    if (filterEstado === 'finalizado') return result?.estado === 'finalizado';
    return !result || result.estado !== 'finalizado';
  });

  const finalizados = Object.values(matchResults).filter((r: any) => r?.estado === 'finalizado').length;

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-muted rounded-lg p-3">
          <div className="text-2xl font-bold text-foreground">{GROUP_STAGE_MATCHES.length}</div>
          <div className="text-xs text-muted-foreground font-medium">Total partidos</div>
        </div>
        <div className="bg-secondary/10 rounded-lg p-3">
          <div className="text-2xl font-bold text-secondary">{finalizados}</div>
          <div className="text-xs text-muted-foreground font-medium">Finalizados</div>
        </div>
        <div className="bg-primary/10 rounded-lg p-3">
          <div className="text-2xl font-bold text-primary">{GROUP_STAGE_MATCHES.length - finalizados}</div>
          <div className="text-xs text-muted-foreground font-medium">Pendientes</div>
        </div>
      </div>

      {/* Instrucciones */}
      <div className="bg-secondary/10 rounded-lg p-4 border-2 border-secondary/30">
        <p className="text-sm text-foreground">
          <strong>Instrucciones:</strong> Ingresa el resultado real de cada partido. Los puntos se calcularán automáticamente para todos los participantes (5 pts marcador exacto · 3 pts diferencia correcta · 1 pt ganador correcto).
        </p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {(['todos', 'pendiente', 'finalizado'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilterEstado(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all capitalize ${
              filterEstado === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {f === 'todos' ? 'Todos' : f === 'pendiente' ? 'Pendientes' : 'Finalizados'}
          </button>
        ))}
      </div>

      {/* Lista de partidos */}
      <div className="space-y-2">
        {filteredMatches.map((match) => {
          const result = matchResults[match.id];
          const isEditing = editingMatch === match.id;
          const badge = getEstadoBadge(result);

          return (
            <div
              key={match.id}
              className={`bg-white rounded-lg border-2 p-3 sm:p-4 transition-all ${
                result?.estado === 'finalizado' ? 'border-secondary/30 bg-secondary/5' : 'border-border'
              }`}
            >
              {/* Grupo y estado */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium">Grupo {match.grupo}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge.class}`}>
                  {badge.label}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 sm:gap-4">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <CountryFlag country={match.equipo_a} size="sm" />
                  <span className="text-xs sm:text-sm font-bold truncate">{match.equipo_a}</span>
                </div>

                {isEditing ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={golesA}
                      onChange={(e) => setGolesA(parseInt(e.target.value) || 0)}
                      className="w-14 px-2 py-1.5 text-center border-2 border-primary rounded-lg font-bold text-lg"
                    />
                    <span className="font-bold text-muted-foreground">-</span>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={golesB}
                      onChange={(e) => setGolesB(parseInt(e.target.value) || 0)}
                      className="w-14 px-2 py-1.5 text-center border-2 border-primary rounded-lg font-bold text-lg"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${
                      result ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'
                    }`}>
                      {result?.golesA ?? '-'}
                    </div>
                    <span className="font-bold text-muted-foreground">-</span>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${
                      result ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'
                    }`}>
                      {result?.golesB ?? '-'}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                  <span className="text-xs sm:text-sm font-bold truncate">{match.equipo_b}</span>
                  <CountryFlag country={match.equipo_b} size="sm" />
                </div>
              </div>

              {/* Acciones */}
              <div className="flex justify-end gap-2 mt-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => saveResult(match.id)}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-bold text-sm hover:bg-secondary/90 transition-colors disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditingMatch(null)}
                      disabled={isLoading}
                      className="px-4 py-2 bg-muted text-foreground rounded-lg font-bold text-sm hover:bg-muted/80 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => startEdit(match.id)}
                    disabled={isLoading}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 ${
                      result ? 'bg-muted text-foreground hover:bg-muted/80' : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                  >
                    {result ? (
                      <><Trophy className="w-4 h-4" /> Editar</>
                    ) : (
                      <><Check className="w-4 h-4" /> Ingresar resultado</>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ApprovalsTab({ pendingUsers, onApprove, isLoading }: any) {
  if (pendingUsers.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-bold text-foreground mb-2">No hay solicitudes pendientes</h3>
        <p className="text-sm text-muted-foreground">
          Las solicitudes de nuevos jugadores aparecerán aquí
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pendingUsers.map((user: any) => (
        <div key={user.id} className="bg-white rounded-lg border-2 border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground">{user.nombre}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onApprove(user.id, true)}
                disabled={isLoading}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-bold text-sm hover:bg-secondary/90 transition-colors flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Aprobar
              </button>
              <button
                onClick={() => onApprove(user.id, false)}
                disabled={isLoading}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-bold text-sm hover:bg-destructive/90 transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Rechazar
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
