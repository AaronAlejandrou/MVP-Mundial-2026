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
        // Sign up
        const response = await apiFetch('/auth/signup', {
          method: 'POST',
          body: { email, password, nombre },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Error al registrarse');

        // Auto sign in after signup
        const signInResponse = await apiFetch('/auth/signin', {
          method: 'POST',
          body: { email, password },
        });
        const signInData = await signInResponse.json();
        if (!signInResponse.ok) throw new Error(signInData.error || 'Error al iniciar sesión');

        localStorage.setItem('auth_token', signInData.token);
        onAuth(signInData.user, signInData.token);
      } else {
        // Sign in
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full opacity-30" style={{ background: 'var(--blob-purple)' }} />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full opacity-30" style={{ background: 'var(--blob-cyan)' }} />
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-2xl shadow-mundial-lg border-2 border-border overflow-hidden">
          {/* Header */}
          <div className="px-6 sm:px-8 py-6 sm:py-8 text-center border-b-2 border-border bg-gradient-to-br from-purple-50 to-cyan-50">
            <img
              src={imgLogo}
              alt="Mundial 2026"
              className="h-16 sm:h-20 w-auto object-contain mx-auto mb-4"
            />
            <h1 className="text-xl sm:text-2xl font-bold text-gradient-mundial mb-2">
              Polla Mundial 2026
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              {invitationCode
                ? 'Únete a la liga con tu cuenta'
                : mode === 'login' ? 'Inicia sesión para continuar' : 'Crea tu cuenta'}
            </p>
          </div>

          {/* Form */}
          <div className="px-6 sm:px-8 py-6 sm:py-8">
            {invitationCode && (
              <div className="mb-6 p-4 bg-primary/10 rounded-lg border-2 border-primary/30">
                <p className="text-sm font-bold text-primary text-center">
                  Código de invitación: {invitationCode}
                </p>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border-2 border-destructive/30 rounded-lg">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">
                    Nombre
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-lg border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="Tu nombre"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-foreground mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-lg border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="tu@email.com"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-lg border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
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
                className="w-full py-3 px-6 rounded-lg font-bold text-white transition-all shadow-md hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{ background: 'var(--gradient-primary)' }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Procesando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {mode === 'login' ? (
                      <>
                        <LogIn className="w-5 h-5" />
                        Iniciar Sesión
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        Crear Cuenta
                      </>
                    )}
                  </span>
                )}
              </button>
            </form>

            {/* Toggle Mode */}
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login');
                  setError('');
                }}
                className="text-sm text-primary font-bold hover:underline"
                disabled={isLoading}
              >
                {mode === 'login'
                  ? '¿No tienes cuenta? Regístrate'
                  : '¿Ya tienes cuenta? Inicia sesión'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
