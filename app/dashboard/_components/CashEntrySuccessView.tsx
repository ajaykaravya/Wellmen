"use client";

import { FaArrowRightLong } from "react-icons/fa6";


type CashEntrySuccessDetail = {
  label: string;
  value: string;
};

type CashEntrySuccessViewProps = {
  title: string;
  subtitle?: string;
  details: CashEntrySuccessDetail[];
  onAddAnother: () => void;
  onDashboard: () => void;
};

export default function CashEntrySuccessView({
  title,
  subtitle,
  details,
  onAddAnother,
  onDashboard,
}: CashEntrySuccessViewProps) {
  return (
    <section className="rbac-section rbac-container">
      <div className="rbac-card grid gap-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--brand)]/10 text-[color:var(--brand)]">
            <span className="text-3xl">₹</span>
          </div>
          <h3 className="rbac-title-lg text-[color:var(--brand)]">{title}</h3>
          {subtitle && (
            <p className="mt-2 text-sm text-[color:var(--theme-text-muted)]">
              {subtitle}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-2)]">
          {details.map((detail) => (
            <div
              key={detail.label}
              className="flex items-center justify-between gap-4 border-b border-[color:var(--theme-border)] px-4 py-3 last:border-b-0"
            >
              <span className="text-sm font-medium text-[color:var(--theme-text-muted)]">
                {detail.label}
              </span>
              <span className="text-sm font-semibold text-[color:var(--theme-text)]">
                {detail.value}
              </span>
            </div>
          ))}
        </div>

        <div className="flex justify-between gap-5 items-center">
          <button
            type="button"
            className="rbac-button w-full"
            onClick={onAddAnother}
          >
            + Add Another
          </button>
          <button
            type="button"
            className="rbac-button flex items-center gap-2 rbac-button-secondary"
            onClick={onDashboard}
          >
            Dashboard <FaArrowRightLong />
          </button>
        </div>
      </div>
    </section>
  );
}
