"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { flexRender, useReactTable } from "@tanstack/react-table";
import { ColumnDef, getCoreRowModel } from "@tanstack/table-core";
import { FaFilter, FaSpinner } from "react-icons/fa";
import { toast } from "react-toastify";
import ListingFilterDialog from "../../../components/ListingFilterDialog";
import AppliedFilterSummary from "../../../components/AppliedFilterSummary";
import CustomDatePicker from "../../../components/CustomDatePicker";
import { formatToDDMMYYYY } from "@/lib/dateUtils";

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
    setFilterOpen(true);
  }, [appliedCompanyId, appliedFromDate, appliedToDate, appliedUserId]);

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
        header: "Reference / Category",
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
        header: "Cash Given By",
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
            <p className="mt-1 text-sm theme-text-muted">
              Review Peti Cash received by an employee and expenses booked by
              the same user.
            </p>
          </div>
          <button
            type="button"
            className="rbac-button rbac-button-secondary theme-button-secondary inline-flex items-center gap-2"
            onClick={openFilters}
          >
            <FaFilter /> <span>Filters</span>
          </button>
        </div>

        <AppliedFilterSummary
          items={appliedFilters}
          onClear={clearFilters}
        />

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-[color:var(--theme-surface-2)] p-4">
            <div className="text-xs uppercase tracking-wide theme-text-muted">
              Total Given To
            </div>
            <div className="mt-2 font-semibold text-emerald-700">
              ₹{formatAmount(summary.totalGivenTo)}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-[color:var(--theme-surface-2)] p-4">
            <div className="text-xs uppercase tracking-wide theme-text-muted">
              Total Expense By
            </div>
            <div className="mt-2 font-semibold text-rose-700">
              ₹{formatAmount(summary.totalExpenseBy)}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-[color:var(--theme-surface-2)] p-4 md:col-span-2">
            <div className="text-xs uppercase tracking-wide theme-text-muted">
              Current Balance
            </div>
            <div
              className="mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold"
            >
              ₹{formatAmount(summary.balance)}
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
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

        <div className="mt-5 border-t border-slate-200 pt-4">
          <div className="text-sm text-slate-600">
            Total rows: <span className="font-semibold text-slate-900">{total}</span>
          </div>
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
        <div>
          <label className="mb-1 block text-sm font-medium theme-text">User</label>
          <select
            className="theme-input w-full rounded-md px-3 py-2"
            value={draftUserId}
            onChange={(event) => setDraftUserId(event.target.value)}
          >
            <option value="">Select employee</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {getUserLabel(user)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium theme-text">Company</label>
          <select
            className="theme-input w-full rounded-md px-3 py-2"
            value={draftCompanyId}
            onChange={(event) => setDraftCompanyId(event.target.value)}
          >
            <option value="">Select company</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {getCompanyLabel(company)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium theme-text">
            From Date
          </label>
          <CustomDatePicker
            value={draftFromDate}
            onChange={setDraftFromDate}
            placeholder="DD/MM/YYYY"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium theme-text">
            To Date
          </label>
          <CustomDatePicker
            value={draftToDate}
            onChange={setDraftToDate}
            placeholder="DD/MM/YYYY"
          />
        </div>
      </ListingFilterDialog>
    </section>
  );
}
