"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { flexRender, useReactTable } from "@tanstack/react-table";
import { ColumnDef, getCoreRowModel } from "@tanstack/table-core";
import { FaChevronLeft, FaChevronRight, FaEdit, FaFilter, FaSpinner, FaTrash, FaEye } from "react-icons/fa";
import { IoIosClose } from "react-icons/io";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import DashboardShell from "../../_components/DashboardShell";
import { FinanceCardList } from "../../_components/FinanceCardList";
import ListingFilterDialog from "../../../components/ListingFilterDialog";
import AppliedFilterSummary from "../../../components/AppliedFilterSummary";
import ConfirmDialog from "../../../components/ConfirmDialog";
import CustomDatePicker from "../../../components/CustomDatePicker";
import { formatToDDMMYYYY } from "@/lib/dateUtils";

type TransactionType = "CREDIT" | "DEBIT";

type PetiCashRow = {
  id: string;
  transactionType: TransactionType;
  amount: number;
  givenById: string | null;
  givenByName: string | null;
  givenByRole: string | null;
  givenToId: string | null;
  givenToName: string | null;
  givenToRole: string | null;
  companyId: string | null;
  companyName: string | null;
  companyCode: string | null;
  projectId: string | null;
  projectName: string | null;
  projectCity: string | null;
  date: string;
  remarks: string | null;
};

type UserOption = {
  id: string;
  firstName: string;
  lastName: string;
  role?: string | null;
};

type ProjectOption = {
  id: string;
  name: string;
  city?: string | null;
};

type CompanyOption = {
  id: string;
  name: string;
  code?: string | null;
};

const formatAmount = (value: number) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getTransactionLabel = (row: PetiCashRow) =>
  row.transactionType === "CREDIT" ? "Credit" : "Debit";

const getTransactionClassName = (row: PetiCashRow) =>
  row.transactionType === "CREDIT"
    ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200"
    : "bg-rose-100 text-rose-800 ring-1 ring-rose-200";

const getSignedAmountLabel = (row: PetiCashRow) =>
  `${row.transactionType === "CREDIT" ? "+" : "-"}₹${formatAmount(row.amount)}`;

const getUserLabel = (user: UserOption) =>
  `${user.firstName} ${user.lastName}${user.role ? ` - ${user.role}` : ""}`.trim();

const getProjectLabel = (project: ProjectOption) =>
  project.city ? `${project.name} (${project.city})` : project.name;

const getCompanyLabel = (company: CompanyOption) => company.name;

function PetiCashListContent() {
  const router = useRouter();
  const [rows, setRows] = useState<PetiCashRow[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [balance, setBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<TransactionType | "">("");
  const [givenByFilter, setGivenByFilter] = useState<UserOption | null>(null);
  const [givenToFilter, setGivenToFilter] = useState<UserOption | null>(null);
  const [projectFilter, setProjectFilter] = useState<ProjectOption | null>(null);
  const [companyFilter, setCompanyFilter] = useState<CompanyOption | null>(null);
  const [draftTransactionTypeFilter, setDraftTransactionTypeFilter] = useState<TransactionType | "">("");
  const [draftGivenByFilter, setDraftGivenByFilter] = useState<UserOption | null>(null);
  const [draftGivenToFilter, setDraftGivenToFilter] = useState<UserOption | null>(null);
  const [draftProjectFilter, setDraftProjectFilter] = useState<ProjectOption | null>(null);
  const [draftCompanyFilter, setDraftCompanyFilter] = useState<CompanyOption | null>(null);
  const [draftGivenByQuery, setDraftGivenByQuery] = useState("");
  const [draftGivenToQuery, setDraftGivenToQuery] = useState("");
  const [draftProjectQuery, setDraftProjectQuery] = useState("");
  const [draftCompanyQuery, setDraftCompanyQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [draftFromDate, setDraftFromDate] = useState("");
  const [draftToDate, setDraftToDate] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<PetiCashRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewData, setViewData] = useState<PetiCashRow | null>(null);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pageIndex + 1),
        pageSize: String(pageSize),
      });
      if (transactionTypeFilter) params.set("transactionType", transactionTypeFilter);
      if (givenByFilter?.id) params.set("givenById", givenByFilter.id);
      if (givenToFilter?.id) params.set("givenToId", givenToFilter.id);
      if (projectFilter?.id) params.set("projectId", projectFilter.id);
      if (companyFilter?.id) params.set("companyId", companyFilter.id);
      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);

      const res = await fetch(`/api/peti-cash?${params.toString()}`);
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error || "Failed to load peti cash.");
        return;
      }

      const data = await res.json();
      setRows(Array.isArray(data?.data) ? data.data : []);
      setTotal(typeof data?.total === "number" ? data.total : 0);
    } catch (error) {
      console.error("Failed to load peti cash", error);
      toast.error("Failed to load peti cash.");
    } finally {
      setLoading(false);
    }
  }, [
    companyFilter,
    fromDate,
    givenByFilter,
    givenToFilter,
    pageIndex,
    pageSize,
    projectFilter,
    transactionTypeFilter,
    toDate,
  ]);

  const loadBalance = useCallback(async () => {
    setBalanceLoading(true);
    try {
      const filters = new URLSearchParams();
      if (transactionTypeFilter) filters.set("transactionType", transactionTypeFilter);
      if (givenByFilter?.id) filters.set("givenById", givenByFilter.id);
      if (givenToFilter?.id) filters.set("givenToId", givenToFilter.id);
      if (projectFilter?.id) filters.set("projectId", projectFilter.id);
      if (companyFilter?.id) filters.set("companyId", companyFilter.id);
      if (fromDate) filters.set("fromDate", fromDate);
      if (toDate) filters.set("toDate", toDate);

      const accumulated: PetiCashRow[] = [];
      let currentPage = 1;
      let totalPages = 1;

      while (currentPage <= totalPages) {
        const params = new URLSearchParams(filters);
        params.set("page", String(currentPage));
        params.set("pageSize", "100");

        const res = await fetch(`/api/peti-cash?${params.toString()}`);
        if (!res.ok) return;

        const data = await res.json();
        const pageRows = Array.isArray(data?.data) ? data.data : [];
        accumulated.push(...pageRows);
        totalPages =
          typeof data?.totalPages === "number" && data.totalPages > 0
            ? data.totalPages
            : 1;
        currentPage += 1;
      }

      const totalBalance = accumulated.reduce((sum, row) => {
        const amount = Number(row.amount || 0);
        return row.transactionType === "CREDIT" ? sum + amount : sum - amount;
      }, 0);

      setBalance(totalBalance);
    } catch (error) {
      console.error("Failed to load peti cash balance", error);
    } finally {
      setBalanceLoading(false);
    }
  }, [
    companyFilter,
    fromDate,
    givenByFilter,
    givenToFilter,
    projectFilter,
    toDate,
    transactionTypeFilter,
  ]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [usersRes, projectsRes, companiesRes] = await Promise.all([
          fetch("/api/users/options"),
          fetch("/api/projects/options"),
          fetch("/api/companies/options"),
        ]);

        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(Array.isArray(data) ? data : []);
        }

        if (projectsRes.ok) {
          const data = await projectsRes.json();
          setProjects(Array.isArray(data) ? data : []);
        }

        if (companiesRes.ok) {
          const data = await companiesRes.json();
          setCompanies(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Failed to load peti cash filter options", error);
      }
    };

    loadOptions();
  }, []);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (pageIndex > pageCount - 1) {
      setPageIndex(Math.max(pageCount - 1, 0));
    }
  }, [pageCount, pageIndex]);

  const openFilters = useCallback(() => {
    setDraftTransactionTypeFilter(transactionTypeFilter);
    setDraftGivenByFilter(givenByFilter);
    setDraftGivenToFilter(givenToFilter);
    setDraftProjectFilter(projectFilter);
    setDraftCompanyFilter(companyFilter);
    setDraftGivenByQuery(givenByFilter ? getUserLabel(givenByFilter) : "");
    setDraftGivenToQuery(givenToFilter ? getUserLabel(givenToFilter) : "");
    setDraftProjectQuery(projectFilter ? getProjectLabel(projectFilter) : "");
    setDraftCompanyQuery(companyFilter ? getCompanyLabel(companyFilter) : "");
    setDraftFromDate(fromDate);
    setDraftToDate(toDate);
    setFilterOpen(true);
  }, [companyFilter, fromDate, givenByFilter, givenToFilter, projectFilter, toDate, transactionTypeFilter]);

  const applyFilters = useCallback(() => {
    setPageIndex(0);
    setTransactionTypeFilter(draftTransactionTypeFilter);
    setGivenByFilter(draftGivenByFilter);
    setGivenToFilter(draftGivenToFilter);
    setProjectFilter(draftProjectFilter);
    setCompanyFilter(draftCompanyFilter);
    setFromDate(draftFromDate);
    setToDate(draftToDate);
    setFilterOpen(false);
  }, [
    draftCompanyFilter,
    draftFromDate,
    draftGivenByFilter,
    draftGivenToFilter,
    draftProjectFilter,
    draftTransactionTypeFilter,
    draftToDate,
  ]);

  const appliedFilters = [
    transactionTypeFilter ? getTransactionLabel({ transactionType: transactionTypeFilter } as PetiCashRow) : "",
    givenByFilter ? getUserLabel(givenByFilter) : "",
    givenToFilter ? getUserLabel(givenToFilter) : "",
    projectFilter ? getProjectLabel(projectFilter) : "",
    companyFilter ? getCompanyLabel(companyFilter) : "",
    fromDate,
    toDate,
  ].filter(Boolean);

  const filteredUsers = useCallback(
    (q: string) => {
      const term = q.trim().toLowerCase();
      if (!term) return users;
      return users.filter((user) => getUserLabel(user).toLowerCase().includes(term));
    },
    [users],
  );

  const filteredProjects = useCallback(
    (q: string) => {
      const term = q.trim().toLowerCase();
      if (!term) return projects;
      return projects.filter((project) => getProjectLabel(project).toLowerCase().includes(term));
    },
    [projects],
  );

  const filteredCompanies = useCallback(
    (q: string) => {
      const term = q.trim().toLowerCase();
      if (!term) return companies;
      return companies.filter((company) => getCompanyLabel(company).toLowerCase().includes(term));
    },
    [companies],
  );

  const handleEdit = useCallback(
    (row: PetiCashRow) => {
      router.push(`/dashboard/peti-cash/${row.id}`);
    },
    [router],
  );

  const handleDelete = useCallback((row: PetiCashRow) => {
    setConfirmTarget(row);
    setConfirmOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!confirmTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/peti-cash/${confirmTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error || "Failed to delete peti cash.");
        return;
      }
      toast.success("Peti cash deleted successfully.");
      await loadRows();
    } catch (error) {
      console.error("Failed to delete peti cash", error);
      toast.error("Failed to delete peti cash.");
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setConfirmTarget(null);
    }
  }, [confirmTarget, loadRows]);

  const handleView = useCallback(async (row: PetiCashRow) => {
    setViewOpen(true);
    setViewLoading(true);
    setViewData(null);

    try {
      const res = await fetch(`/api/peti-cash/${row.id}`);
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error || "Failed to load peti cash details.");
        setViewOpen(false);
        return;
      }

      const data = await res.json();
      setViewData(data);
    } catch (error) {
      console.error("Failed to load peti cash details", error);
      toast.error("Failed to load peti cash details.");
      setViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  }, []);

  const columns = useMemo<ColumnDef<PetiCashRow>[]>(
    () => [
      {
        header: "Type",
        accessorKey: "transactionType",
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getTransactionClassName(
              row.original,
            )}`}
          >
            {getTransactionLabel(row.original)}
          </span>
        ),
      },
      {
        header: "Date",
        accessorKey: "date",
        cell: ({ row }) => (
          <span className="rbac-muted">{formatToDDMMYYYY(row.original.date)}</span>
        ),
      },
      {
        header: "Given By",
        accessorKey: "givenByName",
        cell: ({ row }) => (
          <span className="rbac-muted">{row.original.givenByName || "-"}</span>
        ),
      },
      {
        header: "Given To",
        accessorKey: "givenToName",
        cell: ({ row }) => (
          <span className="rbac-muted">{row.original.givenToName || "-"}</span>
        ),
      },
      {
        header: "Company",
        accessorKey: "companyName",
        cell: ({ row }) => (
          <span className="rbac-muted">{row.original.companyName || "-"}</span>
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
        header: "Remarks",
        accessorKey: "remarks",
        cell: ({ row }) => (
          <span className="rbac-muted">{row.original.remarks || "-"}</span>
        ),
      },
      {
        header: "Amount",
        accessorKey: "amount",
        cell: ({ row }) => (
          <span
            className={
              row.original.transactionType === "CREDIT"
                ? "text-emerald-700"
                : "text-rose-700"
            }
          >
            {getSignedAmountLabel(row.original)}
          </span>
        ),
      },
      {
        header: "Action",
        id: "action",
        cell: ({ row }) => (
          <div className="rbac-inline-actions flex justify-end gap-4">
            <button
              className="rbac-link"
              type="button"
              onClick={() => handleView(row.original)}
            >
              <FaEye />
            </button>
            <button
              className="rbac-link"
              type="button"
              aria-label="Edit"
              onClick={() => handleEdit(row.original)}
            >
              <FaEdit />
            </button>
            <button
              className="rbac-link danger"
              type="button"
              onClick={() => handleDelete(row.original)}
              aria-label="Delete"
            >
              <FaTrash />
            </button>
          </div>
        ),
      },
    ],
    [handleDelete, handleEdit]);

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount,
  });

  return (
    <DashboardShell requireAdmin>
      <section className="rbac-section rbac-container">
        <div className="rbac-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="rbac-title-lg flex flex-wrap items-center gap-2">
                <span>Peti Cash</span>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ring-1 ${balance < 0
                    ? "bg-rose-100 text-rose-800 ring-rose-200"
                    : "bg-emerald-100 text-emerald-800 ring-emerald-200"
                    }`}
                >
                  {balanceLoading ? "Loading..." : `Balance: ${formatAmount(balance)}`}
                </span>
              </h3>
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
                className="rbac-button"
                type="button"
                onClick={() => router.push("/dashboard/peti-cash/new?mode=CREDIT")}
              >
                Add Cash
              </button>
              <button
                className="rbac-button"
                type="button"
                onClick={() => router.push("/dashboard/peti-cash/new?mode=DEBIT")}
              >
                Give Cash
              </button>
            </div>
          </div>

          <AppliedFilterSummary
            items={appliedFilters}
            onClear={() => {
              setPageIndex(0);
              setTransactionTypeFilter("");
              setFromDate("");
              setToDate("");
              setDraftTransactionTypeFilter("");
              setDraftFromDate("");
              setGivenByFilter(null);
              setGivenToFilter(null);
              setDraftGivenByFilter(null);
              setDraftToDate("");
              setFilterOpen(false);
              setProjectFilter(null);
              setCompanyFilter(null);
            }}
          />

          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="theme-table min-w-full border border-slate-200 border-separate border-spacing-0">
              <thead className="bg-slate-50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        style={{ width: header.getSize() }}
                        className={`border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase ${header.id === "action" ? "text-right" : "text-left"}`}
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
                    <td colSpan={columns.length} className="px-4 py-3 text-sm text-slate-500">
                      <div className="flex items-center justify-center">
                        <FaSpinner className="mr-2 animate-spin" size={16} />
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-3 text-sm text-slate-500">
                      No peti cash entries found.
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
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
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
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
              cardContent={{
                getVariant: (row) =>
                  row.transactionType === "CREDIT" ? "income" : "expense",
                getCode: (row) => row.companyCode,
                getTagClassName: (row) => getTransactionClassName(row),
                getProjectName: (row) => row.projectName,
                getProjectCity: (row) => row.projectCity,
                getCashGivenByName: (row) => row.givenByName,
                getCashGivenToName: (row) => row.givenToName,
                getRemark: (row) => row.remarks || "",
                getDateLabel: (row) => formatToDDMMYYYY(row.date),
              }}
            />
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
        title="Delete peti cash entry?"
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
        title="Peti Cash Filters"
        description="Update the filters and apply them when you're ready."
        onClose={() => setFilterOpen(false)}
        onApply={applyFilters}
        maxWidthClassName="max-w-2xl"
      >
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
          value={draftTransactionTypeFilter}
          onChange={(option: TransactionType | "" | null) => {
            setDraftTransactionTypeFilter(option ?? "");
          }}
          nullable
        >
          <div className="relative min-w-64">
            <ComboboxInput
              className="theme-input rbac-input w-full pr-10"
              placeholder="Type"
              displayValue={(option: TransactionType | "" | null) =>
                option ? (option === "CREDIT" ? "Credit" : "Debit") : ""
              }
              onChange={() => {
                setDraftTransactionTypeFilter("");
              }}
            />
            <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3 text-[color:var(--theme-text-muted)]">
              <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
            </ComboboxButton>
            <ComboboxOptions className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-[color:var(--theme-border)] bg-[var(--theme-surface)] p-1 shadow-lg text-[color:var(--theme-text)]">
              {(["CREDIT", "DEBIT"] as const).map((type) => (
                <ComboboxOption
                  key={type}
                  value={type}
                  className="cursor-pointer rounded-lg px-3 py-2 text-sm data-[focus]:bg-[var(--theme-surface-2)] data-[selected]:bg-[var(--theme-surface-2)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span>{type === "CREDIT" ? "Credit" : "Debit"}</span>
                  </div>
                </ComboboxOption>
              ))}
            </ComboboxOptions>
          </div>
        </Combobox>

        <Combobox
          value={draftGivenByFilter}
          onChange={(option: UserOption | null) => {
            setDraftGivenByFilter(option);
            setDraftGivenByQuery("");
          }}
          nullable
        >
          <div className="relative min-w-64">
            <ComboboxInput
              className="theme-input rbac-input w-full pr-10"
              placeholder="Given By"
              displayValue={(option: UserOption | null) =>
                option ? getUserLabel(option) : draftGivenByQuery
              }
              onChange={(event) => {
                setDraftGivenByQuery(event.target.value);
                setDraftGivenByFilter(null);
              }}
            />
            <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3 text-[color:var(--theme-text-muted)]">
              <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
            </ComboboxButton>
            <ComboboxOptions className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-[color:var(--theme-border)] bg-[var(--theme-surface)] p-1 shadow-lg text-[color:var(--theme-text)]">
              {filteredUsers(draftGivenByQuery).map((user) => (
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
          value={draftGivenToFilter}
          onChange={(option: UserOption | null) => {
            setDraftGivenToFilter(option);
            setDraftGivenToQuery("");
          }}
          nullable
        >
          <div className="relative min-w-64">
            <ComboboxInput
              className="theme-input rbac-input w-full pr-10"
              placeholder="Given To"
              displayValue={(option: UserOption | null) =>
                option ? getUserLabel(option) : draftGivenToQuery
              }
              onChange={(event) => {
                setDraftGivenToQuery(event.target.value);
                setDraftGivenToFilter(null);
              }}
            />
            <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3 text-[color:var(--theme-text-muted)]">
              <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
            </ComboboxButton>
            <ComboboxOptions className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-[color:var(--theme-border)] bg-[var(--theme-surface)] p-1 shadow-lg text-[color:var(--theme-text)]">
              {filteredUsers(draftGivenToQuery).map((user) => (
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
              {filteredProjects(draftProjectQuery).map((project) => (
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
              placeholder="Company"
              displayValue={(option: CompanyOption | null) =>
                option ? getCompanyLabel(option) : draftCompanyQuery
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
              {filteredCompanies(draftCompanyQuery).map((company) => (
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
      </ListingFilterDialog>

      {viewOpen && (
        <Dialog open={viewOpen} onClose={() => { setViewOpen(false); setViewData(null); }} className="relative z-100">
          <DialogBackdrop
            className="theme-modal-overlay fixed inset-0 z-100 bg-black/60 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
          />

          <div className="fixed inset-0 z-101 flex items-center justify-center p-4">
            <DialogPanel className="theme-modal-surface relative z-102 w-full max-w-2xl rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-auto">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <DialogTitle className="text-lg font-semibold">Peti Cash details</DialogTitle>
                  <p className="mt-1 text-sm">View full entry information.</p>
                </div>
                <button type="button" onClick={() => { setViewOpen(false); setViewData(null); }}>
                  <IoIosClose size={30} />
                </button>
              </div>

              {viewLoading && (
                <div className="flex items-center justify-center py-4">
                  <FaSpinner className="animate-spin mr-2" size={16} />
                </div>
              )}

              {!viewLoading && viewData && (
                <div className="mt-4 grid gap-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <p className="text-sm">
                      <strong>Type:</strong> {getTransactionLabel(viewData)}
                    </p>
                    <p className="text-sm">
                      <strong>Amount:</strong> {getSignedAmountLabel(viewData)}
                    </p>
                    <p className="text-sm">
                      <strong>Date:</strong> {formatToDDMMYYYY(viewData.date)}
                    </p>
                    <p className="text-sm">
                      <strong>Given By:</strong> {viewData.givenByName || "-"}
                    </p>
                    <p className="text-sm">
                      <strong>Given To:</strong> {viewData.givenToName || "-"}
                    </p>
                    <p className="text-sm">
                      <strong>Company:</strong> {viewData.companyName || "-"}
                    </p>
                    {viewData.projectName && (
                      <p className="text-sm">
                        <strong>Project:</strong> {viewData.projectName ? `${viewData.projectName}${viewData.projectCity ? ` (${viewData.projectCity})` : ""}` : "-"}
                      </p>
                    )}
                  </div>

                  {viewData.remarks && (
                    <p className="text-sm whitespace-pre-wrap">
                      <strong>Remarks:</strong> {viewData.remarks}
                    </p>
                  )}
                </div>
              )}
            </DialogPanel>
          </div>
        </Dialog>
      )}

    </DashboardShell>
  );
}

export default PetiCashListContent;
