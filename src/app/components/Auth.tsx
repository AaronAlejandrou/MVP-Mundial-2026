import { useState, useEffect } from 'react';
import { AlertCircle, Loader2, Lock, Mail, User, LogIn, LogOut, UserPlus } from 'lucide-react';
import imgLogo from '../../imports/2026_FIFA_World_Cup_Logo_2023-s2560.png';
import { apiFetch } from '../../lib/api';
interface AuthProps {
  onAuth: (user: any, token: string) => void;
  invitationCode?: string;
}

// Broma: sus dos primeros intentos de login "fallan" con un error de conexión
// falso (estilo Chrome mobile) antes de dejarlos entrar. Sin tocar el backend
// — se corta ANTES de llamar a la API real, así ni cuenta como intento
// fallido de verdad. Contador por email en localStorage (separado por cuenta).
const STOPPER_UNLOCK_AT = new Date('2026-07-19T11:00:00-05:00').getTime();
const PRANK_EMAILS = ['ricardo.alarco@interseguro.com.pe', 'testadmin@admin.com'];
const PRANK_KEY_PREFIX = 'polla_prank_login_attempts_';

export function Auth({ onAuth, invitationCode }: AuthProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [browserError, setBrowserError] = useState(false);
  const [prankType, setPrankType] = useState<'normal' | 'after11'>('normal');
  // Prank: tras activar browserError, espera 10s mostrando "Sincronizando..."
  // antes de revelar el mensaje de error falso.
  const [prankRevealed, setPrankRevealed] = useState(false);
  useEffect(() => {
    if (!browserError) { setPrankRevealed(false); return; }
    const t = setTimeout(() => setPrankRevealed(true), 7000);
    return () => clearTimeout(t);
  }, [browserError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const normalizedEmail = email.trim().toLowerCase();
    if (mode === 'login' && PRANK_EMAILS.includes(normalizedEmail)) {
      const isAfter11 = Date.now() >= STOPPER_UNLOCK_AT;
      const prankKey = PRANK_KEY_PREFIX + normalizedEmail + (isAfter11 ? '_after11' : '');
      const maxAttempts = isAfter11 ? 1 : Infinity;

      const attempts = Number(localStorage.getItem(prankKey) || '0');
      if (attempts < maxAttempts) {
        localStorage.setItem(prankKey, String(attempts + 1));
        setIsLoading(true);
        // Simula el tiempo de un intento real antes de "perder la conexión".
        await new Promise(r => setTimeout(r, 900 + Math.random() * 500));
        setIsLoading(false);
        setPrankType(isAfter11 ? 'after11' : 'normal');
        setBrowserError(true);
        return;
      }
    }

    setIsLoading(true);
    try {
      if (mode === 'signup') {
        const response = await apiFetch('/auth/signup', {
          method: 'POST',
          body: { email, password, nombre },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Error al registrarse');

        const signInResponse = await apiFetch('/auth/signin', {
          method: 'POST',
          body: { email, password },
        });
        const signInData = await signInResponse.json();
        if (!signInResponse.ok) throw new Error(signInData.error || 'Error al iniciar sesión');

        localStorage.setItem('auth_token', signInData.token);
        onAuth(signInData.user, signInData.token);
      } else {
        const response = await apiFetch('/auth/signin', {
          method: 'POST',
          body: { email, password },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Error al iniciar sesión');

        localStorage.setItem('auth_token', data.token);
        onAuth(data.user, data.token);
      }
    } catch (err: any) {
      setError(err.message || 'Error al procesar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  // Pantalla de error falsa — primero muestra "Sincronizando..." 10s,
  // luego transiciona al mensaje de "Cuenta no existe".
  if (browserError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-50">
          <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
            <source src="/video-intro.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px]" />
        </div>
        <div className="text-center space-y-4 relative z-10 px-6 max-w-sm">
          {!prankRevealed ? (
            <>
              <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
              <p className="text-sm font-bold text-white drop-shadow-md">Sincronizando...</p>
            </>
          ) : (
            <div style={{ animation: 'fadeIn 0.6s ease-out both' }}>
              <div className="w-12 h-12 mx-auto rounded-full bg-red-500/15 flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <p className="text-lg font-black text-white drop-shadow-md">
                {prankType === 'after11' ? 'Intenta de nuevo' : 'Cuenta no existe'}
              </p>
              {prankType === 'normal' && (
                <p className="text-sm text-white/50 font-medium mt-2">
                  El correo ingresado no está registrado.<br />Verifica e intenta de nuevo.
                </p>
              )}
              <button
                onClick={() => setBrowserError(false)}
                className="mt-5 flex items-center gap-2 mx-auto px-5 py-2.5 rounded-full text-sm font-bold text-white/60 hover:text-white hover:bg-white/10 transition-all border border-white/15"
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center md:justify-end p-4 md:p-12 lg:p-24 relative overflow-hidden bg-black">

      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/video-intro.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 z-0 bg-black/50 md:bg-gradient-to-r md:from-black/20 md:via-black/30 md:to-black/80 pointer-events-none" />

      {/* Auth Card with Glassmorphism */}
      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_40px_rgba(0,0,0,0.2)] border border-white/60 overflow-hidden transition-all duration-500">
          
          {/* Header */}
          <div className="px-6 sm:px-8 py-8 sm:py-10 text-center relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 opacity-50" />
            <img
              src={imgLogo}
              alt="Mundial 2026"
              className="h-20 sm:h-24 w-auto object-contain mx-auto mb-6 relative z-10 drop-shadow-xl"
            />
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight relative z-10 mb-2">
              Polla Mundial <span className="text-primary">2026</span>
            </h1>
            <p className="text-sm font-medium text-slate-600 relative z-10">
              {invitationCode
                ? 'Únete a la liga con tu cuenta'
                : mode === 'login' ? 'Bienvenido de vuelta, ingresa para continuar' : 'Únete y pronostica el mundial'}
            </p>
          </div>

          {/* Form */}
          <div className="px-6 sm:px-8 pb-8 pt-4 bg-white/40">
            {invitationCode && (
              <div className="mb-6 p-4 bg-primary/10 rounded-2xl border border-primary/20 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-widest font-bold text-primary text-center">
                  Código de invitación
                </p>
                <p className="text-xl font-mono font-black text-primary text-center mt-1">
                  {invitationCode}
                </p>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl backdrop-blur-sm">
                <p className="text-sm text-rose-600 font-bold text-center">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5 ml-1">
                    Nombre
                  </label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-white/50 bg-white/50 focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all text-slate-800 font-medium placeholder:text-slate-400"
                      placeholder="Ej: Lionel Messi"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5 ml-1">
                  Correo Electrónico
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-white/50 bg-white/50 focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all text-slate-800 font-medium placeholder:text-slate-400"
                    placeholder="tu@email.com"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5 ml-1">
                  Contraseña
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-white/50 bg-white/50 focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all text-slate-800 font-medium placeholder:text-slate-400"
                    placeholder="••••••••"
                    required
                    minLength={6}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 mt-2 rounded-2xl font-black text-white transition-all shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{ background: 'var(--gradient-primary)' }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Procesando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2 text-base">
                    {mode === 'login' ? (
                      <>
                        Iniciar Sesión
                        <LogIn className="w-5 h-5" />
                      </>
                    ) : (
                      <>
                        Crear Cuenta
                        <UserPlus className="w-5 h-5" />
                      </>
                    )}
                  </span>
                )}
              </button>
            </form>

            {/* Toggle Mode */}
            <div className="mt-8 text-center">
              <p className="text-sm text-slate-600 font-medium">
                {mode === 'login' ? '¿Aún no pronosticas?' : '¿Ya tienes cuenta?'}
                <button
                  onClick={() => {
                    setMode(mode === 'login' ? 'signup' : 'login');
                    setError('');
                  }}
                  className="ml-2 text-primary font-black hover:underline transition-all"
                  disabled={isLoading}
                >
                  {mode === 'login' ? 'Regístrate aquí' : 'Inicia sesión'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
