"use client";

import type { UserOption } from "@/lib/api/dashboard/shared-options";
import SelectionCardGrid from "./SelectionCardGrid";

type UserSelectionCardGridProps = {
  title: string;
  users: UserOption[];
  selected: string;
  onSelect: (userId: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  emptyMessage?: string;
  columnsClassName?: string;
};

function getUserDisplayName(user: UserOption) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
}

function getUserInitials(user: UserOption) {
  const first = user.firstName?.[0] || "";
  const last = user.lastName?.[0] || "";
  return (first + last).toUpperCase() || "?";
}

function getCardTone(index: number) {
  const tones = [
    "border-sky-500/20",
    "border-emerald-500/20",
    "border-amber-500/20",
    "border-fuchsia-500/20",
    "border-rose-500/20",
  ];
  return tones[index % tones.length];
}

export default function UserSelectionCardGrid({
  title,
  users,
  selected,
  onSelect,
  error,
  required = false,
  disabled = false,
  emptyMessage = "No users available.",
  columnsClassName = "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3",
}: UserSelectionCardGridProps) {
  if (users.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium text-[color:var(--theme-text)]">
          {title}
          {required && <span className="text-red-600"> *</span>}
        </p>
        <p className="text-sm text-[color:var(--theme-text-muted)]">{emptyMessage}</p>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <fieldset disabled={disabled} className={disabled ? "opacity-70" : undefined}>
      <SelectionCardGrid
        title={title}
        selected={selected || null}
        options={users.map((user, index) => ({
          key: user.id,
          label: getUserDisplayName(user),
          subtitle: user.role || "User",
          icon: (
            <span className="text-sm font-bold">{getUserInitials(user)}</span>
          ),
          accentClassName: getCardTone(index),
        }))}
        onSelect={onSelect}
        error={error}
        required={required}
        columnsClassName={columnsClassName}
      />
    </fieldset>
  );
}
