"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { flexRender, useReactTable } from "@tanstack/react-table";
import { ColumnDef, getCoreRowModel } from "@tanstack/table-core";
import DashboardShell, {
  useDashboardContext,
} from "../_components/DashboardShell";
import ConfirmDialog from "../../components/ConfirmDialog";
import { toast } from "react-toastify";

type ReportStatus = "TODO" | "IN_PROGRESS" | "DONE" | "ON_HOLD";

type ProjectOption = {
  id: string;
  name: string;
  status: string;
};

type UserOption = {
  id: string;
  firstName: string;
  lastName: string;
  role?: string | null;
};

type ReportRow = {
  id: string;
  reportDate: string;
  projectId: string;
  projectName: string;
  title: string;
  description: string;
  status: ReportStatus;
  imageUrls: string[];
  videoUrl: string | null;
  createdById: string | null;
  createdByName: string;
  canManage: boolean;
};

function ReportingListContent() {
  const router = useRouter();
  const { setNavOpen, isAdmin } = useDashboardContext();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [employees, setEmployees] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<ReportRow | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewData, setViewData] = useState<ReportRow | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects/options");
      if (!res.ok) return;
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load project options", error);
    }
  }, []);

  const loadEmployees = useCallback(async () => {
    if (!isAdmin) return;

    try {
      const res = await fetch("/api/users/options");
      if (!res.ok) return;
      const data = await res.json();
      const rows = Array.isArray(data) ? data : [];
      setEmployees(rows);
    } catch (error) {
      console.error("Failed to load employees", error);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadProjects();
    loadEmployees();
  }, [loadEmployees, loadProjects]);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pageIndex + 1),
        pageSize: String(pageSize),
      });

      if (query.trim()) params.set("q", query.trim());
      if (projectFilter) params.set("projectId", projectFilter);
      if (isAdmin && employeeFilter) params.set("employeeId", employeeFilter);
      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);

      const res = await fetch(`/api/reports?${params.toString()}`);
      if (!res.ok) return;

      const data = await res.json();
      setReports(Array.isArray(data?.data) ? data.data : []);
      setTotal(typeof data?.total === "number" ? data.total : 0);
    } catch (error) {
      console.error("Failed to load reports", error);
    } finally {
      setLoading(false);
    }
  }, [employeeFilter, fromDate, isAdmin, pageIndex, pageSize, projectFilter, query, toDate]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (pageIndex > pageCount - 1) {
      setPageIndex(Math.max(pageCount - 1, 0));
    }
  }, [pageCount, pageIndex]);

  const handleView = useCallback(async (row: ReportRow) => {
    setViewOpen(true);
    setViewLoading(true);
    setViewData(null);

    try {
      const res = await fetch(`/api/reports/${row.id}`);
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error || "Failed to load report details.");
        setViewOpen(false);
        return;
      }

      const data = await res.json();
      setViewData(data);
    } catch (error) {
      console.error("Failed to load report details", error);
      toast.error("Failed to load report details.");
      setViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  }, []);

  const handleEdit = useCallback(
    (row: ReportRow) => {
      if (!row.canManage) return;
      router.push(`/dashboard/reports/${row.id}`);
    },
    [router],
  );

  const handleDelete = useCallback((row: ReportRow) => {
    if (!row.canManage) {
      toast.error("You can only delete reporting created by you.");
      return;
    }

    setConfirmTarget(row);
    setConfirmOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!confirmTarget) return;

    try {
      const res = await fetch(`/api/reports/${confirmTarget.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error || "Failed to delete reporting.");
        return;
      }

      await loadReports();
      toast.success("Reporting deleted successfully.");
    } catch (error) {
      console.error("Failed to delete reporting", error);
      toast.error("Failed to delete reporting.");
    } finally {
      setConfirmOpen(false);
      setConfirmTarget(null);
    }
  }, [confirmTarget, loadReports]);

  const columns = useMemo<ColumnDef<ReportRow>[]>(
    () => [
      {
        header: "Date",
        accessorKey: "reportDate",
        cell: (info) => {
          const value = String(info.getValue() || "");
          return value ? new Date(value).toLocaleDateString() : "-";
        },
      },
      ...(isAdmin
        ? [
            {
              header: "Employee",
              accessorKey: "createdByName",
              cell: (info) => (
                <span className="rbac-name">{String(info.getValue() || "-")}</span>
              ),
            } as ColumnDef<ReportRow>,
          ]
        : []),
      {
        header: "Project Name",
        accessorKey: "projectName",
        size: 200,
        cell: (info) => (
          <span className="rbac-name">{String(info.getValue() || "-")}</span>
        ),
      },
      {
        header: "Title",
        accessorKey: "title",
        size: 300,
        cell: (info) => (
          <span className="rbac-name">{String(info.getValue() || "-")}</span>
        ),
      },
      {
        header: "Description",
        accessorKey: "description",
        size: 500,
        cell: (info) => (
          <span className="rbac-muted">{String(info.getValue() || "-")}</span>
        ),
      },
      {
        header: "Action",
        id: "action",
        cell: ({ row }) => {
          const canManage = !!row.original.canManage;
          return (
            <div className="rbac-inline-actions flex gap-4">
              <button
                className="rbac-link"
                type="button"
                onClick={() => handleView(row.original)}
              >
                View
              </button>
              {canManage && (
                <>
                  <button
                    className="rbac-link"
                    type="button"
                    onClick={() => handleEdit(row.original)}
                  >
                    Edit
                  </button>
                  <button
                    className="rbac-link danger"
                    type="button"
                    onClick={() => handleDelete(row.original)}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [handleDelete, handleEdit, handleView, isAdmin],
  );

  const table = useReactTable({
    data: reports,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount,
  });

  return (
    <>
      <header className="rbac-header">
        <div>
          <button
            className="rbac-hamburger"
            type="button"
            onClick={() => setNavOpen(true)}
          >
            <span />
          </button>
          <p className="rbac-eyebrow">Reporting</p>
          <h1 className="rbac-heading">Reporting list</h1>
          <p className="rbac-subtext">Track reporting with filters and actions.</p>
        </div>
        {!isAdmin && (
          <button
            className="rbac-button"
            type="button"
            onClick={() => router.push("/dashboard/reports/new")}
          >
            Add Reporting
          </button>
        )}
      </header>

      <section className="rbac-section">
        <div className="rbac-card">
          <h3 className="rbac-title-lg">All reporting</h3>

          <div className={`mt-4 grid gap-3 md:grid-cols-2 ${isAdmin ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>

            <input
              className="rbac-input"
              type="text"
              placeholder="Search title, description"
              value={query}
              onChange={(event) => {
                setPageIndex(0);
                setQuery(event.target.value);
              }}
            />

            <select
              className="rbac-input rbac-select"
              value={projectFilter}
              onChange={(event) => {
                setPageIndex(0);
                setProjectFilter(event.target.value);
              }}
            >
              <option value="">All projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>

            {isAdmin && (
              <select
                className="rbac-input rbac-select"
                value={employeeFilter}
                onChange={(event) => {
                  setPageIndex(0);
                  setEmployeeFilter(event.target.value);
                }}
              >
                <option value="">All employees</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName}
                  </option>
                ))}
              </select>
            )}

            <input
              className="rbac-input"
              type="date"
              value={fromDate}
              onChange={(event) => {
                setPageIndex(0);
                setFromDate(event.target.value);
              }}
            />
            <input
              className="rbac-input"
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
                setProjectFilter("");
                setEmployeeFilter("");
                setFromDate("");
                setToDate("");
                setQuery("");
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
                        className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
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
                    <td colSpan={columns.length} className="py-6 text-sm text-slate-500">
                      Loading reporting...
                    </td>
                  </tr>
                )}
                {!loading && reports.length === 0 && (
                  <tr>
                    <td colSpan={columns.length} className="py-6 text-sm text-slate-500">
                      No reporting found.
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
                          className="py-4 text-sm text-slate-700"
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

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
            <span>
              Page {pageIndex + 1} of {pageCount}
            </span>
            <div className="flex items-center gap-2">
              <button
                className="rbac-button rbac-button-secondary"
                type="button"
                onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}
                disabled={pageIndex === 0}
              >
                Previous
              </button>
              <button
                className="rbac-button rbac-button-secondary"
                type="button"
                onClick={() =>
                  setPageIndex((prev) => Math.min(prev + 1, pageCount - 1))
                }
                disabled={pageIndex + 1 >= pageCount}
              >
                Next
              </button>
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
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete reporting?"
        description={
          confirmTarget
            ? `Delete "${confirmTarget.title}"? This action cannot be undone.`
            : "This action cannot be undone."
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        onClose={() => {
          setConfirmOpen(false);
          setConfirmTarget(null);
        }}
      />

      {viewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Report details</h2>
                <p className="mt-1 text-sm text-slate-600">
                  View full report with media and download options.
                </p>
              </div>
              <button
                className="rbac-button rbac-button-secondary"
                type="button"
                onClick={() => {
                  setViewOpen(false);
                  setViewData(null);
                }}
              >
                Close
              </button>
            </div>

            {viewLoading && <p className="mt-4 text-sm text-slate-500">Loading details...</p>}

            {!viewLoading && viewData && (
              <div className="mt-4 grid gap-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <p className="text-sm text-slate-700"><strong>Date:</strong> {new Date(viewData.reportDate).toLocaleDateString()}</p>
                  <p className="text-sm text-slate-700"><strong>Project:</strong> {viewData.projectName}</p>
                  <p className="text-sm text-slate-700"><strong>Employee:</strong> {viewData.createdByName || "-"}</p>
                  <p className="text-sm text-slate-700"><strong>Status:</strong> {String(viewData.status || "").replaceAll("_", " ")}</p>
                </div>

                <p className="text-sm text-slate-700"><strong>Title:</strong> {viewData.title}</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap"><strong>Description:</strong> {viewData.description}</p>

                <div>
                  <p className="text-sm font-semibold text-slate-800">Images</p>
                  {viewData.imageUrls?.length ? (
                    <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {viewData.imageUrls.map((url) => (
                        <div key={url} className="rounded-xl border border-slate-200 p-2">
                          <Image
                            src={url}
                            alt="Report"
                            width={640}
                            height={320}
                            unoptimized
                            className="h-40 w-full rounded-lg object-cover"
                          />
                          <a className="rbac-link mt-2 inline-block" href={url} download>
                            Download image
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-slate-500">No images uploaded.</p>
                  )}
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-800">Video</p>
                  {viewData.videoUrl ? (
                    <div className="mt-2 rounded-xl border border-slate-200 p-3">
                      <video controls className="w-full rounded-lg" src={viewData.videoUrl} />
                      <a className="rbac-link mt-2 inline-block" href={viewData.videoUrl} download>
                        Download video
                      </a>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-slate-500">No video uploaded.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function ReportingPage() {
  return (
    <DashboardShell>
      <ReportingListContent />
    </DashboardShell>
  );
}
