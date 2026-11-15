"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

export type ToastTone = "info" | "success" | "warning" | "danger";

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  tone?: ToastTone;
}

export interface ToastContextValue {
  toasts: ToastMessage[];
  pushToast: (toast: Omit<ToastMessage, "id">, durationMs?: number) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toasts: [],
  pushToast: () => undefined,
  dismissToast: () => undefined,
});

const TONE_CLASSES: Record<ToastTone, string> = {
  info: "border-indigo-500 bg-surface-raised text-text-primary",
  success: "border-edge-600 bg-edge-100 text-edge-600",
  warning: "border-warning-600 bg-offline-100 text-offline-600",
  danger: "border-danger-600 bg-surface-raised text-danger-600",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: Omit<ToastMessage, "id">, durationMs = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { ...toast, id }]);
      if (durationMs > 0 && typeof window !== "undefined") {
        window.setTimeout(() => {
          dismissToast(id);
        }, durationMs);
      }
    },
    [dismissToast],
  );

  return (
    <ToastContext.Provider value={{ toasts, pushToast, dismissToast }}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}

export function Toaster({
  toasts,
  onDismiss,
}: {
  toasts: readonly ToastMessage[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-20 right-4 z-50 flex flex-col gap-2 lg:bottom-6 lg:right-6"
    >
      {toasts.map((item) => {
        const tone = item.tone ?? "info";
        return (
          <div
            key={item.id}
            role="status"
            className={`flex min-w-[260px] max-w-sm items-start justify-between gap-3 rounded-xl border-l-4 px-4 py-3 shadow-[var(--shadow-2)] ${TONE_CLASSES[tone]}`}
          >
            <div>
              <p className="text-sm font-semibold">{item.title}</p>
              {item.description ? (
                <p className="mt-0.5 text-xs opacity-90">{item.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(item.id)}
              aria-label="Dismiss notification"
              className="text-xs font-medium opacity-75 hover:opacity-100"
            >
              &times;
            </button>
          </div>
        );
      })}
    </div>
  );
}
