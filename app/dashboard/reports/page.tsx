"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { flexRender, useReactTable } from "@tanstack/react-table";
import { ColumnDef, getCoreRowModel } from "@tanstack/table-core";
import { formatToDDMMYYYY } from "@/lib/dateUtils";
import useDebounce from "@/app/hooks/useDebounce";
import DashboardShell, {
  useDashboardContext,
} from "../_components/DashboardShell";
import ConfirmDialog from "../../components/ConfirmDialog";
import CustomDatePicker from "../../components/CustomDatePicker";
import { toast } from "react-toastify";
import {
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaEye,
  FaSpinner,
  FaTrash,
} from "react-icons/fa";
import Link from "next/link";

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
  categoryId: string | null;
  categoryName: string;
  description: string;
  imageUrls: string[];
  videoUrl: string | null;
  videoUrls?: string[];
  createdById: string | null;
  createdByName: string;
  canManage: boolean;
};

function ReportingListContent() {
  const router = useRouter();
  const { isAdmin } = useDashboardContext();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [employees, setEmployees] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const [projectFilter, setProjectFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<ReportRow | null>(null);
  const [deleting, setDeleting] = useState(false);
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

      if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
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
  }, [
    employeeFilter,
    fromDate,
    isAdmin,
    pageIndex,
    pageSize,
    projectFilter,
    debouncedQuery,
    toDate,
  ]);

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
    setDeleting(true);

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
      setDeleting(false);
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
          return value ? formatToDDMMYYYY(value) : "-";
        },
      },
      ...(isAdmin
        ? [
            {
              header: "Employee",
              accessorKey: "createdByName",
              cell: (info) => (
                <span className="rbac-muted">
                  {String(info.getValue() || "-")}
                </span>
              ),
            } as ColumnDef<ReportRow>,
          ]
        : []),
      {
        header: "Project Name",
        accessorKey: "projectName",
        size: 200,
        cell: (info) => (
          <span className="rbac-muted">{String(info.getValue() || "-")}</span>
        ),
      },
      {
        header: "Reporting Category",
        accessorKey: "categoryName",
        size: 300,
        cell: (info) => (
          <span className="rbac-muted">{String(info.getValue() || "-")}</span>
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
                <FaEye />
              </button>
              {canManage && (
                <>
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
      <section className="rbac-section rbac-container">
        <div className="rbac-card">
          <div className="flex justify-between items-center">
            <h3 className="rbac-title-lg">Reporting List</h3>
            {!isAdmin && (
              <Link href="/dashboard/reports/new">
                <button className="rbac-button" type="button">
                  Add Reporting
                </button>
              </Link>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <input
              className="rbac-input-filter"
              type="text"
              placeholder="Search category, description"
              value={query}
              onChange={(event) => {
                setPageIndex(0);
                setQuery(event.target.value);
              }}
            />

            <select
              className="rbac-input-filter rbac-select"
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
                className="rbac-input-filter rbac-select"
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
                  {!loading && reports.length === 0 && (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-4 py-3 text-sm text-slate-500"
                      >
                        No reporting found.
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
              {!loading && reports.length === 0 && (
                <div className="rbac-card py-4 text-sm text-slate-500">
                  No reporting found.
                </div>
              )}
              {!loading &&
                reports.map((report) => (
                  <div key={report.id} className="rbac-card p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold">
                          {report.categoryName}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {report.projectName} •{" "}
                          {formatToDDMMYYYY(report.reportDate)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="rbac-link"
                          type="button"
                          onClick={() => handleView(report)}
                        >
                          <FaEye />
                        </button>
                        {report.canManage && (
                          <>
                            <button
                              className="rbac-link"
                              type="button"
                              onClick={() => handleEdit(report)}
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="rbac-link danger"
                              type="button"
                              onClick={() => handleDelete(report)}
                            >
                              <FaTrash />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="grid gap-1 text-sm">
                      {isAdmin && (
                        <p>
                          <strong>Employee:</strong>{" "}
                          {report.createdByName || "-"}
                        </p>
                      )}
                      <p>
                        <strong>Description:</strong>{" "}
                        {report.description || "-"}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-end gap-3 text-sm ">
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
        title="Delete reporting?"
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

      {viewOpen && (
        <div className="theme-modal-overlay fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="theme-modal-surface w-full max-w-4xl rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold ">Report details</h2>
                <p className="mt-1 text-sm ">
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

            {viewLoading && (
              <div className="flex items-center justify-center py-4">
                <FaSpinner className="animate-spin mr-2" size={16} />
              </div>
            )}

            {!viewLoading && viewData && (
              <div className="mt-4 grid gap-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <p className="text-sm ">
                    <strong>Date:</strong>{" "}
                    {formatToDDMMYYYY(viewData.reportDate)}
                  </p>
                  <p className="text-sm ">
                    <strong>Project:</strong> {viewData.projectName}
                  </p>
                  <p className="text-sm ">
                    <strong>Employee:</strong> {viewData.createdByName || "-"}
                  </p>
                  <p className="text-sm ">
                    <strong>Reporting Category:</strong>{" "}
                    {viewData.categoryName || "-"}
                  </p>
                </div>

                <p className="text-sm  whitespace-pre-wrap">
                  <strong>Description:</strong> {viewData.description}
                </p>

                <div>
                  {viewData.imageUrls?.length > 0 && (
                    <>
                      <p className="text-sm font-semibold ">Images</p>
                      <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {viewData.imageUrls.map((url) => (
                          <div
                            key={url}
                            className="rounded-xl border p-2"
                            style={{ borderColor: "var(--theme-border)" }}
                          >
                            <Image
                              src={url}
                              alt="Report"
                              width={640}
                              height={320}
                              unoptimized
                              className="h-40 w-full rounded-lg object-cover"
                            />
                            <a
                              className="rbac-link mt-2 inline-block"
                              href={url}
                              download
                            >
                              Download image
                            </a>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div>
                  {(
                    (viewData.videoUrls && viewData.videoUrls.length > 0
                      ? viewData.videoUrls
                      : viewData.videoUrl
                        ? [viewData.videoUrl]
                        : []
                    ).length > 0
                  ) && (
                    <>
                      <p className="text-sm font-semibold ">Video</p>
                      <div
                        className="mt-2 rounded-xl border p-3"
                        style={{ borderColor: "var(--theme-border)" }}
                      >
                        <div className="grid gap-3">
                          {(
                            viewData.videoUrls?.length
                              ? viewData.videoUrls
                              : viewData.videoUrl
                                ? [viewData.videoUrl]
                                : []
                          ).map((url) => (
                            <div key={url}>
                              <video
                                controls
                                className="w-full rounded-lg"
                                src={url}
                              />
                              <a
                                className="rbac-link mt-2 inline-block"
                                href={url}
                                download
                              >
                                Download video
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
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
