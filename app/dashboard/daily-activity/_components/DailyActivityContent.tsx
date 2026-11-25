"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FaChevronLeft, FaChevronRight, FaExternalLinkAlt } from "react-icons/fa";
import {
  loadDailyActivity,
  type DailyActivity,
  type DailyActivityGroup,
  type DailyActivityResponse,
  type DailyActivityType,
} from "@/lib/api/dashboard/daily-activity";

type Tone = "success" | "danger" | "warning" | "brand" | "neutral";

const TYPE_META: Record<DailyActivityType, { label: string; tone: Tone }> = {
  PROJECT_CREATED: { label: "Project created", tone: "brand" },
  CASH_RECEIVED: { label: "Cash received", tone: "success" },
  CASH_GIVEN: { label: "Cash given", tone: "warning" },
  ADVANCE_GIVEN: { label: "Advance given", tone: "warning" },
  EXPENSE_CLAIMED: { label: "Expense claimed", tone: "danger" },
  CASH_SPENT: { label: "Cash spent", tone: "danger" },
  EXPENSE_PAID: { label: "Expense paid", tone: "danger" },
  TASK_CREATED: { label: "Task created", tone: "brand" },
  TASK_COMPLETED: { label: "Task completed", tone: "success" },
  DRAWING_UPLOADED: { label: "Drawing uploaded", tone: "brand" },
  DOCUMENT_UPLOADED: { label: "Document uploaded", tone: "brand" },
  FORM_FILLED: { label: "Form filled", tone: "neutral" },
  REPORT_SUBMITTED: { label: "Report submitted", tone: "neutral" },
  QUERY_RAISED: { label: "Query raised", tone: "warning" },
};

// Order of the count chips in the summary.
const COUNT_ORDER: DailyActivityType[] = [
  "PROJECT_CREATED",
  "TASK_CREATED",
  "TASK_COMPLETED",
  "DRAWING_UPLOADED",
  "DOCUMENT_UPLOADED",
  "FORM_FILLED",
  "REPORT_SUBMITTED",
  "QUERY_RAISED",
];

const GROUP_FILTERS: { key: DailyActivityGroup | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "money", label: "Money" },
  { key: "tasks", label: "Projects & tasks" },
  { key: "files", label: "Drawings, documents & forms" },
  { key: "reports", label: "Reports & queries" },
];

const TONE_STYLE: Record<Tone, React.CSSProperties> = {
  success: { background: "var(--theme-success-bg)", color: "var(--theme-success-text)" },
  danger: { background: "var(--theme-danger-bg)", color: "var(--theme-danger-text)" },
  warning: { background: "var(--theme-warning-bg)", color: "var(--theme-warning-text)" },
  brand: { background: "var(--theme-surface-2)", color: "var(--brand)" },
  neutral: { background: "var(--theme-surface-2)", color: "var(--theme-text-muted)" },
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const IST = "Asia/Kolkata";

const istDateOf = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: IST }).format(new Date(iso));

const shiftDate = (value: string, days: number) => {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};

const formatLongDate = (value: string) => {
  const [y, m, d] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value || 0);

// Time the entry was made. Money and reports are filed under their business
// date, so an entry made on another day also shows that day.
const formatWhen = (iso: string, selectedDate: string) => {
  const time = new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: IST,
  }).format(new Date(iso));
  if (istDateOf(iso) === selectedDate) return time;
  const day = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: IST,
  }).format(new Date(iso));
  return `Entered ${day}, ${time}`;
};

function MoneyCard({ label, value, tone }: { label: string; value: number; tone: Tone }) {
  return (
    <div className="rbac-card" style={{ padding: 14 }}>
      <div className="text-xs font-semibold" style={{ color: "var(--theme-text-muted)" }}>
        {label}
      </div>
      <div
        className="mt-1 text-xl font-bold"
        style={{ color: tone === "neutral" ? "var(--theme-text)" : TONE_STYLE[tone].color }}
      >
        {formatMoney(value)}
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: DailyActivityType }) {
  const meta = TYPE_META[type];
  return (
    <span
      className="inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={TONE_STYLE[meta.tone]}
    >
      {meta.label}
    </span>
  );
}

function ActivityRow({ item, selectedDate }: { item: DailyActivity; selectedDate: string }) {
  const tone = TYPE_META[item.type].tone;
  return (
    <li
      className="flex flex-wrap items-start gap-x-3 gap-y-1 py-2.5 sm:flex-nowrap"
      style={{ borderTop: "1px solid var(--theme-border)" }}
    >
      <div
        className="w-full shrink-0 text-xs tabular-nums sm:w-24 sm:pt-0.5"
        style={{ color: "var(--theme-text-muted)" }}
      >
        {formatWhen(item.at, selectedDate)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <TypeBadge type={item.type} />
          <span className="break-words text-sm font-semibold" style={{ color: "var(--theme-text)" }}>
            {item.title}
          </span>
        </div>
        {item.detail || item.by ? (
          <div className="mt-0.5 break-words text-xs" style={{ color: "var(--theme-text-muted)" }}>
            {[item.by ? `By ${item.by}` : null, item.detail].filter(Boolean).join(" · ")}
          </div>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {item.amount != null ? (
          <span
            className="text-sm font-bold tabular-nums"
            style={{ color: TONE_STYLE[tone].color }}
          >
            {formatMoney(item.amount)}
          </span>
        ) : null}
        {item.fileUrl ? (
          <a
            href={item.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="rbac-link flex items-center gap-1 text-xs font-semibold"
          >
            <FaExternalLinkAlt size={10} /> Open
          </a>
        ) : null}
      </div>
    </li>
  );
}

export default function DailyActivityContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dateParam = searchParams?.get("date") || "";
  const requestedDate = DATE_RE.test(dateParam) ? dateParam : "";

  const [result, setResult] = useState<{
    key: string;
    data: DailyActivityResponse | null;
    error: string | null;
  } | null>(null);
  const [group, setGroup] = useState<DailyActivityGroup | "all">("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;
    loadDailyActivity(requestedDate || undefined)
      .then((response) => {
        if (!cancelled) setResult({ key: requestedDate, data: response, error: null });
      })
      .catch((err) => {
        console.error("Failed to load daily activity", err);
        if (!cancelled) {
          setResult((prev) => ({
            key: requestedDate,
            data: prev?.data ?? null,
            error: err instanceof Error ? err.message : "Failed to load daily activity.",
          }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [requestedDate]);

  // Loading until the result on screen belongs to the date in the URL.
  const loading = result?.key !== requestedDate;
  const error = loading ? null : result?.error ?? null;
  const data = loading ? null : result?.data ?? null;
  const knownToday = result?.data?.today || "";

  const today = data?.today || knownToday;
  const selectedDate = requestedDate || data?.date || today;
  const isToday = Boolean(today) && selectedDate === today;

  const goTo = useCallback(
    (value: string) => {
      if (!DATE_RE.test(value)) return;
      // Keep the date in the URL so browser back/forward and refresh work.
      router.push(`${pathname}?date=${value}`);
    },
    [pathname, router],
  );

  const projects = useMemo(() => {
    if (!data) return [];
    return data.projects
      .filter((project) => projectFilter === "all" || (project.projectId || "none") === projectFilter)
      .map((project) => ({
        ...project,
        activities:
          group === "all"
            ? project.activities
            : project.activities.filter((item) => item.group === group),
      }))
      .filter((project) => project.activities.length > 0);
  }, [data, group, projectFilter]);

  const totals = data?.totals;
  const shownCount = projects.reduce((sum, p) => sum + p.activities.length, 0);

  return (
    <section className="rbac-section rbac-container">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="rbac-title-lg">Daily Activity</h3>
          <p className="text-sm" style={{ color: "var(--theme-text-muted)" }}>
            {selectedDate ? formatLongDate(selectedDate) : " "}
            {isToday ? " · Today" : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rbac-button rbac-button-secondary flex items-center gap-1"
            onClick={() => selectedDate && goTo(shiftDate(selectedDate, -1))}
            disabled={!selectedDate || loading}
            aria-label="Previous day"
          >
            <FaChevronLeft size={12} /> Prev
          </button>
          <input
            type="date"
            className="rbac-input"
            style={{ width: "auto" }}
            value={selectedDate}
            max={today || undefined}
            onChange={(event) => goTo(event.target.value)}
            aria-label="Choose a day"
          />
          <button
            type="button"
            className="rbac-button rbac-button-secondary flex items-center gap-1"
            onClick={() => selectedDate && goTo(shiftDate(selectedDate, 1))}
            disabled={!selectedDate || isToday || loading}
            aria-label="Next day"
          >
            Next <FaChevronRight size={12} />
          </button>
          {!isToday && today ? (
            <button type="button" className="rbac-button" onClick={() => goTo(today)}>
              Today
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={TONE_STYLE.danger}
        >
          {error}
        </div>
      ) : null}

      {totals ? (
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MoneyCard label="Cash received" value={totals.cashReceived} tone="success" />
            <MoneyCard label="Cash & advances given" value={totals.cashGiven} tone="warning" />
            <MoneyCard label="Expenses paid" value={totals.expensesPaid} tone="danger" />
            <MoneyCard label="Expenses claimed" value={totals.expensesClaimed} tone="danger" />
          </div>
          <div className="flex flex-wrap gap-2">
            {COUNT_ORDER.map((type) => (
              <span
                key={type}
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{
                  ...TONE_STYLE.neutral,
                  border: "1px solid var(--theme-border)",
                }}
              >
                {TYPE_META[type].label}:{" "}
                <span style={{ color: "var(--theme-text)" }}>{totals.counts[type] || 0}</span>
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {GROUP_FILTERS.map((option) => {
          const active = group === option.key;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => setGroup(option.key)}
              className="rounded-full px-3 py-1.5 text-xs font-semibold"
              style={{
                border: `1px solid ${active ? "var(--brand)" : "var(--theme-border)"}`,
                background: active ? "var(--brand)" : "var(--theme-surface)",
                color: active ? "#fff" : "var(--theme-text)",
              }}
              aria-pressed={active}
            >
              {option.label}
            </button>
          );
        })}
        <select
          className="rbac-input-filter ml-auto"
          style={{ width: "auto", minWidth: 200 }}
          value={projectFilter}
          onChange={(event) => setProjectFilter(event.target.value)}
          aria-label="Filter by project"
        >
          <option value="all">All projects</option>
          {(data?.projects || []).map((project) => (
            <option key={project.projectId || "none"} value={project.projectId || "none"}>
              {project.projectName} ({project.activities.length})
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div
          className="rounded-xl border border-dashed px-4 py-10 text-center text-sm"
          style={{ borderColor: "var(--theme-border-strong)", color: "var(--theme-text-muted)" }}
        >
          Loading activity...
        </div>
      ) : !error && shownCount === 0 ? (
        <div
          className="rounded-xl border border-dashed px-4 py-10 text-center text-sm"
          style={{ borderColor: "var(--theme-border-strong)", color: "var(--theme-text-muted)" }}
        >
          {totals?.activities
            ? "Nothing matches these filters on this day."
            : "No activity recorded on this day."}
        </div>
      ) : (
        <div className="grid gap-3">
          {projects.map((project) => {
            const t = project.totals;
            const moneyBits = [
              t.cashReceived ? `In ${formatMoney(t.cashReceived)}` : null,
              t.cashGiven ? `Given ${formatMoney(t.cashGiven)}` : null,
              t.expensesPaid + t.expensesClaimed
                ? `Spent ${formatMoney(t.expensesPaid + t.expensesClaimed)}`
                : null,
            ].filter(Boolean);
            return (
              <div key={project.projectId || "none"} className="rbac-card">
                <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex flex-wrap items-baseline gap-2">
                    {project.projectId ? (
                      <Link
                        href={`/dashboard/projects/${project.projectId}/view`}
                        className="rbac-link text-base font-bold"
                      >
                        {project.projectName}
                      </Link>
                    ) : (
                      <span className="text-base font-bold" style={{ color: "var(--theme-text)" }}>
                        {project.projectName}
                      </span>
                    )}
                    <span className="text-xs" style={{ color: "var(--theme-text-muted)" }}>
                      {project.activities.length} activit
                      {project.activities.length === 1 ? "y" : "ies"}
                    </span>
                  </div>
                  {moneyBits.length ? (
                    <span
                      className="text-xs font-semibold tabular-nums"
                      style={{ color: "var(--theme-text-muted)" }}
                    >
                      {moneyBits.join(" · ")}
                    </span>
                  ) : null}
                </div>
                <ul>
                  {project.activities.map((item) => (
                    <ActivityRow key={item.id} item={item} selectedDate={selectedDate} />
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
