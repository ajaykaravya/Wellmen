"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { flexRender, useReactTable } from "@tanstack/react-table";
import { ColumnDef, getCoreRowModel } from "@tanstack/table-core";
import DashboardShell from "../_components/DashboardShell";
import AppliedFilterSummary from "../../components/AppliedFilterSummary";
import ConfirmDialog from "../../components/ConfirmDialog";
import ListingFilterDialog from "../../components/ListingFilterDialog";
import useDebounce from "@/app/hooks/useDebounce";
import { toast } from "react-toastify";
import {
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaSpinner,
  FaFilter,
  FaTrash,
} from "react-icons/fa";
import Link from "next/link";
import { formatToDDMMYYYY } from "@/lib/dateUtils";
import CustomDatePicker from "../../components/CustomDatePicker";
import * as XLSX from "xlsx";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { useRouter } from "next/navigation";
import { FinanceCardList } from "../_components/FinanceCardList";

type TransactionType = "EXPENSE";

type DailyExpenseRow = {
  id: string;
  transactionType: TransactionType;
  amount: number;
  projectId: string | null;
  projectName: string | null;
  projectCity: string | null;
  expenseTypeId: string | null;
  expenseTypeName: string | null;
  expenseById: string | null;
  expenseByName: string | null;
  expenseCompanyId: string | null;
  expenseCompanyName: string | null;
  expenseCompanyCode: string | null;
  paymentMode: string | null;
  date: string;
  remark: string | null;
};

type ExpenseTypeOption = {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
};

type ProjectOption = {
  id: string;
  name: string;
  city?: string | null;
};

type UserOption = {
  id: string;
  firstName: string;
  lastName: string;
  role?: string | null;
};

type CompanyOption = {
  id: string;
  name: string;
};

const formatAmount = (value: number) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getExpenseTypeLabel = (option: ExpenseTypeOption) => option.name;

const getProjectLabel = (option: ProjectOption) =>
  option.city ? `${option.name} (${option.city})` : option.name;

const getUserLabel = (option: UserOption) =>
  `${option.firstName} ${option.lastName} - ${option.role || ""}`.trim();

const getCompanyLabel = (option: CompanyOption) => option.name;

const getTransactionLabel = () => "Expense";

const getTransactionClassName = () =>
  "bg-rose-100 text-rose-800 ring-1 ring-rose-200";

const getRowCompanyLabel = (row: DailyExpenseRow) =>
  row.expenseCompanyName || row.expenseCompanyCode || null;

function DailyExpenseListContent() {
  const router = useRouter();
  const [dailyExpenses, setDailyExpenses] = useState<DailyExpenseRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [expenseTypes, setExpenseTypes] = useState<ExpenseTypeOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [expenseTypeFilter, setExpenseTypeFilter] =
    useState<ExpenseTypeOption | null>(null);
  const [projectFilter, setProjectFilter] = useState<ProjectOption | null>(null);
  const [expenseByFilter, setExpenseByFilter] = useState<UserOption | null>(null);
  const [expenseCompanyFilter, setExpenseCompanyFilter] =
    useState<CompanyOption | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftQuery, setDraftQuery] = useState("");
  const [draftExpenseTypeFilter, setDraftExpenseTypeFilter] =
    useState<ExpenseTypeOption | null>(null);
  const [draftExpenseTypeQuery, setDraftExpenseTypeQuery] = useState("");
  const [draftProjectFilter, setDraftProjectFilter] = useState<ProjectOption | null>(null);
  const [draftProjectQuery, setDraftProjectQuery] = useState("");
  const [draftExpenseByFilter, setDraftExpenseByFilter] =
    useState<UserOption | null>(null);
  const [draftExpenseByQuery, setDraftExpenseByQuery] = useState("");
  const [draftExpenseCompanyFilter, setDraftExpenseCompanyFilter] =
    useState<CompanyOption | null>(null);
  const [draftExpenseCompanyQuery, setDraftExpenseCompanyQuery] = useState("");
  const [draftFromDate, setDraftFromDate] = useState("");
  const [draftToDate, setDraftToDate] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<DailyExpenseRow | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const activeFilterCount = [
    query.trim(),
    fromDate,
    toDate,
    projectFilter?.id,
    expenseTypeFilter?.id,
    expenseByFilter?.id,
    expenseCompanyFilter?.id,
  ].filter(Boolean).length;

  const openFilters = useCallback(() => {
    setDraftQuery(query);
    setDraftFromDate(fromDate);
    setDraftToDate(toDate);
    setDraftProjectFilter(projectFilter);
    setDraftProjectQuery(projectFilter ? getProjectLabel(projectFilter) : "");
    setDraftExpenseTypeFilter(expenseTypeFilter);
    setDraftExpenseTypeQuery(expenseTypeFilter ? getExpenseTypeLabel(expenseTypeFilter) : "");
    setDraftExpenseByFilter(expenseByFilter);
    setDraftExpenseByQuery(expenseByFilter ? getUserLabel(expenseByFilter) : "");
    setDraftExpenseCompanyFilter(expenseCompanyFilter);
    setDraftExpenseCompanyQuery(
      expenseCompanyFilter ? getCompanyLabel(expenseCompanyFilter) : "",
    );
    setFilterOpen(true);
  }, [
    expenseByFilter,
    expenseCompanyFilter,
    expenseTypeFilter,
    fromDate,
    projectFilter,
    query,
    toDate,
  ]);

  const closeFilters = useCallback(() => {
    setFilterOpen(false);
  }, []);

  const applyFilters = useCallback(() => {
    setPageIndex(0);
    setQuery(draftQuery);
    setFromDate(draftFromDate);
    setToDate(draftToDate);
    setProjectFilter(draftProjectFilter);
    setExpenseTypeFilter(draftExpenseTypeFilter);
    setExpenseByFilter(draftExpenseByFilter);
    setExpenseCompanyFilter(draftExpenseCompanyFilter);
    setFilterOpen(false);
  }, [
    draftExpenseByFilter,
    draftExpenseCompanyFilter,
    draftExpenseTypeFilter,
    draftFromDate,
    draftQuery,
    draftProjectFilter,
    draftToDate,
  ]);

  const appliedFilters = [
    query.trim(),
    projectFilter ? getProjectLabel(projectFilter) : "",
    expenseTypeFilter ? getExpenseTypeLabel(expenseTypeFilter) : "",
    expenseByFilter ? getUserLabel(expenseByFilter) : "",
    expenseCompanyFilter ? getCompanyLabel(expenseCompanyFilter) : "",
    fromDate,
    toDate,
  ].filter(Boolean);

  const calculateBalance = (
    transactions: Array<{
      amount: number | string | null | undefined;
      transactionType: TransactionType;
    }>,
  ) =>
    transactions.reduce((total, item) => {
      const amount = Number(item.amount || 0);

      if (item.transactionType === "EXPENSE") return total - amount;

      return total;
    }, 0);

  useEffect(() => {
    const loadExpenseTypes = async () => {
      try {
        const [projectsRes, expenseTypesRes, usersRes, companiesRes] = await Promise.all([
          fetch("/api/projects/options"),
          fetch("/api/expense-types/options"),
          fetch("/api/users/options"),
          fetch("/api/companies/options"),
        ]);

        if (projectsRes.ok) {
          const data = await projectsRes.json();
          setProjects(Array.isArray(data) ? data : []);
        }

        if (expenseTypesRes.ok) {
          const data = await expenseTypesRes.json();
          setExpenseTypes(
            Array.isArray(data)
              ? data.filter((item: ExpenseTypeOption) => item.status === "ACTIVE")
              : [],
          );
        }

        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(Array.isArray(data) ? data : []);
        }

        if (companiesRes.ok) {
          const data = await companiesRes.json();
          setCompanies(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Failed to load expense filter options", error);
      }
    };

    loadExpenseTypes();
  }, []);

  const filteredProjects = useMemo(() => {
    const query = draftProjectQuery.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter((project) =>
      getProjectLabel(project).toLowerCase().includes(query),
    );
  }, [draftProjectQuery, projects]);

  const filteredExpenseByUsers = useMemo(() => {
    const query = draftExpenseByQuery.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) => getUserLabel(user).toLowerCase().includes(query));
  }, [draftExpenseByQuery, users]);

  const filteredExpenseCompanies = useMemo(() => {
    const query = draftExpenseCompanyQuery.trim().toLowerCase();
    if (!query) return companies;
    return companies.filter((company) =>
      getCompanyLabel(company).toLowerCase().includes(query),
    );
  }, [companies, draftExpenseCompanyQuery]);

  const loadDailyExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pageIndex + 1),
        pageSize: String(pageSize),
      });
      if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
      if (projectFilter?.id) params.set("projectId", projectFilter.id);
      if (expenseTypeFilter?.id)
        params.set("expenseTypeId", expenseTypeFilter.id);
      if (expenseByFilter?.id) params.set("expenseById", expenseByFilter.id);
      if (expenseCompanyFilter?.id)
        params.set("expenseCompanyId", expenseCompanyFilter.id);
      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);

      const res = await fetch(`/api/daily-expenses?${params.toString()}`);
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error || "Failed to load daily expenses.");
        return;
      }

      const data = await res.json();
      setDailyExpenses(Array.isArray(data?.data) ? data.data : []);
      setTotal(typeof data?.total === "number" ? data.total : 0);
    } catch (error) {
      console.error("Failed to load daily expenses", error);
      toast.error("Failed to load daily expenses.");
    } finally {
      setLoading(false);
    }
  }, [
    pageIndex,
    pageSize,
    debouncedQuery,
    projectFilter,
    expenseTypeFilter,
    expenseByFilter,
    expenseCompanyFilter,
    fromDate,
    toDate,
  ]);

  useEffect(() => {
    loadDailyExpenses();
  }, [loadDailyExpenses]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (pageIndex > pageCount - 1) {
      setPageIndex(Math.max(pageCount - 1, 0));
    }
  }, [pageCount, pageIndex]);

  const handleDeleteTransaction = useCallback((row: DailyExpenseRow) => {
    setConfirmTarget(row);
    setConfirmOpen(true);
  }, []);

  const handleEditTransaction = useCallback(
    (row: DailyExpenseRow) => {
      router.push(`/dashboard/daily-expenses/${row.id}`);
    },
    [router],
  );

  const confirmDeleteTransaction = useCallback(async () => {
    if (!confirmTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/daily-expenses/${confirmTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error || "Failed to delete daily expense.");
        return;
      }
      await loadDailyExpenses();
      toast.success("Daily expense deleted successfully.");
    } catch (error) {
      console.error("Failed to delete transaction", error);
      toast.error("Failed to delete daily expense.");
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setConfirmTarget(null);
    }
  }, [confirmTarget, loadDailyExpenses]);

  const loadAllFilteredExpenses = useCallback(async () => {
    const accumulated: DailyExpenseRow[] = [];
    let currentPage = 1;
    let totalPages = 1;

    while (currentPage <= totalPages) {
      const params = new URLSearchParams({
        page: String(currentPage),
        pageSize: "100",
      });
      if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
      if (projectFilter?.id) params.set("projectId", projectFilter.id);
      if (expenseTypeFilter?.id)
        params.set("expenseTypeId", expenseTypeFilter.id);
      if (expenseByFilter?.id) params.set("expenseById", expenseByFilter.id);
      if (expenseCompanyFilter?.id)
        params.set("expenseCompanyId", expenseCompanyFilter.id);
      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);

      const res = await fetch(`/api/daily-expenses?${params.toString()}`);
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to load daily expenses.");
      }

      const data = await res.json();
      const rows = Array.isArray(data?.data) ? data.data : [];
      accumulated.push(...rows);
      totalPages =
        typeof data?.totalPages === "number" && data.totalPages > 0
          ? data.totalPages
          : 1;
      currentPage += 1;
    }

    return accumulated;
  }, [
    debouncedQuery,
    projectFilter,
    expenseTypeFilter,
    expenseByFilter,
    expenseCompanyFilter,
    fromDate,
    toDate,
  ]);

  const handleExportExcel = useCallback(async () => {
    setExporting(true);
    try {
      const rows = await loadAllFilteredExpenses();
      const worksheetData = [
        [
          "#",
          "Date",
          "Amount",
          "Category",
          "Project",
          "Expense By",
          "Company",
          "Remark",
        ],
        ...rows.map((row, index) => [
          index + 1,
          formatToDDMMYYYY(row.date),
          Number(row.amount || 0),
          row.expenseTypeName || "-",
          row.projectName
            ? `${row.projectName}${row.projectCity ? ` (${row.projectCity})` : ""}`
            : "-",
          row.expenseByName || "-",
          getRowCompanyLabel(row) || "-",
          row.remark || "-",
        ]),
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Finance Transactions");
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
      anchor.download = `finance-transactions-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      toast.success("Finance transaction export generated successfully.");
    } catch (error) {
      console.error("Failed to export finance transactions", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to export finance transactions.",
      );
    } finally {
      setExporting(false);
    }
  }, [loadAllFilteredExpenses]);

  const columns = useMemo<ColumnDef<DailyExpenseRow>[]>(
    () => [
      {
        header: "Date",
        accessorKey: "date",
        cell: ({ row }) => (
          <div className="flex flex-wrap items-center gap-2">
            <span className="rbac-muted">{formatToDDMMYYYY(row.original.date)}</span>
          </div>
        ),
      },
      {
        header: "Category",
        accessorKey: "expenseTypeName",
        cell: ({ row }) => (
          <span className="rbac-muted">
            {row.original.expenseTypeName || "-"}
          </span>
        ),
      },
      {
        header: "Project",
        accessorKey: "projectName",
        cell: ({ row }) => (
          <span className="rbac-muted">
            {row.original.projectName
              ? `${row.original.projectName}${row.original.projectCity ? ` (${row.original.projectCity})` : ""}`
              : "-"}
          </span>
        ),
      },
      {
        header: "Expense By",
        accessorKey: "expenseByName",
        cell: ({ row }) => (
          <span className="rbac-muted">
            {row.original.expenseByName || "-"}
          </span>
        ),
      },
      {
        header: "Company",
        accessorKey: "expenseCompanyName",
        cell: ({ row }) => (
          <div className="flex flex-wrap items-center gap-2">
            <span className="rbac-muted">
              {row.original.expenseCompanyName || "-"}
            </span>
          </div>
        ),
      },
      {
        header: "Remark",
        accessorKey: "remark",
        cell: ({ row }) => (
          <span className="rbac-muted">{row.original.remark || "-"}</span>
        ),
      },
      {
        header: "Amount",
        accessorKey: "amount",
        cell: ({ row }) => (
          <span className="rbac-muted">
            {formatAmount(row.original.amount)}
          </span>
        ),
      },
      {
        header: "Action",
        id: "action",
        cell: ({ row }) => (
          <div className="justify-end flex gap-4">
            <button
              onClick={() => handleEditTransaction(row.original)}
              className="rbac-link"
              type="button"
            >
              <FaEdit />
            </button>
            <button
              className="rbac-link danger"
              type="button"
              onClick={() => handleDeleteTransaction(row.original)}
            >
              <FaTrash />
            </button>
          </div>
        ),
      },
    ],
    [handleDeleteTransaction, handleEditTransaction],
  );

  const table = useReactTable({
    data: dailyExpenses,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount,
  });

  return (
    <>
      <section className="rbac-section rbac-container">
        <div className="rbac-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="rbac-title-lg">Expenses</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                className="rbac-button rbac-button-secondary theme-button-secondary inline-flex items-center gap-2"
                type="button"
                onClick={openFilters}
              >
                <FaFilter /> <span>Filters</span>
              </button>
              <button
                className="rbac-button rbac-button-secondary"
                type="button"
                onClick={handleExportExcel}
                disabled={exporting || loading}
              >
                {exporting ? "Exporting..." : "Export Excel Sheet"}
              </button>
              <Link href="/dashboard/daily-expenses/new">
                <button className="rbac-button" type="button">
                  Add Expense
                </button>
              </Link>
            </div>
          </div>

          <AppliedFilterSummary
            items={appliedFilters}
            onClear={() => {
              setPageIndex(0);
              setQuery("");
              setFromDate("");
              setToDate("");
              setProjectFilter(null);
              setExpenseTypeFilter(null);
              setExpenseByFilter(null);
              setExpenseCompanyFilter(null);
              setDraftQuery("");
              setDraftProjectFilter(null);
              setDraftProjectQuery("");
              setDraftExpenseTypeFilter(null);
              setDraftExpenseTypeQuery("");
              setDraftExpenseByFilter(null);
              setDraftExpenseByQuery("");
              setDraftExpenseCompanyFilter(null);
              setDraftExpenseCompanyQuery("");
              setFilterOpen(false);
            }}
          />

          <div className="mt-4">
            <div className="hidden md:block overflow-x-auto">
              <table className="theme-table min-w-full border border-slate-200 border-separate border-spacing-0">
                <thead className="bg-slate-50">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          style={{ width: header.getSize() }}
                          className={`text-xs font-semibold uppercase px-4 py-3 border-b border-slate-200 ${header.id === "action" ? "text-right" : "text-left"
                            }`}
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
                  {loading && (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-4 py-3 text-sm text-slate-500"
                      >
                        <div className="flex items-center justify-center">
                          <FaSpinner className="animate-spin mr-2" size={16} />
                        </div>
                      </td>
                    </tr>
                  )}
                  {!loading && dailyExpenses.length === 0 && (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-4 py-3 text-sm text-slate-500"
                      >
                        No expense entries found.
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    table.getRowModel().rows.map((row, index) => (
                      <tr
                        key={row.id}
                        className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            style={{ width: cell.column.getSize() }}
                            className="px-4 py-3 text-sm border-b border-slate-100"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden mt-4">
              <FinanceCardList
                rows={dailyExpenses}
                loading={loading}
                emptyLabel="No expense entries found."
                showCount={false}
                collapsible={false}
                onEdit={handleEditTransaction}
                onDelete={handleDeleteTransaction}
                cardContent={{
                  getVariant: () => "expense",
                  getCode: (row) => row.expenseCompanyCode,
                  getProjectName: (row) => row.projectName,
                  getProjectCity: (row) => row.projectCity,
                  getPaymentMode: (row) => row.paymentMode,
                  getExpenseByName: (row) => row.expenseByName,
                  getTitle: (row) => row.expenseTypeName || "Expense",
                  getRemark: (row) => row.remark || "",
                  getDateLabel: (row) => formatToDDMMYYYY(row.date),
                }}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-end gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <button
                  className="change-button change-button-secondary"
                  type="button"
                  onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}
                  disabled={pageIndex === 0}
                >
                  <FaChevronLeft size={20} />
                </button>
                <span>
                  Page {pageIndex + 1} of {pageCount}
                </span>
                <button
                  className="change-button change-button-secondary"
                  type="button"
                  onClick={() =>
                    setPageIndex((prev) => Math.min(prev + 1, pageCount - 1))
                  }
                  disabled={pageIndex + 1 >= pageCount}
                >
                  <FaChevronRight size={20} />
                </button>
              </div>
              <div>
                <select
                  className="rbac-input rbac-select rbac-pagination"
                  value={pageSize}
                  onChange={(event) => {
                    setPageIndex(0);
                    setPageSize(Number(event.target.value));
                  }}
                >
                  {[5, 10, 20, 30].map((size) => (
                    <option key={size} value={size}>
                      Show {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete expense?"
        description="Are you sure you want to delete?"
        confirmLabel="Delete"
        confirmLoading={deleting}
        confirmLoadingLabel="Deleting..."
        cancelLabel="Cancel"
        onConfirm={confirmDeleteTransaction}
        onClose={() => {
          setConfirmOpen(false);
          setConfirmTarget(null);
        }}
      />
      <ListingFilterDialog
        open={filterOpen}
        title="Expense Filters"
        description="Update the filters and apply them when you're ready."
        onClose={closeFilters}
        onApply={applyFilters}
        activeCount={activeFilterCount}
        maxWidthClassName="max-w-2xl"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <CustomDatePicker
            value={draftFromDate}
            onChange={setDraftFromDate}
            placeholder="From date"
            className="rbac-input-filter"
          />

          <CustomDatePicker
            value={draftToDate}
            onChange={setDraftToDate}
            placeholder="To date"
            className="rbac-input-filter"
          />

          <Combobox
            value={draftProjectFilter}
            onChange={(option: ProjectOption | null) => {
              setDraftProjectFilter(option);
              setDraftProjectQuery("");
            }}
            nullable
          >
            <div className="relative min-w-64">
              <ComboboxInput
                className="theme-input rbac-input w-full pr-10"
                placeholder="Project"
                displayValue={(option: ProjectOption | null) =>
                  option ? getProjectLabel(option) : draftProjectQuery
                }
                onChange={(event) => {
                  setDraftProjectQuery(event.target.value);
                  setDraftProjectFilter(null);
                }}
              />
              <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3 text-[color:var(--theme-text-muted)]">
                <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
              </ComboboxButton>
              <ComboboxOptions className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-[color:var(--theme-border)] bg-[var(--theme-surface)] p-1 shadow-lg text-[color:var(--theme-text)]">
                {filteredProjects.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-[color:var(--theme-text-muted)]">
                    No projects found
                  </div>
                ) : (
                  filteredProjects.map((project) => (
                    <ComboboxOption
                      key={project.id}
                      value={project}
                      className="cursor-pointer rounded-lg px-3 py-2 text-sm data-[focus]:bg-[var(--theme-surface-2)] data-[selected]:bg-[var(--theme-surface-2)]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span>{getProjectLabel(project)}</span>
                      </div>
                    </ComboboxOption>
                  ))
                )}
              </ComboboxOptions>
            </div>
          </Combobox>

          <Combobox
            value={draftExpenseTypeFilter}
            onChange={(option: ExpenseTypeOption | null) => {
              setDraftExpenseTypeFilter(option);
              setDraftExpenseTypeQuery("");
            }}
            nullable
          >
            <div className="relative min-w-64">
              <ComboboxInput
                className="theme-input rbac-input w-full pr-10"
                placeholder="Category"
                displayValue={(option: ExpenseTypeOption | null) =>
                  option ? getExpenseTypeLabel(option) : draftExpenseTypeQuery
                }
                onChange={(event) => {
                  setDraftExpenseTypeQuery(event.target.value);
                  setDraftExpenseTypeFilter(null);
                }}
              />
              <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3 text-[color:var(--theme-text-muted)]">
                <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
              </ComboboxButton>
              <ComboboxOptions className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-[color:var(--theme-border)] bg-[var(--theme-surface)] p-1 shadow-lg text-[color:var(--theme-text)]">
                {expenseTypes
                  .filter((option) =>
                    getExpenseTypeLabel(option)
                      .toLowerCase()
                      .includes(draftExpenseTypeQuery.trim().toLowerCase()),
                  )
                  .map((option) => (
                    <ComboboxOption
                      key={option.id}
                      value={option}
                      className="cursor-pointer rounded-lg px-3 py-2 text-sm data-[focus]:bg-[var(--theme-surface-2)] data-[selected]:bg-[var(--theme-surface-2)]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span>{option.name}</span>
                      </div>
                    </ComboboxOption>
                  ))}
              </ComboboxOptions>
            </div>
          </Combobox>

          <Combobox
            value={draftExpenseByFilter}
            onChange={(option: UserOption | null) => {
              setDraftExpenseByFilter(option);
              setDraftExpenseByQuery("");
            }}
            nullable
          >
            <div className="relative min-w-64">
              <ComboboxInput
                className="theme-input rbac-input w-full pr-10"
                placeholder="Expense By"
                displayValue={(option: UserOption | null) =>
                  option ? getUserLabel(option) : draftExpenseByQuery
                }
                onChange={(event) => {
                  setDraftExpenseByQuery(event.target.value);
                  setDraftExpenseByFilter(null);
                }}
              />
              <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3 text-[color:var(--theme-text-muted)]">
                <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
              </ComboboxButton>
              <ComboboxOptions className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-[color:var(--theme-border)] bg-[var(--theme-surface)] p-1 shadow-lg text-[color:var(--theme-text)]">
                {filteredExpenseByUsers.map((user) => (
                  <ComboboxOption
                    key={user.id}
                    value={user}
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
            value={draftExpenseCompanyFilter}
            onChange={(option: CompanyOption | null) => {
              setDraftExpenseCompanyFilter(option);
              setDraftExpenseCompanyQuery("");
            }}
            nullable
          >
            <div className="relative min-w-64">
              <ComboboxInput
                className="theme-input rbac-input w-full pr-10"
                placeholder="Company"
                displayValue={(option: CompanyOption | null) =>
                  option ? getCompanyLabel(option) : draftExpenseCompanyQuery
                }
                onChange={(event) => {
                  setDraftExpenseCompanyQuery(event.target.value);
                  setDraftExpenseCompanyFilter(null);
                }}
              />
              <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3 text-[color:var(--theme-text-muted)]">
                <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
              </ComboboxButton>
              <ComboboxOptions className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-[color:var(--theme-border)] bg-[var(--theme-surface)] p-1 shadow-lg text-[color:var(--theme-text)]">
                {filteredExpenseCompanies.map((company) => (
                  <ComboboxOption
                    key={company.id}
                    value={company}
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

          <input
            className="rbac-input-filter"
            type="text"
            placeholder="Search remark or other text"
            value={draftQuery}
            onChange={(event) => setDraftQuery(event.target.value)}
          />
        </div>
      </ListingFilterDialog>
    </>
  );
}

export default function DailyExpensesPage() {
  return (
    <DashboardShell requireAdmin>
      <DailyExpenseListContent />
    </DashboardShell>
  );
}
