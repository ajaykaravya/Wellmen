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
import AppliedFilterSummary from "../../components/AppliedFilterSummary";
import ConfirmDialog from "../../components/ConfirmDialog";
import CustomDatePicker from "../../components/CustomDatePicker";
import ListingFilterDialog from "../../components/ListingFilterDialog";
import { Dialog, DialogPanel } from "@headlessui/react";
import { toast } from "react-toastify";
import { IoIosClose } from "react-icons/io";
import { Listbox } from "@headlessui/react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaEye,
  FaFilter,
  FaLink,
  FaSpinner,
  FaTrash,
} from "react-icons/fa";
import Link from "next/link";
import { ReportingCardList } from "../_components/ReportingCardList";
import { ReportDetailsDialog } from "../_components/ReportDetailsDialog";

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
  projectCity?: string | null;
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

const renderProjectLabel = (
  projectName?: string | null,
  projectCity?: string | null,
) => (
  <div className="flex flex-col">
    <span>{projectName || "-"}</span>
    <span className="text-xs text-slate-500">{projectCity || "-"}</span>
  </div>
);

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
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftQuery, setDraftQuery] = useState("");
  const [draftProjectFilter, setDraftProjectFilter] = useState("");
  const [draftEmployeeFilter, setDraftEmployeeFilter] = useState("");
  const [draftFromDate, setDraftFromDate] = useState("");
  const [draftToDate, setDraftToDate] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<ReportRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewData, setViewData] = useState<ReportRow | null>(null);
  const [viewImageIndex, setViewImageIndex] = useState<number | null>(null);
  const [viewVideoIndex, setViewVideoIndex] = useState<number | null>(null);

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

  const openFilters = useCallback(() => {
    setDraftQuery(query);
    setDraftProjectFilter(projectFilter);
    setDraftEmployeeFilter(employeeFilter);
    setDraftFromDate(fromDate);
    setDraftToDate(toDate);
    setFilterOpen(true);
  }, [employeeFilter, fromDate, projectFilter, query, toDate]);

  const closeFilters = useCallback(() => {
    setFilterOpen(false);
  }, []);

  const applyFilters = useCallback(() => {
    setPageIndex(0);
    setQuery(draftQuery);
    setProjectFilter(draftProjectFilter);
    setEmployeeFilter(draftEmployeeFilter);
    setFromDate(draftFromDate);
    setToDate(draftToDate);
    setFilterOpen(false);
  }, [
    draftEmployeeFilter,
    draftFromDate,
    draftProjectFilter,
    draftQuery,
    draftToDate,
  ]);

  const appliedFilters = [
    query.trim(),
    projects.find((project) => project.id === projectFilter)?.name || "",
    isAdmin
      ? (() => {
        const selectedEmployee = employees.find(
          (employee) => employee.id === employeeFilter,
        );
        return selectedEmployee
          ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}`
          : employeeFilter;
      })()
      : "",
    fromDate,
    toDate,
  ].filter(Boolean);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const viewImageUrls = useMemo(() => viewData?.imageUrls ?? [], [viewData]);
  const viewVideoUrls = useMemo(
    () =>
      viewData
        ? viewData.videoUrls?.length
          ? viewData.videoUrls
          : viewData.videoUrl
            ? [viewData.videoUrl]
            : []
        : [],
    [viewData],
  );
  const selectedViewImage =
    viewImageIndex !== null ? viewImageUrls[viewImageIndex] : null;
  const selectedViewVideo =
    viewVideoIndex !== null ? viewVideoUrls[viewVideoIndex] : null;

  useEffect(() => {
    if (pageIndex > pageCount - 1) {
      setPageIndex(Math.max(pageCount - 1, 0));
    }
  }, [pageCount, pageIndex]);

  const handleView = useCallback(async (row: ReportRow) => {
    setViewOpen(true);
    setViewLoading(true);
    setViewData(null);
    setViewImageIndex(null);
    setViewVideoIndex(null);

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

  const closeView = useCallback(() => {
    setViewOpen(false);
    setViewData(null);
    setViewImageIndex(null);
    setViewVideoIndex(null);
  }, []);

  const openViewImage = useCallback((index: number) => {
    setViewVideoIndex(null);
    setViewImageIndex(index);
  }, []);

  const openViewVideo = useCallback((index: number) => {
    setViewImageIndex(null);
    setViewVideoIndex(index);
  }, []);

  const showPreviousViewImage = useCallback(() => {
    if (!viewImageUrls.length) return;
    setViewImageIndex((current) => {
      if (current === null) return 0;
      return (current - 1 + viewImageUrls.length) % viewImageUrls.length;
    });
  }, [viewImageUrls.length]);

  const showNextViewImage = useCallback(() => {
    if (!viewImageUrls.length) return;
    setViewImageIndex((current) => {
      if (current === null) return 0;
      return (current + 1) % viewImageUrls.length;
    });
  }, [viewImageUrls.length]);

  const showPreviousViewVideo = useCallback(() => {
    if (!viewVideoUrls.length) return;
    setViewVideoIndex((current) => {
      if (current === null) return 0;
      return (current - 1 + viewVideoUrls.length) % viewVideoUrls.length;
    });
  }, [viewVideoUrls.length]);

  const showNextViewVideo = useCallback(() => {
    if (!viewVideoUrls.length) return;
    setViewVideoIndex((current) => {
      if (current === null) return 0;
      return (current + 1) % viewVideoUrls.length;
    });
  }, [viewVideoUrls.length]);

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
        cell: ({ row, getValue }) =>
          renderProjectLabel(
            String(getValue() || "-"),
            row.original.projectCity,
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
          const hasMedia =
            (row.original.imageUrls?.length ?? 0) > 0 ||
            (row.original.videoUrls?.length ?? 0) > 0 ||
            Boolean(row.original.videoUrl);
          const canManage = !!row.original.canManage;
          return (
            <div className="rbac-inline-actions flex gap-4 items-center">
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
              {hasMedia && (
                <span className="rbac-link" aria-label="Has media">
                  <FaLink />
                </span>
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
          <div className="flex items-center justify-between gap-3">
            <h3 className="rbac-title-lg">Reporting List</h3>
            <div className="flex gap-2">
              <button
                className="rbac-button rbac-button-secondary theme-button-secondary inline-flex items-center gap-2"
                type="button"
                onClick={openFilters}
              >
                <FaFilter /> <span>Filters</span>
              </button>
              {!isAdmin && (
                <Link href="/dashboard/reports/new">
                  <button className="rbac-button" type="button">
                    Add Reporting
                  </button>
                </Link>
              )}
            </div>
          </div>

          <AppliedFilterSummary
            items={appliedFilters}
            onClear={() => {
              setPageIndex(0);
              setQuery("");
              setProjectFilter("");
              setEmployeeFilter("");
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
              {!loading && (
                <ReportingCardList
                  rows={reports}
                  loading={loading}
                  emptyLabel="No reporting found."
                  showCount={false}
                  showEmployee={isAdmin}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}
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
      <ListingFilterDialog
        open={filterOpen}
        title="Reporting Filters"
        description="Update the filters and apply them when you're ready."
        onClose={closeFilters}
        onApply={applyFilters}
        maxWidthClassName="max-w-2xl"
      >
        <input
          className="rbac-input-filter"
          type="text"
          placeholder="Search category, description"
          value={draftQuery}
          onChange={(event) => setDraftQuery(event.target.value)}
        />
        <Listbox value={draftProjectFilter} onChange={setDraftProjectFilter}>
          <div className="relative">
            <Listbox.Button className="rbac-input-filter rbac-select flex w-full items-center justify-between text-left">
              <span className="truncate">
                {draftProjectFilter
                  ? projects.find((project) => project.id === draftProjectFilter)
                    ?.name || "All projects"
                  : "All projects"}
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
                    <span>All projects</span>
                  </div>
                )}
              </Listbox.Option>

              {projects.map((project) => (
                <Listbox.Option
                  key={project.id}
                  value={project.id}
                  className={({ active }) =>
                    `cursor-pointer px-4 py-2 text-sm ${active ? "bg-slate-100" : ""
                    }`
                  }
                >
                  {({ selected }) => (
                    <div className="flex items-center justify-between">
                      <span>{project.name}</span>

                    </div>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </div>
        </Listbox>
        {isAdmin && (
          <Listbox value={draftEmployeeFilter} onChange={setDraftEmployeeFilter}>
            <div className="relative">
              <Listbox.Button className="rbac-input-filter rbac-select flex w-full items-center justify-between text-left">
                <span className="truncate">
                  {draftEmployeeFilter
                    ? (() => {
                      const selectedEmployee = employees.find(
                        (employee) => employee.id === draftEmployeeFilter,
                      );

                      return selectedEmployee
                        ? `${selectedEmployee.firstName} ${selectedEmployee.lastName
                        } - ${selectedEmployee.role || ""}`
                        : "All employees";
                    })()
                    : "All employees"}
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
                      <span>All employees</span>
                    </div>
                  )}
                </Listbox.Option>

                {employees.map((employee) => (
                  <Listbox.Option
                    key={employee.id}
                    value={employee.id}
                    className={({ active }) =>
                      `cursor-pointer px-4 py-2 text-sm ${active ? "bg-slate-100" : ""
                      }`
                    }
                  >
                    {({ selected }) => (
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate">
                          {employee.firstName} {employee.lastName} -{" "}
                          {employee.role || ""}
                        </span>
                      </div>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Listbox>
        )}
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
        <ReportDetailsDialog
          open={viewOpen}
          loading={viewLoading}
          report={viewData}
          showEmployee={true}
          viewImageUrls={viewData?.imageUrls ?? []}
          viewVideoUrls={viewData?.videoUrls?.length
            ? viewData.videoUrls
            : viewData?.videoUrl
              ? [viewData.videoUrl]
              : []}
          onClose={closeView}
          onOpenImage={openViewImage}
          onOpenVideo={openViewVideo}
        />
      )}

      <Dialog
        open={viewImageIndex !== null && !!selectedViewImage}
        onClose={() => setViewImageIndex(null)}
        className="relative z-60"
      >
        <div className="theme-modal-overlay fixed inset-0" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center px-4 py-6">
          <DialogPanel className="theme-modal-surface w-full max-w-5xl rounded-2xl p-3 shadow-2xl">
            <div className="flex items-center justify-between gap-3 px-2 py-2 theme-text">
              <div className="text-sm theme-text-muted">
                Image {viewImageIndex !== null ? viewImageIndex + 1 : 0} of{" "}
                {viewImageUrls.length}
              </div>
              <button
                type="button"
                onClick={() => setViewImageIndex(null)}
                className="rounded-full p-1 transition theme-text-muted hover:bg-black/5 hover:opacity-80"
                aria-label="Close image preview"
              >
                <IoIosClose size={30} />
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 px-2 py-4">
              <button
                type="button"
                onClick={showPreviousViewImage}
                className="mx-auto flex h-11 w-11 items-center justify-center rounded-full theme-button-secondary transition disabled:cursor-not-allowed disabled:opacity-40"
                disabled={viewImageUrls.length <= 1}
                aria-label="Previous image"
              >
                <FaChevronLeft size={18} />
              </button>

              <div className="flex items-center justify-center rounded-xl theme-surface-2 p-2">
                {selectedViewImage && (
                  <Image
                    src={selectedViewImage}
                    alt={`Report image ${viewImageIndex !== null ? viewImageIndex + 1 : 1}`}
                    width={1400}
                    height={900}
                    unoptimized
                    className="max-h-[75vh] w-full max-w-full rounded-xl object-contain"
                  />
                )}
              </div>

              <button
                type="button"
                onClick={showNextViewImage}
                className="mx-auto flex h-11 w-11 items-center justify-center rounded-full theme-button-secondary transition disabled:cursor-not-allowed disabled:opacity-40"
                disabled={viewImageUrls.length <= 1}
                aria-label="Next image"
              >
                <FaChevronRight size={18} />
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <Dialog
        open={viewVideoIndex !== null && !!selectedViewVideo}
        onClose={() => setViewVideoIndex(null)}
        className="relative z-60"
      >
        <div className="theme-modal-overlay fixed inset-0" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center px-4 py-6">
          <DialogPanel className="theme-modal-surface w-full max-w-5xl rounded-2xl p-3 shadow-2xl">
            <div className="flex items-center justify-between gap-3 px-2 py-2 theme-text">
              <div className="text-sm theme-text-muted">
                Video {viewVideoIndex !== null ? viewVideoIndex + 1 : 0} of{" "}
                {viewVideoUrls.length}
              </div>
              <button
                type="button"
                onClick={() => setViewVideoIndex(null)}
                className="rounded-full p-1 transition theme-text-muted hover:bg-black/5 hover:opacity-80"
                aria-label="Close video preview"
              >
                <IoIosClose size={30} />
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 px-2 py-4">
              <button
                type="button"
                onClick={showPreviousViewVideo}
                className="mx-auto flex h-11 w-11 items-center justify-center rounded-full theme-button-secondary transition disabled:cursor-not-allowed disabled:opacity-40"
                disabled={viewVideoUrls.length <= 1}
                aria-label="Previous video"
              >
                <FaChevronLeft size={18} />
              </button>

              <div className="flex w-full items-center justify-center rounded-xl theme-surface-2 p-2">
                {selectedViewVideo && (
                  <video
                    controls
                    autoPlay
                    src={selectedViewVideo}
                    className="max-h-[75vh] w-full rounded-xl"
                  />
                )}
              </div>

              <button
                type="button"
                onClick={showNextViewVideo}
                className="mx-auto flex h-11 w-11 items-center justify-center rounded-full theme-button-secondary transition disabled:cursor-not-allowed disabled:opacity-40"
                disabled={viewVideoUrls.length <= 1}
                aria-label="Next video"
              >
                <FaChevronRight size={18} />
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
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
