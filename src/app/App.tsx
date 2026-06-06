import { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { MatchesTimeline } from './components/MatchesTimeline';
import { Leaderboard } from './components/Leaderboard';
import { LeagueManager } from './components/LeagueManager';
import { Auth } from './components/Auth';
import { ThemeToggle } from './components/ThemeToggle';
import { KnockoutBracket } from './components/KnockoutBracket';
import { GroupStandings } from './components/GroupStandings';
import { AdminPanel } from './components/AdminPanel';
import { ToastContainer, useToast } from './components/Toast';
import { AlertCircle, Loader2 } from 'lucide-react';
import { GROUP_STAGE_MATCHES } from '../data/groupStageMatches';
import { getResolvedKnockoutMatches } from '../data/knockoutMatches';
import { apiFetch } from '../lib/api';

export default function App() {
  const { toasts, toast, remove: removeToast } = useToast();

  const [currentUser, setCurrentUser]     = useState<any>(null);
  const [accessToken, setAccessToken]     = useState<string>('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [currentLeague, setCurrentLeague]   = useState<any>(null);
  const [isLeagueAdmin, setIsLeagueAdmin]   = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [leagueExists, setLeagueExists]     = useState<boolean | null>(null);

  const [currentView, setCurrentView] = useState<'matches'|'leaderboard'|'leagues'|'knockout'|'standings'>('matches');
  const [predictions, setPredictions]   = useState<Record<number, any>>({});
  const [matchResults, setMatchResults] = useState<Record<number, any>>({});
  const [leaderboard, setLeaderboard]   = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | undefined>(undefined);
  const [highlightTeam, setHighlightTeam] = useState<string | undefined>(undefined);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [invitationCode, setInvitationCode] = useState<string | null>(null);

  const [bracketLocked, setBracketLocked] = useState(false);
  const [knockoutTeams, setKnockoutTeams] = useState<Record<number, { team1: string; team2: string }>>({});

  // ── Init ────────────────────────────────────────────────────────────────

  useEffect(() => {
    checkInvitationCode();
    checkLeagueExists();
    checkAuth();
  }, []);

  useEffect(() => {
    if (currentUser && currentLeague) loadUserData();
  }, [currentUser?.id, currentLeague?.id]);

  const checkInvitationCode = () => {
    const code = new URLSearchParams(window.location.search).get('invite');
    if (code) setInvitationCode(code);
  };

  const checkLeagueExists = async () => {
    try {
      const res = await apiFetch('/leagues/any');
      if (res.ok) {
        const data = await res.json();
        setLeagueExists(data.exists);
      }
    } catch { setLeagueExists(false); }
  };

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) { setIsCheckingAuth(false); return; }
    try {
      const res = await apiFetch('/auth/me', { token });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);            // data.user incluye is_admin del servidor
        setAccessToken(token);
        if (data.user.is_admin) setIsLeagueAdmin(true);
        await loadUserLeague(data.user.id, token);
      } else {
        localStorage.removeItem('auth_token');
      }
    } catch { localStorage.removeItem('auth_token'); }
    setIsCheckingAuth(false);
  };

  // ── Liga ─────────────────────────────────────────────────────────────────

  const loadUserLeague = async (userId: string, token: string) => {
    try {
      const res = await apiFetch('/leagues/my', { token });
      if (res.ok) {
        const data = await res.json();
        if (data.leagues?.length > 0) {
          const league = data.leagues[0];
          setCurrentLeague(league);
          setIsLeagueAdmin(league.admin_id === userId);
          if (league.admin_id === userId) loadPendingUsers(league.id, token);
        }
      }
    } catch { /* silent */ }
  };

  const loadPendingUsers = async (leagueId: string, token: string) => {
    try {
      const res = await apiFetch(`/leagues/${leagueId}/pending`, { token });
      if (res.ok) {
        const data = await res.json();
        setPendingApprovals(data.pendingUsers || []);
      }
    } catch { /* silent */ }
  };

  // ── Datos ────────────────────────────────────────────────────────────────

  const loadUserData = useCallback(async () => {
    if (!currentLeague || !accessToken) return;

    try {
      const res = await apiFetch(`/predictions/${currentLeague.id}`, { token: accessToken });
      if (res.ok) {
        const data = await res.json();
        const preds: Record<number, any> = {};
        data.predictions.forEach((p: any) => {
          preds[p.matchId] = {
            goles_a: p.goles_a,
            goles_b: p.goles_b,
            puntos_obtenidos: p.puntosObtenidos ?? undefined,
          };
        });
        setPredictions(preds);
      }
    } catch { /* silent */ }

    try {
      const res = await apiFetch(`/matches/results?leagueId=${currentLeague.id}`);
      if (res.ok) {
        const data = await res.json();
        setMatchResults(data.results || {});
      }
    } catch { /* silent */ }

    await loadLeaderboard();
  }, [currentLeague?.id, accessToken]);

  const loadLeaderboard = useCallback(async () => {
    if (!currentLeague || !accessToken) return;
    try {
      const res = await apiFetch(`/leagues/${currentLeague.id}/leaderboard`, { token: accessToken });
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(
          (data.leaderboard || [])
            .map((p: any) => ({
              id: p.userId,
              nombre: p.nombre,
              puntaje_total: p.puntajeTotal,
            }))
            .filter((p: any) => p.id !== currentLeague.admin_id)
        );
      }
    } catch { /* silent */ }
  }, [currentLeague?.id, accessToken]);

  useEffect(() => {
    if (!currentLeague?.id) return;
    (async () => {
      try {
        const pr = await apiFetch(`/bracket/phase?leagueId=${currentLeague.id}`);
        if (pr.ok) {
          const phase = await pr.json();
          setBracketLocked(phase.bracketLocked);
          if (phase.bracketLocked) {
            const tr = await apiFetch(`/bracket/knockout-teams?leagueId=${currentLeague.id}`);
            if (tr.ok) setKnockoutTeams((await tr.json()).teams ?? {});
          }
        }
      } catch { /* silent */ }
    })();
  }, [currentLeague?.id]);

  // ── Auth handlers ────────────────────────────────────────────────────────

  const handleAuth = async (user: any, token: string) => {
    setIsAuthenticating(true);
    try {
      await Promise.all([loadUserLeague(user.id, token), checkLeagueExists()]);
    } catch { /* silent */ }
    
    setCurrentUser(user);                   // user.is_admin viene del servidor
    setAccessToken(token);
    if (user.is_admin) setIsLeagueAdmin(true);
    if (invitationCode) setTimeout(() => handleJoinLeagueByCode(invitationCode!), 600);
    
    setIsAuthenticating(false);
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) await apiFetch('/auth/logout', { method: 'POST', token });
    } catch { /* silent */ }
    localStorage.removeItem('auth_token');
    setCurrentUser(null); setAccessToken(''); setCurrentLeague(null);
    setPredictions({}); setLeaderboard([]); setMatchResults({});
    setCurrentView('matches');
  };

  // ── Liga handlers ────────────────────────────────────────────────────────

  const handleCreateLeague = async (nombre: string) => {
    try {
      const res = await apiFetch('/leagues', {
        method: 'POST', token: accessToken, body: { nombre },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCurrentLeague(data.league);
      setIsLeagueAdmin(true);
      setLeagueExists(true);
      setCurrentView('matches');
      toast(`¡Liga "${nombre}" creada! Código: ${data.league.invitationCode}`, 'success');
    } catch (err: any) {
      toast(err.message || 'Error al crear la liga', 'error');
    }
  };

  const handleJoinLeagueByCode = async (code: string) => {
    try {
      const leagueRes = await apiFetch(`/leagues/code/${code}`, { token: accessToken });
      const leagueData = await leagueRes.json();
      if (!leagueRes.ok) throw new Error(leagueData.error || 'Código inválido');

      const joinRes = await apiFetch(`/leagues/${leagueData.league.id}/join`, {
        method: 'POST', token: accessToken,
      });
      const joinData = await joinRes.json();
      if (!joinRes.ok) throw new Error(joinData.error);

      toast(`Solicitud enviada a "${leagueData.league.nombre}". Espera la aprobación.`, 'info');
      setInvitationCode(null);
      window.history.replaceState({}, '', window.location.pathname);
    } catch (err: any) {
      toast(err.message || 'Error al unirse a la liga', 'error');
      setInvitationCode(null);
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  const handleApproveUser = async (userId: string, approved: boolean) => {
    if (!currentLeague || !isLeagueAdmin) return;
    try {
      const res = await apiFetch(`/leagues/${currentLeague.id}/approve`, {
        method: 'POST', token: accessToken, body: { userId, approved },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      loadPendingUsers(currentLeague.id, accessToken);
      if (approved) setCurrentLeague((p: any) => p ? { ...p, member_count: (p.member_count || 1) + 1 } : p);
      toast(approved ? 'Usuario aprobado ✓' : 'Usuario rechazado', approved ? 'success' : 'info');
    } catch (err: any) {
      toast(err.message || 'Error al procesar la solicitud', 'error');
    }
  };

  // ── Predicciones ─────────────────────────────────────────────────────────

  const handleSavePrediction = async (matchId: number, golesA: number, golesB: number) => {
    if (!currentLeague || !accessToken) return;
    try {
      const res = await apiFetch('/predictions', {
        method: 'POST', token: accessToken,
        body: { leagueId: currentLeague.id, matchId, golesA, golesB },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPredictions(prev => ({ ...prev, [matchId]: { goles_a: golesA, goles_b: golesB } }));
    } catch (err: any) {
      toast(err.message || 'Error al guardar el pronóstico', 'error');
      throw err;
    }
  };

  // ── Navegación ───────────────────────────────────────────────────────────

  const handleViewGroup = (grupo: string) => {
    setSelectedGroup(grupo); setHighlightTeam(undefined); setCurrentView('standings');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const handleViewTeam = (team: string, grupo: string) => {
    setSelectedGroup(grupo); setHighlightTeam(team); setCurrentView('standings');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const baseMatches = bracketLocked ? [...GROUP_STAGE_MATCHES, ...getResolvedKnockoutMatches(knockoutTeams)] : GROUP_STAGE_MATCHES;
  const enrichedMatches = baseMatches.map(m => ({
    ...m,
    goles_a: matchResults[m.id]?.golesA ?? null,
    goles_b: matchResults[m.id]?.golesB ?? null,
    estado: (matchResults[m.id]?.estado ?? m.estado ?? 'pendiente') as 'pendiente'|'en_juego'|'finalizado',
  }));

  // ── Render ───────────────────────────────────────────────────────────────

  if (isCheckingAuth || isAuthenticating) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
        {/* Video Background para que no haya corte brusco */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-50">
          <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
            <source src="/video-intro.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px]" />
        </div>
        <div className="text-center space-y-3 relative z-10">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
          <p className="text-sm font-bold text-white drop-shadow-md">Sincronizando...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        <Auth onAuth={handleAuth} invitationCode={invitationCode || undefined} />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  if (!currentLeague) {
    return (
      <>
        <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-black p-4">
          {/* Video Background */}
          <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
              <source src="/video-intro.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px]" />
          </div>

          <div className="w-full max-w-lg mx-auto py-8 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black text-foreground tracking-tight mb-3 drop-shadow-md">
                Polla Mundial <span className="text-primary">2026</span>
              </h1>
              <p className="text-sm font-medium text-foreground bg-background/60 inline-block px-4 py-1.5 rounded-full backdrop-blur-md border border-border/50 shadow-sm">
                {leagueExists === false
                  ? 'Bienvenido — crea la liga para comenzar'
                  : 'Únete a la liga con tu código de invitación'}
              </p>
            </div>

            <LeagueManager
              leagueExists={leagueExists ?? false}
              isAdmin={currentUser?.is_admin === true}
              onCreateLeague={handleCreateLeague}
              onJoinLeague={handleJoinLeagueByCode}
              invitationCode={invitationCode || undefined}
            />

            {/* Notorious Theme Selector */}
            <div className="mt-8 bg-card/60 backdrop-blur-xl border border-border/50 p-5 rounded-3xl flex flex-col items-center gap-3 shadow-mundial-lg transition-all hover:bg-card/80">
              <p className="text-sm font-bold text-foreground text-center">
                Personaliza tu experiencia:<br/>
                <span className="text-xs text-muted-foreground font-medium">Elige el tema claro u oscuro antes de entrar</span>
              </p>
              <div className="transform scale-125 mt-1">
                <ThemeToggle />
              </div>
            </div>

            <div className="mt-8 text-center">
              <button onClick={handleLogout} className="text-sm text-muted-foreground hover:text-destructive transition-colors font-bold px-4 py-2 rounded-xl hover:bg-destructive/10">
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  const handleViewChange = (view: 'matches' | 'leaderboard' | 'leagues' | 'knockout' | 'standings') => {
    setCurrentView(view);
    if (view !== 'standings') {
      setSelectedGroup(undefined);
      setHighlightTeam(undefined);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Layout
        currentView={currentView}
        onViewChange={handleViewChange}
        leagueCode={currentLeague?.invitationCode}
        onLogout={handleLogout}
        isAdmin={isLeagueAdmin}
        pendingCount={pendingApprovals.length}
        onOpenAdmin={() => setShowAdminPanel(true)}
      >
        {isLeagueAdmin && pendingApprovals.length > 0 && (
          <div className="mb-4 p-3 bg-accent/10 border-2 border-accent/40 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-accent flex-shrink-0" />
            <p className="text-sm font-bold text-foreground flex-1">
              {pendingApprovals.length} solicitud{pendingApprovals.length !== 1 ? 'es' : ''} pendiente{pendingApprovals.length !== 1 ? 's' : ''}
            </p>
            <button onClick={() => setShowAdminPanel(true)} className="px-3 py-1.5 bg-accent text-accent-foreground rounded-lg font-bold text-xs hover:bg-accent/90 transition-colors">
              Revisar
            </button>
          </div>
        )}

        {currentView === 'matches' && (
          <MatchesTimeline
            matches={enrichedMatches}
            predictions={predictions}
            onSavePrediction={handleSavePrediction}
            onViewGroup={handleViewGroup}
            onViewTeam={handleViewTeam}
          />
        )}
        {currentView === 'knockout' && (
          <KnockoutBracket 
            leagueId={currentLeague?.id} 
            predictions={predictions}
            matchResults={matchResults}
            onSavePrediction={handleSavePrediction}
          />
        )}
        {currentView === 'standings' && (
          <GroupStandings 
            selectedGroup={selectedGroup} 
            highlightTeam={highlightTeam}
            matches={enrichedMatches}
            predictions={predictions}
            onSavePrediction={handleSavePrediction}
            onViewGroup={handleViewGroup}
          />
        )}
        {currentView === 'leaderboard' && (
          <div className="max-w-3xl mx-auto">
            <Leaderboard players={leaderboard} currentUserId={currentUser.id} currentLeague={currentLeague} />
          </div>
        )}
      </Layout>

      {showAdminPanel && accessToken && (
        <AdminPanel
          league={currentLeague}
          accessToken={accessToken}
          onClose={() => setShowAdminPanel(false)}
          onResultUpdated={loadUserData}
          onApproveUser={handleApproveUser}
          pendingUsers={pendingApprovals}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
