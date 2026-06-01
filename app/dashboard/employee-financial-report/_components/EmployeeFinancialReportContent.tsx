"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { flexRender, useReactTable } from "@tanstack/react-table";
import { ColumnDef, getCoreRowModel } from "@tanstack/table-core";
import { FaFilter, FaSpinner } from "react-icons/fa";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import ListingFilterDialog from "../../../components/ListingFilterDialog";
import AppliedFilterSummary from "../../../components/AppliedFilterSummary";
import CustomDatePicker from "../../../components/CustomDatePicker";
import { FinanceCardList } from "../../_components/FinanceCardList";
import { formatToDDMMYYYY } from "@/lib/dateUtils";
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/16/solid";

type ReportUserOption = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string | null;
};

type CompanyOption = {
  id: string;
  name: string;
  code?: string | null;
};

type ReportRow = {
  id: string;
  sourceType: "PETI_CASH" | "EXPENSE";
  typeLabel: string;
  referenceLabel: string;
  cashGivenByLabel: string | null;
  sourceSubTypeLabel: string | null;
  projectName: string | null;
  projectCity: string | null;
  companyName: string | null;
  companyCode: string | null;
  credit: number;
  debit: number;
  remarks: string | null;
  runningBalance: number;
  date: string;
  createdAt: string;
  amount: number;
};

type ReportSummary = {
  totalGivenTo: number;
  totalExpenseBy: number;
  balance: number;
};

type ReportResponse = {
  users: ReportUserOption[];
  selectedUser: ReportUserOption | null;
  data: ReportRow[];
  total: number;
  summary: ReportSummary;
};

type CompanyResponse = {
  id: string;
  name: string;
  code?: string | null;
};

const formatAmount = (value: number) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getUserLabel = (user?: ReportUserOption | null) =>
  user ? `${user.fullName}${user.role ? ` - ${user.role}` : ""}` : "";

const getCompanyLabel = (company?: CompanyOption | null) =>
  company ? `${company.name}${company.code ? ` (${company.code})` : ""}` : "";

const getProjectLabel = (row: ReportRow) =>
  row.projectName
    ? row.projectCity
      ? `${row.projectName} (${row.projectCity})`
      : row.projectName
    : "-";

const getRowCompanyLabel = (row: ReportRow) =>
  row.companyName
    ? row.companyCode
      ? `${row.companyName} (${row.companyCode})`
      : row.companyName
    : row.companyCode || "-";

const getTypeClassName = (row: ReportRow) =>
  row.sourceType === "PETI_CASH"
    ? "bg-sky-100 text-sky-800 ring-1 ring-sky-200"
    : "bg-rose-100 text-rose-800 ring-1 ring-rose-200";

const getBalanceClassName = (value: number) =>
  value >= 0
    ? "text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200"
    : "text-rose-700 bg-rose-50 ring-1 ring-rose-200";

const isCompleteDateInput = (value: string) =>
  !value || /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value.trim());

const moneyCell = (value: number, tone: "credit" | "debit" | "balance") => {
  if (!value) {
    return tone === "balance" ? (
      <span className="font-semibold text-slate-600">₹0.00</span>
    ) : (
      <span className="theme-text-muted">-</span>
    );
  }

  const toneClass =
    tone === "credit"
      ? "text-emerald-700"
      : tone === "debit"
        ? "text-rose-700"
        : value >= 0
          ? "text-emerald-700"
          : "text-rose-700";

  return <span className={`font-semibold ${toneClass}`}>₹{formatAmount(value)}</span>;
};

export default function EmployeeFinancialReportContent() {
  const [users, setUsers] = useState<ReportUserOption[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [summary, setSummary] = useState<ReportSummary>({
    totalGivenTo: 0,
    totalExpenseBy: 0,
    balance: 0,
  });
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [appliedUserId, setAppliedUserId] = useState("");
  const [appliedCompanyId, setAppliedCompanyId] = useState("");
  const [appliedFromDate, setAppliedFromDate] = useState("");
  const [appliedToDate, setAppliedToDate] = useState("");
  const [draftUserId, setDraftUserId] = useState("");
  const [draftCompanyId, setDraftCompanyId] = useState("");
  const [draftFromDate, setDraftFromDate] = useState("");
  const [draftToDate, setDraftToDate] = useState("");
  const [draftUserQuery, setDraftUserQuery] = useState("");
  const [draftCompanyQuery, setDraftCompanyQuery] = useState("");
  const [exporting, setExporting] = useState(false);

  const loadReport = useCallback(async () => {
    if (!isCompleteDateInput(appliedFromDate) || !isCompleteDateInput(appliedToDate)) {
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (appliedUserId) params.set("userId", appliedUserId);
      if (appliedCompanyId) params.set("companyId", appliedCompanyId);
      if (appliedFromDate) params.set("fromDate", appliedFromDate);
      if (appliedToDate) params.set("toDate", appliedToDate);

      const res = await fetch(`/api/employee-financial-report?${params.toString()}`);
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error || "Failed to load employee financial report.");
        return;
      }

      const data = (await res.json()) as ReportResponse;
      setUsers(Array.isArray(data.users) ? data.users : []);
      setRows(Array.isArray(data.data) ? data.data : []);
      setSummary(
        data.summary || {
          totalGivenTo: 0,
          totalExpenseBy: 0,
          balance: 0,
        },
      );
      setTotal(typeof data.total === "number" ? data.total : 0);
    } catch (error) {
      console.error("Failed to load employee financial report", error);
      toast.error("Failed to load employee financial report.");
    } finally {
      setLoading(false);
    }
  }, [appliedCompanyId, appliedFromDate, appliedToDate, appliedUserId]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const res = await fetch("/api/companies/options");
        if (!res.ok) return;
        const data = (await res.json()) as CompanyResponse[];
        setCompanies(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load company options", error);
      }
    };

    loadCompanies();
  }, []);

  const openFilters = useCallback(() => {
    setDraftUserId(appliedUserId);
    setDraftCompanyId(appliedCompanyId);
    setDraftFromDate(appliedFromDate);
    setDraftToDate(appliedToDate);
    const selectedUser = users.find((user) => user.id === appliedUserId);
    const selectedCompany = companies.find((company) => company.id === appliedCompanyId);
    setDraftUserQuery(selectedUser ? getUserLabel(selectedUser) : "");
    setDraftCompanyQuery(selectedCompany ? getCompanyLabel(selectedCompany) : "");
    setFilterOpen(true);
  }, [appliedCompanyId, appliedFromDate, appliedToDate, appliedUserId, users, companies]);

  const closeFilters = useCallback(() => {
    setFilterOpen(false);
  }, []);

  const applyFilters = useCallback(() => {
    if (!draftUserId) {
      toast.error("Please select a user.");
      return;
    }

    if (!isCompleteDateInput(draftFromDate) || !isCompleteDateInput(draftToDate)) {
      toast.error("Please enter complete dates.");
      return;
    }

    setAppliedUserId(draftUserId);
    setAppliedCompanyId(draftCompanyId);
    setAppliedFromDate(draftFromDate);
    setAppliedToDate(draftToDate);
    setFilterOpen(false);
  }, [draftCompanyId, draftFromDate, draftToDate, draftUserId]);

  const filteredUsers = useCallback(
    (q: string) => {
      const term = q.trim().toLowerCase();
      if (!term) return users;
      return users.filter((user) => getUserLabel(user).toLowerCase().includes(term));
    },
    [users],
  );

  const filteredCompanies = useCallback(
    (q: string) => {
      const term = q.trim().toLowerCase();
      if (!term) return companies;
      return companies.filter((company) => getCompanyLabel(company).toLowerCase().includes(term));
    },
    [companies],
  );

  const clearFilters = useCallback(() => {
    setAppliedUserId("");
    setAppliedCompanyId("");
    setAppliedFromDate("");
    setAppliedToDate("");
    setDraftUserId("");
    setDraftCompanyId("");
    setDraftFromDate("");
    setDraftToDate("");
    setFilterOpen(false);
  }, []);

  const handleExportExcel = useCallback(async () => {
    if (rows.length === 0) {
      toast.warning("No data to export.");
      return;
    }
    setExporting(true);
    try {
      const worksheetData = [
        [
          "#",
          "Date",
          "Type",
          "Category",
          "Given By",
          "Project",
          "Company",
          "Credit",
          "Debit",
          "Remarks",
          "Running Balance",
        ],
        ...rows.map((row, index) => [
          index + 1,
          formatToDDMMYYYY(row.date),
          row.typeLabel,
          row.referenceLabel || "-",
          row.sourceType === "PETI_CASH" ? row.cashGivenByLabel || "-" : "-",
          getProjectLabel(row),
          getRowCompanyLabel(row),
          Number(row.credit || 0),
          Number(row.debit || 0),
          row.remarks || "-",
          Number(row.runningBalance || 0),
        ]),
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Financial Report");

      const arrayBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const blob = new Blob([arrayBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `employee-financial-report-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      toast.success("Excel export generated successfully.");
    } catch (error) {
      console.error("Failed to export Excel", error);
      toast.error("Failed to export Excel report.");
    } finally {
      setExporting(false);
    }
  }, [rows]);

  const appliedFilters = useMemo(
    () =>
      [
        users.find((user) => user.id === appliedUserId)
          ? `User: ${getUserLabel(users.find((user) => user.id === appliedUserId) || null)}`
          : "",
        companies.find((company) => company.id === appliedCompanyId)
          ? `Company: ${getCompanyLabel(
            companies.find((company) => company.id === appliedCompanyId) || null,
          )}`
          : "",
        appliedFromDate ? `From: ${appliedFromDate}` : "",
        appliedToDate ? `To: ${appliedToDate}` : "",
      ].filter(Boolean),
    [appliedCompanyId, appliedFromDate, appliedToDate, appliedUserId, companies, users],
  );

  const columns = useMemo<ColumnDef<ReportRow>[]>(
    () => [
      {
        header: "Date",
        accessorKey: "date",
        cell: (info) => {
          const value = String(info.getValue() || "");
          return value ? formatToDDMMYYYY(value) : "-";
        },
      },
      {
        header: "Type",
        accessorKey: "typeLabel",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span
              className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${getTypeClassName(row.original)}`}
            >
              {row.original.typeLabel}
            </span>
          </div>
        ),
      },
      {
        header: "Category",
        accessorKey: "referenceLabel",
        size: 220,
        cell: ({ row, getValue }) => (
          <div className="flex flex-col">
            <span className="font-medium theme-text">
              {String(getValue() || "-")}
            </span>
          </div>
        ),
      },
      {
        header: "Given By",
        accessorKey: "cashGivenByLabel",
        size: 220,
        cell: ({ row, getValue }) => (
          <div className="flex flex-col">
            <span className="font-medium theme-text">
              {row.original.sourceType === "PETI_CASH"
                ? String(getValue() || "-")
                : "-"}
            </span>
          </div>
        ),
      },
      {
        header: "Project",
        accessorKey: "projectName",
        cell: ({ row }) => (
          <span className="theme-text-muted">{getProjectLabel(row.original)}</span>
        ),
      },
      {
        header: "Company",
        accessorKey: "companyName",
        cell: ({ row }) => (
          <span className="theme-text-muted">{getRowCompanyLabel(row.original)}</span>
        ),
      },
      {
        header: "Credit",
        accessorKey: "credit",
        cell: ({ getValue }) => moneyCell(Number(getValue() || 0), "credit"),
      },
      {
        header: "Debit",
        accessorKey: "debit",
        cell: ({ getValue }) => moneyCell(Number(getValue() || 0), "debit"),
      },
      {
        header: "Remarks",
        accessorKey: "remarks",
        size: 260,
        cell: (info) => (
          <span className="theme-text-muted">{String(info.getValue() || "-")}</span>
        ),
      },
      {
        header: "Running Balance",
        accessorKey: "runningBalance",
        cell: ({ getValue }) => moneyCell(Number(getValue() || 0), "balance"),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <section className="rbac-section rbac-container">
      <div className="rbac-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="rbac-title-lg">Employee Financial Report</h3>
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
              className="rbac-button rbac-button-secondary"
              type="button"
              onClick={handleExportExcel}
              disabled={exporting || loading || rows.length === 0}
            >
              {exporting ? "Exporting..." : "Export Excel Sheet"}
            </button>
          </div>
        </div>

        <AppliedFilterSummary
          items={appliedFilters}
          onClear={clearFilters}
        />

        <div className="mt-5 grid gap-3 grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-[color:var(--theme-surface-2)] p-4">
            <div className="text-xs uppercase tracking-wide theme-text-muted">
              Given
            </div>
            <div className="mt-2 text-xs font-semibold text-emerald-700">
              ₹{formatAmount(summary.totalGivenTo)}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-[color:var(--theme-surface-2)] p-4">
            <div className="text-xs uppercase tracking-wide theme-text-muted">
              Expense
            </div>
            <div className="mt-2 text-xs font-semibold text-rose-700">
              ₹{formatAmount(summary.totalExpenseBy)}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-[color:var(--theme-surface-2)] p-4">
            <div className="text-xs uppercase tracking-wide theme-text-muted">
              Balance
            </div>
            <div
              className="mt-2 text-xs font-semibold"
            >
              ₹{formatAmount(summary.balance)}
            </div>
          </div>
        </div>

        <div className="mt-4 hidden overflow-x-auto md:block">
          <table className="theme-table min-w-full border border-slate-200 border-separate border-spacing-0">
            <thead className="bg-slate-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 border-b border-slate-200"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    <div className="inline-flex items-center gap-2">
                      <FaSpinner className="animate-spin" />
                      <span>Loading report...</span>
                    </div>
                  </td>
                </tr>
              ) : rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="border-b border-slate-200 px-4 py-3 align-top text-sm"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center text-sm text-slate-500"
                  >
                    {appliedUserId
                      ? "No financial activity found for the selected filters."
                      : "Open Filters and select a user to view the report."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 md:hidden">
          <FinanceCardList
            rows={rows}
            loading={loading}
            emptyLabel="No peti cash entries found."
            showCount={false}
            collapsible={false}
            cardContent={{
              getVariant: (row) =>
                row.typeLabel === "Expense" ? "expense" : "income",
              getCode: (row) => row.companyCode,
              getProjectName: (row) => row.projectName,
              getProjectCity: (row) => row.projectCity,
              getCashGivenByName: (row) => row.cashGivenByLabel,
              getRemark: (row) => row.remarks || "",
              getDateLabel: (row) => formatToDDMMYYYY(row.date),
              getCredit: (row) => row.credit,
              getDebit: (row) => row.debit,
            }}
          />
        </div>
      </div>

      <ListingFilterDialog
        open={filterOpen}
        title="Employee Financial Filters"
        description="Choose an employee, company, and date range before loading the report."
        onClose={closeFilters}
        onApply={applyFilters}
        applyLabel="Apply Filters"
        closeLabel="Cancel"
      >
        <Combobox
          value={draftUserId}
          onChange={(option: string | null) => {
            setDraftUserId(option ?? "");
            setDraftUserQuery("");
          }}
          nullable
        >
          <div className="relative min-w-64">
            <ComboboxInput
              className="theme-input rbac-input w-full pr-10"
              placeholder="Select employee"
              displayValue={(option: string | null) => {
                if (option) {
                  const user = users.find((u) => u.id === option);
                  return user ? getUserLabel(user) : draftUserQuery;
                }
                return draftUserQuery;
              }}
              onChange={(event) => {
                setDraftUserQuery(event.target.value);
                setDraftUserId("");
              }}
            />
            <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3 text-[color:var(--theme-text-muted)]">
              <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
            </ComboboxButton>
            <ComboboxOptions className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-[color:var(--theme-border)] bg-[var(--theme-surface)] p-1 shadow-lg text-[color:var(--theme-text)]">
              {filteredUsers(draftUserQuery).map((user) => (
                <ComboboxOption
                  key={user.id}
                  value={user.id}
                  className="cursor-pointer rounded-lg px-3 py-2 text-sm data-[focus]:bg-[var(--theme-surface-2)] data-[selected]:bg-[var(--theme-surface-2)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span>{getUserLabel(user)}</span>
                  </div>
                </ComboboxOption>
              ))}
            </ComboboxOptions>
          </div>
        </Combobox>

        <Combobox
          value={draftCompanyId}
          onChange={(option: string | null) => {
            setDraftCompanyId(option ?? "");
            setDraftCompanyQuery("");
          }}
          nullable
        >
          <div className="relative min-w-64">
            <ComboboxInput
              className="theme-input rbac-input w-full pr-10"
              placeholder="Select company"
              displayValue={(option: string | null) => {
                if (option) {
                  const company = companies.find((c) => c.id === option);
                  return company ? getCompanyLabel(company) : draftCompanyQuery;
                }
                return draftCompanyQuery;
              }}
              onChange={(event) => {
                setDraftCompanyQuery(event.target.value);
                setDraftCompanyId("");
              }}
            />
            <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3 text-[color:var(--theme-text-muted)]">
              <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
            </ComboboxButton>
            <ComboboxOptions className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-[color:var(--theme-border)] bg-[var(--theme-surface)] p-1 shadow-lg text-[color:var(--theme-text)]">
              {filteredCompanies(draftCompanyQuery).map((company) => (
                <ComboboxOption
                  key={company.id}
                  value={company.id}
                  className="cursor-pointer rounded-lg px-3 py-2 text-sm data-[focus]:bg-[var(--theme-surface-2)] data-[selected]:bg-[var(--theme-surface-2)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span>{getCompanyLabel(company)}</span>
                  </div>
                </ComboboxOption>
              ))}
            </ComboboxOptions>
          </div>
        </Combobox>

        <div>
          <CustomDatePicker
            value={draftFromDate}
            placeholder="From date"
            onChange={setDraftFromDate}
          />
        </div>

        <div>
          <CustomDatePicker
            value={draftToDate}
            onChange={setDraftToDate}
            placeholder="To date"
          />
        </div>
      </ListingFilterDialog>
    </section>
  );
}
