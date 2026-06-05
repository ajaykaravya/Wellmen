"use client";

import { useEffect } from "react";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  confirmLoading?: boolean;
  confirmLoadingLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  confirmLoading = false,
  confirmLoadingLabel = "Loading...",
  cancelLabel = "Cancel",
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        className="theme-modal-overlay fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      <div className="fixed inset-0 z-[51] flex items-center justify-center px-4">
        <DialogPanel className="theme-modal-surface relative w-full max-w-md rounded-2xl p-6 shadow-xl">
          <DialogTitle className="text-lg font-semibold theme-text">
            {title}
          </DialogTitle>

          {description && (
            <p className="mt-2 text-sm theme-text-muted">{description}</p>
          )}

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              className="rbac-button rbac-button-secondary theme-button-secondary"
              type="button"
              disabled={confirmLoading}
              onClick={onClose}
            >
              {cancelLabel}
            </button>
            <button
              className="rbac-button"
              type="button"
              onClick={onConfirm}
              disabled={confirmLoading}
            >
              {confirmLoading ? confirmLoadingLabel : confirmLabel}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
