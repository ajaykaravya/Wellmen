"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { flexRender, useReactTable } from "@tanstack/react-table";
import { ColumnDef, getCoreRowModel } from "@tanstack/table-core";
import AppliedFilterSummary from "../../../components/AppliedFilterSummary";
import ConfirmDialog from "../../../components/ConfirmDialog";
import ListingFilterDialog from "../../../components/ListingFilterDialog";
import useDebounce from "@/app/hooks/useDebounce";
import { QueryTableCard } from "../../../dashboard/_components/QueryTableCard";
import { toast } from "react-toastify";
import {
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaTrash,
  FaSpinner,
  FaFilter,
} from "react-icons/fa";
import { Listbox } from "@headlessui/react";
import Link from "next/link";
import { useDashboardContext } from "../../_components/DashboardShell";

type QueryCategory = "REMARKS" | "URGENCY" | "DECISION_PENDING";
type QueryStatus = "PENDING" | "COMPLETED";
type PriorityLevel = "LOW" | "MEDIUM" | "HIGH";

type QueryRow = {
  id: string;
  projectId: string;
  projectName: string;
  projectCity?: string | null;
  category: QueryCategory;
  description: string;
  status: QueryStatus;
  priority: PriorityLevel;
  createdAt: string;
  createdById?: string;
  createdByName?: string;
};

type QueryListContentProps = {
  apiBase: string;
  basePath: string;
  title: string;
  addLabel?: string;
  emptyMessage?: string;
};

const categoryLabel = (value: QueryCategory | string) => {
  switch (value) {
    case "REMARKS":
      return "Remarks";
    case "URGENCY":
      return "Urgency";
    case "DECISION_PENDING":
      return "Decision Pending";
    default:
      return value.replaceAll("_", " ");
  }
};

const statusLabel = (value: QueryStatus | string) => {
  switch (value) {
    case "PENDING":
      return "Pending";
    case "COMPLETED":
      return "Completed";
    default:
      return value.replaceAll("_", " ");
  }
};

const priorityLabel = (value: PriorityLevel | string) => {
  switch (value) {
    case "LOW":
      return "Low";
    case "MEDIUM":
      return "Medium";
    case "HIGH":
      return "High";
    default:
      return value.replaceAll("_", " ");
  }
};

export default function QueryListContent({
  apiBase,
  basePath,
  title,
  addLabel = "Add Query",
  emptyMessage = "No queries found.",
}: QueryListContentProps) {
  const router = useRouter();
  const { isAdmin } = useDashboardContext();
  const searchParams = useSearchParams();
  const [queries, setQueries] = useState<QueryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<QueryStatus | "">(() => {
    const initialStatus = searchParams?.get("status")?.toUpperCase();
    return initialStatus === "PENDING" || initialStatus === "COMPLETED"
      ? (initialStatus as QueryStatus)
      : "";
  });
  const [priorityFilter, setPriorityFilter] = useState<PriorityLevel | "">("");
  const [categoryFilter, setCategoryFilter] = useState<QueryCategory | "">("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftQuery, setDraftQuery] = useState("");
  const [draftStatusFilter, setDraftStatusFilter] = useState<QueryStatus | "">(
    "",
  );
  const [draftPriorityFilter, setDraftPriorityFilter] = useState<
    PriorityLevel | ""
  >("");
  const [draftCategoryFilter, setDraftCategoryFilter] =
    useState<QueryCategory | "">("");
  const debouncedQuery = useDebounce(query, 400);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<QueryRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadQueries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pageIndex + 1),
        pageSize: String(pageSize),
      });

      if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
      if (statusFilter) params.set("status", statusFilter);
      if (priorityFilter) params.set("priority", priorityFilter);
      if (categoryFilter) params.set("category", categoryFilter);
      const res = await fetch(`${apiBase}?${params.toString()}`);
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error || "Failed to load queries.");
        return;
      }

      const data = await res.json();
      setQueries(Array.isArray(data?.data) ? data.data : []);
      setTotal(typeof data?.total === "number" ? data.total : 0);
    } catch (error) {
      console.error("Failed to load queries", error);
      toast.error("Failed to load queries.");
    } finally {
      setLoading(false);
    }
  }, [
    apiBase,
    debouncedQuery,
    pageIndex,
    pageSize,
    statusFilter,
    priorityFilter,
    categoryFilter,
  ]);

  useEffect(() => {
    loadQueries();
  }, [loadQueries]);

  useEffect(() => {
    const status = searchParams?.get("status")?.toUpperCase();
    if (status === "PENDING" || status === "COMPLETED") {
      setStatusFilter(status as QueryStatus);
    } else {
      setStatusFilter("");
    }
  }, [searchParams]);

  const appliedFilters = [
    query.trim(),
    statusFilter ? statusLabel(statusFilter) : "",
    priorityFilter ? priorityLabel(priorityFilter) : "",
    categoryFilter ? categoryLabel(categoryFilter) : "",
  ].filter(Boolean);

  const openFilters = () => {
    setDraftQuery(query);
    setDraftStatusFilter(statusFilter);
    setDraftPriorityFilter(priorityFilter);
    setDraftCategoryFilter(categoryFilter);
    setFilterOpen(true);
  };

  const closeFilters = () => {
    setFilterOpen(false);
  };

  const applyFilters = () => {
    setPageIndex(0);
    setQuery(draftQuery);
    setStatusFilter(draftStatusFilter);
    setPriorityFilter(draftPriorityFilter);
    setCategoryFilter(draftCategoryFilter);
    setFilterOpen(false);
  };

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (pageIndex > pageCount - 1) {
      setPageIndex(Math.max(pageCount - 1, 0));
    }
  }, [pageCount, pageIndex]);

  const handleEdit = useCallback(
    (row: QueryRow) => {
      router.push(`${basePath}/${row.id}`);
    },
    [basePath, router],
  );

  const handleDelete = useCallback((row: QueryRow) => {
    setConfirmTarget(row);
    setConfirmOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!confirmTarget) return;
    setDeleting(true);

    try {
      const res = await fetch(`${apiBase}/${confirmTarget.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error || "Failed to delete query.");
        return;
      }

      await loadQueries();
      toast.success("Query deleted successfully.");
    } catch (error) {
      console.error("Failed to delete query", error);
      toast.error("Failed to delete query.");
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setConfirmTarget(null);
    }
  }, [apiBase, confirmTarget, loadQueries]);

  const columns = useMemo<ColumnDef<QueryRow>[]>(
    () => [
      ...(isAdmin
        ? [
            {
              header: "By",
              accessorKey: "createdByName",
              cell: (info:any) => (
                <span className="rbac-muted">
                  {String(info.getValue() || "-")}
                </span>
              ),
            },
          ]
        : []),
      {
        header: "Category",
        accessorKey: "category",
        cell: (info) => (
          <span className="rbac-muted">
            {categoryLabel(String(info.getValue() || ""))}
          </span>
        ),
      },
      {
        header: "Project",
        accessorKey: "projectName",
        cell: ({ row, getValue }) => (
          <div className="flex flex-col">
            <span className="rbac-muted">{String(getValue() || "-")}</span>
            <span className="text-xs text-slate-500">
              {row.original.projectCity || "-"}
            </span>
          </div>
        ),
      },
      {
        header: "Description",
        accessorKey: "description",
        cell: (info) => (
          <span className="rbac-muted">{String(info.getValue() || "-")}</span>
        ),
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: (info) => {
          const value = String(info.getValue() || "")
            .replaceAll("_", " ")
            .toLowerCase();

          const formatted = value.charAt(0).toUpperCase() + value.slice(1);

          return <span className="rbac-muted">{formatted}</span>;
        },
      },
      {
        header: "Priority",
        accessorKey: "priority",
        cell: (info) => (
          <span className="rbac-muted">
            {priorityLabel(String(info.getValue() || ""))}
          </span>
        ),
      },
      {
        header: "Action",
        id: "action",
        cell: ({ row }) => (
          <div className="rbac-inline-actions flex gap-2">
            <button
              className="rbac-link"
              type="button"
              onClick={() => handleEdit(row.original)}
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
    [basePath, handleDelete, handleEdit],
  );

  const table = useReactTable({
    data: queries,
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
            <h3 className="rbac-title-lg">{title}</h3>
            <div className="flex items-center gap-2">
              <button
                className="rbac-button rbac-button-secondary theme-button-secondary inline-flex items-center gap-2"
                type="button"
                onClick={openFilters}
              >
                <FaFilter /> <span>Filters</span>
              </button>
              <Link href={`${basePath}/new`}>
                <button className="rbac-button" type="button">
                  {addLabel}
                </button>
              </Link>
            </div>
          </div>

          <AppliedFilterSummary
            items={appliedFilters}
            onClear={() => {
              setPageIndex(0);
              setQuery("");
              setStatusFilter("");
              setPriorityFilter("");
              setCategoryFilter("");
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
                          className="text-left text-xs font-semibold uppercase px-4 py-3 border-b border-slate-200"
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
                  {!loading && queries.length === 0 && (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-4 py-3 text-sm text-slate-500"
                      >
                        {emptyMessage}
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    table.getRowModel().rows.map((row, index) => (
                      <tr
                        key={row.original.id}
                        className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
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
              {!loading && queries.length === 0 && (
                <div className="rbac-card py-4 text-sm text-slate-500">
                  {emptyMessage}
                </div>
              )}
              {!loading && (
                <QueryTableCard
                  title=""
                  rows={queries.map((query) => ({
                    id: query.id,
                    projectId: query.projectId,
                    projectName: query.projectName,
                    projectCity: query.projectCity || null,
                    category: query.category,
                    description: query.description,
                    status: query.status,
                    priority: query.priority,
                    createdById: query.createdById || query.id,
                    createdByName: query.createdByName || "",
                  }))}
                  loading={loading}
                  emptyLabel={emptyMessage}
                  showCount={false}
                  collapsible={false}
                  renderActions={(query) => (
                    <div className="flex justify-end">
                      <button
                        className="rbac-link"
                        type="button"
                        onClick={() => {
                          const fullQuery = queries.find((q) => q.id === query.id);
                          if (fullQuery) handleEdit(fullQuery);
                        }}
                      >
                        <FaEdit size={18} />
                      </button>
                      <button
                        style={{ padding: "2px" }}
                        className="rbac-link danger"
                        type="button"
                        onClick={() => {
                          const fullQuery = queries.find((q) => q.id === query.id);
                          if (fullQuery) handleDelete(fullQuery);
                        }}
                      >
                        <FaTrash size={18} />
                      </button>
                    </div>
                  )}
                />
              )}
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
        title="Delete query?"
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
        title={`${title} Filters`}
        description="Update the filters and apply them when you're ready."
        onClose={closeFilters}
        onApply={applyFilters}
      >
        <input
          className="rbac-input-filter"
          type="text"
          placeholder="Search description or project"
          value={draftQuery}
          onChange={(event) => setDraftQuery(event.target.value)}
        />
        <Listbox
          value={draftStatusFilter}
          onChange={(value: QueryStatus | "") =>
            setDraftStatusFilter(value)
          }
        >
          <div className="relative">
            <Listbox.Button className="rbac-input-filter rbac-select flex w-full items-center justify-between text-left">
              <span>
                {draftStatusFilter === "PENDING"
                  ? "Pending"
                  : draftStatusFilter === "COMPLETED"
                    ? "Completed"
                    : "All status"}
              </span>

            </Listbox.Button>

            <Listbox.Options className="theme-surface absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-md py-1 shadow-lg focus:outline-none">
              {[
                { label: "All status", value: "" },
                { label: "Pending", value: "PENDING" },
                { label: "Completed", value: "COMPLETED" },
              ].map((status) => (
                <Listbox.Option
                  key={status.value}
                  value={status.value}
                  className={({ active }) =>
                    `cursor-pointer px-4 py-2 text-sm ${active ? "rbac-option-active" : ""
                    }`
                  }
                >
                  {({ selected }) => (
                    <div className="flex items-center justify-between">
                      <span>{status.label}</span>
                    </div>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </div>
        </Listbox>
        <Listbox
          value={draftPriorityFilter}
          onChange={(value: PriorityLevel | "") =>
            setDraftPriorityFilter(value)
          }
        >
          <div className="relative">
            <Listbox.Button className="rbac-input-filter rbac-select flex w-full items-center justify-between text-left">
              <span>
                {draftPriorityFilter === "LOW"
                  ? "Low"
                  : draftPriorityFilter === "MEDIUM"
                    ? "Medium"
                    : draftPriorityFilter === "HIGH"
                      ? "High"
                      : "Priority"}
              </span>

            </Listbox.Button>

            <Listbox.Options className="theme-surface absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-md py-1 shadow-lg focus:outline-none">
              {[
                { label: "Priority", value: "" },
                { label: "Low", value: "LOW" },
                { label: "Medium", value: "MEDIUM" },
                { label: "High", value: "HIGH" },
              ].map((priority) => (
                <Listbox.Option
                  key={priority.value}
                  value={priority.value}
                  className={({ active }) =>
                    `cursor-pointer px-4 py-2 text-sm ${active ? "rbac-option-active" : ""
                    }`
                  }
                >
                  {({ selected }) => (
                    <div className="flex items-center justify-between">
                      <span>{priority.label}</span>
                    </div>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </div>
        </Listbox>
        <Listbox
          value={draftCategoryFilter}
          onChange={(value: QueryCategory | "") =>
            setDraftCategoryFilter(value)
          }
        >
          <div className="relative">
            <Listbox.Button className="rbac-input-filter rbac-select flex w-full items-center justify-between text-left">
              <span>
                {draftCategoryFilter === "REMARKS"
                  ? "Remarks"
                  : draftCategoryFilter === "DECISION_PENDING"
                    ? "Decision Pending"
                    : draftCategoryFilter === "URGENCY"
                      ? "Urgency"
                      : "Category"}
              </span>

            </Listbox.Button>

            <Listbox.Options className="theme-surface absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-md py-1 shadow-lg focus:outline-none">
              {[
                { label: "Category", value: "" },
                { label: "Remarks", value: "REMARKS" },
                { label: "Decision Pending", value: "DECISION_PENDING" },
                { label: "Urgency", value: "URGENCY" },
              ].map((category) => (
                <Listbox.Option
                  key={category.value}
                  value={category.value}
                  className={({ active }) =>
                    `cursor-pointer px-4 py-2 text-sm ${active ? "rbac-option-active" : ""
                    }`
                  }
                >
                  {({ selected }) => (
                    <div className="flex items-center justify-between">
                      <span>{category.label}</span>
                    </div>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </div>
        </Listbox>
      </ListingFilterDialog>
    </>
  );
}
