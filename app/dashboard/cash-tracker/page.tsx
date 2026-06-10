"use client";

import { type ComponentType, useState } from "react";
import {
  FaChartBar,
  FaMoneyBillWave,
  FaReceipt,
  FaWallet,
} from "react-icons/fa";
import DashboardShell from "../_components/DashboardShell";
import IncomeFormContent from "../income/_components/IncomeFormContent";
import DailyExpenseFormContent from "../daily-expenses/_components/DailyExpenseFormContent";
import CashPetiLedger from "../_components/CashPetiLedger";

type CashTrackerTab = "expense" | "income" | "cashPeti" | "dashboard";

const cashTrackerTabs: {
  key: CashTrackerTab;
  label: string;
  Icon: ComponentType<{ className?: string; size?: number }>;
}[] = [
  { key: "expense", label: "Expense", Icon: FaReceipt },
  { key: "income", label: "Income", Icon: FaMoneyBillWave },
  { key: "cashPeti", label: "Cash Peti", Icon: FaWallet },
  { key: "dashboard", label: "Dashboard", Icon: FaChartBar },
];

export default function CashTrackerPage() {
  const [selectedTab, setSelectedTab] = useState<CashTrackerTab>("expense");
  const goToDashboard = () => setSelectedTab("dashboard");

  const renderContent = () => {
    if (selectedTab === "income") {
      return <IncomeFormContent onGoDashboard={goToDashboard} />;
    }

    if (selectedTab === "expense") {
      return <DailyExpenseFormContent onGoDashboard={goToDashboard} />;
    }

    if (selectedTab === "cashPeti") {
      return <CashPetiLedger />;
    }

    return (
      <div className="rbac-card theme-surface">
        <h3 className="rbac-title-lg">
          {cashTrackerTabs.find((tab) => tab.key === selectedTab)?.label}
        </h3>
        <p className="mt-2 text-sm text-[color:var(--theme-text-muted)]">
          This section is coming next.
        </p>
      </div>
    );
  };

  return (
    <DashboardShell requireAdmin>
      <section className="flex min-h-[calc(100vh-32px)] flex-col p-4">
        <div className="flex-1">
          {renderContent()}
        </div>

        <nav
          aria-label="Cash tracker sections"
          className="sticky bottom-0 z-30 mt-6 rbac-nav-item active px-2 py-2"
        >
          <div className="grid grid-cols-4">
            {cashTrackerTabs.map(({ key, label, Icon }) => {
              const isSelected = selectedTab === key;

              return (
                <button
                  key={key}
                  type="button"
                  aria-current={isSelected ? "page" : undefined}
                  className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-none bg-transparent px-1 text-[11px] font-semibold transition-colors ${
                    isSelected
                      ? "text-white"
                      : "text-[color:var(--theme-text-muted)] hover:text-[color:var(--theme-text)]"
                  }`}
                  onClick={() => setSelectedTab(key)}
                >
                  <Icon
                    size={20}
                    className={isSelected ? "text-yellow-500" : ""}
                  />
                  <span className="leading-none">{label}</span>
                  <span
                    className={`h-0.5 w-5 rounded-full ${
                      isSelected ? "bg-white" : "bg-transparent"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </nav>
      </section>
    </DashboardShell>
  );
}
