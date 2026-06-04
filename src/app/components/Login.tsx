import { useState } from 'react';
import { Trophy, User, Lock, LogIn } from 'lucide-react';
import imgLogo from '../../imports/2026_FIFA_World_Cup_Logo_2023-s2560.png';

interface LoginProps {
  onLogin: (username: string, password: string) => Promise<void>;
}

export function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);
    try {
      await onLogin(username, password);
    } catch (err) {
      setError('Usuario o contraseña incorrectos');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl" style={{ background: 'var(--blob-purple)' }} />
      <div className="absolute top-1/4 right-0 w-80 h-80 rounded-full blur-3xl" style={{ background: 'var(--blob-cyan)' }} />
      <div className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full blur-3xl" style={{ background: 'var(--blob-lime)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-3xl" style={{ background: 'var(--blob-fuscia)' }} />

      {/* Login Card */}
      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-mundial-lg border border-border p-6 sm:p-8 lg:p-10">
          {/* Logo del Mundial 2026 */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <img
              src={imgLogo}
              alt="Mundial 2026"
              className="h-24 sm:h-32 w-auto object-contain"
            />
          </div>

          {/* Título */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gradient-mundial">
              Polla Mundial 2026
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Inicia sesión para comenzar a jugar
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-input-background border-2 border-border focus:border-primary focus:outline-none transition-all text-foreground"
                  placeholder="Tu nombre de usuario"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-input-background border-2 border-border focus:border-primary focus:outline-none transition-all text-foreground"
                  placeholder="Tu contraseña"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-2 sm:p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-mundial bg-primary text-primary-foreground"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Ingresando...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <LogIn className="w-5 h-5" />
                  Iniciar Sesión
                </span>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-xl bg-muted border border-border">
            <p className="text-xs text-muted-foreground text-center mb-2 font-medium">
              Credenciales de prueba:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center">
                <span className="text-muted-foreground">Usuario:</span>
                <p className="font-mono font-bold text-foreground">demo</p>
              </div>
              <div className="text-center">
                <span className="text-muted-foreground">Contraseña:</span>
                <p className="font-mono font-bold text-foreground">demo123</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 sm:mt-8 text-center">
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
              <span>Mundial FIFA 2026</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
