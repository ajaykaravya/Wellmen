import React from "react";

export type ButtonGroupOption<T = string | number> = {
  key: T;
  label: string;
};

interface ButtonGroupProps<T = string | number> {
  title: string;
  selected: T | null;
  options: ButtonGroupOption<T>[];
  onSelect: (key: T) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export function ButtonGroup<T extends string | number>({
  title,
  selected,
  options,
  onSelect,
  error,
  required = false,
  disabled = false,
}: ButtonGroupProps<T>) {
  return (
    <div className="space-y-2">
      <p className="text-sm">
        {title}
        {required && <span className="text-red-600"> *</span>}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected === option.key;
          return (
            <button
              key={String(option.key)}
              type="button"
              aria-pressed={isSelected}
              disabled={disabled}
              onClick={() => onSelect(option.key)}
              className={
                isSelected
                  ? "rbac-button"
                  : "rbac-button rbac-button-secondary"
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
