"use client";

type SelectionPill = {
  label: string;
  tone?: "default" | "brand" | "success" | "warning";
};

type SelectionPillsProps = {
  items: SelectionPill[];
};

const toneClassName: Record<NonNullable<SelectionPill["tone"]>, string> = {
  default: "bg-[color:var(--theme-surface-2)] text-[color:var(--theme-text)]",
  brand: "bg-[color:var(--brand)]/10 text-[color:var(--brand-dark)]",
  success: "bg-emerald-500/10 text-emerald-700",
  warning: "bg-amber-500/10 text-amber-700",
};

export default function SelectionPills({ items }: SelectionPillsProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item.label}
          className={`inline-flex max-w-full items-center rounded-full px-3 py-1 text-sm font-semibold ${toneClassName[item.tone || "default"]}`}
        >
          <span className="truncate">{item.label}</span>
        </span>
      ))}
    </div>
  );
}
