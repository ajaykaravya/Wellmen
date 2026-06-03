"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "../_components/DashboardShell";

type TransportReportRow = {
  transportType: string;
  module: string;
  totalTrips: number;
  totalAmount: number;
};

type TransportReportsResponse = {
  year: number;
  month: string;
  yearMonth: string;
  availableYears: number[];
  data: TransportReportRow[];
  totals: {
    totalTrips: number;
    totalAmount: number;
  };
};

const moneyFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const monthOptions = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const getCurrentPeriodValue = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return { year: String(year), month };
};

export default function TransportReportsPage() {
  const currentPeriod = useMemo(() => getCurrentPeriodValue(), []);
  const [selectedYear, setSelectedYear] = useState(currentPeriod.year);
  const [selectedMonth, setSelectedMonth] = useState(currentPeriod.month);
  const [availableYears, setAvailableYears] = useState<string[]>([
    currentPeriod.year,
  ]);
  const [rows, setRows] = useState<TransportReportRow[]>([]);
  const [totals, setTotals] = useState({
    totalTrips: 0,
    totalAmount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const loadSummary = async () => {
      setLoading(true);
      setError("");
      setRows([]);
      setTotals({
        totalTrips: 0,
        totalAmount: 0,
      });

      try {
        const res = await fetch(
          `/api/transport-reports?year=${encodeURIComponent(selectedYear)}&month=${encodeURIComponent(selectedMonth)}`,
          { signal: controller.signal },
        );

        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(
            payload.error || "Failed to load transport reports.",
          );
        }

        const payload = (await res.json()) as TransportReportsResponse;
        if (Array.isArray(payload.availableYears) && payload.availableYears.length) {
          setAvailableYears(
            payload.availableYears.map((year) => String(year)),
          );
        }
        setRows(Array.isArray(payload.data) ? payload.data : []);
        setTotals(
          payload.totals || {
            totalTrips: 0,
            totalAmount: 0,
          },
        );
      } catch (fetchError) {
        if ((fetchError as Error).name === "AbortError") return;
        console.error("Failed to load transport reports", fetchError);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load transport reports.",
        );
        setRows([]);
        setTotals({
          totalTrips: 0,
          totalAmount: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    loadSummary();

    return () => controller.abort();
  }, [selectedMonth, selectedYear]);

  return (
    <DashboardShell requireAdmin>
      <section className="p-4 md:p-6">
        <div className="rounded-2xl border border-[color:var(--theme-border)] bg-[var(--theme-surface)] p-4 shadow-sm md:p-6 theme-text">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <h3 className="rbac-title-lg">Transport Reports</h3>

            <div className="grid gap-3 grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium theme-text">
                Month
                <select
                  value={selectedMonth}
                  onChange={(event) => setSelectedMonth(event.target.value)}
                  className="min-w-40 rounded-xl border border-[color:var(--theme-border)] bg-[var(--theme-surface-2)] px-3 py-2 text-sm theme-text outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                >
                  {monthOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium theme-text">
                Year
                <select
                  value={selectedYear}
                  onChange={(event) => setSelectedYear(event.target.value)}
                  className="min-w-40 rounded-xl border border-[color:var(--theme-border)] bg-[var(--theme-surface-2)] px-3 py-2 text-sm theme-text outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                >
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="mt-6 grid gap-3 grid-cols-2">
            <div className="rounded-xl border border-[color:var(--theme-border)] bg-[var(--theme-surface-2)] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide theme-text-muted">
                Total Trips
              </p>
              <p className="mt-2 text-sm sm:text-2xl font-semibold theme-text">
                {loading ? "Loading..." : totals.totalTrips}
              </p>
            </div>
            <div className="rounded-xl border border-[color:var(--theme-border)] bg-[var(--theme-surface-2)] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide theme-text-muted">
                Total Amount
              </p>
              <p className="mt-2 text-sm sm:text-2xl font-semibold theme-text">
                {loading
                  ? "Loading..."
                  : `₹${moneyFormatter.format(totals.totalAmount)}`}
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="mt-6 overflow-hidden rounded-2xl border border-[color:var(--theme-border)]">
            <table className="min-w-full divide-y divide-[color:var(--theme-border)]">
              <thead className="bg-[var(--theme-surface-2)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide theme-text-muted">
                    Module
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide theme-text-muted">
                    Total Trips
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide theme-text-muted">
                    Total Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--theme-border)] bg-[var(--theme-surface)]">
                {loading && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-8 text-center text-sm theme-text-muted"
                    >
                      Loading transport summary...
                    </td>
                  </tr>
                )}

                {!loading && rows.length === 0 && !error && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-8 text-center text-sm theme-text-muted"
                    >
                      No transport logs found for this month.
                    </td>
                  </tr>
                )}

                {rows.map((row) => (
                  <tr
                    key={row.transportType}
                    className="hover:bg-[var(--theme-surface-2)]"
                  >
                    <td className="px-4 py-4 text-sm font-medium theme-text">
                      {row.module}
                    </td>
                    <td className="px-4 py-4 text-right text-sm theme-text">
                      {row.totalTrips}
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-semibold theme-text">
                      ₹{moneyFormatter.format(row.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-[color:var(--theme-border)] bg-[var(--theme-surface-2)]">
                <tr>
                  <td className="px-4 py-4 text-sm font-semibold theme-text">
                    Grand Total
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-semibold theme-text">
                    {totals.totalTrips}
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-semibold theme-text">
                    ₹{moneyFormatter.format(totals.totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}
