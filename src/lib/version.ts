/**
 * version.ts — Auto-recarga cuando hay un deploy nuevo (cache-busting).
 *
 * Problema: tras un push, algunos navegadores siguen sirviendo el index.html /
 * bundle viejo desde caché, dejando al usuario en una versión obsoleta.
 *
 * Solución: cada build inyecta una versión única (__APP_VERSION__, ver
 * vite.config.ts) y escribe dist/version.json con ese mismo valor. En runtime
 * comparamos la versión "horneada" en el bundle que corre contra el version.json
 * del servidor (pedido con cache: 'no-store', siempre fresco). Si difieren, hay
 * un deploy más nuevo → forzamos un reload.
 *
 * Es seguro contra loops: tras recargar con el bundle nuevo, __APP_VERSION__
 * coincide con el server y ya no vuelve a recargar.
 */

// Inyectado por Vite (define). Fallback 'dev' cuando se corre sin build.
declare const __APP_VERSION__: string;
export const RUNNING_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';

// Evita recargas repetidas dentro de la misma sesión si algo sale mal.
const RELOAD_GUARD_KEY = 'app_version_reloaded_to';

async function fetchServerVersion(): Promise<string | null> {
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.version === 'string' ? data.version : null;
  } catch {
    return null;
  }
}

function maybeReload(serverVersion: string | null) {
  if (!serverVersion) return;
  // En dev no hay version.json que coincida; no recargar.
  if (RUNNING_VERSION === 'dev') return;
  if (serverVersion === RUNNING_VERSION) return;

  // Guard: si ya intentamos recargar hacia esta versión y seguimos en la vieja
  // (p. ej. index.html cacheado a nivel de host), no entrar en loop.
  if (sessionStorage.getItem(RELOAD_GUARD_KEY) === serverVersion) return;
  sessionStorage.setItem(RELOAD_GUARD_KEY, serverVersion);

  window.location.reload();
}

/**
 * Arranca el chequeo de versión: una vez al cargar, otra al volver a la pestaña,
 * y cada 5 min para tabs de larga vida (durante un partido en vivo, p. ej.).
 */
export function startVersionWatcher() {
  const check = () => { void fetchServerVersion().then(maybeReload); };

  check(); // al entrar a la página

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check();
  });

  setInterval(check, 5 * 60 * 1000);
}
