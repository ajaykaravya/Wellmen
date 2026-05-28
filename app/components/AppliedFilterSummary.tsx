"use client";

import type { ReactNode } from "react";

type AppliedFilterSummaryProps = {
  items: string[];
  onClear: () => void;
  clearLabel?: string;
  title?: string;
  className?: string;
  emptyState?: ReactNode;
};

export default function AppliedFilterSummary({
  items,
  onClear,
  clearLabel = "Clear Filters",
  title,
  className = "",
  emptyState = null,
}: AppliedFilterSummaryProps) {
  const activeItems = items.filter(Boolean);

  if (activeItems.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <div
      className={`mt-4 flex items-center justify-between gap-3 rounded-xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-2)] px-4 py-3 ${className}`}
    >
      <div className="text-sm">
        {title && <span className="font-semibold theme-text">{title}:</span>}
        {activeItems.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="mx-1 inline-flex items-center rounded-full bg-[color:var(--theme-surface)] px-3 py-1 text-xs font-medium theme-text"
          >
            {item}
          </span>
        ))}
      </div>
      <button
        className="rbac-button h-fit rbac-button-secondary theme-button-secondary"
        type="button"
        onClick={onClear}
      >
        {clearLabel}
      </button>
    </div>
  );
}
