"use client";

import { useEffect, type ReactNode } from "react";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: ModalProps) {
  useEffect(() => {
    if (!open || typeof window === "undefined") {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="fixed inset-0 bg-indigo-900/50 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-border bg-surface-raised p-6 shadow-[var(--shadow-3)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-text-primary">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-text-secondary">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="inline-flex size-9 items-center justify-center rounded-[10px] text-text-secondary hover:bg-indigo-100/60 hover:text-text-primary focus-visible:outline-2 focus-visible:outline-indigo-500"
          >
            <span aria-hidden="true" className="text-lg leading-none">
              &times;
            </span>
          </button>
        </div>
        <div className="mt-4">{children}</div>
        {footer ? (
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
