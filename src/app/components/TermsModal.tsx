import { X, Trophy, Clock, Users, Award, Shield, FileText, ScrollText } from 'lucide-react';

interface TermsProps {
  onClose: () => void;
}

/* ─── Shared content blocks ─────────────────────────────────────────────── */

function TermsLeft() {
  return (
    <div className="space-y-4">
      {/* 1 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Users className="w-3 h-3 text-primary" />
          </div>
          <h3 className="font-bold text-foreground text-sm">1. Inscripción y Participación</h3>
        </div>
        <ul className="space-y-1 text-xs text-muted-foreground leading-relaxed pl-8">
          <li><span className="font-semibold text-foreground">Cuentas:</span> Cada participante podrá registrarse con una única cuenta, utilizando datos que permitan identificarlo.</li>
          <li><span className="font-semibold text-foreground">Fecha Límite:</span> Inscripción abierta hasta un día antes del primer partido. Vencido el plazo, no se aceptarán nuevos participantes.</li>
        </ul>
      </div>

      <div className="border-t border-border/30" />

      {/* 2 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Trophy className="w-3 h-3 text-primary" />
          </div>
          <h3 className="font-bold text-foreground text-sm">2. Sistema de Puntuación</h3>
        </div>
        <p className="text-xs text-muted-foreground pl-8">Puntos asignados automáticamente al culminar el último partido del día (no acumulables por partido):</p>
        <div className="pl-8 space-y-1">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/8 border border-amber-500/15">
            <span className="text-base leading-none flex-shrink-0">⚽</span>
            <div>
              <span className="font-bold text-amber-500 text-xs">Marcador Exacto +5 pts</span>
              <p className="text-[11px] text-muted-foreground">Acierta el resultado idéntico (Ej: Pronóstico 2-1 / Real 2-1).</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/8 border border-primary/15">
            <span className="text-base leading-none flex-shrink-0">🎯</span>
            <div>
              <span className="font-bold text-primary text-xs">Ganador o Empate +2 pts</span>
              <p className="text-[11px] text-muted-foreground">Acierta la tendencia pero no el marcador exacto.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border/30">
            <span className="text-base leading-none flex-shrink-0">❌</span>
            <div>
              <span className="font-bold text-muted-foreground text-xs">Sin acierto — 0 pts</span>
              <p className="text-[11px] text-muted-foreground">No se acierta ganador, empate ni marcador.</p>
            </div>
          </div>
        </div>
        <div className="pl-8 space-y-0.5">
          <p className="text-[11px] text-muted-foreground flex items-start gap-1"><span className="text-amber-500 flex-shrink-0">⚠️</span>Grupos y eliminación directa otorgan los mismos puntos.</p>
          <p className="text-[11px] text-muted-foreground flex items-start gap-1"><span className="text-amber-500 flex-shrink-0">⚠️</span>En eliminatorias el resultado válido es al 90' + descuento. No se consideran penales ni tiempos extra.</p>
        </div>
      </div>
    </div>
  );
}

function TermsRight() {
  return (
    <div className="space-y-4">
      {/* 3 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Clock className="w-3 h-3 text-primary" />
          </div>
          <h3 className="font-bold text-foreground text-sm">3. Registro de Pronósticos</h3>
        </div>
        <ul className="space-y-1 text-xs text-muted-foreground leading-relaxed pl-8">
          <li><span className="font-semibold text-foreground">Tiempo Límite:</span> Los pronósticos se bloquean automáticamente <span className="font-bold text-foreground">1 hora antes</span> del pitazo inicial.</li>
          <li><span className="font-semibold text-foreground">Responsabilidad:</span> Es total responsabilidad del participante ingresar sus apuestas a tiempo. No se realizarán modificaciones manuales bajo ninguna circunstancia.</li>
        </ul>
      </div>

      <div className="border-t border-border/30" />

      {/* 4 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Shield className="w-3 h-3 text-primary" />
          </div>
          <h3 className="font-bold text-foreground text-sm">4. Criterios de Desempate</h3>
        </div>
        <p className="text-xs text-muted-foreground pl-8 leading-relaxed">
          En igualdad de puntos, tiene ventaja quien posea más <span className="font-bold text-foreground">Marcadores Exactos (+5 pts)</span>. Si persiste el empate, el premio se reparte entre los participantes empatados.
        </p>
      </div>

      <div className="border-t border-border/30" />

      {/* 5 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Award className="w-3 h-3 text-primary" />
          </div>
          <h3 className="font-bold text-foreground text-sm">5. Premios y Transparencia</h3>
        </div>
        <div className="pl-8 space-y-2">
          <p className="text-xs text-muted-foreground">Inscripción: <span className="font-bold text-foreground">20 soles</span> por participante. El fondo acumulado se reparte:</p>
          <div className="flex gap-2">
            <div className="flex-1 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
              <div className="text-base font-black text-amber-500">70%</div>
              <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">1.er Puesto</div>
            </div>
            <div className="flex-1 p-2 rounded-xl bg-slate-400/10 border border-slate-400/20 text-center">
              <div className="text-base font-black text-slate-400">30%</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">2.do Puesto</div>
            </div>
          </div>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li><span className="font-semibold text-foreground">Resultados:</span> La tabla de posiciones y puntajes son visibles para todos en la plataforma.</li>
            <li><span className="font-semibold text-foreground">Auditoría:</span> Reclamos sobre asignación de puntos dentro de las <span className="font-bold text-foreground">24 horas</span> posteriores al partido.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ─── Modal: Ranking (2 cols, sin scroll, offset sobre navbar) ─────────── */
export function TermsModal({ onClose }: TermsProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-20 sm:pt-24">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-card border border-border/60 rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.3)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-primary/8 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Trophy className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-base font-black text-foreground tracking-tight">Bases del Juego</h2>
              <p className="text-[11px] text-muted-foreground font-medium">Polla Mundial 2026</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <TermsLeft />
          <TermsRight />
        </div>
        <div className="px-5 pb-4 pt-1 border-t border-border/30">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'var(--gradient-primary)', color: 'white' }}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Drawer: usado si en algún punto se necesita overlay lateral ─────── */
export function TermsDrawer({ onClose }: TermsProps) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm h-full bg-card border-l border-border/60 shadow-[-24px_0_80px_rgba(0,0,0,0.25)] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0 bg-gradient-to-r from-primary/8 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-base font-black text-foreground tracking-tight">Bases del Juego</h2>
              <p className="text-[11px] text-muted-foreground font-medium">Polla Mundial 2026</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <TermsLeft />
          <div className="border-t border-border/30" />
          <TermsRight />
        </div>
        <div className="px-5 pb-5 pt-3 border-t border-border/40 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'var(--gradient-primary)', color: 'white' }}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Panel estático: siempre visible a la derecha en landing page ──────── */
export function TermsPanel() {
  return (
    <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-3xl shadow-mundial-lg overflow-hidden flex flex-col">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border/50 bg-gradient-to-r from-primary/8 to-transparent flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
          <ScrollText className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-base font-black text-foreground tracking-tight">Bases del Juego</h2>
          <p className="text-[11px] text-muted-foreground font-medium">Polla Mundial 2026</p>
        </div>
      </div>
      <div className="overflow-y-auto px-5 py-4 space-y-4">
        <TermsLeft />
        <div className="border-t border-border/30" />
        <TermsRight />
      </div>
    </div>
  );
}
