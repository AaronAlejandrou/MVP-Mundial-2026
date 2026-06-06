import { useState } from 'react';
import { Lock, Mail, User, LogIn, UserPlus } from 'lucide-react';
import imgLogo from '../../imports/2026_FIFA_World_Cup_Logo_2023-s2560.png';
import { apiFetch } from '../../lib/api';
interface AuthProps {
  onAuth: (user: any, token: string) => void;
  invitationCode?: string;
}

export function Auth({ onAuth, invitationCode }: AuthProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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
