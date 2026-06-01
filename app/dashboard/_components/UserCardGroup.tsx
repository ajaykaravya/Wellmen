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
  selected: string;
  users: UserOption[];
  onSelect: (userId: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  emptyMessage?: string;
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
}: UserCardGroupProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        {title}
        {required && <span className="text-red-600"> *</span>}
      </p>

      {users.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {users.map((user) => {
            const isSelected = selected === user.id;

            return (
              <button
                key={user.id}
                type="button"
                aria-pressed={isSelected}
                disabled={disabled}
                onClick={() => onSelect(user.id)}
                className={
                  isSelected
                    ? "rbac-button flex flex-col items-start gap-1 text-left"
                    : "rbac-button rbac-button-secondary flex flex-col items-start gap-1 text-left"
                }
              >
                <span className="font-medium">{getUserDisplayName(user)}</span>
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
