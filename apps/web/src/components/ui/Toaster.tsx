'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

export interface Toast {
  id: string;
  message: string;
}

interface ToasterProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timeout = setTimeout(() => onDismiss(toast.id), 5000);
    return () => clearTimeout(timeout);
  }, [toast.id, onDismiss]);

  return (
    <div className="flex w-80 max-w-[calc(100vw-2rem)] items-center justify-between gap-2 rounded-lg bg-slate-800 px-3 py-2.5 text-sm text-white shadow-lg">
      <span className="min-w-0 flex-1">{toast.message}</span>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="rounded p-1 text-slate-300 transition hover:bg-white/10 hover:text-white"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

export function Toaster({ toasts, onDismiss }: ToasterProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
