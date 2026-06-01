"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { flexRender, useReactTable } from "@tanstack/react-table";
import { ColumnDef, getCoreRowModel } from "@tanstack/table-core";
import DashboardShell from "../_components/DashboardShell";
import AppliedFilterSummary from "../../components/AppliedFilterSummary";
import ConfirmDialog from "../../components/ConfirmDialog";
import ListingFilterDialog from "../../components/ListingFilterDialog";
import useDebounce from "@/app/hooks/useDebounce";
import { toast } from "react-toastify";
import {
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaTrash,
  FaSpinner,
  FaFilter,
} from "react-icons/fa";
import Link from "next/link";
import { useRouter } from "next/navigation";

type IncomeTypeRow = {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
};

function IncomeTypeListContent() {
  const router = useRouter();
  const [incomeTypes, setIncomeTypes] = useState<IncomeTypeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftQuery, setDraftQuery] = useState("");
  const [draftStatusFilter, setDraftStatusFilter] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<IncomeTypeRow | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const loadIncomeTypes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pageIndex + 1),
        pageSize: String(pageSize),
      });
      if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/income-types?${params.toString()}`);
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error || "Failed to load income types.");
        return;
      }

      const data = await res.json();
      setIncomeTypes(Array.isArray(data?.data) ? data.data : []);
      setTotal(typeof data?.total === "number" ? data.total : 0);
    } catch (error) {
      console.error("Failed to load income types", error);
      toast.error("Failed to load income types.");
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, debouncedQuery, statusFilter]);

  useEffect(() => {
    loadIncomeTypes();
  }, [loadIncomeTypes]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (pageIndex > pageCount - 1) {
      setPageIndex(Math.max(pageCount - 1, 0));
    }
  }, [pageCount, pageIndex]);

  const handleDeleteIncomeType = useCallback((row: IncomeTypeRow) => {
    setConfirmTarget(row);
    setConfirmOpen(true);
  }, []);

  const handleEditIncomeType = useCallback(
    (row: IncomeTypeRow) => {
      router.push(`/dashboard/income-types/${row.id}`);
    },
    [router],
  );

  const confirmDeleteIncomeType = useCallback(async () => {
    if (!confirmTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/income-types/${confirmTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error || "Failed to delete income type.");
        return;
      }
      await loadIncomeTypes();
      toast.success("Income type deleted successfully.");
    } catch (error) {
      console.error("Failed to delete income type", error);
      toast.error("Failed to delete income type.");
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setConfirmTarget(null);
    }
  }, [confirmTarget, loadIncomeTypes]);

  const columns = useMemo<ColumnDef<IncomeTypeRow>[]>(
    () => [
      {
        header: "Name",
        accessorKey: "name",
        cell: (info) => (
          <span className="rbac-muted">{String(info.getValue() || "")}</span>
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
        header: "Action",
        id: "action",
        cell: ({ row }) => (
          <div className="justify-end flex gap-2">
            <button
              onClick={() => handleEditIncomeType(row.original)}
              className="rbac-link"
              type="button"
            >
              <FaEdit />
            </button>
            <button
              className="rbac-link danger"
              type="button"
              onClick={() => handleDeleteIncomeType(row.original)}
            >
              <FaTrash />
            </button>
          </div>
        ),
      },
    ],
    [handleDeleteIncomeType, handleEditIncomeType],
  );

  const table = useReactTable({
    data: incomeTypes,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount,
  });

  const statusLabel = (value: string) => {
    switch (value) {
      case "ACTIVE":
        return "Active";
      case "INACTIVE":
        return "Inactive";
      default:
        return value.replaceAll("_", " ");
    }
  };

  const openFilters = useCallback(() => {
    setDraftQuery(query);
    setDraftStatusFilter(statusFilter);
    setFilterOpen(true);
  }, [query, statusFilter]);

  const closeFilters = useCallback(() => {
    setFilterOpen(false);
  }, []);

  const applyFilters = useCallback(() => {
    setPageIndex(0);
    setQuery(draftQuery);
    setStatusFilter(draftStatusFilter);
    setFilterOpen(false);
  }, [draftQuery, draftStatusFilter]);

  const appliedFilters = [
    query.trim(),
    statusFilter ? statusLabel(statusFilter) : "",
  ].filter(Boolean);

  return (
    <>
      <section className="rbac-section rbac-container">
        <div className="rbac-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="rbac-title-lg">Income Types</h3>
            <div className="flex items-center gap-2">
              <button
                className="rbac-button rbac-button-secondary theme-button-secondary inline-flex items-center gap-2"
                type="button"
                onClick={openFilters}
              >
                <FaFilter /> <span> Filters</span>
              </button>
              <Link href="/dashboard/income-types/new">
                <button className="rbac-button" type="button">
                  Add Income Type
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
              setFilterOpen(false);
            }}
          />

          <div className="mt-4">
            <div className="hidden overflow-x-auto md:block">
              <table className="theme-table min-w-full border-separate border border-slate-200 border-spacing-0">
                <thead className="bg-slate-50">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          style={{ width: header.getSize() }}
                          className={`border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase ${
                            header.id === "action" ? "text-right" : "text-left"
                          }`}
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
                          <FaSpinner className="mr-2 animate-spin" size={16} />
                        </div>
                      </td>
                    </tr>
                  )}
                  {!loading && incomeTypes.length === 0 && (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-4 py-3 text-sm text-slate-500"
                      >
                        No income types found.
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

            <div className="space-y-3 md:hidden">
              {loading && (
                <div className="flex items-center justify-center py-4">
                  <FaSpinner className="mr-2 animate-spin" size={16} />
                </div>
              )}
              {!loading && incomeTypes.length === 0 && (
                <div className="rbac-card py-4 text-sm text-slate-500">
                  No income types found.
                </div>
              )}
              {!loading &&
                incomeTypes.map((incomeType) => (
                  <div key={incomeType.id} className="rbac-card p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold">
                          {incomeType.name}
                        </h4>
                        <span className="mt-2 inline-flex items-center text-xs font-medium tracking-wide text-[color:var(--theme-text-muted)]">
                          {statusLabel(incomeType.status)}
                        </span>
                      </div>
                      <div className="flex">
                        <button
                          onClick={() => handleEditIncomeType(incomeType)}
                          className="rbac-link"
                          type="button"
                        >
                          <FaEdit size={18} />
                        </button>
                        <button
                          style={{ padding: "2px" }}
                          className="rbac-link danger"
                          type="button"
                          onClick={() => handleDeleteIncomeType(incomeType)}
                        >
                          <FaTrash size={18} />
                        </button>
                      </div>
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
        title="Delete income type?"
        description="Are you sure you want to delete?"
        confirmLabel="Delete"
        confirmLoading={deleting}
        confirmLoadingLabel="Deleting..."
        cancelLabel="Cancel"
        onConfirm={confirmDeleteIncomeType}
        onClose={() => {
          setConfirmOpen(false);
          setConfirmTarget(null);
        }}
      />
      <ListingFilterDialog
        open={filterOpen}
        title="Income Type Filters"
        description="Update the filters and apply them when you're ready."
        onClose={closeFilters}
        onApply={applyFilters}
      >
        <input
          className="rbac-input-filter"
          type="text"
          placeholder="Search name"
          value={draftQuery}
          onChange={(event) => setDraftQuery(event.target.value)}
        />
        <select
          className="rbac-input-filter"
          value={draftStatusFilter}
          onChange={(event) => setDraftStatusFilter(event.target.value)}
        >
          <option value="">All status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </ListingFilterDialog>
    </>
  );
}

export default function IncomeTypesPage() {
  return (
    <DashboardShell requireAdmin>
      <IncomeTypeListContent />
    </DashboardShell>
  );
}
