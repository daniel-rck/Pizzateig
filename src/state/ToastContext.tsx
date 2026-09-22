import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type ToastContextValue = {
  /** Show a short confirmation; replaces any toast still on screen. */
  showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_MS = 2500;

/**
 * App-wide toast. Lives above the routes so feedback survives navigation
 * (e.g. "Rezept geladen" after jumping from the list back to the calculator).
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  // The id restarts the timer when the same message is shown twice in a row.
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);

  const showToast = useCallback((message: string) => {
    setToast((prev) => ({ id: (prev?.id ?? 0) + 1, message }));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(t);
  }, [toast]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <div
          key={toast.id}
          role="status"
          className="fixed inset-x-0 top-16 z-50 mx-auto w-fit max-w-[calc(100%-2rem)] animate-fade-in rounded-full bg-fg px-4 py-2 text-sm font-medium text-surface shadow-lg"
        >
          {toast.message}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
