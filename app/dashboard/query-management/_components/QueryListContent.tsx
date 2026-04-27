"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { flexRender, useReactTable } from "@tanstack/react-table";
import { ColumnDef, getCoreRowModel } from "@tanstack/table-core";
import ConfirmDialog from "../../../components/ConfirmDialog";
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

type QueryCategory = "REMARKS" | "URGENCY" | "DECISION_PENDING";
type QueryStatus = "PENDING" | "COMPLETED";
type PriorityLevel = "LOW" | "MEDIUM" | "HIGH";

type QueryRow = {
  id: string;
  projectId: string;
  projectName: string;
  category: QueryCategory;
  description: string;
  status: QueryStatus;
  priority: PriorityLevel;
  createdAt: string;
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
  const searchParams = useSearchParams();
  const [queries, setQueries] = useState<QueryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<QueryStatus | "">(() => {
    const initialStatus = searchParams.get("status")?.toUpperCase();
    return initialStatus === "PENDING" || initialStatus === "COMPLETED"
      ? (initialStatus as QueryStatus)
      : "";
  });
  const [priorityFilter, setPriorityFilter] = useState<PriorityLevel | "">("");
  const [categoryFilter, setCategoryFilter] = useState<QueryCategory | "">("");
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
    const status = searchParams.get("status")?.toUpperCase();
    if (status === "PENDING" || status === "COMPLETED") {
      setStatusFilter(status as QueryStatus);
    } else {
      setStatusFilter("");
    }
  }, [searchParams]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (pageIndex > pageCount - 1) {
      setPageIndex(Math.max(pageCount - 1, 0));
    }
  }, [pageCount, pageIndex]);

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
        cell: (info) => (
          <span className="rbac-muted">{String(info.getValue() || "-")}</span>
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
          <div className="rbac-inline-actions flex gap-4">
            <Link href={`${basePath}/${row.original.id}`}>
              <button className="rbac-link" type="button">
                <FaEdit />
              </button>
            </Link>
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
    [basePath, handleDelete],
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
          <div className="flex justify-between items-center">
            <h3 className="rbac-title-lg">{title}</h3>
            <Link href={`${basePath}/new`}>
              <button className="rbac-button" type="button">
                {addLabel}
              </button>
            </Link>
          </div>

          <div className="my-4 flex flex-wrap gap-3">
            <input
              className="rbac-input-filter"
              type="text"
              placeholder="Search description or project"
              value={query}
              onChange={(event) => {
                setPageIndex(0);
                setQuery(event.target.value);
              }}
            />
            <select
              className="rbac-input-filter rbac-select"
              value={statusFilter}
              onChange={(event) => {
                setPageIndex(0);
                setStatusFilter(event.target.value as QueryStatus | "");
              }}
            >
              <option value="">All status</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <select
              className="rbac-input-filter rbac-select"
              value={priorityFilter}
              onChange={(event) => {
                setPageIndex(0);
                setPriorityFilter(event.target.value as PriorityLevel | "");
              }}
            >
              <option value="">Priority</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
            <select
              className="rbac-input-filter rbac-select"
              value={categoryFilter}
              onChange={(event) => {
                setPageIndex(0);
                setCategoryFilter(event.target.value as QueryCategory | "");
              }}
            >
              <option value="">Category</option>
              <option value="REMARKS">Remarks</option>
              <option value="DECISION_PENDING">Decision Pending</option>
              <option value="URGENCY">Urgency</option>
            </select>
            <button
              className="rbac-button rbac-button-secondary"
              type="button"
              onClick={() => {
                setPageIndex(0);
                setQuery("");
                setStatusFilter("");
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
              {!loading &&
                queries.map((item) => (
                  <div key={item.id} className="rbac-card p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase text-slate-500">
                          {categoryLabel(item.category)}
                        </p>
                        <h4 className="text-sm font-semibold">
                          {item.projectName || "-"}
                        </h4>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`${basePath}/${item.id}`}>
                          <button className="rbac-link" type="button">
                            <FaEdit />
                          </button>
                        </Link>
                        <button
                          className="rbac-link danger"
                          type="button"
                          onClick={() => handleDelete(item)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                    <div className="grid gap-1 text-sm">
                      <p>
                        <strong>Description:</strong> {item.description || "-"}
                      </p>
                      <p>
                        <strong>Status:</strong> {statusLabel(item.status)}
                      </p>
                      <p>
                        <strong>Priority:</strong>{" "}
                        {priorityLabel(item.priority)}
                      </p>
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
    </>
  );
}
