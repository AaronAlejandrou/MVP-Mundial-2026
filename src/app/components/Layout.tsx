import { ReactNode, useState } from 'react';
import { Trophy, Calendar, Users, Menu, X, LogOut, Award, Table2, Shield } from 'lucide-react';
import imgLogo from '../../imports/2026_FIFA_World_Cup_Logo_2023-s2560.png';
import { ThemeToggle } from './ThemeToggle';

interface LayoutProps {
  children: ReactNode;
  currentView: 'matches' | 'leaderboard' | 'leagues' | 'knockout' | 'standings';
  onViewChange: (view: 'matches' | 'leaderboard' | 'leagues' | 'knockout' | 'standings') => void;
  leagueCode?: string;
  onLogout?: () => void;
  isAdmin?: boolean;
  pendingCount?: number;
  onOpenAdmin?: () => void;
  showActuBadge?: boolean;
}

export function Layout({ children, currentView, onViewChange, leagueCode, onLogout, isAdmin, pendingCount = 0, onOpenAdmin, showActuBadge = false }: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Badge rojo "¡Actu!" que invita a entrar a Eliminatorias. Desaparece al entrar.
  const actuBadge = showActuBadge && currentView !== 'knockout' ? (
    <span className="absolute -top-1.5 -right-1.5 z-10 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[8px] font-black leading-none shadow-lg shadow-rose-500/40 animate-pulse pointer-events-none">
      ¡Actu!
    </span>
  ) : null;

  return (
    <div className="min-h-screen flex flex-col relative bg-black">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src="/video-intro.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px]" />
      </div>

      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-background/20 backdrop-blur-2xl border-b border-border/50 shadow-md" style={{ borderColor: 'var(--primary)' }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-4">
              <img
                src={imgLogo}
                alt="Mundial 2026"
                className="h-10 sm:h-14 w-auto object-contain"
              />
              <div>
                <h1 className="text-sm sm:text-lg lg:text-xl font-bold text-gradient-mundial">Polla Mundial 2026</h1>
                <p className="text-xs font-medium text-muted-foreground hidden sm:block">FIFA World Cup</p>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-1 lg:gap-2">
              {/* League Code Display */}
              {leagueCode && (
                <div
                  className="flex items-center gap-1.5 lg:gap-2 px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl shadow-sm border-2 bg-muted/30 border-border mr-1 lg:mr-2"
                >
                  <Users className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-primary" />
                  <div className="flex flex-col text-left">
                    <span className="text-[8px] lg:text-[9px] font-medium text-muted-foreground leading-none mb-0.5">Liga Actual</span>
                    <span className="text-xs lg:text-sm font-mono font-bold text-primary leading-none">
                      {leagueCode}
                    </span>
                  </div>
                </div>
              )}
              <button
                onClick={() => onViewChange('matches')}
                className={`px-3 lg:px-5 py-2 lg:py-2.5 rounded-xl font-bold text-xs lg:text-sm transition-all shadow-sm ${
                  currentView === 'matches'
                    ? 'scale-105'
                    : 'hover:scale-105'
                }`}
                style={
                  currentView === 'matches'
                    ? { background: 'var(--gradient-primary)', color: 'white' }
                    : { background: 'var(--muted)', color: 'var(--foreground)' }
                }
              >
                <div className="flex items-center gap-1 lg:gap-2">
                  <Calendar className="w-3 h-3 lg:w-4 lg:h-4" />
                  <span className="hidden lg:inline">Partidos</span>
                  <span className="lg:hidden">Partidos</span>
                </div>
              </button>
              <button
                onClick={() => onViewChange('knockout')}
                className={`relative px-3 lg:px-5 py-2 lg:py-2.5 rounded-xl font-bold text-xs lg:text-sm transition-all shadow-sm ${
                  currentView === 'knockout'
                    ? 'scale-105'
                    : 'hover:scale-105'
                }`}
                style={
                  currentView === 'knockout'
                    ? { background: 'var(--gradient-primary)', color: 'white' }
                    : { background: 'var(--muted)', color: 'var(--foreground)' }
                }
              >
                <div className="flex items-center gap-1 lg:gap-2">
                  <Award className="w-3 h-3 lg:w-4 lg:h-4" />
                  <span className="hidden xl:inline">Eliminatorias</span>
                  <span className="xl:hidden">Elimis</span>
                </div>
                {actuBadge}
              </button>
              <button
                onClick={() => onViewChange('standings')}
                className={`px-3 lg:px-5 py-2 lg:py-2.5 rounded-xl font-bold text-xs lg:text-sm transition-all shadow-sm ${
                  currentView === 'standings'
                    ? 'scale-105'
                    : 'hover:scale-105'
                }`}
                style={
                  currentView === 'standings'
                    ? { background: 'var(--gradient-primary)', color: 'white' }
                    : { background: 'var(--muted)', color: 'var(--foreground)' }
                }
              >
                <div className="flex items-center gap-1 lg:gap-2">
                  <Table2 className="w-3 h-3 lg:w-4 lg:h-4" />
                  <span className="hidden lg:inline">Posiciones</span>
                  <span className="lg:hidden">Tabla</span>
                </div>
              </button>
              <button
                onClick={() => onViewChange('leaderboard')}
                className={`px-3 lg:px-5 py-2 lg:py-2.5 rounded-xl font-bold text-xs lg:text-sm transition-all shadow-sm ${
                  currentView === 'leaderboard'
                    ? 'scale-105'
                    : 'hover:scale-105'
                }`}
                style={
                  currentView === 'leaderboard'
                    ? { background: 'var(--gradient-primary)', color: 'white' }
                    : { background: 'var(--muted)', color: 'var(--foreground)' }
                }
              >
                <div className="flex items-center gap-1 lg:gap-2">
                  <Trophy className="w-3 h-3 lg:w-4 lg:h-4" />
                  <span className="hidden lg:inline">Ranking</span>
                  <span className="lg:hidden">Ranking</span>
                </div>
              </button>

              {/* Admin Button */}
              {isAdmin && onOpenAdmin && (
                <button
                  onClick={onOpenAdmin}
                  className="relative ml-1 px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl font-bold text-xs lg:text-sm transition-all hover:scale-105 border-2 border-primary/40 text-primary bg-primary/10"
                >
                  <div className="flex items-center gap-1 lg:gap-2">
                    <Shield className="w-3 h-3 lg:w-4 lg:h-4" />
                    <span className="hidden lg:inline">Admin</span>
                    {pendingCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-destructive text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {pendingCount}
                      </span>
                    )}
                  </div>
                </button>
              )}

              {/* Logout Button */}
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="ml-1 px-2 lg:px-3 py-2 lg:py-2.5 rounded-xl font-medium text-xs lg:text-sm transition-all hover:scale-105 border-2 border-destructive/40 text-destructive bg-destructive/5"
                >
                  <div className="flex items-center gap-1 lg:gap-2">
                    <LogOut className="w-3 h-3 lg:w-4 lg:h-4" />
                    <span className="hidden lg:inline">Salir</span>
                  </div>
                </button>
              )}
              
              <div className="ml-2 pl-2 border-l-2 border-border hidden sm:flex items-center">
                <ThemeToggle />
              </div>
            </div>

            {/* Mobile Menu Button & Theme Toggle */}
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-xl hover:bg-muted transition-all"
              >
                {menuOpen ? (
                  <X className="w-6 h-6 text-foreground" />
                ) : (
                  <Menu className="w-6 h-6 text-foreground" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Dropdown Menu */}
          {menuOpen && (
            <div className="md:hidden py-4 space-y-2 border-t border-border">
              {leagueCode && (
                <div
                  className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 mb-2 bg-muted border-border"
                >
                  <Users className="w-4 h-4 text-primary" />
                  <div className="text-left flex-1">
                    <div className="text-xs font-medium text-muted-foreground">Liga</div>
                    <div className="text-sm font-mono font-bold text-primary">
                      {leagueCode}
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={() => {
                  onViewChange('matches');
                  setMenuOpen(false);
                }}
                className={`w-full px-4 py-3 rounded-xl font-bold text-sm transition-all text-left ${
                  currentView === 'matches' ? '' : ''
                }`}
                style={
                  currentView === 'matches'
                    ? { background: 'var(--gradient-primary)', color: 'white' }
                    : { background: 'var(--muted)', color: 'var(--foreground)' }
                }
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5" />
                  Partidos
                </div>
              </button>
              <button
                onClick={() => {
                  onViewChange('knockout');
                  setMenuOpen(false);
                }}
                className={`relative w-full px-4 py-3 rounded-xl font-bold text-sm transition-all text-left`}
                style={
                  currentView === 'knockout'
                    ? { background: 'var(--gradient-primary)', color: 'white' }
                    : { background: 'var(--muted)', color: 'var(--foreground)' }
                }
              >
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5" />
                  Eliminatorias
                </div>
                {actuBadge}
              </button>
              <button
                onClick={() => {
                  onViewChange('standings');
                  setMenuOpen(false);
                }}
                className={`w-full px-4 py-3 rounded-xl font-bold text-sm transition-all text-left ${
                  currentView === 'standings' ? '' : ''
                }`}
                style={
                  currentView === 'standings'
                    ? { background: 'var(--gradient-primary)', color: 'white' }
                    : { background: 'var(--muted)', color: 'var(--foreground)' }
                }
              >
                <div className="flex items-center gap-3">
                  <Table2 className="w-5 h-5" />
                  Tabla de Posiciones
                </div>
              </button>
              <button
                onClick={() => {
                  onViewChange('leaderboard');
                  setMenuOpen(false);
                }}
                className={`w-full px-4 py-3 rounded-xl font-bold text-sm transition-all text-left ${
                  currentView === 'leaderboard' ? '' : ''
                }`}
                style={
                  currentView === 'leaderboard'
                    ? { background: 'var(--gradient-primary)', color: 'white' }
                    : { background: 'var(--muted)', color: 'var(--foreground)' }
                }
              >
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5" />
                  Ranking
                </div>
              </button>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="w-full px-4 py-3 rounded-xl font-bold text-sm transition-all text-left border-2 mt-2 border-destructive text-destructive bg-destructive/10"
                >
                  <div className="flex items-center gap-3">
                    <LogOut className="w-5 h-5" />
                    Cerrar Sesión
                  </div>
                </button>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-8 relative z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          {children}
        </div>
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/40 backdrop-blur-2xl border-t border-border/50 safe-area-bottom shadow-[0_-8px_30px_rgba(0,0,0,0.1)]">
        <div className="grid grid-cols-4 gap-1 px-2 py-3">
          <button
            onClick={() => onViewChange('matches')}
            className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all"
            style={
              currentView === 'matches'
                ? { background: 'var(--blob-purple)' }
                : {}
            }
          >
            <Calendar
              className={`w-5 h-5 transition-colors ${
                currentView === 'matches' ? 'text-primary' : 'text-muted-foreground'
              }`}
            />
            <span
              className={`text-xs font-bold transition-colors ${
                currentView === 'matches' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Grupos
            </span>
          </button>

          <button
            onClick={() => onViewChange('knockout')}
            className="relative flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all"
            style={
              currentView === 'knockout'
                ? { background: 'var(--blob-purple)' }
                : {}
            }
          >
            <Award
              className={`w-5 h-5 transition-colors ${
                currentView === 'knockout' ? 'text-primary' : 'text-muted-foreground'
              }`}
            />
            <span
              className={`text-xs font-bold transition-colors ${
                currentView === 'knockout' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Elimis
            </span>
            {showActuBadge && currentView !== 'knockout' && (
              <span className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[8px] font-black leading-none shadow-lg shadow-rose-500/40 animate-pulse pointer-events-none whitespace-nowrap">
                ¡Actu!
              </span>
            )}
          </button>

          <button
            onClick={() => onViewChange('standings')}
            className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all"
            style={
              currentView === 'standings'
                ? { background: 'var(--blob-purple)' }
                : {}
            }
          >
            <Table2
              className={`w-5 h-5 transition-colors ${
                currentView === 'standings' ? 'text-primary' : 'text-muted-foreground'
              }`}
            />
            <span
              className={`text-xs font-bold transition-colors ${
                currentView === 'standings' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Tabla
            </span>
          </button>

          <button
                onClick={() => onViewChange('leaderboard')}
                className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all"
                style={
                  currentView === 'leaderboard'
                    ? { background: 'var(--blob-purple)' }
                    : {}
                }
              >
                <Trophy
                  className={`w-5 h-5 transition-colors ${
                    currentView === 'leaderboard' ? 'text-primary' : 'text-muted-foreground'
                  }`}
                />
                <span
                  className={`text-xs font-bold transition-colors ${
                    currentView === 'leaderboard' ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  Ranking
                </span>
              </button>
        </div>
      </nav>
    </div>
  );
}
