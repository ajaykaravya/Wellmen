"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { flexRender, useReactTable } from "@tanstack/react-table";
import { ColumnDef, getCoreRowModel } from "@tanstack/table-core";
import { useRouter, useSearchParams } from "next/navigation";
import { formatToDDMMYYYY } from "@/lib/dateUtils";
import useDebounce from "@/app/hooks/useDebounce";
import DashboardShell, {
  useDashboardContext,
} from "../_components/DashboardShell";
import { TaskTableCard } from "../_components/TaskTableCard";
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
} from "react-icons/fa";

type TodoStatus = "TODO" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED";

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
  type: "PROJECT" | "OFFICE" | "SERVICE";
  categoryId?: string | null;
  categoryName?: string | null;
  projectId?: string | null;
  projectName?: string;
  projectCity?: string | null;
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

const formatTaskType = (value?: string | null) => {
  switch (value) {
    case "PROJECT":
      return "Project Work";
    case "OFFICE":
      return "Office Work";
    case "SERVICE":
      return "Service Work";
    default:
      return value ? value.replaceAll("_", " ") : "-";
  }
};

const renderProjectName = (name?: string | null, city?: string | null) => (
  <div className="flex flex-col">
    <span>{name || "-"}</span>
    <span className="text-xs text-slate-500">{city || "-"}</span>
  </div>
);

function TodoListContent() {
  const router = useRouter();
  const { isAdmin } = useDashboardContext();
  const searchParams = useSearchParams();
  const taskTypeFromQuery = (() => {
    const value = searchParams?.get("type");
    if (value === "PROJECT" || value === "OFFICE" || value === "SERVICE") {
      return value;
    }
    return "PROJECT";
  })();
  const [todos, setTodos] = useState<TodoRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const [statusFilter, setStatusFilter] = useState("");
  const [taskTypeFilter, setTaskTypeFilter] = useState(taskTypeFromQuery);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [assignees, setAssignees] = useState<UserOption[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftQuery, setDraftQuery] = useState("");
  const [draftStatusFilter, setDraftStatusFilter] = useState("");
  const [draftTaskTypeFilter, setDraftTaskTypeFilter] =
    useState(taskTypeFromQuery);
  const [draftCategoryFilter, setDraftCategoryFilter] = useState("");
  const [draftFromDate, setDraftFromDate] = useState("");
  const [draftToDate, setDraftToDate] = useState("");
  const [draftAssigneeFilter, setDraftAssigneeFilter] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<TodoRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setTaskTypeFilter(taskTypeFromQuery);
    setPageIndex(0);
  }, [taskTypeFromQuery]);

  const activeFilterCount = [
    query.trim(),
    statusFilter,
    categoryFilter.trim(),
    fromDate,
    toDate,
    assigneeFilter,
  ].filter(Boolean).length;

  const openFilters = useCallback(() => {
    setDraftQuery(query);
    setDraftStatusFilter(statusFilter);
    setDraftTaskTypeFilter(taskTypeFilter);
    setDraftCategoryFilter(categoryFilter);
    setDraftFromDate(fromDate);
    setDraftToDate(toDate);
    setDraftAssigneeFilter(assigneeFilter);
    setFilterOpen(true);
  }, [assigneeFilter, categoryFilter, fromDate, query, statusFilter, taskTypeFilter, toDate]);

  const closeFilters = useCallback(() => {
    setFilterOpen(false);
  }, []);

  const applyFilters = useCallback(() => {
    setPageIndex(0);
    setQuery(draftQuery);
    setStatusFilter(draftStatusFilter);
    setTaskTypeFilter(draftTaskTypeFilter);
    setCategoryFilter(draftCategoryFilter);
    setFromDate(draftFromDate);
    setToDate(draftToDate);
    setAssigneeFilter(draftAssigneeFilter);
    setFilterOpen(false);
  }, [
    draftAssigneeFilter,
    draftCategoryFilter,
    draftFromDate,
    draftQuery,
    draftStatusFilter,
    draftTaskTypeFilter,
    draftToDate,
  ]);

  const statusLabel = (value: string) => {
    switch (value) {
      case "TODO":
        return "To do";
      case "IN_PROGRESS":
        return "In progress";
      case "ON_HOLD":
        return "On hold";
      case "COMPLETED":
        return "Completed";
      default:
        return value.replaceAll("_", " ");
    }
  };

  const selectedAssignee = assigneeFilter
    ? assignees.find((user) => user.id === assigneeFilter)
    : null;
  const selectedAssigneeLabel = selectedAssignee
    ? `${selectedAssignee.firstName} ${selectedAssignee.lastName}`
    : assigneeFilter;

  const appliedFilters = [
    query.trim(),
    statusFilter ? statusLabel(statusFilter) : "",
    categoryFilter.trim(),
    selectedAssigneeLabel || "",
    fromDate,
    toDate,
  ].filter(Boolean);

  const getTaskTypeButtonClass = (type: TodoRow["type"]) =>
    taskTypeFilter === type
      ? "rbac-button"
      : "rbac-button rbac-button-secondary";

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTarget, setModalTarget] = useState<TodoRow | null>(null);
  const [modalDraft, setModalDraft] = useState<TodoUpdateDraft>({
    comments: "",
    status: "TODO",
  });
  const [savingId, setSavingId] = useState<string | null>(null);
  const buildTaskListUrl = useCallback(
    (type: TodoRow["type"]) => `/dashboard/task-management?type=${type}`,
    [],
  );

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
      if (taskTypeFilter) params.set("type", taskTypeFilter);
      if (categoryFilter.trim()) params.set("category", categoryFilter.trim());
      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);
      if (isAdmin && assigneeFilter) params.set("assigneeId", assigneeFilter);

      const endpoint = "/api/task-management";
      const res = await fetch(`${endpoint}?${params.toString()}`);
      if (!res.ok) return;

      const data = await res.json();
      setTodos(Array.isArray(data?.data) ? data.data : []);
      setTotal(typeof data?.total === "number" ? data.total : 0);
    } catch (error) {
      console.error("Failed to load tasks", error);
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
    taskTypeFilter,
    categoryFilter,
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

  const handleEdit = useCallback(
    (row: TodoRow) => {
      router.push(`/dashboard/task-management/${row.id}`);
    },
    [router],
  );

  const handleDeleteTodo = useCallback(
    (row: TodoRow) => {
      if (!isAdmin && !row.canManage) {
        toast.error("You can only delete tasks created by you.");
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
        const res = await fetch(`/api/task-management/${row.id}`, {
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

        toast.success("Task updated successfully.");
        return true;
      } catch (error) {
        console.error("Failed to update task", error);
        toast.error("Failed to update task.");
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
    setDeleting(true);
    try {
      const endpoint = "/api/task-management";
      const res = await fetch(`${endpoint}/${confirmTarget.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error || "Failed to delete task.");
        return;
      }

      await loadTodos();
      toast.success("Task deleted successfully.");
    } catch (error) {
      console.error("Failed to delete task", error);
      toast.error("Failed to delete task.");
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setConfirmTarget(null);
    }
  }, [confirmTarget, loadTodos]);

  const adminColumns = useMemo<ColumnDef<TodoRow>[]>(
    () => [
      {
        header: "Project Name",
        accessorKey: "projectName",
        size: 600,
        cell: ({ row, getValue }) =>
          renderProjectName(
            String(getValue() || "-"),
            row.original.projectCity,
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
        header: "Task Type",
        accessorKey: "type",
        size: 700,
        cell: (info) => (
          <span className="rbac-muted">
            {formatTaskType(String(info.getValue() || ""))}
          </span>
        ),
      },
      {
        header: "Category",
        accessorKey: "categoryName",
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
            <span className="rbac-muted">
              {value ? formatToDDMMYYYY(value) : "-"}
            </span>
          );
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
              onClick={() => handleDeleteTodo(row.original)}
            >
              <FaTrash />
            </button>
          </div>
        ),
      },
    ],
    [handleDeleteTodo, handleEdit],
  );

  const employeeColumns = useMemo<ColumnDef<TodoRow>[]>(
    () => [
      {
        header: "Project Name",
        accessorKey: "projectName",
        size: 700,
        cell: ({ row, getValue }) =>
          renderProjectName(
            String(getValue() || "-"),
            row.original.projectCity,
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
        header: "Task Type",
        accessorKey: "type",
        size: 700,
        cell: (info) => (
          <span className="rbac-muted">
            {formatTaskType(String(info.getValue() || ""))}
          </span>
        ),
      },
      {
        header: "Category",
        accessorKey: "categoryName",
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
            <span className="rbac-muted">
              {value ? formatToDDMMYYYY(value) : "-"}
            </span>
          );
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
                  <button
                    className="rbac-link"
                    type="button"
                    onClick={() => handleEdit(row.original)}
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
                </>
              )}
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
    [handleDeleteTodo, handleEdit, openModal],
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
      <section className="rbac-section rbac-container">
        <div className="rbac-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="rbac-title-lg">Task Management</h3>
            <div className="flex items-center gap-2">
              <button
                className="rbac-button rbac-button-secondary theme-button-secondary inline-flex items-center gap-2"
                type="button"
                onClick={openFilters}
              >
                <FaFilter /> <span>Filters</span>
              </button>
              <button
                className="rbac-button"
                type="button"
                onClick={() =>
                  router.push(
                    `/dashboard/task-management/new?type=${taskTypeFilter}`,
                  )
                }
              >
                Add Task
              </button>
            </div>
          </div>

          <AppliedFilterSummary
            items={appliedFilters}
            onClear={() => {
              setPageIndex(0);
              setQuery("");
              setStatusFilter("");
              setTaskTypeFilter("PROJECT");
              setCategoryFilter("");
              setAssigneeFilter("");
              setFromDate("");
              setToDate("");
              setFilterOpen(false);
            }}
          />

            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                className={getTaskTypeButtonClass("PROJECT")}
                onClick={() => {
                  setPageIndex(0);
                  setTaskTypeFilter("PROJECT");
                  router.replace(buildTaskListUrl("PROJECT"), { scroll: false });
                }}
              >
                Project
              </button>
              <button
                type="button"
                className={getTaskTypeButtonClass("OFFICE")}
                onClick={() => {
                  setPageIndex(0);
                  setTaskTypeFilter("OFFICE");
                  router.replace(buildTaskListUrl("OFFICE"), { scroll: false });
                }}
              >
                Office
              </button>
              <button
                type="button"
                className={getTaskTypeButtonClass("SERVICE")}
                onClick={() => {
                  setPageIndex(0);
                  setTaskTypeFilter("SERVICE");
                  router.replace(buildTaskListUrl("SERVICE"), { scroll: false });
                }}
              >
                Service
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
                  {!loading && todos.length === 0 && (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-4 py-3 text-sm text-slate-500"
                      >
                        No tasks found.
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
            <div className="md:hidden">
              <TaskTableCard
                title="Tasks"
                rows={todos}
                loading={loading}
                emptyLabel="No tasks found."
                showHeader={false}
                collapsible={false}
                renderActions={(todo) => (
                  <>
                    {(isAdmin || todo.canManage) && (
                      <div className="flex justify-end">
                        <button
                          className="rbac-link"
                          type="button"
                          title="Edit"
                          onClick={() => handleEdit(todo)}
                        >
                          <FaEdit size={18} />
                        </button>
                        <button
                          style={{ padding: "2px" }}
                          className="rbac-link danger"
                          type="button"
                          onClick={() => handleDeleteTodo(todo)}
                          title="Delete"
                        >
                          <FaTrash size={18} />
                        </button>
                      </div>
                    )}
                    {!isAdmin && (
                      <button
                        className="rbac-button rbac-button-secondary"
                        type="button"
                        onClick={() => openModal(todo)}
                      >
                        Update
                      </button>
                    )}
                  </>
                )}
              />
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
                  <option value="COMPLETED">Completed</option>
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
        title="Delete task?"
        description="Are you sure you want to delete?"
        confirmLabel="Delete"
        confirmLoading={deleting}
        confirmLoadingLabel="Deleting..."
        cancelLabel="Cancel"
        onConfirm={confirmDeleteTodo}
        onClose={() => {
          setConfirmOpen(false);
          setConfirmTarget(null);
        }}
      />
      <ListingFilterDialog
        open={filterOpen}
        title="Task Filters"
        description="Update the filters and apply them when you're ready."
        onClose={closeFilters}
        onApply={applyFilters}
        activeCount={activeFilterCount}
      >
        <input
          className="rbac-input-filter"
          type="text"
          placeholder="Search..."
          value={draftQuery}
          onChange={(event) => setDraftQuery(event.target.value)}
        />
        <select
          className="rbac-input-filter rbac-select"
          value={draftStatusFilter}
          onChange={(event) => setDraftStatusFilter(event.target.value)}
        >
          <option value="">All status</option>
          <option value="TODO">To do</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="ON_HOLD">On hold</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <input
          className="rbac-input-filter"
          type="text"
          placeholder="Category"
          value={draftCategoryFilter}
          onChange={(event) => setDraftCategoryFilter(event.target.value)}
        />
        {isAdmin && (
          <select
            className="rbac-input-filter rbac-select"
            value={draftAssigneeFilter}
            onChange={(event) => setDraftAssigneeFilter(event.target.value)}
          >
            <option value="">All assignees</option>
            {assignees.map((user) => (
              <option key={user.id} value={user.id}>
                {user.firstName} {user.lastName}
              </option>
            ))}
          </select>
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
