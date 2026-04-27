"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { flexRender, useReactTable } from "@tanstack/react-table";
import { ColumnDef, getCoreRowModel } from "@tanstack/table-core";
import DashboardShell from "../_components/DashboardShell";
import ConfirmDialog from "../../components/ConfirmDialog";
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

type CategoryRow = {
  id: string;
  name: string;
};

function CategoryListContent() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<CategoryRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pageIndex + 1),
        pageSize: String(pageSize),
      });
      if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());

      const res = await fetch(`/api/categories?${params.toString()}`);
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error || "Failed to load categories.");
        return;
      }

      const data = await res.json();
      setCategories(Array.isArray(data?.data) ? data.data : []);
      setTotal(typeof data?.total === "number" ? data.total : 0);
    } catch (error) {
      console.error("Failed to load categories", error);
      toast.error("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, debouncedQuery]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (pageIndex > pageCount - 1) {
      setPageIndex(Math.max(pageCount - 1, 0));
    }
  }, [pageCount, pageIndex]);

  const handleDeleteCategory = useCallback((row: CategoryRow) => {
    setConfirmTarget(row);
    setConfirmOpen(true);
  }, []);

  const confirmDeleteCategory = useCallback(async () => {
    if (!confirmTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/categories/${confirmTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error || "Failed to delete category.");
        return;
      }
      await loadCategories();
      toast.success("Category deleted successfully.");
    } catch (error) {
      console.error("Failed to delete category", error);
      toast.error("Failed to delete category.");
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setConfirmTarget(null);
    }
  }, [confirmTarget, loadCategories]);

  const columns = useMemo<ColumnDef<CategoryRow>[]>(
    () => [
      {
        header: "Name",
        accessorKey: "name",
        cell: (info) => (
          <span className="rbac-muted">{String(info.getValue() || "")}</span>
        ),
      },
      {
        header: "Action",
        id: "action",
        cell: ({ row }) => (
          <div className="flex justify-end gap-4">
            <Link href={`/dashboard/project-categories/${row.original.id}`}>
              <button className="rbac-link" type="button">
                <FaEdit />
              </button>
            </Link>
            <button
              className="rbac-link danger"
              type="button"
              onClick={() => handleDeleteCategory(row.original)}
            >
              <FaTrash />
            </button>
          </div>
        ),
      },
    ],
    [handleDeleteCategory],
  );

  const table = useReactTable({
    data: categories,
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
            <h3 className="rbac-title-lg">Project work Categories</h3>
            <Link href="/dashboard/project-categories/new">
              <button className="rbac-button" type="button">
                Add Project Category
              </button>
            </Link>
          </div>

          <div className="my-4 flex flex-wrap gap-2">
            <input
              className="rbac-input-filter"
              type="text"
              placeholder="Search name"
              value={query}
              onChange={(event) => {
                setPageIndex(0);
                setQuery(event.target.value);
              }}
            />
            <button
              className="rbac-button rbac-button-secondary"
              type="button"
              onClick={() => {
                setPageIndex(0);
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
                          className={`text-xs font-semibold uppercase px-4 py-3 border-b border-slate-200 ${
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
                        className="px-4 py-3 text-sm text-slate-500 text-center"
                      >
                        <div className="flex items-center justify-center">
                          <FaSpinner className="animate-spin mr-2" size={16} />
                        </div>
                      </td>
                    </tr>
                  )}
                  {!loading && categories.length === 0 && (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-4 py-3 text-sm text-slate-500 text-center"
                      >
                        No categories found.
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
                            className={`px-4 py-3 text-sm border-b border-slate-100 ${
                              cell.column.id === "action" ? "text-right" : ""
                            }`}
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
              {!loading && categories.length === 0 && (
                <div className="rbac-card py-4 text-sm text-slate-500">
                  No categories found.
                </div>
              )}
              {!loading &&
                categories.map((category) => (
                  <div key={category.id} className="rbac-card p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold">
                          {category.name}
                        </h4>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/dashboard/project-categories/${category.id}`}
                        >
                          <button className="rbac-link" type="button">
                            <FaEdit />
                          </button>
                        </Link>
                        <button
                          className="rbac-link danger"
                          type="button"
                          onClick={() => handleDeleteCategory(category)}
                        >
                          <FaTrash />
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
        title="Delete category?"
        description="Are you sure you want to delete?"
        confirmLabel="Delete"
        confirmLoading={deleting}
        confirmLoadingLabel="Deleting..."
        cancelLabel="Cancel"
        onConfirm={confirmDeleteCategory}
        onClose={() => {
          setConfirmOpen(false);
          setConfirmTarget(null);
        }}
      />
    </>
  );
}

export default function CategoriesPage() {
  return (
    <DashboardShell requireAdmin>
      <CategoryListContent />
    </DashboardShell>
  );
}
