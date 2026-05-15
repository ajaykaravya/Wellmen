"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";

type ListingFilterDialogProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  onApply: () => void;
  children: ReactNode;
  description?: string;
  activeCount?: number;
  applyLabel?: string;
  closeLabel?: string;
  maxWidthClassName?: string;
};

export default function ListingFilterDialog({
  open,
  title,
  onClose,
  onApply,
  children,
  description,
  activeCount = 0,
  applyLabel = "Apply Filters",
  closeLabel = "Close",
  maxWidthClassName = "max-w-3xl",
}: ListingFilterDialogProps) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <Dialog
  open={open}
  onClose={() => {}}
  className="relative z-100"
>
   <DialogBackdrop
    className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm transition-opacity"
    aria-hidden="true"
  />

      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
    <DialogPanel
      className={`theme-modal-surface relative z-[102] ${maxWidthClassName} rounded-2xl border border-white/10 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)]`}
    >
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-lg font-semibold theme-text">
                {title}
              </DialogTitle>
              {description && (
                <p className="mt-1 text-sm theme-text-muted">{description}</p>
              )}
            </div>

            {activeCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-[color:var(--theme-surface-2)] px-3 py-1 text-xs font-semibold theme-text">
                {activeCount} active
              </span>
            )}
          </div>

          <div className="mt-4 grid gap-4">{children}</div>

          <div className="mt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              className="rbac-button rbac-button-secondary theme-button-secondary"
              onClick={onClose}
            >
              {closeLabel}
            </button>
            <button type="button" className="rbac-button" onClick={onApply}>
              {applyLabel}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
