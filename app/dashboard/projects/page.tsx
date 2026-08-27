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
import { projectsApi } from "@/lib/api/dashboard/projects";
import {
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaTrash,
  FaSpinner,
  FaFilter,
  FaEye,
  FaDraftingCompass
} from "react-icons/fa";
import { IoDocumentTextOutline } from "react-icons/io5";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Listbox } from "@headlessui/react";
import { FaCheck, FaChevronDown } from "react-icons/fa";

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
  city: string | null;
};

function ProjectListContent() {
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const [statusFilter, setStatusFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftQuery, setDraftQuery] = useState("");
  const [draftStatusFilter, setDraftStatusFilter] = useState("");
  const [draftCityFilter, setDraftCityFilter] = useState("");
  const [draftFromDate, setDraftFromDate] = useState("");
  const [draftToDate, setDraftToDate] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<ProjectRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await projectsApi.list({
        page: pageIndex + 1,
        pageSize,
        q: debouncedQuery.trim() || undefined,
        city: cityFilter || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      setProjects(Array.isArray(data?.data) ? data.data : []);
      setTotal(typeof data?.total === "number" ? data.total : 0);
    } catch (error) {
      console.error("Failed to load projects", error);
    } finally {
      setLoading(false);
    }
  }, [cityFilter, fromDate, pageIndex, pageSize, debouncedQuery, toDate]);

  const loadCityOptions = useCallback(async () => {
    try {
      const pageSizeForCities = 100;
      let currentPage = 1;
      let totalPages = 1;
      const citiesByKey = new Map<string, string>();

      while (currentPage <= totalPages) {
        const data = await projectsApi.list({
          page: currentPage,
          pageSize: pageSizeForCities,
        });
        totalPages =
          typeof data?.totalPages === "number" && data.totalPages > 0
            ? data.totalPages
            : 1;

        const rows = Array.isArray(data?.data) ? data.data : [];
        rows.forEach((project: ProjectRow) => {
          const city = String(project.city || "").trim();
          if (!city || project.status === "COMPLETED") return;

          const key = city.toLowerCase();
          if (!citiesByKey.has(key)) {
            citiesByKey.set(key, city);
          }
        });

        currentPage += 1;
      }

      setCityOptions(
        Array.from(citiesByKey.values()).sort((a, b) => a.localeCompare(b)),
      );
    } catch (error) {
      console.error("Failed to load city options", error);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    loadCityOptions();
  }, [loadCityOptions]);

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

  const handleEditProject = useCallback((row: ProjectRow) => {
    router.push(`/dashboard/projects/${row.id}`)
  }, [router])

  const handleProjectForm = useCallback((row:ProjectRow) => {
    router.push(`/dashboard/projects/forms?projectId=${row.id}`)
  }, [])

  const handleProjectDrawings = useCallback((row: ProjectRow) => {
    router.push(`/dashboard/projects/${row.id}/drawings`)
  }, [router])

  const handleView = useCallback((row: ProjectRow) => {
    router.push(`/dashboard/projects/${row.id}/view`)
  }, [router]);

  const confirmDeleteProject = useCallback(async () => {
    if (!confirmTarget) return;
    setDeleting(true);
    try {
      await projectsApi.remove(confirmTarget.id);
      await loadProjects();
      await loadCityOptions();
      toast.success("Project deleted successfully.");
    } catch (error) {
      console.error("Failed to delete project", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete project.",
      );
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setConfirmTarget(null);
    }
  }, [confirmTarget, loadCityOptions, loadProjects]);

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
        cell: (info) => (
          <span className="rbac-muted">{String(info.getValue() || "-")}</span>
        ),
      },
      {
        header: "Start Date",
        accessorKey: "startDate",
        cell: (info) => {
          const value = String(info.getValue() || "");
          return value ? formatToDDMMYYYY(value) : "-";
        },
      },
      {
        header: "End Date",
        accessorKey: "endDate",
        cell: (info) => {
          const value = String(info.getValue() || "");
          return value ? formatToDDMMYYYY(value) : "-";
        },
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
            <button onClick={() => handleEditProject(row.original)} className="rbac-link" type="button">
              <FaEdit />
            </button>
            <button
              className="rbac-link danger"
              type="button"
              onClick={() => handleDeleteProject(row.original)}
            >
              <FaTrash />
            </button>
            <button className="rbac-link" type="button" onClick={() => handleProjectForm(row.original)}>
              <IoDocumentTextOutline />
            </button>
            <button
              className="rbac-link"
              type="button"
              title="Drawings"
              onClick={() => handleProjectDrawings(row.original)}
            >
              <FaDraftingCompass />
            </button>
          </div>
        ),
      },
    ],
    [handleDeleteProject, handleEditProject, handleView, handleProjectDrawings],
  );

  const visibleProjects = useMemo(
    () =>
      projects.filter(
        (project) =>
          project.status !== "COMPLETED" &&
          (!statusFilter || project.status === statusFilter),
      ),
    [projects, statusFilter],
  );

  const table = useReactTable({
    data: visibleProjects,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount,
  });

  const statusLabel = (value: ProjectStatus | string) => {
    switch (value) {
      case "PENDING":
        return "Pending";
      case "IN_PROGRESS":
        return "In Progress";
      case "ON_HOLD":
        return "On Hold";
      case "COMPLETED":
        return "Completed";
      default:
        return value.replaceAll("_", " ");
    }
  };

  const appliedFilters = [
    query.trim(),
    statusFilter ? statusLabel(statusFilter) : "",
    cityFilter,
    fromDate,
    toDate,
  ].filter(Boolean);

  const openFilters = useCallback(() => {
    setDraftQuery(query);
    setDraftStatusFilter(statusFilter);
    setDraftCityFilter(cityFilter);
    setDraftFromDate(fromDate);
    setDraftToDate(toDate);
    setFilterOpen(true);
  }, [cityFilter, fromDate, query, statusFilter, toDate]);

  const closeFilters = useCallback(() => {
    setFilterOpen(false);
  }, []);

  const applyFilters = useCallback(() => {
    setPageIndex(0);
    setQuery(draftQuery);
    setStatusFilter(draftStatusFilter);
    setCityFilter(draftCityFilter);
    setFromDate(draftFromDate);
    setToDate(draftToDate);
    setFilterOpen(false);
  }, [
    draftCityFilter,
    draftFromDate,
    draftQuery,
    draftStatusFilter,
    draftToDate,
  ]);

  return (
    <>
      {" "}
      <section className="rbac-section rbac-container">
        <div className="rbac-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="rbac-title-lg">Projects List</h3>
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
              <Link href="/dashboard/projects/new">
                <button className="rbac-button" type="button">
                  Add Project
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
                  {!loading && visibleProjects.length === 0 && (
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
              {!loading && visibleProjects.length === 0 && (
                <div className="rbac-card py-4 text-sm text-slate-500">
                  No projects found.
                </div>
              )}
              {!loading &&
                visibleProjects.map((project) => (
                  <div key={project.id} className="rbac-card p-4">
                    <div className="flex items-center justify-between">
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
                          style={{ padding: "2px" }}
                          className="rbac-link"
                          type="button"
                          onClick={() => handleView(project)}
                        >
                          <FaEye size={18} />
                        </button>
                        <button className="rbac-link" type="button" onClick={() => handleEditProject(project)}>
                          <FaEdit size={18} />
                        </button>
                        <button
                          style={{ padding: "2px" }}
                          className="rbac-link danger"
                          type="button"
                          onClick={() => handleDeleteProject(project)}
                        >
                          <FaTrash size={18} />
                        </button>
                        <button className="rbac-link" type="button" onClick={() => handleProjectForm(project)}>
                          <IoDocumentTextOutline  size={18}/>
                        </button>
                        <button
                          className="rbac-link"
                          type="button"
                          title="Drawings"
                          onClick={() => handleProjectDrawings(project)}
                        >
                          <FaDraftingCompass size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="grid gap-1 text-sm">
                      {project.contactNumber && (
                        <p>
                          <strong>Contact:</strong> {project.contactNumber}
                        </p>
                      )}
                      {project.email && (
                        <p>
                          <strong>Email:</strong> {project.email}
                        </p>
                      )}
                      {project.startDate && (
                        <p>
                          <strong>Start Date:</strong>{" "}
                          {formatToDDMMYYYY(project.startDate)}
                        </p>
                      )}
                      {project.endDate && (
                        <p>
                          <strong>End Date:</strong>{" "}
                          {formatToDDMMYYYY(project.endDate)}
                        </p>
                      )}
                      {project.status && (
                        <p>
                          <strong>Status:</strong> {statusLabel(project.status)}
                        </p>
                      )}
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
        title="Project Filters"
        description="Update the filters and apply them when you're ready."
        onClose={closeFilters}
        onApply={applyFilters}
      >
        <input
          className="rbac-input-filter"
          type="text"
          placeholder="Search name, city or contact..."
          value={draftQuery}
          onChange={(event) => setDraftQuery(event.target.value)}
        />
        <Listbox value={draftStatusFilter} onChange={setDraftStatusFilter}>
          <div className="relative">
            <Listbox.Button className="rbac-input-filter flex w-full items-center justify-between text-left">
              <span>
                {draftStatusFilter
                  ? draftStatusFilter
                    .replaceAll("_", " ")
                    .toLowerCase()
                    .replace(/\b\w/g, (char) => char.toUpperCase())
                  : "All status"}
              </span>

              <FaChevronDown className="text-xs text-slate-500" />
            </Listbox.Button>

            <Listbox.Options className="theme-surface absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-md py-1 shadow-lg focus:outline-none">
              {[
                { label: "All status", value: "" },
                { label: "Pending", value: "PENDING" },
                { label: "In progress", value: "IN_PROGRESS" },
                { label: "On hold", value: "ON_HOLD" },
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
        <Listbox value={draftCityFilter} onChange={setDraftCityFilter}>
          <div className="relative">
            <Listbox.Button className="rbac-input-filter rbac-select flex w-full items-center justify-between text-left">
              <span className="truncate">
                {draftCityFilter || "All cities"}
              </span>
            </Listbox.Button>

            <Listbox.Options className="theme-surface absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-md py-1 shadow-lg focus:outline-none">
              <Listbox.Option
                value=""
                className={({ active }) =>
                  `cursor-pointer px-4 py-2 text-sm ${active ? "rbac-option-active" : ""
                  }`
                }
              >
                {({ selected }) => (
                  <div className="flex items-center justify-between">
                    <span>All cities</span>

                  </div>
                )}
              </Listbox.Option>

              {cityOptions.map((city) => (
                <Listbox.Option
                  key={city}
                  value={city}
                  className={({ active }) =>
                    `cursor-pointer px-4 py-2 text-sm ${active ? "rbac-option-active" : ""
                    }`
                  }
                >
                  {({ selected }) => (
                    <div className="flex items-center justify-between">
                      <span>{city}</span>
                    </div>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </div>
        </Listbox>
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
