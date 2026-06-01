"use client";

type CompanyCodeBadgeProps = {
  code?: string | null;
  fallback?: string;
  className?: string;
};

const badgeStyles = [
  "bg-sky-100 text-sky-700 ring-sky-200",
  "bg-emerald-100 text-emerald-700 ring-emerald-200",
  "bg-amber-100 text-amber-800 ring-amber-200",
  "bg-rose-100 text-rose-700 ring-rose-200",
  "bg-violet-100 text-violet-700 ring-violet-200",
  "bg-cyan-100 text-cyan-800 ring-cyan-200",
  "bg-lime-100 text-lime-800 ring-lime-200",
  "bg-orange-100 text-orange-700 ring-orange-200",
];

const hashCode = (value: string) =>
  Array.from(value).reduce((acc, char) => acc + char.charCodeAt(0), 0);

const getBadgeClassName = (code: string) =>
  badgeStyles[hashCode(code.toUpperCase()) % badgeStyles.length];

export default function CompanyCodeBadge({
  code,
  fallback = "-",
  className = "",
}: CompanyCodeBadgeProps) {
  const label = code?.trim() || fallback;

  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1 ${getBadgeClassName(label)} ${className}`.trim()}
    >
      {label}
    </span>
  );
}
