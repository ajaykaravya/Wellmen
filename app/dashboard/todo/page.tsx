"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { flexRender, useReactTable } from "@tanstack/react-table";
import { ColumnDef, getCoreRowModel } from "@tanstack/table-core";
import DashboardShell, {
  useDashboardContext,
} from "../_components/DashboardShell";
import ConfirmDialog from "../../components/ConfirmDialog";
import { toast } from "react-toastify";
import { FaChevronLeft, FaChevronRight, FaEdit, FaTrash } from "react-icons/fa";

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

function TodoListContent() {
  const router = useRouter();
  const { setNavOpen, isAdmin } = useDashboardContext();
  const [todos, setTodos] = useState<TodoRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [assignees, setAssignees] = useState<UserOption[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<TodoRow | null>(null);

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

      if (query.trim()) params.set("q", query.trim());
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
    query,
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

  const handleEditTodo = useCallback(
    (row: TodoRow) => {
      if (!isAdmin && !row.canManage) return;
      router.push(`/dashboard/todo/${row.id}`);
    },
    [isAdmin, router],
  );

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
          const date = value ? new Date(value) : null;
          return (
            <span className="rbac-muted">{date ? date.toLocaleDateString() : "-"}</span>
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
            <button
              className="rbac-link"
              type="button"
              onClick={() => handleEditTodo(row.original)}
            >
                  <FaEdit />
            </button>
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
    [handleDeleteTodo, handleEditTodo],
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
          const date = value ? new Date(value) : null;
          return (
            <span className="rbac-muted">{date ? date.toLocaleDateString() : "-"}</span>
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
        header: "Action",
        id: "action",
        cell: ({ row }) => {
          const canManage = !!row.original.canManage;
          return (
            <div className="rbac-inline-actions flex gap-4">
            {canManage && (
              <>
                <button
                className="rbac-link"
                type="button"
                onClick={() => handleEditTodo(row.original)}
                disabled={!canManage}
                title={"Edit"}
              >
                <FaEdit />
              </button>
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
            </div>
          );
        },
      },
    ],
    [handleDeleteTodo, handleEditTodo],
  );

  const columns = isAdmin ? adminColumns : employeeColumns;

  const table = useReactTable({
    data: todos,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount,
  });

  return (
    <>
      {/* <header className="rbac-header">
        <div>
        <p className="rbac-eyebrow">To-Do</p>
          <h1 className="rbac-heading">Task list</h1>
          <p className="rbac-subtext">
            {isAdmin
              ? "Create and assign tasks to your team."
              : "View all your tasks with quick filtering, and update or delete tasks created by you."}
          </p>
        </div>
       
      </header> */}

      <section className="rbac-section">
        <div className="rbac-card">
          <div className="flex justify-between items-center">
          <h3 className="rbac-title-lg">{isAdmin ? "All tasks" : "My tasks"}</h3>
           <button
          className="rbac-button"
          type="button"
          onClick={() => router.push("/dashboard/todo/new")}
        >
          Add Todo
        </button>
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

          <div className="mt-4 flex flex-wrap items-center justify-end gap-3 text-sm text-slate-600">
           
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
