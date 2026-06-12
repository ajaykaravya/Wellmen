"use client";

import { FaCheck, FaChevronLeft } from "react-icons/fa";

type PetiCashStep = {
  label: string;
  description?: string;
};

type PetiCashStepperProps = {
  title: string;
  steps: readonly PetiCashStep[];
  activeStep: number;
  onBack?: () => void;
  onStepClick?: (stepIndex: number) => void;
  children: React.ReactNode;
};

export default function PetiCashStepper({
  title,
  steps,
  activeStep,
  onBack,
  onStepClick,
  children,
}: PetiCashStepperProps) {
  return (
    <section className="">
      <div className="rbac-card overflow-hidden h-full">
        <div className="flex flex-col h-full justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="rbac-title-lg">{title}</h3>
              </div>

              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--brand-dark)]"
                >
                  <FaChevronLeft size={12} />
                  Back
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {steps.map((step, index) => {
                const isActive = index === activeStep;
                const isCompleted = index < activeStep;

                return (
                  <button
                    key={step.label}
                    type="button"
                    className={`inline-flex min-w-0 items-center rounded-full border px-3 py-1.5 text-left transition-colors ${
                      onStepClick ? "cursor-pointer" : "cursor-default"
                    } ${
                      isActive
                        ? "border-[color:var(--brand)] bg-[color:var(--brand)]/10 text-[color:var(--brand-dark)]"
                        : isCompleted
                          ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-700"
                          : "border-[color:var(--theme-border)] bg-[color:var(--theme-surface-2)] text-[color:var(--theme-text-muted)]"
                    }`}
                    onClick={() => {
                      if (!onStepClick) return;
                      if (index <= activeStep) onStepClick(index);
                    }}
                    disabled={!onStepClick || index > activeStep}
                  >
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                      {isCompleted && <FaCheck size={10} />}
                      {step.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div>{children}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
