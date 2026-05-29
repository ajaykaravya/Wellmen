"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { flexRender, useReactTable } from "@tanstack/react-table";
import { ColumnDef, getCoreRowModel } from "@tanstack/table-core";
import DashboardShell from "../_components/DashboardShell";
import AppliedFilterSummary from "../../components/AppliedFilterSummary";
import ConfirmDialog from "../../components/ConfirmDialog";
import ListingFilterDialog from "../../components/ListingFilterDialog";
import { toast } from "react-toastify";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaTrash,
  FaSpinner,
  FaFilter,
} from "react-icons/fa";
import CustomDatePicker from "../../components/CustomDatePicker";
import { formatToDDMMYYYY } from "@/lib/dateUtils";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { FinanceCardList } from "../_components/FinanceCardList";
import { Listbox } from "@headlessui/react";

type PaymentMode = "CASH" | "BANK";

type ProjectOption = {
  id: string;
  name: string;
  city?: string | null;
};

type CompanyOption = {
  id: string;
  name: string;
};

type IncomeTypeOption = {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
};

type UserOption = {
  id: string;
  firstName: string;
  lastName: string;
  role?: string | null;
};

type IncomeRow = {
  id: string;
  projectId: string | null;
  projectName: string | null;
  projectCity: string | null;
  incomeTypeId: string | null;
  incomeTypeName: string | null;
  incomeCompanyId: string | null;
  incomeCompanyName: string | null;
  incomeCompanyCode: string | null;
  receivedById: string | null;
  receivedByName: string | null;
  amount: number;
  paymentMode: PaymentMode | null;
  date: string;
  remark: string | null;
};

type CashPaymentMode = "CASH" | "BANK" | "CHEQUE" | "UPI" | "NEFT_RTGS";

const formatAmount = (value: number) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getProjectLabel = (option: ProjectOption) =>
  option.city ? `${option.name} (${option.city})` : option.name;

const getCompanyLabel = (option: CompanyOption) => option.name;

const getIncomeTypeLabel = (option: IncomeTypeOption) => option.name;

const getUserLabel = (option: UserOption) =>
  `${option.firstName} ${option.lastName} - ${option.role || ""}`.trim();

function IncomeListContent() {
  const router = useRouter();
  const [rows, setRows] = useState<IncomeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [incomeTypes, setIncomeTypes] = useState<IncomeTypeOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [projectFilter, setProjectFilter] = useState<ProjectOption | null>(null);
  const [incomeTypeFilter, setIncomeTypeFilter] =
    useState<IncomeTypeOption | null>(null);
  const [incomeCompanyFilter, setIncomeCompanyFilter] =
    useState<CompanyOption | null>(null);
  const [receivedByFilter, setReceivedByFilter] = useState<UserOption | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [paymentModeFilter, setPaymentModeFilter] = useState<PaymentMode | "">("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftQuery, setDraftQuery] = useState("");
  const [draftProjectFilter, setDraftProjectFilter] = useState<ProjectOption | null>(null);
  const [draftProjectQuery, setDraftProjectQuery] = useState("");
  const [draftIncomeTypeFilter, setDraftIncomeTypeFilter] =
    useState<IncomeTypeOption | null>(null);
  const [draftIncomeTypeQuery, setDraftIncomeTypeQuery] = useState("");
  const [draftIncomeCompanyFilter, setDraftIncomeCompanyFilter] =
    useState<CompanyOption | null>(null);
  const [draftIncomeCompanyQuery, setDraftIncomeCompanyQuery] = useState("");
  const [draftReceivedByFilter, setDraftReceivedByFilter] =
    useState<UserOption | null>(null);
  const [draftReceivedByQuery, setDraftReceivedByQuery] = useState("");
  const [draftFromDate, setDraftFromDate] = useState("");
  const [draftToDate, setDraftToDate] = useState("");
  const [draftPaymentModeFilter, setDraftPaymentModeFilter] =
    useState<PaymentMode | "">("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<IncomeRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const activeFilterCount = [
    query.trim(),
    projectFilter?.id,
    incomeTypeFilter?.id,
    incomeCompanyFilter?.id,
    receivedByFilter?.id,
    fromDate,
    toDate,
    paymentModeFilter,
  ].filter(Boolean).length;

  const openFilters = useCallback(() => {
    setDraftQuery(query);
    setDraftProjectFilter(projectFilter);
    setDraftProjectQuery(projectFilter ? getProjectLabel(projectFilter) : "");
    setDraftIncomeTypeFilter(incomeTypeFilter);
    setDraftIncomeTypeQuery(
      incomeTypeFilter ? getIncomeTypeLabel(incomeTypeFilter) : "",
    );
    setDraftIncomeCompanyFilter(incomeCompanyFilter);
    setDraftIncomeCompanyQuery(
      incomeCompanyFilter ? getCompanyLabel(incomeCompanyFilter) : "",
    );
    setDraftReceivedByFilter(receivedByFilter);
    setDraftReceivedByQuery(receivedByFilter ? getUserLabel(receivedByFilter) : "");
    setDraftFromDate(fromDate);
    setDraftToDate(toDate);
    setDraftPaymentModeFilter(paymentModeFilter);
    setFilterOpen(true);
  }, [
    fromDate,
    incomeCompanyFilter,
    paymentModeFilter,
    projectFilter,
    query,
    incomeTypeFilter,
    receivedByFilter,
    toDate,
  ]);

  const closeFilters = useCallback(() => {
    setFilterOpen(false);
  }, []);

  const applyFilters = useCallback(() => {
    setPageIndex(0);
    setQuery(draftQuery);
    setProjectFilter(draftProjectFilter);
    setIncomeTypeFilter(draftIncomeTypeFilter);
    setIncomeCompanyFilter(draftIncomeCompanyFilter);
    setReceivedByFilter(draftReceivedByFilter);
    setFromDate(draftFromDate);
    setToDate(draftToDate);
    setPaymentModeFilter(draftPaymentModeFilter);
    setFilterOpen(false);
  }, [
    draftFromDate,
    draftIncomeCompanyFilter,
    draftIncomeTypeFilter,
    draftPaymentModeFilter,
    draftProjectFilter,
    draftQuery,
    draftReceivedByFilter,
    draftToDate,
  ]);

  const appliedFilters = [
    query.trim(),
    projectFilter ? getProjectLabel(projectFilter) : "",
    incomeTypeFilter ? getIncomeTypeLabel(incomeTypeFilter) : "",
    incomeCompanyFilter ? getCompanyLabel(incomeCompanyFilter) : "",
    receivedByFilter ? getUserLabel(receivedByFilter) : "",
    fromDate,
    toDate,
    paymentModeFilter ? `Payment: ${paymentModeFilter}` : "",
  ].filter(Boolean);

  const CASH_PAYMENT_MODE_LABELS: Record<CashPaymentMode, string> = {
    CASH: "Cash",
    BANK: "Bank",
    CHEQUE: "Cheque",
    UPI: "UPI",
    NEFT_RTGS: "NEFT/RTGS",
  };

  const getCashPaymentModeLabel = (mode: CashPaymentMode | string | null | undefined) => {
    if (!mode) return "-";

    return (
      CASH_PAYMENT_MODE_LABELS[mode as CashPaymentMode] ??
      mode.replaceAll("_", " ")
    );
  }

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [projectsRes, companiesRes, incomeTypesRes, usersRes] = await Promise.all([
          fetch("/api/projects/options"),
          fetch("/api/companies/options"),
          fetch("/api/income-types/options"),
          fetch("/api/users/options"),
        ]);

        if (projectsRes.ok) {
          const data = await projectsRes.json();
          setProjects(Array.isArray(data) ? data : []);
        }

        if (companiesRes.ok) {
          const data = await companiesRes.json();
          setCompanies(Array.isArray(data) ? data : []);
        }

        if (incomeTypesRes.ok) {
          const data = await incomeTypesRes.json();
          setIncomeTypes(
            Array.isArray(data)
              ? data.filter((item: IncomeTypeOption) => item.status === "ACTIVE")
              : [],
          );
        }

        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Failed to load income filter options", error);
      }
    };

    loadOptions();
  }, []);

  const filteredProjects = useMemo(() => {
    const q = draftProjectQuery.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((project) =>
      getProjectLabel(project).toLowerCase().includes(q),
    );
  }, [draftProjectQuery, projects]);

  const filteredCompanies = useMemo(() => {
    const q = draftIncomeCompanyQuery.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((company) =>
      getCompanyLabel(company).toLowerCase().includes(q),
    );
  }, [companies, draftIncomeCompanyQuery]);

  const filteredIncomeTypes = useMemo(() => {
    const q = draftIncomeTypeQuery.trim().toLowerCase();
    if (!q) return incomeTypes;
    return incomeTypes.filter((incomeType) =>
      getIncomeTypeLabel(incomeType).toLowerCase().includes(q),
    );
  }, [draftIncomeTypeQuery, incomeTypes]);

  const filteredUsers = useMemo(() => {
    const q = draftReceivedByQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) => getUserLabel(user).toLowerCase().includes(q));
  }, [draftReceivedByQuery, users]);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pageIndex + 1),
        pageSize: String(pageSize),
      });
      if (query.trim()) params.set("q", query.trim());
      if (projectFilter?.id) params.set("projectId", projectFilter.id);
      if (incomeTypeFilter?.id) params.set("incomeTypeId", incomeTypeFilter.id);
      if (incomeCompanyFilter?.id)
        params.set("incomeCompanyId", incomeCompanyFilter.id);
      if (receivedByFilter?.id) params.set("receivedById", receivedByFilter.id);
      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);
      if (paymentModeFilter) params.set("paymentMode", paymentModeFilter);

      const res = await fetch(`/api/income?${params.toString()}`);
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error || "Failed to load income.");
        return;
      }

      const data = await res.json();
      setRows(Array.isArray(data?.data) ? data.data : []);
      setTotal(typeof data?.total === "number" ? data.total : 0);
    } catch (error) {
      console.error("Failed to load income", error);
      toast.error("Failed to load income.");
    } finally {
      setLoading(false);
    }
  }, [
    fromDate,
    incomeCompanyFilter,
    pageIndex,
    pageSize,
    paymentModeFilter,
    projectFilter,
    incomeTypeFilter,
    query,
    receivedByFilter,
    toDate,
  ]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (pageIndex > pageCount - 1) {
      setPageIndex(Math.max(pageCount - 1, 0));
    }
  }, [pageCount, pageIndex]);

  const handleEdit = useCallback(
    (row: IncomeRow) => {
      router.push(`/dashboard/income/${row.id}`);
    },
    [router],
  );

  const handleDelete = useCallback((row: IncomeRow) => {
    setConfirmTarget(row);
    setConfirmOpen(true);
  }, []);

  const columns = useMemo<ColumnDef<IncomeRow>[]>(
    () => [
      {
        header: "Date",
        accessorKey: "date",
        cell: ({ row }) => (
          <div className="flex flex-wrap items-center gap-2 text-slate-600">
            <span>{formatToDDMMYYYY(row.original.date)}</span>
          </div>
        ),
      },
      {
        header: "Category",
        accessorKey: "incomeTypeName",
        cell: ({ row }) => (
          <span className="text-slate-600">
            {row.original.incomeTypeName || "-"}
          </span>
        ),
      },
      {
        header: "Project",
        accessorKey: "projectName",
        cell: ({ row }) => (
          <span className="text-slate-600">
            {row.original.projectName || "-"}
            {row.original.projectCity ? ` (${row.original.projectCity})` : ""}
          </span>
        ),
      },
      {
        header: "Income Company",
        accessorKey: "incomeCompanyName",
        cell: ({ row }) => (
          <div className="flex flex-wrap items-center gap-2 text-slate-600">
            <span>{row.original.incomeCompanyName || "-"}</span>
          </div>
        ),
      },
      {
        header: "Received By",
        accessorKey: "receivedByName",
        cell: ({ row }) => (
          <span className="text-slate-600">{row.original.receivedByName || "-"}</span>
        ),
      },
      {
        header: "Payment Mode",
        accessorKey: "paymentMode",
        cell: ({ row }) => (
          <span className="text-slate-600">{getCashPaymentModeLabel(row.original.paymentMode) || "-"}</span>
        ),
      },
      {
        header: "Amount",
        accessorKey: "amount",
        cell: ({ row }) => (
          <span className="text-slate-600">{formatAmount(row.original.amount)}</span>
        ),
      },
      {
        header: "Action",
        id: "action",
        cell: ({ row }) => (
          <div className="rbac-inline-actions flex gap-4">
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
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount,
  });

  const confirmDelete = useCallback(async () => {
    if (!confirmTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/income/${confirmTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error || "Failed to delete income.");
        return;
      }
      toast.success("Income deleted successfully.");
      await loadRows();
    } catch (error) {
      console.error("Failed to delete income", error);
      toast.error("Failed to delete income.");
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setConfirmTarget(null);
    }
  }, [confirmTarget, loadRows]);

  return (
    <>
      <section className="rbac-section rbac-container">
        <div className="rbac-card">
          <div className="flex items-center justify-between gap-3">
            <h3 className="rbac-title-lg">Income</h3>
            <div className="flex gap-2">
              <button
                className="rbac-button rbac-button-secondary theme-button-secondary inline-flex items-center gap-2"
                type="button"
                onClick={openFilters}
              >
                <FaFilter /> <span>Filters</span>
              </button>
              <Link href="/dashboard/income/new">
                <button className="rbac-button" type="button">
                  Add Income
                </button>
              </Link>
            </div>
          </div>

          <AppliedFilterSummary
            items={appliedFilters}
            onClear={() => {
              setPageIndex(0);
              setQuery("");
              setProjectFilter(null);
              setIncomeTypeFilter(null);
              setIncomeCompanyFilter(null);
              setReceivedByFilter(null);
              setFromDate("");
              setToDate("");
              setPaymentModeFilter("");
              setDraftQuery("");
              setDraftProjectFilter(null);
              setDraftProjectQuery("");
              setDraftIncomeTypeFilter(null);
              setDraftIncomeTypeQuery("");
              setDraftIncomeCompanyFilter(null);
              setDraftIncomeCompanyQuery("");
              setDraftReceivedByFilter(null);
              setDraftReceivedByQuery("");
              setDraftFromDate("");
              setDraftToDate("");
              setDraftPaymentModeFilter("");
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
                          className={`border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase ${header.id === "action" ? "text-right" : ""
                            }`}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={columns.length} className="px-4 py-4 text-center text-slate-500">
                        <FaSpinner className="mx-auto animate-spin" />
                      </td>
                    </tr>
                  )}
                  {!loading && rows.length === 0 && (
                    <tr>
                      <td colSpan={columns.length} className="px-4 py-4 text-slate-500">
                        No income found.
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    table.getRowModel().rows.map((row) => (
                      <tr key={row.id} className="bg-white">
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="border-b border-slate-100 px-4 py-3 text-sm">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden mt-4">
              <FinanceCardList
                rows={rows}
                loading={loading}
                emptyLabel="No income found."
                showCount={false}
                collapsible={false}
                onEdit={handleEdit}
                onDelete={handleDelete}
                cardContent={{
                  getVariant: () => "income",
                  getCode: (row) => row.incomeCompanyCode,
                  getTitle: (row) => row.incomeTypeName || "",
                  getPaymentMode: (row) => row.paymentMode,
                  getProjectName: (row) => row.projectName,
                  getProjectCity: (row) => row.projectCity,
                  getPersonLabel: (row) => row.receivedByName || "",
                  getReceivedByName: (row) => row.receivedByName,
                  getRemark: (row) => row.remark || "",
                  getDateLabel: (row) => formatToDDMMYYYY(row.date),
                }}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-3 text-sm">
            <button
              className="change-button change-button-secondary"
              type="button"
              onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}
              disabled={pageIndex === 0}
            >
              <FaChevronLeft size={18} />
            </button>
            <span>
              Page {pageIndex + 1} of {pageCount}
            </span>
            <button
              className="change-button change-button-secondary"
              type="button"
              onClick={() => setPageIndex((prev) => Math.min(prev + 1, pageCount - 1))}
              disabled={pageIndex + 1 >= pageCount}
            >
              <FaChevronRight size={18} />
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
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete income?"
        description="Are you sure you want to delete this income entry?"
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
        title="Income Filters"
        description="Update the filters and apply them when you're ready."
        onClose={closeFilters}
        onApply={applyFilters}
        activeCount={activeFilterCount}
        maxWidthClassName="max-w-2xl"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <input
            className="rbac-input-filter"
            type="text"
            placeholder="Search project, company, user"
            value={draftQuery}
            onChange={(event) => setDraftQuery(event.target.value)}
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
                {filteredProjects.map((project) => (
                  <ComboboxOption
                    key={project.id}
                    value={project}
                    className="cursor-pointer rounded-lg px-3 py-2 text-sm data-[focus]:bg-[var(--theme-surface-2)] data-[selected]:bg-[var(--theme-surface-2)]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span>{getProjectLabel(project)}</span>
                    </div>
                  </ComboboxOption>
                ))}
              </ComboboxOptions>
            </div>
          </Combobox>

          <Combobox
            value={draftIncomeTypeFilter}
            onChange={(option: IncomeTypeOption | null) => {
              setDraftIncomeTypeFilter(option);
              setDraftIncomeTypeQuery("");
            }}
            nullable
          >
            <div className="relative min-w-64">
              <ComboboxInput
                className="theme-input rbac-input w-full pr-10"
                placeholder="Category"
                displayValue={(option: IncomeTypeOption | null) =>
                  option ? getIncomeTypeLabel(option) : draftIncomeTypeQuery
                }
                onChange={(event) => {
                  setDraftIncomeTypeQuery(event.target.value);
                  setDraftIncomeTypeFilter(null);
                }}
              />
              <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3 text-[color:var(--theme-text-muted)]">
                <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
              </ComboboxButton>
              <ComboboxOptions className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-[color:var(--theme-border)] bg-[var(--theme-surface)] p-1 shadow-lg text-[color:var(--theme-text)]">
                {filteredIncomeTypes.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-[color:var(--theme-text-muted)]">
                    No income types found
                  </div>
                ) : (
                  filteredIncomeTypes.map((incomeType) => (
                    <ComboboxOption
                      key={incomeType.id}
                      value={incomeType}
                      className="cursor-pointer rounded-lg px-3 py-2 text-sm data-[focus]:bg-[var(--theme-surface-2)] data-[selected]:bg-[var(--theme-surface-2)]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span>{getIncomeTypeLabel(incomeType)}</span>
                      </div>
                    </ComboboxOption>
                  ))
                )}
              </ComboboxOptions>
            </div>
          </Combobox>

          <Combobox
            value={draftIncomeCompanyFilter}
            onChange={(option: CompanyOption | null) => {
              setDraftIncomeCompanyFilter(option);
              setDraftIncomeCompanyQuery("");
            }}
            nullable
          >
            <div className="relative min-w-64">
              <ComboboxInput
                className="theme-input rbac-input w-full pr-10"
                placeholder="Income Company"
                displayValue={(option: CompanyOption | null) =>
                  option ? getCompanyLabel(option) : draftIncomeCompanyQuery
                }
                onChange={(event) => {
                  setDraftIncomeCompanyQuery(event.target.value);
                  setDraftIncomeCompanyFilter(null);
                }}
              />
              <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3 text-[color:var(--theme-text-muted)]">
                <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
              </ComboboxButton>
              <ComboboxOptions className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-[color:var(--theme-border)] bg-[var(--theme-surface)] p-1 shadow-lg text-[color:var(--theme-text)]">
                {filteredCompanies.map((company) => (
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

          <Combobox
            value={draftReceivedByFilter}
            onChange={(option: UserOption | null) => {
              setDraftReceivedByFilter(option);
              setDraftReceivedByQuery("");
            }}
            nullable
          >
            <div className="relative min-w-64">
              <ComboboxInput
                className="theme-input rbac-input w-full pr-10"
                placeholder="Received By"
                displayValue={(option: UserOption | null) =>
                  option ? getUserLabel(option) : draftReceivedByQuery
                }
                onChange={(event) => {
                  setDraftReceivedByQuery(event.target.value);
                  setDraftReceivedByFilter(null);
                }}
              />
              <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3 text-[color:var(--theme-text-muted)]">
                <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
              </ComboboxButton>
              <ComboboxOptions className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-[color:var(--theme-border)] bg-[var(--theme-surface)] p-1 shadow-lg text-[color:var(--theme-text)]">
                {filteredUsers.map((user) => (
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

          <Listbox
            value={draftPaymentModeFilter}
            onChange={(value: PaymentMode | "") =>
              setDraftPaymentModeFilter(value)
            }
          >
            <div className="relative">
              <Listbox.Button className="rbac-input rbac-select flex w-full items-center justify-between text-left">
                <span>
                  {draftPaymentModeFilter === "CASH"
                    ? "Cash"
                    : draftPaymentModeFilter === "BANK"
                      ? "Bank"
                      : "All payment modes"}
                </span>

              </Listbox.Button>

              <Listbox.Options className="theme-surface absolute bottom-full z-50 mt-2 max-h-60 w-full overflow-auto rounded-md py-1 shadow-lg focus:outline-none">
                {[
                  { label: "All payment modes", value: "" },
                  { label: "Cash", value: "CASH" },
                  { label: "Cheque", value: "CHEQUE" },
                  { label: "UPI", value: "UPI" },
                  { label: "NEFT/RTGS", value: "NEFT_RTGS" },
                ].map((mode) => (
                  <Listbox.Option
                    key={mode.value}
                    value={mode.value}
                    className={({ active }) =>
                      `cursor-pointer px-4 py-2 text-sm ${active ? "rbac-option-active" : ""
                      }`
                    }
                  >
                    {({ selected }) => (
                      <div className="flex items-center justify-between">
                        <span>{mode.label}</span>

                      </div>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Listbox>
        </div>
      </ListingFilterDialog>
    </>
  );
}

export default function IncomePage() {
  return (
    <DashboardShell requireAdmin>
      <IncomeListContent />
    </DashboardShell>
  );
}
