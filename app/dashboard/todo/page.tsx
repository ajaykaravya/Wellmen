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

type TodoStatus = "TODO" | "IN_PROGRESS" | "ON_HOLD" | "DONE";

type UserOption = {
  id: string;
  firstName: string;
  lastName: string;
  role?: string | null;
};

type TodoRow = {
  id: string;
  title: string;
  description: string | null;
  comments?: string | null;
  startDate: string;
  status: TodoStatus;
  projectId?: string | null;
  projectName?: string;
  createdById?: string | null;
  canManage?: boolean;
  assignee: {
    id: string;
    firstName: string;
    lastName: string;
    mobileNumber: string;
    role?: string | null;
  } | null;
};

type TodoUpdateDraft = {
  comments: string;
  status: TodoStatus;
};

function TodoListContent() {
  const { setNavOpen, isAdmin } = useDashboardContext();
  const [todos, setTodos] = useState<TodoRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [assignees, setAssignees] = useState<UserOption[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<TodoRow | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTarget, setModalTarget] = useState<TodoRow | null>(null);
  const [modalDraft, setModalDraft] = useState<TodoUpdateDraft>({
    comments: "",
    status: "TODO",
  });
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadAssignees = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await fetch("/api/users/options");
      if (!res.ok) return;
      const data = await res.json();
      setAssignees(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load assignees", error);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadAssignees();
  }, [loadAssignees]);

  const loadTodos = useCallback(async () => {
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
      if (isAdmin && assigneeFilter) params.set("assigneeId", assigneeFilter);

      const endpoint = isAdmin ? "/api/todos" : "/api/my-todos";
      const res = await fetch(`${endpoint}?${params.toString()}`);
      if (!res.ok) return;

      const data = await res.json();
      setTodos(Array.isArray(data?.data) ? data.data : []);
      setTotal(typeof data?.total === "number" ? data.total : 0);
    } catch (error) {
      console.error("Failed to load todos", error);
    } finally {
      setLoading(false);
    }
  }, [
    assigneeFilter,
    fromDate,
    isAdmin,
    pageIndex,
    pageSize,
    debouncedQuery,
    statusFilter,
    toDate,
  ]);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (pageIndex > pageCount - 1) {
      setPageIndex(Math.max(pageCount - 1, 0));
    }
  }, [pageCount, pageIndex]);

  const handleDeleteTodo = useCallback(
    (row: TodoRow) => {
      if (!isAdmin && !row.canManage) {
        toast.error("You can only delete todos created by you.");
        return;
      }
      setConfirmTarget(row);
      setConfirmOpen(true);
    },
    [isAdmin],
  );

  const handleSave = useCallback(
    async (row: TodoRow, draft: TodoUpdateDraft) => {
      setSavingId(row.id);
      try {
        const res = await fetch(`/api/my-todos/${row.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            comments: draft.comments,
            status: draft.status,
          }),
        });

        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          toast.error(payload.error || "Failed to update task.");
          return false;
        }

        const updated = await res.json();
        setTodos((prev) =>
          prev.map((item) =>
            item.id === row.id
              ? {
                  ...item,
                  comments: updated.comments ?? null,
                  status: updated.status,
                }
              : item,
          ),
        );

        toast.success("Todo updated successfully.");
        return true;
      } catch (error) {
        console.error("Failed to update todo", error);
        toast.error("Failed to update todo.");
        return false;
      } finally {
        setSavingId(null);
      }
    },
    [],
  );

  const openModal = useCallback((row: TodoRow) => {
    setModalTarget(row);
    setModalDraft({ comments: row.comments || "", status: row.status });
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setModalTarget(null);
    setModalDraft({ comments: "", status: "TODO" });
  }, []);

  const handleModalSave = useCallback(async () => {
    if (!modalTarget) return;
    const ok = await handleSave(modalTarget, modalDraft);
    if (ok) closeModal();
  }, [closeModal, handleSave, modalDraft, modalTarget]);

  const confirmDeleteTodo = useCallback(async () => {
    if (!confirmTarget) return;
    try {
      const endpoint = isAdmin ? "/api/todos" : "/api/my-todos";
      const res = await fetch(`${endpoint}/${confirmTarget.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error || "Failed to delete todo.");
        return;
      }

      await loadTodos();
      toast.success("Todo deleted successfully.");
    } catch (error) {
      console.error("Failed to delete todo", error);
      toast.error("Failed to delete todo.");
    } finally {
      setConfirmOpen(false);
      setConfirmTarget(null);
    }
  }, [confirmTarget, isAdmin, loadTodos]);

  const adminColumns = useMemo<ColumnDef<TodoRow>[]>(
    () => [
      {
        header: "Task Title",
        accessorKey: "title",
        cell: (info) => (
          <span className="rbac-muted">{String(info.getValue() || "")}</span>
        ),
      },
      {
        header: "Description",
        accessorKey: "description",
        size: 600,
        cell: (info) => (
          <span className="rbac-muted">{String(info.getValue() || "-")}</span>
        ),
      },
      {
        header: "Date",
        accessorKey: "startDate",
        cell: (info) => {
          const value = String(info.getValue() || "");
          return (
            <span className="rbac-muted">{value ? formatToDDMMYYYY(value) : "-"}</span>
          );
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
        header: "Comments",
        accessorKey: "comments",
        cell: (info) => (
          <span className="rbac-muted">{String(info.getValue() || "-")}</span>
        ),
      },
      {
        header: "Assign",
        id: "assignee",
        cell: ({ row }) => {
          const assignee = row.original.assignee;
          if (!assignee) return <span className="rbac-muted">Unassigned</span>;
          return (
            <span className="rbac-muted">
              {assignee.firstName} {assignee.lastName}
            </span>
          );
        },
      },
      {
        header: "Action",
        id: "action",
        cell: ({ row }) => (
          <div className="rbac-inline-actions flex gap-4">
            <Link href={`/dashboard/todo/${row.original.id}`}>
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
              onClick={() => handleDeleteTodo(row.original)}
            >
              <FaTrash />
            </button>
          </div>
        ),
      },
    ],
    [handleDeleteTodo],
  );

  const employeeColumns = useMemo<ColumnDef<TodoRow>[]>(
    () => [
      {
        header: "Task Name",
        accessorKey: "title",
        cell: (info) => (
          <span className="rbac-muted">{String(info.getValue() || "")}</span>
        ),
      },
      {
        header: "Description",
        accessorKey: "description",
        size: 700,
        cell: (info) => (
          <span className="rbac-muted">{String(info.getValue() || "-")}</span>
        ),
      },
      {
        header: "Date",
        accessorKey: "startDate",
        cell: (info) => {
          const value = String(info.getValue() || "");
          return (
            <span className="rbac-muted">{value ? formatToDDMMYYYY(value) : "-"}</span>
          );
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
        header: "Comments",
        accessorKey: "comments",
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
            {canManage && (
              <>
              <Link href={`/dashboard/todo/${row.original.id}`}>
                <button
                className="rbac-link"
                type="button"
                disabled={!canManage}
                title={"Edit"}
              >
                <FaEdit />
              </button>
              </Link>
              <button
                className="rbac-link danger"
                type="button"
                onClick={() => handleDeleteTodo(row.original)}
                disabled={!canManage}
                title={"Delete"}
              >
                <FaTrash />
              </button>
              </>)}
              <button
                    className="rbac-button rbac-button-secondary"
                    type="button"
                    onClick={() => openModal(row.original)}
                  >
                    Update
                  </button>
            </div>
          );
        },
      },
    ],
    [handleDeleteTodo],
  );

  const columns = isAdmin ? adminColumns : employeeColumns;

  const table = useReactTable({
    data: todos,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount,
  });

  const isModalDirty =
    !!modalTarget &&
    ((modalDraft.comments || "") !== (modalTarget.comments || "") ||
      modalDraft.status !== modalTarget.status);

  const isModalSaving = savingId === modalTarget?.id;

  return (
    <>
      <section className="rbac-section">
        <div className="rbac-card">
          <div className="flex justify-between items-center">
          <h3 className="rbac-title-lg">Todo's List</h3>
          <Link href="/dashboard/todo/new">
           <button
          className="rbac-button"
          type="button"
        >
          Add Todo
        </button>
        </Link>
</div>
          <div className="mt-4 flex flex-wrap gap-3">
            <input
              className="rbac-input-filter"
              type="text"
              placeholder="Search task name or description"
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
              <option value="TODO">To do</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="ON_HOLD">On hold</option>
              <option value="DONE">Done</option>
            </select>
            {isAdmin && (
              <select
                className="rbac-input-filter rbac-select"
                value={assigneeFilter}
                onChange={(event) => {
                  setPageIndex(0);
                  setAssigneeFilter(event.target.value);
                }}
              >
                <option value="">All assignees</option>
                {assignees.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </option>
                ))}
              </select>
            )}
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
                setAssigneeFilter("");
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
                      Loading tasks...
                    </td>
                  </tr>
                )}
                {!loading && todos.length === 0 && (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="py-6 text-sm text-slate-500"
                    >
                      No tasks found.
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
                          className="py-4 text-sm "
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
              <div className="flex items-center gap-2">
              <button
                className="change-button change-button-secondary"
                type="button"
                onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}
                disabled={pageIndex === 0}
              >
                <FaChevronLeft size={20}/>
              </button>
               <span >
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
      {modalOpen && !isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold ">Update task</h2>
            <p className="mt-2 text-sm ">
              Add your comments and choose a status before saving.
            </p>

            <div className="mt-4 grid gap-4">
              <label className="rbac-label">
                Comments
                <textarea
                  className="rbac-input"
                  rows={4}
                  value={modalDraft.comments}
                  onChange={(event) =>
                    setModalDraft((prev) => ({
                      ...prev,
                      comments: event.target.value,
                    }))
                  }
                  placeholder="Add work comments"
                />
              </label>

              <label className="rbac-label">
                Status
                <select
                  className="rbac-input rbac-select"
                  value={modalDraft.status}
                  onChange={(event) =>
                    setModalDraft((prev) => ({
                      ...prev,
                      status: event.target.value as TodoStatus,
                    }))
                  }
                >
                  <option value="TODO">To do</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="ON_HOLD">On hold</option>
                  <option value="DONE">Done</option>
                </select>
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                className="rbac-button rbac-button-secondary"
                type="button"
                onClick={closeModal}
                disabled={savingId === modalTarget?.id}
              >
                Cancel
              </button>
              <button
                className="rbac-button"
                type="button"
                onClick={handleModalSave}
                disabled={!modalTarget || !isModalDirty || isModalSaving}
              >
                {isModalSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Delete todo?"
        description={
          confirmTarget
            ? `Delete "${confirmTarget.title}"? This action cannot be undone.`
            : "This action cannot be undone."
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDeleteTodo}
        onClose={() => {
          setConfirmOpen(false);
          setConfirmTarget(null);
        }}
      />
    </>
  );
}

export default function TodoPage() {
  return (
    <DashboardShell>
      <TodoListContent />
    </DashboardShell>
  );
}
