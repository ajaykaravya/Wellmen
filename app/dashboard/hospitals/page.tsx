"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { flexRender, useReactTable } from "@tanstack/react-table";
import { ColumnDef, getCoreRowModel } from "@tanstack/table-core";
import { formatToDDMMYYYY } from "@/lib/dateUtils";
import useDebounce from "@/app/hooks/useDebounce";
import DashboardShell from "../_components/DashboardShell";
import AppliedFilterSummary from "../../components/AppliedFilterSummary";
import ConfirmDialog from "../../components/ConfirmDialog";
import CustomDatePicker from "../../components/CustomDatePicker";
import ListingFilterDialog from "../../components/ListingFilterDialog";
import { toast } from "react-toastify";
import {
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaTrash,
  FaSpinner,
  FaFilter,
  FaEye,
} from "react-icons/fa";
import { IoIosClose } from "react-icons/io";
import Link from "next/link";

type ProjectRow = {
  id: string;
  name: string;
  address: string;
  contactNumber: string;
  email: string;
  startDate: string;
  endDate: string;
  description: string | null;
  city: string | null;
  status: string;
};

function ProjectListContent() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const [cityFilter, setCityFilter] = useState("");
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftQuery, setDraftQuery] = useState("");
  const [draftCityFilter, setDraftCityFilter] = useState("");
  const [draftFromDate, setDraftFromDate] = useState("");
  const [draftToDate, setDraftToDate] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<ProjectRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState<ProjectRow | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pageIndex + 1),
        pageSize: String(pageSize),
      });

      if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
      if (cityFilter) params.set("city", cityFilter);
      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);

      const res = await fetch(`/api/projects?${params.toString()}`);
      if (!res.ok) return;

      const data = await res.json();
      setProjects(Array.isArray(data?.data) ? data.data : []);
      const completed = Array.isArray(data?.data)
        ? data.data.filter(
            (project: ProjectRow) => project.status === "COMPLETED",
          )
        : [];

      setProjects(completed);

      const completedCities = [
        ...new Set(
          completed.map((project: ProjectRow) => project.city).filter(Boolean),
        ),
      ] as string[];

      setCityOptions(completedCities);
      setTotal(typeof data?.total === "number" ? data.total : 0);
    } catch (error) {
      console.error("Failed to load projects", error);
    } finally {
      setLoading(false);
    }
  }, [cityFilter, fromDate, pageIndex, pageSize, debouncedQuery, toDate]);

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

  const activeFilterCount = [query.trim(), cityFilter, fromDate, toDate].filter(Boolean).length;

  const openFilters = useCallback(() => {
    setDraftQuery(query);
    setDraftCityFilter(cityFilter);
    setDraftFromDate(fromDate);
    setDraftToDate(toDate);
    setFilterOpen(true);
  }, [cityFilter, fromDate, query, toDate]);

  const closeFilters = useCallback(() => {
    setFilterOpen(false);
  }, []);

  const applyFilters = useCallback(() => {
    setPageIndex(0);
    setQuery(draftQuery);
    setCityFilter(draftCityFilter);
    setFromDate(draftFromDate);
    setToDate(draftToDate);
    setFilterOpen(false);
  }, [draftCityFilter, draftFromDate, draftQuery, draftToDate]);

  const appliedFilters = [
    query.trim(),
    cityFilter,
    fromDate,
    toDate,
  ].filter(Boolean);

  const handleView = useCallback(async (row: ProjectRow) => {
    setViewOpen(true);
    setViewLoading(true);
    setViewData(null);

    try {
      const res = await fetch(`/api/projects/${row.id}`);
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error || "Failed to load project details.");
        setViewOpen(false);
        return;
      }

      const data = await res.json();
      setViewData(data);
    } catch (error) {
      console.error("Failed to load project details", error);
      toast.error("Failed to load project details.");
      setViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  }, []);

  const closeView = useCallback(() => {
    setViewOpen(false);
    setViewData(null);
  }, []);

  const confirmDeleteProject = useCallback(async () => {
    if (!confirmTarget) return;
    setDeleting(true);
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
      setDeleting(false);
      setConfirmOpen(false);
      setConfirmTarget(null);
    }
  }, [confirmTarget, loadProjects]);

  const columns = useMemo<ColumnDef<ProjectRow>[]>(
    () => [
      {
        header: "Hospitals",
        accessorKey: "name",
        cell: (info) => (
          <span className="rbac-muted">{String(info.getValue() || "")}</span>
        ),
      },
      {
        header: "City",
        accessorKey: "city",
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
        header: "Action",
        id: "action",
        cell: ({ row }) => (
          <div className="rbac-inline-actions flex gap-4">
            <button
              className="rbac-link"
              type="button"
              onClick={() => handleView(row.original)}
            >
              <FaEye />
            </button>
            <Link href={`/dashboard/hospitals/${row.original.id}`}>
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

  const completedProjects = projects.filter((project) => {
    return project.status === "COMPLETED";
  });

  const table = useReactTable({
    data: completedProjects,
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
          <div className="flex items-center justify-between gap-3">
            <h3 className="rbac-title-lg">Hospitals</h3>
            <div className="flex
             gap-2">
              <button
                className="rbac-button rbac-button-secondary theme-button-secondary inline-flex items-center gap-2"
                type="button"
                onClick={openFilters}
              >
                <FaFilter />
                <span>Filters</span>
              </button>
              <Link href="/dashboard/users/new">
                <button className="rbac-button" type="button">
                  Add User
                </button>
              </Link>
            </div>
          </div>
          <AppliedFilterSummary
            items={appliedFilters}
            onClear={() => {
              setPageIndex(0);
              setQuery("");
              setCityFilter("");
              setFromDate("");
              setToDate("");
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
                  {!loading && completedProjects.length === 0 && (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-4 py-3 text-sm text-slate-500"
                      >
                        No completed projects found.
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
              {!loading && completedProjects.length === 0 && (
                <div className="rbac-card py-4 text-sm text-slate-500">
                  No completed projects found.
                </div>
              )}
              {!loading &&
                completedProjects.map((project) => (
                  <div key={project.id} className="rbac-card p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold">
                          {project.name}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {project.city || "-"}
                        </p>
                      </div>
                      <div className="flex">
                        <button
                          className="rbac-link"
                          type="button"
                          onClick={() => handleView(project)}
                        >
                          <FaEye size={18} />
                        </button>
                        <Link href={`/dashboard/projects/${project.id}`}>
                          <button className="rbac-link" type="button">
                            <FaEdit size={18} />
                          </button>
                        </Link>
                        <button
                        style={{padding:"2px"}}
                          className="rbac-link danger"
                          type="button"
                          onClick={() => handleDeleteProject(project)}
                        >
                          <FaTrash size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="grid gap-1 text-sm">
                      {
                        project.contactNumber && (
                          <p>
                        <strong>Contact:</strong> {project.contactNumber}
                      </p>
                        )
                      }
                      {
                        project.email && (
                          <p>
                            <strong>Email:</strong> {project.email}
                          </p>
                        )
                      }
                      {
                        project.startDate && (
                          <p>
                        <strong>Start:</strong>{" "}
                        {project.startDate
                          ? formatToDDMMYYYY(project.startDate)
                          : ""}
                      </p>
                        )
                        }
                      {
                        project.endDate && (
                          <p>
                        <strong>End:</strong>{" "}
                        {project.endDate
                          ? formatToDDMMYYYY(project.endDate)
                          : ""}
                      </p>
                        )
                        }
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
        title="Delete project?"
        description="Are you sure you want to delete?"
        confirmLabel="Delete"
        confirmLoading={deleting}
        confirmLoadingLabel="Deleting..."
        cancelLabel="Cancel"
        onConfirm={confirmDeleteProject}
        onClose={() => {
          setConfirmOpen(false);
          setConfirmTarget(null);
        }}
      />
      <ListingFilterDialog
        open={filterOpen}
        title="Hospital Filters"
        description="Update the filters and apply them when you're ready."
        onClose={closeFilters}
        onApply={applyFilters}
        activeCount={activeFilterCount}
      >
        <input
          className="rbac-input-filter"
          type="text"
          placeholder="Search name, city or contact..."
          value={draftQuery}
          onChange={(event) => setDraftQuery(event.target.value)}
        />
        <select
          className="rbac-input-filter rbac-select"
          value={draftCityFilter}
          onChange={(event) => setDraftCityFilter(event.target.value)}
        >
          <option value="">All cities</option>
          {cityOptions.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
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
      </ListingFilterDialog>

      {viewOpen && (
        <div className="theme-modal-overlay fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="theme-modal-surface w-full max-w-4xl rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Hospital details</h2>
                <p className="mt-1 text-sm">View full hospital information.</p>
              </div>
              <button type="button" onClick={closeView}>
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
                    <strong>Name:</strong> {viewData.name}
                  </p>
                  <p className="text-sm">
                    <strong>City:</strong> {viewData.city || "-"}
                  </p>
                  <p className="text-sm">
                    <strong>Contact:</strong> {viewData.contactNumber || "-"}
                  </p>
                  <p className="text-sm">
                    <strong>Email:</strong> {viewData.email || "-"}
                  </p>
                  <p className="text-sm">
                    <strong>Start Date:</strong> {formatToDDMMYYYY(viewData.startDate)}
                  </p>
                  <p className="text-sm">
                    <strong>End Date:</strong> {formatToDDMMYYYY(viewData.endDate)}
                  </p>
                  <p className="text-sm">
                    <strong>Status:</strong> {viewData.status}
                  </p>
                </div>

                {viewData.address && (
                  <p className="text-sm whitespace-pre-wrap">
                    <strong>Address:</strong> {viewData.address}
                  </p>
                )}

                {viewData.description && (
                  <p className="text-sm whitespace-pre-wrap">
                    <strong>Description:</strong> {viewData.description}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
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
