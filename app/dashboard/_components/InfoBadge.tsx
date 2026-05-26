"use client";

import { ReactNode } from "react";

type InfoBadgeProps = {
  children: ReactNode;
  variant?: "payment" | "project" | "person" | "default";
  className?: string;
};

const variantClasses = {
  default: "bg-slate-100 text-slate-700 ring-slate-200",
  payment: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  project: "bg-mist-100 text-mist-800 ring-mist-200",
  person: "text-black-700",
};

export default function InfoBadge({
  children,
  variant = "default",
  className = "",
}: InfoBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ${variantClasses[variant]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}
