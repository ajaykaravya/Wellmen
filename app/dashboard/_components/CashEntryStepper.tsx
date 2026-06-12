"use client";

import { FaCheck, FaChevronLeft } from "react-icons/fa";

type CashEntryStep = {
  label: string;
  description?: string;
};

type CashEntryStepperProps = {
  title: string;
  steps: readonly CashEntryStep[];
  activeStep: number;
  onBack?: () => void;
  onStepClick?: (stepIndex: number) => void;
  children: React.ReactNode;
  incomeId?: string;
  dailyExpenseId?: string;
};

export default function CashEntryStepper({
  title,
  steps,
  activeStep,
  onBack,
  onStepClick,
  children,
  incomeId,
  dailyExpenseId,
}: CashEntryStepperProps) {
  return (
    <section className={` ${incomeId || dailyExpenseId ? "p-4" : ""}`}>
      <div className="rbac-card overflow-hidden h-full">
        <div className="flex flex-col h-full justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="rbac-title-lg">{title}</h3>
                <p className="mt-1 text-sm text-[color:var(--theme-text-muted)]">
                  Step {activeStep + 1} of {steps.length}
                </p>
              </div>

              {onBack && activeStep > 0 && (
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

            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              {steps.map((step, index) => {
                const isActive = index === activeStep;
                const isCompleted = index < activeStep;

                return (
                  <button
                    key={step.label}
                    type="button"
                    className={`flex min-w-0 items-center gap-3 rounded-full px-0 py-0 text-left ${
                      onStepClick ? "cursor-pointer" : "cursor-default"
                    }`}
                    onClick={() => {
                      if (!onStepClick) return;
                      if (index <= activeStep) onStepClick(index);
                    }}
                    disabled={!onStepClick || index > activeStep}
                  >
                    <span
                      className={`flex h-6 w-6 md:h-8 md:w-8 items-center justify-center rounded-full border text-[10px] md:text-sm font-bold transition-colors ${
                        isCompleted
                          ? "border-emerald-400 bg-emerald-500 text-white"
                          : isActive
                            ? "border-sky-400 bg-sky-500 text-white"
                            : "border-[color:var(--theme-border)] bg-[color:var(--theme-surface-2)] text-[color:var(--theme-text-muted)]"
                      }`}
                    >
                      {isCompleted ? <FaCheck size={12} /> : index + 1}
                    </span>
                    <div className="min-w-0">
                      <p
                        className={`text-[10px] md:text-xs font-semibold ${
                          isActive
                            ? "text-[color:var(--brand-dark)]"
                            : isCompleted
                              ? "text-[color:var(--theme-text)]"
                              : "text-[color:var(--theme-text-muted)]"
                        }`}
                      >
                        {step.label}
                      </p>
                      {step.description && (
                        <p className="text-xs text-[color:var(--theme-text-muted)]">
                          {step.description}
                        </p>
                      )}
                    </div>
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
