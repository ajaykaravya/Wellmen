"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { flexRender, useReactTable } from "@tanstack/react-table";
import { ColumnDef, getCoreRowModel } from "@tanstack/table-core";
import { formatToDDMMYYYY } from "@/lib/dateUtils";
import useDebounce from "@/app/hooks/useDebounce";
import DashboardShell, {
  useDashboardContext,
} from "../_components/DashboardShell";
import ConfirmDialog from "../../components/ConfirmDialog";
import { toast } from "react-toastify";
import { FaChevronLeft, FaChevronRight, FaEdit, FaTrash } from "react-icons/fa";
import Link from "next/link";

type ProjectStatus = "PENDING" | "IN_PROGRESS" | "DONE" | "ON_HOLD";

type ProjectRow = {
  id: string;
  name: string;
  address: string;
  contactNumber: string;
  email: string;
  startDate: string;
  endDate: string;
  description: string | null;
  status: ProjectStatus;
};

function ProjectListContent() {
  const { setNavOpen } = useDashboardContext();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<ProjectRow | null>(null);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pageIndex + 1),
        pageSize: String(pageSize),
      });

      if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
      if (statusFilter) params.set("status", statusFilter);
      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);

      const res = await fetch(`/api/projects?${params.toString()}`);
      if (!res.ok) return;

      const data = await res.json();
      setProjects(Array.isArray(data?.data) ? data.data : []);
      setTotal(typeof data?.total === "number" ? data.total : 0);
    } catch (error) {
      console.error("Failed to load projects", error);
    } finally {
      setLoading(false);
    }
  }, [fromDate, pageIndex, pageSize, debouncedQuery, statusFilter, toDate]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (pageIndex > pageCount - 1) {
      setPageIndex(Math.max(pageCount - 1, 0));
    }
  }, [pageCount, pageIndex]);

  const handleDeleteProject = useCallback((row: ProjectRow) => {
    setConfirmTarget(row);
    setConfirmOpen(true);
  }, []);

  const confirmDeleteProject = useCallback(async () => {
    if (!confirmTarget) return;
    try {
      const res = await fetch(`/api/projects/${confirmTarget.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error || "Failed to delete project.");
        return;
      }

      await loadProjects();
      toast.success("Project deleted successfully.");
    } catch (error) {
      console.error("Failed to delete project", error);
      toast.error("Failed to delete project.");
    } finally {
      setConfirmOpen(false);
      setConfirmTarget(null);
    }
  }, [confirmTarget, loadProjects]);

  const columns = useMemo<ColumnDef<ProjectRow>[]>(
    () => [
      {
        header: "Project",
        accessorKey: "name",
        cell: (info) => (
          <span className="rbac-muted">{String(info.getValue() || "")}</span>
        ),
      },
      {
        header: "Address",
        accessorKey: "address",
        size: 300,
        cell: (info) => (
          <span className="rbac-muted">{String(info.getValue() || "-")}</span>
        ),
      },
      {
        header: "Contact",
        accessorKey: "contactNumber",
      },
      {
        header: "Email",
        accessorKey: "email",
      },
      {
        header: "Start",
        accessorKey: "startDate",
        cell: (info) => {
          const value = String(info.getValue() || "");
          return value ? formatToDDMMYYYY(value) : "-";
        },
      },
      {
        header: "End",
        accessorKey: "endDate",
        cell: (info) => {
          const value = String(info.getValue() || "");
          return value ? formatToDDMMYYYY(value) : "-";
        },
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: (info) => (
          <span className="rbac-muted">
            {String(info.getValue() || "").replaceAll("_", " ")}
          </span>
        ),
      },
      {
        header: "Action",
        id: "action",
        cell: ({ row }) => (
          <div className="rbac-inline-actions flex gap-4">
            <Link href={`/dashboard/projects/${row.original.id}`}>
            <button
              className="rbac-link"
              type="button"
            >
                  <FaEdit />
            </button>
            </Link>
            <button
              className="rbac-link danger"
              type="button"
              onClick={() => handleDeleteProject(row.original)}
            >
                  <FaTrash />
            </button>
          </div>
        ),
      },
    ],
    [handleDeleteProject],
  );

  const table = useReactTable({
    data: projects,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount,
  });

  return (
    <>      <section className="rbac-section">
        <div className="rbac-card">
          <div className="flex justify-between item-center">

          <h3 className="rbac-title-lg">Projects List</h3>
          <Link href="/dashboard/projects/new">
          <button
          className="rbac-button"
          type="button"
        >
          Add Project
        </button>
        </Link>
</div>
          <div className="my-4 flex flex-wrap gap-2 ">
            <input
              className="rbac-input-filter"
              type="text"
              placeholder="Search name, address or description"
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
                setStatusFilter(event.target.value);
              }}
            >
              <option value="">All status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="DONE">Done</option>
              <option value="ON_HOLD">On hold</option>
            </select>
            <input
              className="rbac-input-filter"
              type="date"
              value={fromDate}
              onChange={(event) => {
                setPageIndex(0);
                setFromDate(event.target.value);
              }}
            />
            <input
              className="rbac-input-filter"
              type="date"
              value={toDate}
              onChange={(event) => {
                setPageIndex(0);
                setToDate(event.target.value);
              }}
            />
            <button
              className="rbac-button rbac-button-secondary"
              type="button"
              onClick={() => {
                setPageIndex(0);
                setQuery("");
                setStatusFilter("");
                setFromDate("");
                setToDate("");
              }}
            >
              Clear filters
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        style={{ width: header.getSize() }}
                        className="text-left text-xs font-semibold uppercase tracking-[0.2em]"
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
                      className="py-6 text-sm text-slate-500"
                    >
                      Loading projects...
                    </td>
                  </tr>
                )}
                {!loading && projects.length === 0 && (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="py-6 text-sm text-slate-500"
                    >
                      No projects found.
                    </td>
                  </tr>
                )}
                {!loading &&
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="bg-white">
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          style={{ width: cell.column.getSize() }}
                          className="py-4 text-sm"
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

          <div className="mt-4 flex flex-wrap items-center justify-end gap-3 text-sm">
           
            <div className="flex items-center gap-2">
              <div className="flex flex-wrap items-center gap-2">
              <button
                className="change-button change-button-secondary"
                type="button"
                onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}
                disabled={pageIndex === 0}
              >
                <FaChevronLeft size={20}/>
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
                <FaChevronRight size={20}/>
              </button>
              </div>
              <div>
              <select
                className="rbac-input rbac-select"
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
        title="Delete project?"
        description={
          confirmTarget
            ? `Delete "${confirmTarget.name}"? This action cannot be undone.`
            : "This action cannot be undone."
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDeleteProject}
        onClose={() => {
          setConfirmOpen(false);
          setConfirmTarget(null);
        }}
      />
    </>
  );
}

export default function ProjectsPage() {
  return (
    <DashboardShell requireAdmin>
      <ProjectListContent />
    </DashboardShell>
  );
}
