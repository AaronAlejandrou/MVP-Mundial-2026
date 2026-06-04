import { useState, useCallback, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastProps) {
  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => (
        <ToastMessage key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastMessage({ toast, onRemove }: { toast: ToastItem; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const styles = {
    success: {
      bg: 'bg-white border-secondary',
      icon: <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0" />,
    },
    error: {
      bg: 'bg-white border-destructive',
      icon: <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />,
    },
    info: {
      bg: 'bg-white border-primary',
      icon: <AlertCircle className="w-5 h-5 text-primary flex-shrink-0" />,
    },
  };

  const s = styles[toast.type];

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border-2 shadow-mundial-lg ${s.bg}`}
      style={{ animation: 'slideInRight 0.25s ease-out' }}
    >
      {s.icon}
      <p className="text-sm font-medium text-foreground flex-1">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Hook
export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, toast, remove };
}
