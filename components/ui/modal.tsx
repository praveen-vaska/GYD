"use client";

import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidthClassName?: string;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  maxWidthClassName = "max-w-xl",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-[2px]"
          />
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "relative z-10 w-full max-h-[90vh] overflow-y-auto rounded-[20px] border border-brand-border bg-brand-surface p-6 shadow-2xl",
              maxWidthClassName
            )}
          >
            {(title || description) && (
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  {title && (
                    <h2 className="font-editorial text-2xl font-semibold text-brand-text">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="mt-1 text-sm text-brand-text-secondary">
                      {description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close modal"
                  className="rounded-xl p-2 text-brand-muted hover:bg-brand-surface-muted hover:text-brand-text transition-colors"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
