"use client";

import { useMemo, useState } from "react";
import Loading from "../../../components/Loading";
import CashVoucherTab from "./CashVoucherTab";
import DirectWhiteTab from "./DirectWhiteTab";
import ExpenseMgmtTab from "./ExpenseMgmtTab";
import { useNewPetiCashData } from "./useNewPetiCashData";
import type { NewPetiCashTab } from "./types";

const tabs: { key: NewPetiCashTab; label: string; activeClass: string }[] = [
  {
    key: "cashVoucher",
    label: "Cash Voucher",
    activeClass: "bg-orange-500 text-white border-orange-500",
  },
  {
    key: "directWhite",
    label: "Direct (White)",
    activeClass: "bg-slate-900 text-white border-slate-900",
  },
  {
    key: "expenseMgmt",
    label: "Expense Mgmt",
    activeClass: "bg-teal-700 text-white border-teal-700",
  },
];

export default function NewPetiCashContent() {
  const [activeTab, setActiveTab] = useState<NewPetiCashTab>("cashVoucher");
  const {
    loading,
    companies,
    users,
    projects,
    incomeTypes,
    expenseTypes,
    ledger,
    reloadLedger,
  } = useNewPetiCashData();

  const content = useMemo(() => {
    if (activeTab === "directWhite") {
      return (
        <DirectWhiteTab
          companies={companies}
          users={users}
          projects={projects}
          incomeTypes={incomeTypes}
          expenseTypes={expenseTypes}
          ledger={ledger}
          onSaved={reloadLedger}
        />
      );
    }

    if (activeTab === "expenseMgmt") {
      return (
        <ExpenseMgmtTab
          companies={companies}
          users={users}
          expenseTypes={expenseTypes}
        />
      );
    }

    return (
      <CashVoucherTab
        companies={companies}
        users={users}
        projects={projects}
        incomeTypes={incomeTypes}
        expenseTypes={expenseTypes}
        ledger={ledger}
        onSaved={reloadLedger}
      />
    );
  }, [
    activeTab,
    companies,
    users,
    projects,
    incomeTypes,
    expenseTypes,
    ledger,
    reloadLedger,
  ]);

  if (loading) {
    return (
      <section className="p-4">
        <Loading />
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl space-y-4 p-4">
      <div className="grid grid-cols-3 gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-lg border px-2 py-2.5 text-xs font-bold transition sm:text-sm ${
                isActive
                  ? tab.activeClass
                  : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {content}
    </section>
  );
}
