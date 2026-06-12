"use client";

import type { ReactNode } from "react";
import { FaCheck } from "react-icons/fa";

export type SelectionCardOption<T> = {
  key: T;
  label: string;
  subtitle?: string;
  icon?: ReactNode;
  accentClassName?: string;
};

type SelectionCardGridProps<T> = {
  title: string;
  options: SelectionCardOption<T>[];
  selected: T | null;
  onSelect: (value: T) => void;
  error?: string;
  required?: boolean;
  columnsClassName?: string;
};

export default function SelectionCardGrid<T>({
  title,
  options,
  selected,
  onSelect,
  error,
  required = false,
  columnsClassName = "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3",
}: SelectionCardGridProps<T>) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-[color:var(--theme-text)]">
        {title}
        {required && <span className="text-red-600"> *</span>}
      </p>

      <div className={columnsClassName}>
        {options.map((option, index) => {
          const isSelected = selected === option.key;

          return (
            <button
              key={String(option.key)}
              type="button"
              onClick={() => onSelect(option.key)}
              aria-pressed={isSelected}
              className={`group flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left transition-all ${
                isSelected
                  ? "border-[color:var(--brand)] bg-[color:var(--theme-surface)] shadow-[0_10px_24px_rgba(15,23,42,0.12)]"
                  : `border-[color:var(--theme-border)] bg-[color:var(--theme-surface-2)] hover:border-[color:var(--brand-border-soft)] hover:bg-[color:var(--theme-surface)] ${option.accentClassName || ""}`
              }`}
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-lg ${
                  isSelected
                    ? "border-[color:var(--brand)] bg-[color:var(--brand)]/10 text-[color:var(--brand-dark)]"
                    : "border-transparent bg-[color:var(--brand)]/10 text-[color:var(--brand-dark)]"
                }`}
              >
                {isSelected ? <FaCheck size={14} /> : option.icon || index + 1}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-[color:var(--theme-text)]">
                  {option.label}
                </p>
                <p
                  className={`text-sm font-medium ${
                    isSelected
                      ? "text-[color:var(--brand)]"
                      : "text-[color:var(--theme-text-muted)]"
                  }`}
                >
                  {option.subtitle || "Tap to select →"}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
