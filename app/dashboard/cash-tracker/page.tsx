"use client";

import { type ComponentType } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import CashTrackerDashboard from "../_components/CashTrackerDashboard";

type CashTrackerTab = "dashboard" | "expense" | "income" | "cashPeti";

const DEFAULT_TAB: CashTrackerTab = "dashboard";

function resolveTabFromQuery(value: string | null | undefined): CashTrackerTab {
  if (
    value === "expense" ||
    value === "income" ||
    value === "cashPeti" ||
    value === "dashboard"
  ) {
    return value;
  }

  return DEFAULT_TAB;
}

const cashTrackerTabs: {
  key: CashTrackerTab;
  label: string;
  Icon: ComponentType<{ className?: string; size?: number }>;
}[] = [
  { key: "dashboard", label: "Dashboard", Icon: FaChartBar },
  { key: "income", label: "Incomes", Icon: FaMoneyBillWave },
  { key: "expense", label: "Expenses", Icon: FaReceipt },
  { key: "cashPeti", label: "Cash Peti", Icon: FaWallet },
];

export default function CashTrackerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedTab = resolveTabFromQuery(searchParams?.get("tab"));

  const setSelectedTab = (tab: CashTrackerTab) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");

    if (tab === DEFAULT_TAB) {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }

    const query = params.toString();
    router.replace(query ? `?${query}` : "?", { scroll: false });
  };

  const renderContent = () => {
    if (selectedTab === "income") {
      return <IncomeFormContent />;
    }

    if (selectedTab === "expense") {
      return <DailyExpenseFormContent />;
    }

    if (selectedTab === "cashPeti") {
      return <CashPetiLedger />;
    }

    if (selectedTab === "dashboard") {
      return <CashTrackerDashboard />;
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
                    className={isSelected ? "text-white" : ""}
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
