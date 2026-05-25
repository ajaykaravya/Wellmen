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
  FaTrash,
  FaSpinner,
  FaFilter,
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

type PaymentMode = "CASH" | "BANK";

type CashInRow = {
  id: string;
  date: string;
  cashGivenToId: string;
  cashGivenToName: string | null;
  cashGivenToRole: string | null;
  cashGivenById: string;
  cashGivenByName: string | null;
  cashGivenByRole: string | null;
  cashGivenFromCompanyId: string;
  cashGivenFromCompanyName: string | null;
  amount: number;
  paymentMode: PaymentMode;
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

const paymentModeOptions: Array<{ key: PaymentMode | ""; label: string }> = [
  { key: "", label: "All modes" },
  { key: "CASH", label: "Cash" },
  { key: "BANK", label: "Bank" },
];

const getPaymentModeClass = (value: PaymentMode) => {
  switch (value) {
    case "CASH":
      return "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200";
    case "BANK":
      return "bg-sky-100 text-sky-800 ring-1 ring-sky-200";
    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  }
};

const isAdminManager = (role?: string | null) =>
  role === "Admin" || role === "Manager";

const formatUserLabel = (user: UserOption) => {
  const name = `${user.firstName} ${user.lastName}`.trim();
  return user.role ? `${name} (${user.role})` : name;
};

function CashInListContent() {
  const router = useRouter();
  const [cashIns, setCashIns] = useState<CashInRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [paymentModeFilter, setPaymentModeFilter] = useState<PaymentMode | "">("");
  const [cashGivenToFilter, setCashGivenToFilter] = useState<UserOption | null>(
    null,
  );
  const [cashGivenByFilter, setCashGivenByFilter] = useState<UserOption | null>(
    null,
  );
  const [companyFilter, setCompanyFilter] = useState<CompanyOption | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftQuery, setDraftQuery] = useState("");
  const [draftPaymentModeFilter, setDraftPaymentModeFilter] = useState<
    PaymentMode | ""
  >("");
  const [draftCashGivenToFilter, setDraftCashGivenToFilter] =
    useState<UserOption | null>(null);
  const [draftCashGivenByFilter, setDraftCashGivenByFilter] =
    useState<UserOption | null>(null);
  const [draftCompanyFilter, setDraftCompanyFilter] =
    useState<CompanyOption | null>(null);
  const [draftFromDate, setDraftFromDate] = useState("");
  const [draftToDate, setDraftToDate] = useState("");
  const [draftCashGivenToQuery, setDraftCashGivenToQuery] = useState("");
  const [draftCashGivenByQuery, setDraftCashGivenByQuery] = useState("");
  const [draftCompanyQuery, setDraftCompanyQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<CashInRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const cashGivenToUsers = useMemo(() => users, [users]);
  const cashGivenByUsers = useMemo(
    () => users.filter((user) => isAdminManager(user.role)),
    [users],
  );

  const activeFilterCount = [
    query.trim(),
    paymentModeFilter,
    cashGivenToFilter?.id,
    cashGivenByFilter?.id,
    companyFilter?.id,
    fromDate,
    toDate,
  ].filter(Boolean).length;

  const openFilters = useCallback(() => {
    setDraftQuery(query);
    setDraftPaymentModeFilter(paymentModeFilter);
    setDraftCashGivenToFilter(cashGivenToFilter);
    setDraftCashGivenByFilter(cashGivenByFilter);
    setDraftCompanyFilter(companyFilter);
    setDraftFromDate(fromDate);
    setDraftToDate(toDate);
    setDraftCashGivenToQuery(cashGivenToFilter ? formatUserLabel(cashGivenToFilter) : "");
    setDraftCashGivenByQuery(cashGivenByFilter ? formatUserLabel(cashGivenByFilter) : "");
    setDraftCompanyQuery(companyFilter ? companyFilter.name : "");
    setFilterOpen(true);
  }, [cashGivenByFilter, cashGivenToFilter, companyFilter, fromDate, paymentModeFilter, query, toDate]);

  const closeFilters = useCallback(() => {
    setFilterOpen(false);
  }, []);

  const applyFilters = useCallback(() => {
    setPageIndex(0);
    setQuery(draftQuery);
    setPaymentModeFilter(draftPaymentModeFilter);
    setCashGivenToFilter(draftCashGivenToFilter);
    setCashGivenByFilter(draftCashGivenByFilter);
    setCompanyFilter(draftCompanyFilter);
    setFromDate(draftFromDate);
    setToDate(draftToDate);
    setFilterOpen(false);
  }, [
    draftCashGivenByFilter,
    draftCashGivenToFilter,
    draftCompanyFilter,
    draftFromDate,
    draftPaymentModeFilter,
    draftQuery,
    draftToDate,
  ]);

  const appliedFilters = [
    query.trim(),
    paymentModeFilter
      ? paymentModeOptions.find((item) => item.key === paymentModeFilter)?.label ||
      ""
      : "",
    cashGivenToFilter ? formatUserLabel(cashGivenToFilter) : "",
    cashGivenByFilter ? formatUserLabel(cashGivenByFilter) : "",
    companyFilter ? companyFilter.name : "",
    fromDate,
    toDate,
  ].filter(Boolean);

  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [usersRes, companiesRes] = await Promise.all([
          fetch("/api/users/options"),
          fetch("/api/companies/options"),
        ]);

        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(Array.isArray(data) ? data : []);
        }

        if (companiesRes.ok) {
          const data = await companiesRes.json();
          setCompanies(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Failed to load cash reference data", error);
      }
    };

    loadReferenceData();
  }, []);

  const loadCashIns = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pageIndex + 1),
        pageSize: String(pageSize),
      });
      if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
      if (paymentModeFilter) params.set("paymentMode", paymentModeFilter);
      if (cashGivenToFilter?.id) params.set("cashGivenToId", cashGivenToFilter.id);
      if (cashGivenByFilter?.id) params.set("cashGivenById", cashGivenByFilter.id);
      if (companyFilter?.id) params.set("cashGivenFromCompanyId", companyFilter.id);
      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);

      const res = await fetch(`/api/cash?${params.toString()}`);
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error || "Failed to load cash.");
        return;
      }

      const data = await res.json();
      setCashIns(Array.isArray(data?.data) ? data.data : []);
      setTotal(typeof data?.total === "number" ? data.total : 0);
    } catch (error) {
      console.error("Failed to load cash", error);
      toast.error("Failed to load cash.");
    } finally {
      setLoading(false);
    }
  }, [
    pageIndex,
    pageSize,
    debouncedQuery,
    paymentModeFilter,
    cashGivenToFilter,
    cashGivenByFilter,
    companyFilter,
    fromDate,
    toDate,
  ]);

  useEffect(() => {
    loadCashIns();
  }, [loadCashIns]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (pageIndex > pageCount - 1) {
      setPageIndex(Math.max(pageCount - 1, 0));
    }
  }, [pageCount, pageIndex]);

  const handleDelete = useCallback((row: CashInRow) => {
    setConfirmTarget(row);
    setConfirmOpen(true);
  }, []);

  const handleEdit = useCallback(
    (row: CashInRow) => {
      router.push(`/dashboard/cash/${row.id}`);
    },
    [router],
  );

  const confirmDelete = useCallback(async () => {
    if (!confirmTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/cash/${confirmTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error || "Failed to delete cash.");
        return;
      }
      await loadCashIns();
      toast.success("Cash deleted successfully.");
    } catch (error) {
      console.error("Failed to delete cash", error);
      toast.error("Failed to delete cash.");
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setConfirmTarget(null);
    }
  }, [confirmTarget, loadCashIns]);

  const loadAllFilteredCashIns = useCallback(async () => {
    const accumulated: CashInRow[] = [];
    let currentPage = 1;
    let totalPages = 1;

    while (currentPage <= totalPages) {
      const params = new URLSearchParams({
        page: String(currentPage),
        pageSize: "100",
      });
      if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
      if (paymentModeFilter) params.set("paymentMode", paymentModeFilter);
      if (cashGivenToFilter?.id) params.set("cashGivenToId", cashGivenToFilter.id);
      if (cashGivenByFilter?.id) params.set("cashGivenById", cashGivenByFilter.id);
      if (companyFilter?.id) params.set("cashGivenFromCompanyId", companyFilter.id);
      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);

      const res = await fetch(`/api/cash?${params.toString()}`);
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to load cash.");
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
    paymentModeFilter,
    cashGivenToFilter,
    cashGivenByFilter,
    companyFilter,
    fromDate,
    toDate,
  ]);

  const handleExportExcel = useCallback(async () => {
    setExporting(true);
    try {
      const rows = await loadAllFilteredCashIns();
      const worksheetData = [
        [
          "#",
          "Date",
          "Cash Given To",
          "Cash Given By",
          "Company",
          "Payment Mode",
          "Amount",
        ],
        ...rows.map((row, index) => [
          index + 1,
          formatToDDMMYYYY(row.date),
          row.cashGivenToName || "-",
          row.cashGivenByName || "-",
          row.cashGivenFromCompanyName || "-",
          row.paymentMode.toLowerCase(),
          Number(row.amount || 0),
        ]),
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Cash");
      const arrayBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([arrayBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `cash-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      toast.success("Cash export generated successfully.");
    } catch (error) {
      console.error("Failed to export cash", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to export cash.",
      );
    } finally {
      setExporting(false);
    }
  }, [loadAllFilteredCashIns]);

  const columns = useMemo<ColumnDef<CashInRow>[]>(
    () => [
      {
        header: "Date",
        accessorKey: "date",
        cell: ({ row }) => (
          <span className="rbac-muted">{formatToDDMMYYYY(row.original.date)}</span>
        ),
      },
      {
        header: "Cash Given To",
        accessorKey: "cashGivenToName",
        cell: ({ row }) => (
          <span className="rbac-muted">{row.original.cashGivenToName || "-"}</span>
        ),
      },
      {
        header: "Cash Given By",
        accessorKey: "cashGivenByName",
        cell: ({ row }) => (
          <span className="rbac-muted">{row.original.cashGivenByName || "-"}</span>
        ),
      },
      {
        header: "Company",
        accessorKey: "cashGivenFromCompanyName",
        cell: ({ row }) => (
          <span className="rbac-muted">
            {row.original.cashGivenFromCompanyName || "-"}
          </span>
        ),
      },
      {
        header: "Payment Mode",
        accessorKey: "paymentMode",
        cell: ({ row }) => (
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getPaymentModeClass(
              row.original.paymentMode,
            )}`}
          >
            {row.original.paymentMode.toLowerCase()}
          </span>
        ),
      },
      {
        header: "Amount",
        accessorKey: "amount",
        cell: ({ row }) => (
          <span className="rbac-muted rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
            {formatAmount(row.original.amount)}
          </span>
        ),
      },
      {
        header: "Action",
        id: "action",
        cell: ({ row }) => (
          <div className="flex justify-end gap-4">
            <button
              onClick={() => handleEdit(row.original)}
              className="rbac-link"
              type="button"
            >
              <FaEdit />
            </button>
            <button
              className="rbac-link danger"
              type="button"
              onClick={() => handleDelete(row.original)}
            >
              <FaTrash />
            </button>
          </div>
        ),
      },
    ],
    [handleDelete, handleEdit],
  );

  const table = useReactTable({
    data: cashIns,
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
            <h3 className="rbac-title-lg">Cash</h3>
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
              <Link href="/dashboard/cash/new">
                <button className="rbac-button" type="button">
                  Add Cash
                </button>
              </Link>
            </div>
          </div>

          <AppliedFilterSummary
            items={appliedFilters}
            onClear={() => {
              setPageIndex(0);
              setQuery("");
              setPaymentModeFilter("");
              setCashGivenToFilter(null);
              setCashGivenByFilter(null);
              setCompanyFilter(null);
              setFromDate("");
              setToDate("");
              setDraftCashGivenToFilter(null);
              setDraftCashGivenByFilter(null);
              setDraftCompanyFilter(null);
              setDraftCashGivenToQuery("");
              setDraftCashGivenByQuery("");
              setDraftCompanyQuery("");
              setFilterOpen(false);
            }}
          />

          <div className="mt-4">
            <div className="hidden overflow-x-auto md:block">
              <table className="theme-table min-w-full border-separate border-spacing-0 border border-slate-200">
                <thead className="bg-slate-50">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          style={{ width: header.getSize() }}
                          className={`border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase ${header.id === "action" ? "text-right" : "text-left"
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
                          <FaSpinner className="mr-2 animate-spin" size={16} />
                        </div>
                      </td>
                    </tr>
                  )}
                  {!loading && cashIns.length === 0 && (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-4 py-3 text-sm text-slate-500"
                      >
                        No cash found.
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
                            className="border-b border-slate-100 px-4 py-3 text-sm"
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

            <div className="space-y-3 md:hidden">
              {loading && (
                <div className="flex items-center justify-center py-4">
                  <FaSpinner className="mr-2 animate-spin" size={16} />
                </div>
              )}
              {!loading && cashIns.length === 0 && (
                <div className="rbac-card py-4 text-sm text-slate-500">
                  No cash found.
                </div>
              )}
              {!loading &&
                cashIns.map((cashIn) => (
                  <div key={cashIn.id} className="rbac-card p-4">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold">
                            {formatToDDMMYYYY(cashIn.date)}
                          </h4>
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
                            {formatAmount(cashIn.amount)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">
                          To: {cashIn.cashGivenToName || "-"}
                        </p>
                        <p className="text-sm text-slate-600">
                          By: {cashIn.cashGivenByName || "-"}
                        </p>
                        <p className="text-sm text-slate-600">
                          Company: {cashIn.cashGivenFromCompanyName || "-"}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getPaymentModeClass(
                              cashIn.paymentMode,
                            )}`}
                          >
                            {cashIn.paymentMode.toLowerCase()}
                          </span>

                        </div>
                      </div>
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => handleEdit(cashIn)}
                          className="rbac-link"
                          type="button"
                        >
                          <FaEdit size={18} />
                        </button>
                        <button
                          style={{padding:"2px"}}
                          className="rbac-link danger"
                          type="button"
                          onClick={() => handleDelete(cashIn)}
                        >
                          <FaTrash size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-end gap-3 text-sm">
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
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete cash?"
        description="Are you sure you want to delete?"
        confirmLabel="Delete"
        confirmLoading={deleting}
        confirmLoadingLabel="Deleting..."
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        onClose={() => {
          setConfirmOpen(false);
          setConfirmTarget(null);
        }}
      />

      <ListingFilterDialog
        open={filterOpen}
        title="Cash Filters"
        description="Update the filters and apply them when you're ready."
        onClose={closeFilters}
        onApply={applyFilters}
        activeCount={activeFilterCount}
        maxWidthClassName="max-w-2xl"
      >
        <select
          className="rbac-input rbac-select"
          value={draftPaymentModeFilter}
          onChange={(event) =>
            setDraftPaymentModeFilter(event.target.value as PaymentMode | "")
          }
        >
          <option value="">All payment modes</option>
          <option value="CASH">Cash</option>
          <option value="BANK">Bank</option>
        </select>

        <Combobox
          value={draftCashGivenToFilter}
          onChange={(option: UserOption | null) => {
            setDraftCashGivenToFilter(option);
            setDraftCashGivenToQuery("");
          }}
          nullable
        >
          <div className="relative min-w-64">
            <ComboboxInput
              className="theme-input rbac-input w-full pr-10"
              placeholder="Cash Given To"
              displayValue={(option: UserOption | null) =>
                option ? formatUserLabel(option) : draftCashGivenToQuery
              }
              onChange={(event) => {
                setDraftCashGivenToQuery(event.target.value);
                setDraftCashGivenToFilter(null);
              }}
            />
            <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3 text-[color:var(--theme-text-muted)]">
              <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
            </ComboboxButton>
            <ComboboxOptions className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-[color:var(--theme-border)] bg-[var(--theme-surface)] p-1 shadow-lg text-[color:var(--theme-text)]">
              {cashGivenToUsers
                .filter((user) =>
                  formatUserLabel(user)
                    .toLowerCase()
                    .includes(draftCashGivenToQuery.trim().toLowerCase()),
                )
                .map((option) => (
                  <ComboboxOption
                    key={option.id}
                    value={option}
                    className="cursor-pointer rounded-lg px-3 py-2 text-sm data-[focus]:bg-[var(--theme-surface-2)] data-[selected]:bg-[var(--theme-surface-2)]"
                  >
                    {formatUserLabel(option)}
                  </ComboboxOption>
                ))}
            </ComboboxOptions>
          </div>
        </Combobox>

        <Combobox
          value={draftCashGivenByFilter}
          onChange={(option: UserOption | null) => {
            setDraftCashGivenByFilter(option);
            setDraftCashGivenByQuery("");
          }}
          nullable
        >
          <div className="relative min-w-64">
            <ComboboxInput
              className="theme-input rbac-input w-full pr-10"
              placeholder="Cash Given By"
              displayValue={(option: UserOption | null) =>
                option ? formatUserLabel(option) : draftCashGivenByQuery
              }
              onChange={(event) => {
                setDraftCashGivenByQuery(event.target.value);
                setDraftCashGivenByFilter(null);
              }}
            />
            <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3 text-[color:var(--theme-text-muted)]">
              <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
            </ComboboxButton>
            <ComboboxOptions className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-[color:var(--theme-border)] bg-[var(--theme-surface)] p-1 shadow-lg text-[color:var(--theme-text)]">
              {cashGivenByUsers
                .filter((user) =>
                  formatUserLabel(user)
                    .toLowerCase()
                    .includes(draftCashGivenByQuery.trim().toLowerCase()),
                )
                .map((option) => (
                  <ComboboxOption
                    key={option.id}
                    value={option}
                    className="cursor-pointer rounded-lg px-3 py-2 text-sm data-[focus]:bg-[var(--theme-surface-2)] data-[selected]:bg-[var(--theme-surface-2)]"
                  >
                    {formatUserLabel(option)}
                  </ComboboxOption>
                ))}
            </ComboboxOptions>
          </div>
        </Combobox>

        <Combobox
          value={draftCompanyFilter}
          onChange={(option: CompanyOption | null) => {
            setDraftCompanyFilter(option);
            setDraftCompanyQuery("");
          }}
          nullable
        >
          <div className="relative min-w-64">
            <ComboboxInput
              className="theme-input rbac-input w-full pr-10"
              placeholder="Cash Given From Company"
              displayValue={(option: CompanyOption | null) =>
                option ? option.name : draftCompanyQuery
              }
              onChange={(event) => {
                setDraftCompanyQuery(event.target.value);
                setDraftCompanyFilter(null);
              }}
            />
            <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3 text-[color:var(--theme-text-muted)]">
              <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
            </ComboboxButton>
            <ComboboxOptions className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-[color:var(--theme-border)] bg-[var(--theme-surface)] p-1 shadow-lg text-[color:var(--theme-text)]">
              {companies
                .filter((company) =>
                  company.name
                    .toLowerCase()
                    .includes(draftCompanyQuery.trim().toLowerCase()),
                )
                .map((option) => (
                  <ComboboxOption
                    key={option.id}
                    value={option}
                    className="cursor-pointer rounded-lg px-3 py-2 text-sm data-[focus]:bg-[var(--theme-surface-2)] data-[selected]:bg-[var(--theme-surface-2)]"
                  >
                    {option.name}
                  </ComboboxOption>
                ))}
            </ComboboxOptions>
          </div>
        </Combobox>

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

        <input
          className="rbac-input-filter"
          type="text"
          placeholder="Search text"
          value={draftQuery}
          onChange={(event) => setDraftQuery(event.target.value)}
        />
      </ListingFilterDialog>
    </>
  );
}

export default function CashInPage() {
  return (
    <DashboardShell requireAdmin>
      <CashInListContent />
    </DashboardShell>
  );
}
