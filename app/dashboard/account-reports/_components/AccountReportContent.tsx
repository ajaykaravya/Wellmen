"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FaFileExcel, FaFilter, FaSpinner } from "react-icons/fa";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import ListingFilterDialog from "../../../components/ListingFilterDialog";
import AppliedFilterSummary from "../../../components/AppliedFilterSummary";
import CustomDatePicker from "../../../components/CustomDatePicker";
import {
  loadCompanyOptions,
  loadExpenseTypeOptions,
  loadIncomeTypeOptions,
  loadProjectOptions,
  loadUserOptions,
} from "@/lib/api/dashboard/shared-options";
import {
  loadAccountReport,
  type AccountReportFilters,
  type AccountReportKind,
  type AccountReportRow,
} from "@/lib/api/dashboard/account-reports";

// ---------------------------------------------------------------------------
// Config per report

type KindConfig = {
  title: string;
  noun: string;
  sheetName: string;
  fileName: string;
  categoryLabel: string;
  personLabel: string;
  tone: string;
};

const KIND_CONFIG: Record<AccountReportKind, KindConfig> = {
  expense: {
    title: "Expense Report",
    noun: "expenses",
    sheetName: "Expenses",
    fileName: "expense-report",
    categoryLabel: "Expense type",
    personLabel: "Expense by",
    tone: "var(--theme-danger-text)",
  },
  income: {
    title: "Income Report",
    noun: "income entries",
    sheetName: "Income",
    fileName: "income-report",
    categoryLabel: "Income type",
    personLabel: "Received by",
    tone: "var(--theme-success-text)",
  },
};

const PAYMENT_MODE_LABEL: Record<string, string> = {
  CASH: "Cash",
  BANK: "Bank",
  CHEQUE: "Cheque",
  UPI: "UPI",
  NEFT_RTGS: "NEFT / RTGS",
};

const SOURCE_LABEL: Record<string, string> = {
  DIRECT: "Direct expense",
  CLAIM: "Peti cash claim",
};

type GroupKey = "project" | "category" | "company" | "person" | "paymentMode" | "month";

const PAGE_SIZE = 50;
const IST = "Asia/Kolkata";
const NO_PROJECT = "No project (office / general)";

// ---------------------------------------------------------------------------
// Helpers

type Option = { id: string; label: string };

const pad2 = (n: number) => String(n).padStart(2, "0");

const formatAmount = (value: number) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// Today's date parts in Indian time, whatever the viewer's clock says.
const istToday = () => {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: IST })
    .format(new Date())
    .split("-")
    .map(Number);
  return { y, m, d };
};

const ddmmyyyy = (y: number, m: number, d: number) => {
  const date = new Date(Date.UTC(y, m - 1, d));
  return `${pad2(date.getUTCDate())}/${pad2(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`;
};

// Calendar date (in IST) of a stored timestamp.
const istParts = (iso: string) => {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: IST })
    .format(new Date(iso))
    .split("-")
    .map(Number);
  return { y, m, d };
};

const formatRowDate = (iso: string) => {
  const { y, m, d } = istParts(iso);
  return `${pad2(d)}/${pad2(m)}/${y}`;
};

const monthKey = (iso: string) => {
  const { y, m } = istParts(iso);
  return `${y}-${pad2(m)}`;
};

const monthLabel = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, 1)));
};

const isCompleteDate = (value: string) =>
  !value || /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value.trim());

const projectLabel = (row: AccountReportRow) =>
  row.project
    ? row.project.city
      ? `${row.project.name} (${row.project.city})`
      : row.project.name
    : NO_PROJECT;

const companyLabel = (row: AccountReportRow) =>
  row.companyName
    ? row.companyCode
      ? `${row.companyName} (${row.companyCode})`
      : row.companyName
    : "-";

type Period = { key: string; label: string; from: string; to: string };

const getPeriods = (): Period[] => {
  const { y, m, d } = istToday();
  const fyStartYear = m >= 4 ? y : y - 1;
  return [
    { key: "this-month", label: "This month", from: ddmmyyyy(y, m, 1), to: ddmmyyyy(y, m, d) },
    {
      key: "last-month",
      label: "Last month",
      from: ddmmyyyy(y, m - 1, 1),
      // Day 0 of this month is the last day of the previous one.
      to: ddmmyyyy(y, m, 0),
    },
    {
      key: "this-fy",
      label: `FY ${fyStartYear}-${pad2((fyStartYear + 1) % 100)}`,
      from: ddmmyyyy(fyStartYear, 4, 1),
      to: ddmmyyyy(y, m, d),
    },
    { key: "all", label: "All time", from: "", to: "" },
  ];
};

type Filters = Required<Omit<AccountReportFilters, "q">>;

const EMPTY_FILTERS: Filters = {
  fromDate: "",
  toDate: "",
  projectId: "",
  companyId: "",
  categoryId: "",
  personId: "",
  paymentMode: "",
  source: "",
};

// ---------------------------------------------------------------------------
// Searchable dropdown used in the filter dialog

function SearchSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder: string;
}) {
  const [query, setQuery] = useState("");
  const term = query.trim().toLowerCase();
  const shown = term
    ? options.filter((option) => option.label.toLowerCase().includes(term))
    : options;

  return (
    <Combobox
      value={value}
      onChange={(next: string | null) => {
        onChange(next ?? "");
        setQuery("");
      }}
    >
      <div className="relative min-w-64">
        <ComboboxInput
          className="theme-input rbac-input w-full pr-10"
          placeholder={placeholder}
          displayValue={(id: string | null) =>
            options.find((option) => option.id === id)?.label || query
          }
          onChange={(event) => {
            setQuery(event.target.value);
            if (!event.target.value) onChange("");
          }}
        />
        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3 text-[color:var(--theme-text-muted)]">
          <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
        </ComboboxButton>
        <ComboboxOptions className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-[color:var(--theme-border)] bg-[var(--theme-surface)] p-1 text-[color:var(--theme-text)] shadow-lg">
          <ComboboxOption
            value=""
            className="cursor-pointer rounded-lg px-3 py-2 text-sm text-[color:var(--theme-text-muted)] data-[focus]:bg-[var(--theme-surface-2)]"
          >
            All
          </ComboboxOption>
          {shown.map((option) => (
            <ComboboxOption
              key={option.id}
              value={option.id}
              className="cursor-pointer rounded-lg px-3 py-2 text-sm data-[focus]:bg-[var(--theme-surface-2)] data-[selected]:bg-[var(--theme-surface-2)]"
            >
              {option.label}
            </ComboboxOption>
          ))}
        </ComboboxOptions>
      </div>
    </Combobox>
  );
}

// ---------------------------------------------------------------------------

export default function AccountReportContent({ kind }: { kind: AccountReportKind }) {
  const config = KIND_CONFIG[kind];
  const periods = useMemo(() => getPeriods(), []);

  // Opens on the current month.
  const [applied, setApplied] = useState<Filters>({
    ...EMPTY_FILTERS,
    fromDate: periods[0].from,
    toDate: periods[0].to,
  });
  const [draft, setDraft] = useState<Filters>(applied);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const [rows, setRows] = useState<AccountReportRow[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [truncated, setTruncated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [groupBy, setGroupBy] = useState<GroupKey>("project");

  const [projects, setProjects] = useState<Option[]>([]);
  const [companies, setCompanies] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [people, setPeople] = useState<Option[]>([]);

  const groupOptions: { key: GroupKey; label: string }[] = [
    { key: "project", label: "Project" },
    { key: "category", label: config.categoryLabel },
    { key: "company", label: "Company" },
    { key: "person", label: config.personLabel },
    { key: "paymentMode", label: "Payment mode" },
    { key: "month", label: "Month" },
  ];

  // Dropdown options for the filter dialog.
  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      loadProjectOptions(),
      loadCompanyOptions(),
      kind === "expense" ? loadExpenseTypeOptions() : loadIncomeTypeOptions(),
      loadUserOptions(),
    ]).then(([p, c, t, u]) => {
      if (cancelled) return;
      if (p.status === "fulfilled")
        setProjects([
          { id: "none", label: NO_PROJECT },
          ...p.value.map((row) => ({
            id: row.id,
            label: row.city ? `${row.name} (${row.city})` : row.name,
          })),
        ]);
      if (c.status === "fulfilled")
        setCompanies(
          c.value.map((row) => ({
            id: row.id,
            label: row.code ? `${row.name} (${row.code})` : row.name,
          })),
        );
      if (t.status === "fulfilled")
        setCategories(
          t.value.map((row) => ({
            id: row.id,
            label: row.status === "INACTIVE" ? `${row.name} (inactive)` : row.name,
          })),
        );
      if (u.status === "fulfilled")
        setPeople(
          u.value.map((row) => ({
            id: row.id,
            label: [row.firstName, row.lastName].filter(Boolean).join(" ") +
              (row.role ? ` - ${row.role}` : ""),
          })),
        );
    });
    return () => {
      cancelled = true;
    };
  }, [kind]);

  // The report itself.
  useEffect(() => {
    let cancelled = false;
    loadAccountReport(kind, { ...applied, q: appliedSearch })
      .then((response) => {
        if (cancelled) return;
        setRows(response.data || []);
        setTotalAmount(response.totalAmount || 0);
        setTruncated(Boolean(response.truncated));
        setPage(1);
      })
      .catch((error) => {
        console.error(`Failed to load ${kind} report`, error);
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Failed to load report.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kind, applied, appliedSearch]);

  const reload = (next: Filters) => {
    setLoading(true);
    setApplied(next);
  };

  const activePeriod = periods.find(
    (period) => period.from === applied.fromDate && period.to === applied.toDate,
  );

  // Summary figures.
  const summary = useMemo(() => {
    let cash = 0;
    let other = 0;
    let claims = 0;
    rows.forEach((row) => {
      const paise = Math.round(row.amount * 100);
      if (row.paymentMode === "CASH") cash += paise;
      else other += paise;
      if (row.source === "CLAIM") claims += paise;
    });
    return { cash: cash / 100, other: other / 100, claims: claims / 100 };
  }, [rows]);

  const groupRows = useCallback(
    (key: GroupKey) => {
      const map = new Map<string, { label: string; count: number; paise: number }>();
      rows.forEach((row) => {
        let id: string;
        let label: string;
        switch (key) {
          case "project":
            id = row.project?.id || "none";
            label = projectLabel(row);
            break;
          case "category":
            id = row.categoryId || "none";
            label = row.categoryName || "Uncategorised";
            break;
          case "company":
            id = row.companyId || "none";
            label = row.companyName ? companyLabel(row) : "No company";
            break;
          case "person":
            id = row.personId || "none";
            label = row.personName || "Not recorded";
            break;
          case "paymentMode":
            id = row.paymentMode || "none";
            label = row.paymentMode ? PAYMENT_MODE_LABEL[row.paymentMode] || row.paymentMode : "Not recorded";
            break;
          case "month":
            id = monthKey(row.date);
            label = monthLabel(id);
            break;
        }
        const entry = map.get(id) || { label, count: 0, paise: 0 };
        entry.count += 1;
        entry.paise += Math.round(row.amount * 100);
        map.set(id, entry);
      });
      const list = [...map.entries()].map(([id, value]) => ({
        id,
        label: value.label,
        count: value.count,
        amount: value.paise / 100,
      }));
      return key === "month"
        ? list.sort((a, b) => b.id.localeCompare(a.id))
        : list.sort((a, b) => b.amount - a.amount);
    },
    [rows],
  );

  const grouped = useMemo(() => groupRows(groupBy), [groupBy, groupRows]);

  // Filter dialog.
  const openFilters = () => {
    setDraft(applied);
    setSearch(appliedSearch);
    setFilterOpen(true);
  };

  const applyFilters = () => {
    if (!isCompleteDate(draft.fromDate) || !isCompleteDate(draft.toDate)) {
      toast.error("Please enter complete dates (DD/MM/YYYY).");
      return;
    }
    setFilterOpen(false);
    setLoading(true);
    setApplied(draft);
    setAppliedSearch(search.trim());
  };

  const labelOf = (list: Option[], id: string) =>
    list.find((option) => option.id === id)?.label || id;

  const describeFilters = (filters: Filters, q: string) =>
    [
      filters.fromDate || filters.toDate
        ? `Period: ${filters.fromDate || "start"} to ${filters.toDate || "today"}`
        : "Period: All time",
      filters.projectId ? `Project: ${labelOf(projects, filters.projectId)}` : "",
      filters.companyId ? `Company: ${labelOf(companies, filters.companyId)}` : "",
      filters.categoryId ? `${config.categoryLabel}: ${labelOf(categories, filters.categoryId)}` : "",
      filters.personId ? `${config.personLabel}: ${labelOf(people, filters.personId)}` : "",
      filters.paymentMode ? `Payment mode: ${PAYMENT_MODE_LABEL[filters.paymentMode]}` : "",
      filters.source ? `Source: ${SOURCE_LABEL[filters.source.toUpperCase()]}` : "",
      q ? `Remark contains: "${q}"` : "",
    ].filter(Boolean);

  const appliedChips = describeFilters(applied, appliedSearch).filter(
    (chip) => !chip.startsWith("Period:"),
  );

  const clearFilters = () => {
    setLoading(true);
    setApplied({ ...EMPTY_FILTERS, fromDate: applied.fromDate, toDate: applied.toDate });
    setAppliedSearch("");
  };

  // Excel export: detail sheet plus summary sheets.
  const handleExport = () => {
    if (rows.length === 0) {
      toast.warning("No data to export.");
      return;
    }
    setExporting(true);
    try {
      const workbook = XLSX.utils.book_new();
      const moneyFormat = "#,##0.00";

      const header = [
        "#",
        "Date",
        "Project",
        config.categoryLabel,
        "Company",
        config.personLabel,
        "Payment mode",
        ...(kind === "expense" ? ["Source"] : []),
        "Remark",
        "Amount (₹)",
      ];
      const amountCol = header.length - 1;
      const intro = [
        [config.title],
        ...describeFilters(applied, appliedSearch).map((line) => [line]),
        [`Generated: ${new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: IST }).format(new Date())}`],
        [],
      ];
      const body = rows.map((row, index) => {
        const { y, m, d } = istParts(row.date);
        return [
          index + 1,
          new Date(Date.UTC(y, m - 1, d)),
          projectLabel(row),
          row.categoryName || "-",
          companyLabel(row),
          row.personName || "-",
          row.paymentMode ? PAYMENT_MODE_LABEL[row.paymentMode] || row.paymentMode : "-",
          ...(kind === "expense" ? [row.source ? SOURCE_LABEL[row.source] : "-"] : []),
          row.remark || "",
          row.amount,
        ];
      });
      const totalRow = [...Array(amountCol - 1).fill(""), "Total", totalAmount];

      const detail = XLSX.utils.aoa_to_sheet([...intro, header, ...body, [], totalRow], {
        cellDates: true,
      });
      const firstDataRow = intro.length + 1;
      for (let r = firstDataRow; r < firstDataRow + body.length + 2; r += 1) {
        const dateCell = detail[XLSX.utils.encode_cell({ r, c: 1 })];
        if (dateCell && dateCell.t === "d") dateCell.z = "dd/mm/yyyy";
        const amountCell = detail[XLSX.utils.encode_cell({ r, c: amountCol })];
        if (amountCell && amountCell.t === "n") amountCell.z = moneyFormat;
      }
      detail["!cols"] = header.map((name) => ({
        wch:
          name === "#" ? 5
          : name === "Date" ? 12
          : name === "Remark" ? 40
          : name.startsWith("Amount") ? 15
          : 26,
      }));
      XLSX.utils.book_append_sheet(workbook, detail, config.sheetName);

      const summaryKeys: GroupKey[] = ["project", "category", "month", "paymentMode", "person", "company"];
      summaryKeys.forEach((key) => {
        const label = groupOptions.find((option) => option.key === key)!.label;
        const list = groupRows(key);
        const sheet = XLSX.utils.aoa_to_sheet([
          [`${config.title} by ${label.toLowerCase()}`],
          [describeFilters(applied, appliedSearch)[0]],
          [],
          [label, "Entries", "Amount (₹)", "Share %"],
          ...list.map((item) => [
            item.label,
            item.count,
            item.amount,
            totalAmount ? Math.round((item.amount / totalAmount) * 10000) / 100 : 0,
          ]),
          [],
          ["Total", rows.length, totalAmount, 100],
        ]);
        for (let r = 4; r < 4 + list.length + 2; r += 1) {
          const cell = sheet[XLSX.utils.encode_cell({ r, c: 2 })];
          if (cell && cell.t === "n") cell.z = moneyFormat;
        }
        sheet["!cols"] = [{ wch: 36 }, { wch: 10 }, { wch: 16 }, { wch: 10 }];
        XLSX.utils.book_append_sheet(workbook, sheet, `By ${label}`.slice(0, 31));
      });

      const stamp = (applied.fromDate || applied.toDate)
        ? `${(applied.fromDate || "start").replace(/\//g, "-")}_to_${(applied.toDate || "today").replace(/\//g, "-")}`
        : "all-time";
      XLSX.writeFile(workbook, `${config.fileName}_${stamp}.xlsx`, { compression: true });
      toast.success("Excel file downloaded.");
    } catch (error) {
      console.error("Failed to export Excel", error);
      toast.error("Failed to export Excel file.");
    } finally {
      setExporting(false);
    }
  };

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const periodText =
    applied.fromDate || applied.toDate
      ? `${applied.fromDate || "Start"} – ${applied.toDate || "today"}`
      : "All time";

  const statCard = (label: string, value: string, color?: string) => (
    <div className="rounded-xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-2)] p-4">
      <div className="text-xs uppercase tracking-wide theme-text-muted">{label}</div>
      <div className="mt-1 text-lg font-bold tabular-nums" style={{ color: color || "var(--theme-text)" }}>
        {value}
      </div>
    </div>
  );

  return (
    <section className="rbac-section rbac-container">
      <div className="rbac-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="rbac-title-lg">{config.title}</h3>
            <p className="text-sm theme-text-muted">{periodText}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rbac-button rbac-button-secondary theme-button-secondary inline-flex items-center gap-2"
              onClick={openFilters}
            >
              <FaFilter /> <span>Filters</span>
            </button>
            <button
              type="button"
              className="rbac-button inline-flex items-center gap-2"
              onClick={handleExport}
              disabled={exporting || loading || rows.length === 0}
            >
              <FaFileExcel /> {exporting ? "Exporting..." : "Export Excel"}
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {periods.map((period) => {
            const active = activePeriod?.key === period.key;
            return (
              <button
                key={period.key}
                type="button"
                onClick={() => reload({ ...applied, fromDate: period.from, toDate: period.to })}
                className="rounded-full px-3 py-1.5 text-xs font-semibold"
                style={{
                  border: `1px solid ${active ? "var(--brand)" : "var(--theme-border)"}`,
                  background: active ? "var(--brand)" : "var(--theme-surface)",
                  color: active ? "#fff" : "var(--theme-text)",
                }}
                aria-pressed={active}
              >
                {period.label}
              </button>
            );
          })}
          {!activePeriod ? (
            <span className="rounded-full px-3 py-1.5 text-xs font-semibold" style={{ border: "1px solid var(--brand)", color: "var(--brand)" }}>
              Custom range
            </span>
          ) : null}
        </div>

        <AppliedFilterSummary items={appliedChips} onClear={clearFilters} />

        {truncated ? (
          <div className="mt-3 rounded-xl px-4 py-2 text-sm" style={{ background: "var(--theme-warning-bg)", color: "var(--theme-warning-text)" }}>
            Showing the latest 10,000 entries only. Narrow the date range to see everything.
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statCard(`Total ${kind}`, `₹${formatAmount(totalAmount)}`, config.tone)}
          {statCard("Entries", String(rows.length))}
          {statCard("Cash", `₹${formatAmount(summary.cash)}`)}
          {kind === "expense"
            ? statCard("Via peti cash claims", `₹${formatAmount(summary.claims)}`)
            : statCard("Bank / UPI / cheque", `₹${formatAmount(summary.other)}`)}
        </div>

        {/* Summary by dimension */}
        <div className="mt-6">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-bold theme-text">Summary by</h4>
            <select
              className="rbac-input-filter"
              style={{ width: "auto" }}
              value={groupBy}
              onChange={(event) => setGroupBy(event.target.value as GroupKey)}
              aria-label="Summarise by"
            >
              {groupOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="theme-table min-w-full border-separate border-spacing-0 border border-[color:var(--theme-border)] text-sm">
              <thead>
                <tr>
                  {[groupOptions.find((o) => o.key === groupBy)!.label, "Entries", "Amount", "Share"].map((label, index) => (
                    <th
                      key={label}
                      className={`border-b border-[color:var(--theme-border)] px-4 py-2 text-xs font-semibold uppercase tracking-wide theme-text-muted ${index ? "text-right" : "text-left"}`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? null : grouped.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center theme-text-muted">
                      Nothing to summarise.
                    </td>
                  </tr>
                ) : (
                  grouped.map((item) => {
                    const share = totalAmount ? (item.amount / totalAmount) * 100 : 0;
                    return (
                      <tr key={item.id}>
                        <td className="border-b border-[color:var(--theme-border)] px-4 py-2 theme-text">{item.label}</td>
                        <td className="border-b border-[color:var(--theme-border)] px-4 py-2 text-right tabular-nums">{item.count}</td>
                        <td className="border-b border-[color:var(--theme-border)] px-4 py-2 text-right font-semibold tabular-nums">₹{formatAmount(item.amount)}</td>
                        <td className="border-b border-[color:var(--theme-border)] px-4 py-2 text-right tabular-nums theme-text-muted">
                          <div className="flex items-center justify-end gap-2">
                            <span className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-[color:var(--theme-border)] sm:inline-block">
                              <span className="block h-full rounded-full" style={{ width: `${Math.min(100, share)}%`, background: config.tone }} />
                            </span>
                            {share.toFixed(1)}%
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail */}
        <div className="mt-6">
          <h4 className="mb-2 text-sm font-bold theme-text">All {config.noun}</h4>

          {loading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm theme-text-muted">
              <FaSpinner className="animate-spin" /> Loading report...
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[color:var(--theme-border-strong)] px-4 py-10 text-center text-sm theme-text-muted">
              No {config.noun} found for the selected filters.
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="theme-table min-w-full border-separate border-spacing-0 border border-[color:var(--theme-border)] text-sm">
                  <thead>
                    <tr>
                      {["Date", "Project", config.categoryLabel, "Company", config.personLabel, "Mode", ...(kind === "expense" ? ["Source"] : []), "Remark", "Amount"].map((label) => (
                        <th
                          key={label}
                          className={`border-b border-[color:var(--theme-border)] px-3 py-2 text-xs font-semibold uppercase tracking-wide theme-text-muted ${label === "Amount" ? "text-right" : "text-left"}`}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((row) => (
                      <tr key={row.id}>
                        <td className="whitespace-nowrap border-b border-[color:var(--theme-border)] px-3 py-2 tabular-nums">{formatRowDate(row.date)}</td>
                        <td className="border-b border-[color:var(--theme-border)] px-3 py-2">{projectLabel(row)}</td>
                        <td className="border-b border-[color:var(--theme-border)] px-3 py-2">{row.categoryName || "-"}</td>
                        <td className="border-b border-[color:var(--theme-border)] px-3 py-2">{companyLabel(row)}</td>
                        <td className="border-b border-[color:var(--theme-border)] px-3 py-2">{row.personName || "-"}</td>
                        <td className="whitespace-nowrap border-b border-[color:var(--theme-border)] px-3 py-2">{row.paymentMode ? PAYMENT_MODE_LABEL[row.paymentMode] || row.paymentMode : "-"}</td>
                        {kind === "expense" ? (
                          <td className="whitespace-nowrap border-b border-[color:var(--theme-border)] px-3 py-2">{row.source ? SOURCE_LABEL[row.source] : "-"}</td>
                        ) : null}
                        <td className="border-b border-[color:var(--theme-border)] px-3 py-2 theme-text-muted">{row.remark || "-"}</td>
                        <td className="whitespace-nowrap border-b border-[color:var(--theme-border)] px-3 py-2 text-right font-semibold tabular-nums" style={{ color: config.tone }}>
                          ₹{formatAmount(row.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={kind === "expense" ? 8 : 7} className="px-3 py-2 text-right text-xs font-bold uppercase theme-text-muted">
                        Total ({rows.length} entries)
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right font-bold tabular-nums" style={{ color: config.tone }}>
                        ₹{formatAmount(totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Mobile cards */}
              <ul className="grid gap-2 md:hidden">
                {pageRows.map((row) => (
                  <li key={row.id} className="rounded-xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-2)] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold theme-text">{row.categoryName || "-"}</div>
                        <div className="text-xs theme-text-muted">{projectLabel(row)}</div>
                      </div>
                      <div className="whitespace-nowrap text-sm font-bold tabular-nums" style={{ color: config.tone }}>
                        ₹{formatAmount(row.amount)}
                      </div>
                    </div>
                    <div className="mt-1 text-xs theme-text-muted">
                      {[
                        formatRowDate(row.date),
                        row.personName,
                        row.paymentMode ? PAYMENT_MODE_LABEL[row.paymentMode] : null,
                        row.source === "CLAIM" ? SOURCE_LABEL.CLAIM : null,
                        row.companyName ? companyLabel(row) : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                    {row.remark ? <div className="mt-1 text-xs theme-text">{row.remark}</div> : null}
                  </li>
                ))}
              </ul>

              {pageCount > 1 ? (
                <div className="mt-3 flex items-center justify-end gap-2 text-sm">
                  <button type="button" className="rbac-button rbac-button-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </button>
                  <span className="theme-text-muted">
                    Page {page} of {pageCount}
                  </span>
                  <button type="button" className="rbac-button rbac-button-secondary" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>
                    Next
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      <ListingFilterDialog
        open={filterOpen}
        title={`${config.title} Filters`}
        description="Leave a filter empty to include everything."
        onClose={() => setFilterOpen(false)}
        onApply={applyFilters}
        applyLabel="Apply Filters"
        closeLabel="Cancel"
      >
        <CustomDatePicker
          value={draft.fromDate}
          placeholder="From date"
          onChange={(value) => setDraft((prev) => ({ ...prev, fromDate: value }))}
        />
        <CustomDatePicker
          value={draft.toDate}
          placeholder="To date"
          onChange={(value) => setDraft((prev) => ({ ...prev, toDate: value }))}
        />
        <SearchSelect
          value={draft.projectId}
          onChange={(value) => setDraft((prev) => ({ ...prev, projectId: value }))}
          options={projects}
          placeholder="Project"
        />
        <SearchSelect
          value={draft.categoryId}
          onChange={(value) => setDraft((prev) => ({ ...prev, categoryId: value }))}
          options={categories}
          placeholder={config.categoryLabel}
        />
        <SearchSelect
          value={draft.companyId}
          onChange={(value) => setDraft((prev) => ({ ...prev, companyId: value }))}
          options={companies}
          placeholder="Company"
        />
        <SearchSelect
          value={draft.personId}
          onChange={(value) => setDraft((prev) => ({ ...prev, personId: value }))}
          options={people}
          placeholder={config.personLabel}
        />
        <select
          className="theme-input rbac-input"
          value={draft.paymentMode}
          onChange={(event) => setDraft((prev) => ({ ...prev, paymentMode: event.target.value }))}
          aria-label="Payment mode"
        >
          <option value="">All payment modes</option>
          {Object.entries(PAYMENT_MODE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {kind === "expense" ? (
          <select
            className="theme-input rbac-input"
            value={draft.source}
            onChange={(event) => setDraft((prev) => ({ ...prev, source: event.target.value }))}
            aria-label="Source"
          >
            <option value="">Direct expenses and peti cash claims</option>
            <option value="direct">Direct expenses only</option>
            <option value="claim">Peti cash claims only</option>
          </select>
        ) : null}
        <input
          className="theme-input rbac-input"
          placeholder="Remark contains..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </ListingFilterDialog>
    </section>
  );
}
