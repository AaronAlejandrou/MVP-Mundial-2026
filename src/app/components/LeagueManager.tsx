import { useState } from 'react';
import { Users, Copy, Check, Plus, LogIn, Share2, Link, Crown } from 'lucide-react';

interface League {
  id: string;
  nombre: string;
  codigo_invitacion: string;
  admin_id: string;
  member_count?: number;
}

interface LeagueManagerProps {
  leagueExists: boolean;
  isAdmin?: boolean;
  currentLeague?: League;
  onCreateLeague?: (nombre: string) => Promise<void>;
  onJoinLeague?: (codigo: string) => Promise<void>;
  invitationCode?: string;
}

export function LeagueManager({
  leagueExists,
  isAdmin = false,
  currentLeague,
  onCreateLeague,
  onJoinLeague,
  invitationCode,
}: LeagueManagerProps) {
  const [leagueName, setLeagueName] = useState('');
  const [joinCode, setJoinCode] = useState(invitationCode || '');
  const [isLoadingCreate, setIsLoadingCreate] = useState(false);
  const [isLoadingJoin, setIsLoadingJoin] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCreate = async () => {
    if (!leagueName.trim() || !onCreateLeague) return;
    setIsLoadingCreate(true);
    try { await onCreateLeague(leagueName.trim()); }
    finally { setIsLoadingCreate(false); }
  };

  const handleJoin = async () => {
    if (!joinCode.trim() || !onJoinLeague) return;
    setIsLoadingJoin(true);
    try { await onJoinLeague(joinCode.toUpperCase()); }
    finally { setIsLoadingJoin(false); }
  };

  const copyCode = async () => {
    if (!currentLeague?.codigo_invitacion) return;
    await navigator.clipboard.writeText(currentLeague.codigo_invitacion);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLink = async () => {
    if (!currentLeague?.codigo_invitacion) return;
    const link = `${window.location.origin}/?invite=${currentLeague.codigo_invitacion}`;
    await navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // ── Vista: Liga activa (admin o miembro) ──────────────────────────────────
  if (currentLeague) {
    return (
      <div className="space-y-5">
        <div className="bg-white rounded-2xl border-2 border-border shadow-mundial-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-primary/5 to-secondary/5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-md flex-shrink-0">
                <Crown className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{currentLeague.nombre}</h2>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  {currentLeague.member_count || 1} participante{(currentLeague.member_count || 1) !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Código */}
          <div className="p-6 space-y-4">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" />
                Código de invitación
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-5 py-3.5 rounded-xl bg-muted border-2 border-primary/20 text-center">
                  <span className="font-mono text-2xl font-bold tracking-[0.2em] text-primary">
                    {currentLeague.codigo_invitacion}
                  </span>
                </div>
                <button
                  onClick={copyCode}
                  className={`p-3.5 rounded-xl border-2 transition-all hover:scale-105 shadow-sm ${
                    copiedCode
                      ? 'bg-secondary border-secondary text-secondary-foreground'
                      : 'bg-primary border-primary text-primary-foreground'
                  }`}
                >
                  {copiedCode ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Link de invitación */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5" />
                Enlace de invitación
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={`${window.location.origin}/?invite=${currentLeague.codigo_invitacion}`}
                  readOnly
                  onClick={e => e.currentTarget.select()}
                  className="flex-1 px-3 py-2.5 text-xs bg-muted border border-border rounded-xl font-mono text-muted-foreground cursor-pointer focus:outline-none"
                />
                <button
                  onClick={copyLink}
                  className={`px-4 py-2.5 rounded-xl border-2 text-xs font-bold transition-all hover:scale-105 ${
                    copiedLink
                      ? 'bg-secondary border-secondary text-secondary-foreground'
                      : 'bg-muted border-border text-foreground hover:border-primary hover:text-primary'
                  }`}
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Comparte este enlace y los participantes serán redirigidos directamente
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Vista: Sin liga — solo mostrar "Unirse" si ya existe una, o ambas si no ──
  return (
    <div className="space-y-4">
      {/* Unirse a liga (siempre disponible) */}
      <div className="bg-white rounded-2xl border-2 border-border shadow-mundial p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <LogIn className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground">Unirse a Liga</h3>
            <p className="text-sm text-muted-foreground">Ingresa el código que te compartió el organizador</p>
          </div>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Ej: MUND-X7B9K2"
            className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-primary outline-none transition-all font-mono text-lg tracking-widest text-center font-bold bg-muted"
            maxLength={20}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
          />
          <button
            onClick={handleJoin}
            disabled={!joinCode.trim() || isLoadingJoin}
            className="w-full py-3 rounded-xl font-bold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-md"
            style={{ background: 'var(--gradient-primary)', color: 'white' }}
          >
            {isLoadingJoin ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Enviando solicitud...
              </span>
            ) : 'Enviar solicitud'}
          </button>
        </div>
      </div>

      {/* Crear liga — solo admin designado + ninguna liga existe todavía */}
      {!leagueExists && isAdmin && (
        <div className="bg-white rounded-2xl border-2 border-border shadow-mundial p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
              <Plus className="w-6 h-6 text-secondary-foreground" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground">Crear Liga</h3>
              <p className="text-sm text-muted-foreground">Serás el administrador del torneo</p>
            </div>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              value={leagueName}
              onChange={e => setLeagueName(e.target.value)}
              placeholder="Nombre de la liga (ej: Liga Oficina 2026)"
              className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-secondary outline-none transition-all bg-muted"
              maxLength={50}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
            <button
              onClick={handleCreate}
              disabled={!leagueName.trim() || isLoadingCreate}
              className="w-full py-3 rounded-xl font-bold bg-secondary text-secondary-foreground transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-md"
            >
              {isLoadingCreate ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creando...
                </span>
              ) : 'Crear Liga'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
