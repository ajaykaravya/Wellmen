"use client";

import React from "react";

type UserOption = {
  id: string;
  firstName: string;
  lastName: string;
  role?: string | null;
};

interface UserCardGroupProps {
  title: string;
  selected: string | string[];
  users: UserOption[];
  onSelect: (userId: string | string[]) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  emptyMessage?: string;
  multiple?: boolean;
}

function getUserDisplayName(user: UserOption) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
}

export function UserCardGroup({
  title,
  selected,
  users,
  onSelect,
  error,
  required = false,
  disabled = false,
  emptyMessage = "No users available.",
  multiple = false,
}: UserCardGroupProps) {
  const selectedIds = Array.isArray(selected) ? selected : selected ? [selected] : [];

  return (
    <div className="space-y-2">
      <p className="text-sm">
        {title}
        {required && <span className="text-red-600"> *</span>}
      </p>

      {users.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {users.map((user) => {
            const isSelected = multiple
              ? selectedIds.includes(user.id)
              : selected === user.id;

            return (
              <button
                key={user.id}
                type="button"
                aria-pressed={multiple ? undefined : isSelected}
                aria-checked={multiple ? isSelected : undefined}
                role={multiple ? "checkbox" : undefined}
                disabled={disabled}
                onClick={() => {
                  if (!multiple) {
                    onSelect(user.id);
                    return;
                  }

                  const nextSelected = isSelected
                    ? selectedIds.filter((id) => id !== user.id)
                    : [...selectedIds, user.id];
                  onSelect(nextSelected);
                }}
                className={
                  isSelected
                    ? "rbac-button flex flex-col items-start gap-1 text-left"
                    : "rbac-button rbac-button-secondary flex flex-col items-start gap-1 text-left"
                }
              >
                <span className="flex w-full items-center justify-between gap-3 font-medium">
                  <span>{getUserDisplayName(user)}</span>
                  {multiple && (
                    <span
                      className={
                        isSelected
                          ? "inline-flex h-4 w-4 items-center justify-center rounded-full bg-[var(--theme-primary)] text-[10px] text-white"
                          : "inline-flex h-4 w-4 items-center justify-center rounded-full border border-current text-[10px] opacity-60"
                      }
                      aria-hidden="true"
                    >
                      {isSelected ? "✓" : ""}
                    </span>
                  )}
                </span>
                <span className="text-xs opacity-75">
                  {user.role || "User"}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
