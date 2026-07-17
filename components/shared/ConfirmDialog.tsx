"use client";

import { useEffect, useRef } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Conferma",
  cancelLabel = "Annulla",
  variant = "default",
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div ref={dialogRef} className="veil-premium-card mx-4 w-full max-w-md p-6 shadow-2xl">
        <h3 className="text-lg text-veil-gold">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-white/70">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button className="veil-btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`veil-btn ${variant === "danger" ? "!bg-red-600 hover:!bg-red-500" : ""}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
