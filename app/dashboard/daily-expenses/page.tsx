"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { flexRender, useReactTable } from "@tanstack/react-table";
import { ColumnDef, getCoreRowModel } from "@tanstack/table-core";
import DashboardShell from "../_components/DashboardShell";
import ConfirmDialog from "../../components/ConfirmDialog";
import useDebounce from "@/app/hooks/useDebounce";
import { toast } from "react-toastify";
import {
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaTrash,
  FaSpinner,
} from "react-icons/fa";
import Link from "next/link";
import { formatToDDMMYYYY } from "@/lib/dateUtils";
import CustomDatePicker from "../../components/CustomDatePicker";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/16/solid";

type TransactionType = "INCOME" | "EXPENSE";

type DailyExpenseRow = {
  id: string;
  transactionType: TransactionType;
  amount: number;
  expenseTypeId: string | null;
  expenseTypeName: string | null;
  date: string;
  remark: string | null;
};

type ExpenseTypeOption = {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
};

const formatAmount = (value: number) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getTransactionBadgeClass = (value: TransactionType) => {
  switch (value) {
    case "INCOME":
      return "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200";
    case "EXPENSE":
      return "bg-rose-100 text-rose-800 ring-1 ring-rose-200";
    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  }
};

const transactionTypeOptions: Array<{
  key: TransactionType | "";
  label: string;
}> = [
  { key: "", label: "All types" },
  { key: "INCOME", label: "Income" },
  { key: "EXPENSE", label: "Expense" },
];

const getExpenseTypeLabel = (option: ExpenseTypeOption) =>
  option.name;

function DailyExpenseListContent() {
  const [dailyExpenses, setDailyExpenses] = useState<DailyExpenseRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [balance, setBalance] = useState(0);
  const [query, setQuery] = useState("");
  const [expenseTypes, setExpenseTypes] = useState<ExpenseTypeOption[]>([]);
  const [expenseTypeFilter, setExpenseTypeFilter] =
    useState<ExpenseTypeOption | null>(null);
  const [expenseTypeQuery, setExpenseTypeQuery] = useState("");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<
    TransactionType | ""
  >("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<DailyExpenseRow | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadExpenseTypes = async () => {
      try {
        const res = await fetch("/api/expense-types/options");
        if (!res.ok) return;
        const data = await res.json();
        setExpenseTypes(
          Array.isArray(data)
            ? data.filter((item: ExpenseTypeOption) => item.status === "ACTIVE")
            : [],
        );
      } catch (error) {
        console.error("Failed to load expense types", error);
      }
    };

    loadExpenseTypes();
  }, []);

  const loadDailyExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pageIndex + 1),
        pageSize: String(pageSize),
      });
      if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
      if (transactionTypeFilter)
        params.set("transactionType", transactionTypeFilter);
      if (expenseTypeFilter?.id)
        params.set("expenseTypeId", expenseTypeFilter.id);
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
      setBalance(typeof data?.balance === "number" ? data.balance : 0);
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
    transactionTypeFilter,
    expenseTypeFilter,
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

  const handleDeleteDailyExpense = useCallback((row: DailyExpenseRow) => {
    setConfirmTarget(row);
    setConfirmOpen(true);
  }, []);

  const confirmDeleteDailyExpense = useCallback(async () => {
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
      console.error("Failed to delete daily expense", error);
      toast.error("Failed to delete daily expense.");
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setConfirmTarget(null);
    }
  }, [confirmTarget, loadDailyExpenses]);

  const columns = useMemo<ColumnDef<DailyExpenseRow>[]>(
    () => [
      {
        header: "Date",
        accessorKey: "date",
        cell: ({ row }) => (
          <span className="rbac-muted">
            {formatToDDMMYYYY(row.original.date)}
          </span>
        ),
      },
      {
        header: "Type",
        accessorKey: "transactionType",
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-wide ${getTransactionBadgeClass(
              row.original.transactionType,
            )}`}
          >
            {row.original.transactionType}
          </span>
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
        header: "Expense Type",
        accessorKey: "expenseTypeName",
        cell: ({ row }) => (
          <span className="rbac-muted">
            {row.original.expenseTypeName || "-"}
          </span>
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
        header: "Action",
        id: "action",
        cell: ({ row }) => (
          <div className="justify-end flex gap-4">
            <Link href={`/dashboard/daily-expenses/${row.original.id}`}>
              <button className="rbac-link" type="button">
                <FaEdit />
              </button>
            </Link>
            <button
              className="rbac-link danger"
              type="button"
              onClick={() => handleDeleteDailyExpense(row.original)}
            >
              <FaTrash />
            </button>
          </div>
        ),
      },
    ],
    [handleDeleteDailyExpense],
  );

  const table = useReactTable({
    data: dailyExpenses,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount,
  });

  const balanceClass =
    balance >= 0
      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
      : "bg-rose-50 text-rose-700 ring-1 ring-rose-200";

  return (
    <>
      <section className="rbac-section rbac-container">
        <div className="rbac-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="rbac-title-lg">Daily Expenses</h3>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${balanceClass}`}
              >
                Current Balance: {formatAmount(balance)}
              </span>
            </div>
            <Link href="/dashboard/daily-expenses/new">
              <button className="rbac-button" type="button">
                Add Daily Expense
              </button>
            </Link>
          </div>

          <div className="my-4 flex flex-wrap gap-2">
            <Listbox
              value={transactionTypeFilter}
              onChange={setTransactionTypeFilter}
            >
              <div className="relative min-w-48">
                <ListboxButton className="rbac-input flex w-full items-center justify-between gap-3 text-left">
                  <span>
                    {transactionTypeOptions.find(
                      (item) => item.key === transactionTypeFilter,
                    )?.label || "All types"}
                  </span>
                  <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
                </ListboxButton>
                <ListboxOptions className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-[color:var(--theme-border)] bg-[var(--theme-surface)] p-1 shadow-lg text-[color:var(--theme-text)]">
                  {transactionTypeOptions.map((option) => (
                    <ListboxOption
                      key={option.key || "all"}
                      value={option.key}
                      className="cursor-pointer rounded-lg px-3 py-2 text-sm data-[focus]:bg-[var(--theme-surface-2)] data-[selected]:bg-[var(--theme-surface-2)]"
                    >
                      {option.label}
                    </ListboxOption>
                  ))}
                </ListboxOptions>
              </div>
            </Listbox>

            <CustomDatePicker
              value={fromDate}
              onChange={(value) => {
                setPageIndex(0);
                setFromDate(value);
              }}
              placeholder="From date"
              className="rbac-input-filter"
            />

            <CustomDatePicker
              value={toDate}
              onChange={(value) => {
                setPageIndex(0);
                setToDate(value);
              }}
              placeholder="To date"
              className="rbac-input-filter"
            />

            <Combobox
              value={expenseTypeFilter}
              onChange={(option: ExpenseTypeOption | null) => {
                setExpenseTypeFilter(option);
                setExpenseTypeQuery("");
              }}
              nullable
            >
              <div className="relative min-w-64">
                <ComboboxInput
                  className="theme-input rbac-input w-full pr-10"
                  placeholder="Filter by expense type"
                  displayValue={(option: ExpenseTypeOption | null) =>
                    option ? getExpenseTypeLabel(option) : expenseTypeQuery
                  }
                  onChange={(event) => {
                    setExpenseTypeQuery(event.target.value);
                    setExpenseTypeFilter(null);
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
                        .includes(expenseTypeQuery.trim().toLowerCase()),
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
            <button
              className="rbac-button rbac-button-secondary"
              type="button"
              onClick={() => {
                setPageIndex(0);
                setQuery("");
                setTransactionTypeFilter("");
                setFromDate("");
                setToDate("");
                setExpenseTypeFilter(null);
                setExpenseTypeQuery("");
              }}
            >
              Clear filters
            </button>
          </div>

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
                          className={`text-xs font-semibold uppercase px-4 py-3 border-b border-slate-200 ${
                            header.id === "action" ? "text-right" : "text-left"
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
                        No daily expenses found.
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

            <div className="md:hidden space-y-3">
              {loading && (
                <div className="flex items-center justify-center py-4">
                  <FaSpinner className="animate-spin mr-2" size={16} />
                </div>
              )}
              {!loading && dailyExpenses.length === 0 && (
                <div className="rbac-card py-4 text-sm text-slate-500">
                  No daily expenses found.
                </div>
              )}
              {!loading &&
                dailyExpenses.map((expense) => (
                  <div key={expense.id} className="rbac-card p-4">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">
                          {formatToDDMMYYYY(expense.date)}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-wide ${getTransactionBadgeClass(
                              expense.transactionType,
                            )}`}
                          >
                            {expense.transactionType}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            {formatAmount(expense.amount)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">
                          {expense.expenseTypeName || "-"}
                        </p>
                        <p className="text-sm text-slate-500">
                          {expense.remark || "-"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/dashboard/daily-expenses/${expense.id}`}>
                          <button className="rbac-link" type="button">
                            <FaEdit />
                          </button>
                        </Link>
                        <button
                          className="rbac-link danger"
                          type="button"
                          onClick={() => handleDeleteDailyExpense(expense)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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
        title="Delete daily expense?"
        description="Are you sure you want to delete?"
        confirmLabel="Delete"
        confirmLoading={deleting}
        confirmLoadingLabel="Deleting..."
        cancelLabel="Cancel"
        onConfirm={confirmDeleteDailyExpense}
        onClose={() => {
          setConfirmOpen(false);
          setConfirmTarget(null);
        }}
      />
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
