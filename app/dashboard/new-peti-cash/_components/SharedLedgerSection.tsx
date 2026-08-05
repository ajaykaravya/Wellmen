"use client";

import { useMemo, useState } from "react";
import { formatToDDMMYYYY } from "@/lib/dateUtils";
import { formatMoney, type LedgerEntry, type LedgerSource } from "./types";
import { filterLedger, summarizeLedger } from "./useNewPetiCashData";
import { FilterPill, LedgerList, SummaryCards } from "./ui";
import type { CompanyOption } from "@/lib/api/dashboard/shared-options";

type Props = {
  companies: CompanyOption[];
  ledger: LedgerEntry[];
  defaultSourceFilter?: "all" | LedgerSource;
};

export default function SharedLedgerSection({
  companies,
  ledger,
  defaultSourceFilter = "all",
}: Props) {
  const [sourceFilter, setSourceFilter] = useState<"all" | LedgerSource>(
    defaultSourceFilter,
  );
  const [companyId, setCompanyId] = useState("");

  const filtered = useMemo(
    () => filterLedger(ledger, { sourceFilter, companyId }),
    [ledger, sourceFilter, companyId],
  );
  const summary = useMemo(() => summarizeLedger(filtered), [filtered]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        <FilterPill
          label="All"
          active={sourceFilter === "all"}
          onClick={() => setSourceFilter("all")}
        />
        <FilterPill
          label="Direct (White)"
          active={sourceFilter === "directWhite"}
          onClick={() => setSourceFilter("directWhite")}
        />
        <FilterPill
          label="Cash Voucher"
          active={sourceFilter === "cashVoucher"}
          onClick={() => setSourceFilter("cashVoucher")}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <FilterPill
          label="All"
          tone="orange"
          active={!companyId}
          onClick={() => setCompanyId("")}
        />
        {companies.map((company) => (
          <FilterPill
            key={company.id}
            label={company.name}
            tone="orange"
            active={companyId === company.id}
            onClick={() => setCompanyId(company.id)}
          />
        ))}
      </div>

      <SummaryCards
        income={summary.income}
        expense={summary.expense}
        net={summary.net}
      />

      <LedgerList empty={filtered.length === 0}>
        {filtered.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3"
          >
            <div>
              <p className="text-xs text-slate-500">
                {formatToDDMMYYYY(entry.date)}
              </p>
              <p className="text-sm font-semibold text-slate-900">{entry.label}</p>
              <p className="text-xs text-slate-500">
                {entry.companyName || "-"}
                {entry.paymentMode ? ` · ${entry.paymentMode}` : ""}
              </p>
              {entry.remark ? (
                <p className="mt-0.5 text-xs text-slate-400 line-clamp-1">
                  {entry.remark}
                </p>
              ) : null}
            </div>
            <div
              className={`text-sm font-bold ${
                entry.kind === "INCOME" ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {entry.kind === "INCOME" ? "+" : "-"}
              {formatMoney(entry.amount)}
            </div>
          </div>
        ))}
      </LedgerList>
    </div>
  );
}
