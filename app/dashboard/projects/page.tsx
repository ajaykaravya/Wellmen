"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { flexRender, useReactTable } from "@tanstack/react-table";
import { ColumnDef, getCoreRowModel } from "@tanstack/table-core";
import { formatToDDMMYYYY } from "@/lib/dateUtils";
import useDebounce from "@/app/hooks/useDebounce";
import DashboardShell from "../_components/DashboardShell";
import ConfirmDialog from "../../components/ConfirmDialog";
import CustomDatePicker from "../../components/CustomDatePicker";
import { toast } from "react-toastify";
import {
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaTrash,
  FaSpinner,
} from "react-icons/fa";
import Link from "next/link";

type ProjectStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD";

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
              <button className="rbac-link" type="button">
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
    <>
      {" "}
      <section className="rbac-section rbac-container">
        <div className="rbac-card">
          <div className="flex justify-between item-center">
            <h3 className="rbac-title-lg">Projects List</h3>
            <Link href="/dashboard/projects/new">
              <button className="rbac-button" type="button">
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
              <option value="COMPLETED">Completed</option>
              <option value="ON_HOLD">On hold</option>
            </select>
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

          <div className="mt-4">
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full border border-slate-200 border-separate border-spacing-0">
                <thead className="bg-slate-50">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          style={{ width: header.getSize() }}
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
                  {!loading && projects.length === 0 && (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-4 py-3 text-sm text-slate-500"
                      >
                        No projects found.
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
              {!loading && projects.length === 0 && (
                <div className="rbac-card py-4 text-sm text-slate-500">
                  No projects found.
                </div>
              )}
              {!loading &&
                projects.map((project) => (
                  <div key={project.id} className="rbac-card p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold">
                          {project.name}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {project.address}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/dashboard/projects/${project.id}`}>
                          <button className="rbac-link" type="button">
                            <FaEdit />
                          </button>
                        </Link>
                        <button
                          className="rbac-link danger"
                          type="button"
                          onClick={() => handleDeleteProject(project)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                    <div className="grid gap-1 text-sm">
                      <p>
                        <strong>Contact:</strong> {project.contactNumber}
                      </p>
                      <p>
                        <strong>Email:</strong> {project.email}
                      </p>
                      <p>
                        <strong>Start:</strong>{" "}
                        {project.startDate
                          ? formatToDDMMYYYY(project.startDate)
                          : "-"}
                      </p>
                      <p>
                        <strong>End:</strong>{" "}
                        {project.endDate
                          ? formatToDDMMYYYY(project.endDate)
                          : "-"}
                      </p>
                      <p>
                        <strong>Status:</strong>{" "}
                        {project.status.replaceAll("_", " ")}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
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
