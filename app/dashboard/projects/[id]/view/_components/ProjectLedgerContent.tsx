"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaDraftingCompass, FaFileAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import { formatToDDMMYYYY } from "@/lib/dateUtils";
import {
  loadProjectLedger,
  type LedgerEntry,
  type ProjectLedger,
} from "@/lib/api/dashboard/project-ledger";

type Tab = "byDate" | "income" | "expense";

const money = (value: number) =>
  `₹ ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const statusLabel = (status: string) =>
  ({
    PENDING: "Pending",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    ON_HOLD: "On Hold",
  })[status] || status;

function SummaryCard({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string;
  tone: "income" | "expense" | "net";
  hint?: string;
}) {
  const toneClass =
    tone === "income"
      ? "text-emerald-600"
      : tone === "expense"
        ? "text-rose-600"
        : "text-slate-900";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className={`mt-1 text-xl font-bold ${toneClass}`}>{value}</div>
      {hint ? <div className="mt-0.5 text-xs text-slate-400">{hint}</div> : null}
    </div>
  );
}

function EntryTable({
  rows,
  kind,
}: {
  rows: LedgerEntry[];
  kind: "income" | "expense";
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
        No {kind} entries for this project.
      </div>
    );
  }

  const total = rows.reduce((sum, row) => sum + row.amount, 0);

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wide text-slate-500">
            <th className="py-2 pr-3">Date</th>
            <th className="py-2 pr-3">{kind === "income" ? "Source" : "Expense Type"}</th>
            <th className="py-2 pr-3">{kind === "income" ? "Received By" : "Expense By"}</th>
            <th className="py-2 pr-3">Company</th>
            <th className="py-2 pr-3">Mode</th>
            <th className="py-2 pr-3">Remark</th>
            <th className="py-2 pl-3 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-slate-100">
              <td className="py-2 pr-3 whitespace-nowrap">
                {formatToDDMMYYYY(row.date)}
              </td>
              <td className="py-2 pr-3">
                {row.categoryName || "-"}
                {row.fromPetiCash ? (
                  <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                    Peti Cash
                  </span>
                ) : null}
              </td>
              <td className="py-2 pr-3">{row.personName || "-"}</td>
              <td className="py-2 pr-3">{row.companyName || "-"}</td>
              <td className="py-2 pr-3">{row.paymentMode || "-"}</td>
              <td className="py-2 pr-3 text-slate-500">{row.remark || "-"}</td>
              <td
                className={`py-2 pl-3 text-right font-semibold ${
                  kind === "income" ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {money(row.amount)}
              </td>
            </tr>
          ))}
          <tr className="border-t-2 border-slate-300 font-bold">
            <td className="py-2 pr-3" colSpan={6}>
              Total ({rows.length}{" "}
              {rows.length === 1 ? "entry" : "entries"})
            </td>
            <td className="py-2 pl-3 text-right">{money(total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function ProjectLedgerContent({
  projectId,
}: {
  projectId: string;
}) {
  const router = useRouter();
  const [ledger, setLedger] = useState<ProjectLedger | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("byDate");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const result = await loadProjectLedger(projectId, { from, to });
      setLedger(result);
    } catch (error) {
      console.error("Failed to load project ledger", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load project ledger.",
      );
    } finally {
      setLoading(false);
    }
  }, [projectId, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const runningTotals = useMemo(() => {
    if (!ledger) return [];
    // byDate arrives newest first; accumulate oldest-first so the running
    // balance reads as a ledger, then flip back for display.
    const oldestFirst = [...ledger.byDate].reverse();
    let balance = 0;
    const withBalance = oldestFirst.map((row) => {
      balance += row.net;
      return { ...row, balance };
    });
    return withBalance.reverse();
  }, [ledger]);

  if (loading) {
    return (
      <section className="rbac-section rbac-container">
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">
          Loading project ledger...
        </div>
      </section>
    );
  }

  if (!ledger) {
    return (
      <section className="rbac-section rbac-container">
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">
          Project not found.
        </div>
      </section>
    );
  }

  const { project, summary } = ledger;

  return (
    <section className="rbac-section rbac-container space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.push("/dashboard/projects")}
          className="rbac-link flex items-center gap-2 text-sm font-semibold"
        >
          <FaArrowLeft size={14} />
          Projects
        </button>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              router.push(`/dashboard/projects/forms?projectId=${project.id}`)
            }
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <FaFileAlt size={12} />
            Documents
          </button>
          <button
            type="button"
            onClick={() =>
              router.push(`/dashboard/projects/${project.id}/drawings`)
            }
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <FaDraftingCompass size={12} />
            Drawings
          </button>
        </div>
      </div>

      <div className="rbac-card">
        <h3 className="rbac-title-lg">{project.name}</h3>
        <div className="mt-2 grid grid-cols-1 gap-x-8 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Address", [project.address, project.city].filter(Boolean).join(", ")],
            ["Contact", project.contactNumber],
            ["Email", project.email],
            ["Start Date", formatToDDMMYYYY(project.startDate)],
            ["End Date", project.endDate ? formatToDDMMYYYY(project.endDate) : "-"],
            ["Status", statusLabel(project.status)],
          ].map(([label, value]) => (
            <div key={String(label)} className="flex gap-2">
              <span className="shrink-0 text-slate-500">{label}:</span>
              <span className="font-medium">{value || "-"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard
          label="Total Received"
          value={money(summary.totalIncome)}
          tone="income"
          hint={`${summary.incomeCount} ${summary.incomeCount === 1 ? "entry" : "entries"}`}
        />
        <SummaryCard
          label="Total Expense"
          value={money(summary.totalExpense)}
          tone="expense"
          hint={`${summary.expenseCount} ${summary.expenseCount === 1 ? "entry" : "entries"}`}
        />
        <SummaryCard
          label="Net Balance"
          value={money(summary.net)}
          tone="net"
          hint="Received minus expense"
        />
      </div>

      <div className="rbac-card">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["byDate", "Date-wise"],
                ["income", `Income (${summary.incomeCount})`],
                ["expense", `Expense (${summary.expenseCount})`],
              ] as [Tab, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  tab === key
                    ? "border-teal-700 bg-teal-700 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                From
              </label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="rbac-input"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                To
              </label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="rbac-input"
              />
            </div>
            {from || to ? (
              <button
                type="button"
                onClick={() => {
                  setFrom("");
                  setTo("");
                }}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>

        {tab === "byDate" ? (
          runningTotals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              No transactions for this project.
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3 text-right">Received</th>
                    <th className="py-2 pr-3 text-right">Expense</th>
                    <th className="py-2 pr-3 text-right">Net</th>
                    <th className="py-2 pl-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {runningTotals.map((row) => (
                    <tr key={row.date} className="border-b border-slate-100">
                      <td className="py-2 pr-3 whitespace-nowrap font-medium">
                        {formatToDDMMYYYY(row.date)}
                      </td>
                      <td className="py-2 pr-3 text-right text-emerald-600">
                        {row.income ? money(row.income) : "-"}
                      </td>
                      <td className="py-2 pr-3 text-right text-rose-600">
                        {row.expense ? money(row.expense) : "-"}
                      </td>
                      <td
                        className={`py-2 pr-3 text-right font-semibold ${
                          row.net >= 0 ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {money(row.net)}
                      </td>
                      <td className="py-2 pl-3 text-right font-semibold">
                        {money(row.balance)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-slate-300 font-bold">
                    <td className="py-2 pr-3">Total</td>
                    <td className="py-2 pr-3 text-right text-emerald-600">
                      {money(summary.totalIncome)}
                    </td>
                    <td className="py-2 pr-3 text-right text-rose-600">
                      {money(summary.totalExpense)}
                    </td>
                    <td className="py-2 pr-3 text-right">{money(summary.net)}</td>
                    <td className="py-2 pl-3 text-right">{money(summary.net)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )
        ) : null}

        {tab === "income" ? (
          <EntryTable rows={ledger.income} kind="income" />
        ) : null}
        {tab === "expense" ? (
          <EntryTable rows={ledger.expenses} kind="expense" />
        ) : null}
      </div>
    </section>
  );
}
