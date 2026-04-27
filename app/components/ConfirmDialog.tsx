"use client";

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
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="theme-surface-inverse w-full max-w-md rounded-2xl p-6 shadow-xl">
        <h2 className="text-lg font-semibold theme-text">{title}</h2>
        {description && <p className="mt-2 text-sm theme-text-muted">{description}</p>}
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
      </div>
    </div>
  );
}
