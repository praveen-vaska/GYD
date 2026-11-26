"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
}

interface ToastContextValue {
  pushToast: (toast: Omit<ToastItem, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: Omit<ToastItem, "id">) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
      window.setTimeout(() => removeToast(id), 4200);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ pushToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-[90] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2.5 pointer-events-none"
      >
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon =
              t.type === "success"
                ? CheckCircle2
                : t.type === "error" || t.type === "warning"
                  ? AlertCircle
                  : Info;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "pointer-events-auto flex items-start gap-3 rounded-2xl border p-3.5 shadow-lg bg-brand-surface",
                  t.type === "success" && "border-brand-success-border",
                  t.type === "error" && "border-brand-error-border",
                  t.type === "warning" && "border-brand-warning-border",
                  t.type === "info" && "border-brand-info-border"
                )}
              >
                <Icon
                  className={cn(
                    "mt-0.5 h-4.5 w-4.5 shrink-0",
                    t.type === "success" && "text-brand-success",
                    t.type === "error" && "text-brand-error",
                    t.type === "warning" && "text-brand-warning",
                    t.type === "info" && "text-brand-info"
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-brand-text">{t.title}</p>
                  {t.description && (
                    <p className="mt-0.5 text-xs text-brand-text-secondary">
                      {t.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(t.id)}
                  aria-label="Dismiss notification"
                  className="rounded-lg p-1 text-brand-muted hover:bg-brand-surface-muted hover:text-brand-text"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
