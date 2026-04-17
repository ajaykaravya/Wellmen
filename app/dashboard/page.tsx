"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ColumnDef } from "@tanstack/table-core";
import { formatToDDMMYYYY, getTodayInputDate } from "@/lib/dateUtils";
import { toast } from "react-toastify";
import DashboardShell, {
  useDashboardContext,
} from "./_components/DashboardShell";
import Loading from "../components/Loading";
import CustomDatePicker from "../components/CustomDatePicker";
import {
  FaChevronLeft,
  FaChevronRight,
  FaEye,
  FaClock,
  FaHourglass,
  FaCheckCircle,
  FaSpinner,
} from "react-icons/fa";
import Link from "next/link";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { FaListCheck } from "react-icons/fa6";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
  Legend,
);

type TodoStatus = "TODO" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED";

type TodoRow = {
  id: string;
  title: string;
  description: string | null;
  comments: string | null;
  startDate: string;
  status: TodoStatus;
  assignee: {
    id: string;
    firstName: string;
    lastName: string;
    mobileNumber: string;
    role?: string | null;
  } | null;
};

type TodoDraft = {
  comments: string;
  status: TodoStatus;
};

type OverviewTableMeta = {
  savingId: string | null;
  openUpdateModal: (row: TodoRow) => void;
};

type AdminReportRow = {
  id: string;
  reportDate: string;
  projectName: string;
  title: string;
  description: string;
  createdByName: string;
  status: string;
  imageUrls: string[];
  videoUrl: string | null;
};

const shiftInputDate = (value: string, diffDays: number) => {
  let base: Date;
  if (value) {
    const parts = value.split("/");
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      base = new Date(year, month, day);
    } else {
      base = new Date();
    }
  } else {
    base = new Date();
  }

  if (Number.isNaN(base.getTime())) return getTodayInputDate();
  base.setDate(base.getDate() + diffDays);

  const day = base.getDate().toString().padStart(2, "0");
  const month = (base.getMonth() + 1).toString().padStart(2, "0");
  const year = base.getFullYear();
  return `${day}/${month}/${year}`;
};

function OverviewContent() {
  const { user, isAdmin } = useDashboardContext();
  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : "";

  const [todos, setTodos] = useState<TodoRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTarget, setModalTarget] = useState<TodoRow | null>(null);
  const [modalDraft, setModalDraft] = useState<TodoDraft>({
    comments: "",
    status: "TODO",
  });

  const [adminDate, setAdminDate] = useState(getTodayInputDate());
  const [adminReports, setAdminReports] = useState<AdminReportRow[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [userReports, setUserReports] = useState<AdminReportRow[]>([]);
  const [userReportsLoading, setUserReportsLoading] = useState(false);
  const [reportViewOpen, setReportViewOpen] = useState(false);
  const [reportViewLoading, setReportViewLoading] = useState(false);
  const [reportViewData, setReportViewData] = useState<AdminReportRow | null>(
    null,
  );

  const loadTodayTodos = useCallback(async () => {
    setLoading(true);
    try {
      const today = getTodayInputDate();
      const endpoint = isAdmin ? "/api/todos" : "/api/my-todos";
      const res = await fetch(
        `${endpoint}?fromDate=${today}&page=1&pageSize=10`,
      );
      if (!res.ok) return;

      const data = await res.json();
      const rows = Array.isArray(data?.data) ? data.data : [];
      setTodos(rows);
    } catch (error) {
      console.error("Failed to load today tasks", error);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadTodayTodos();
  }, [loadTodayTodos]);

  const loadAdminReports = useCallback(async () => {
    if (!isAdmin) return;

    setAdminLoading(true);
    try {
      const params = new URLSearchParams({
        fromDate: adminDate,
        page: "1",
        pageSize: "50",
      });

      const res = await fetch(`/api/reports?${params.toString()}`);
      if (!res.ok) return;

      const data = await res.json();
      setAdminReports(Array.isArray(data?.data) ? data.data : []);
    } catch (error) {
      console.error("Failed to load admin reports", error);
    } finally {
      setAdminLoading(false);
    }
  }, [adminDate, isAdmin]);

  useEffect(() => {
    loadAdminReports();
  }, [loadAdminReports]);

  const loadUserReports = useCallback(async () => {
    if (isAdmin) return;

    setUserReportsLoading(true);
    try {
      const today = getTodayInputDate();
      const res = await fetch(
        `/api/reports?fromDate=${today}&page=1&pageSize=20`,
      );
      if (!res.ok) return;
      const data = await res.json();
      setUserReports(Array.isArray(data?.data) ? data.data : []);
    } catch (error) {
      console.error("Failed to load user reports", error);
    } finally {
      setUserReportsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadUserReports();
  }, [loadUserReports]);

  const openReportView = useCallback(async (row: AdminReportRow) => {
    setReportViewOpen(true);
    setReportViewLoading(true);
    setReportViewData(null);

    try {
      const res = await fetch(`/api/reports/${row.id}`);
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error || "Failed to load report details.");
        setReportViewOpen(false);
        return;
      }

      const data = await res.json();
      setReportViewData(data);
    } catch (error) {
      console.error("Failed to load report details", error);
      toast.error("Failed to load report details.");
      setReportViewOpen(false);
    } finally {
      setReportViewLoading(false);
    }
  }, []);

  const handleSave = useCallback(async (row: TodoRow, draft?: TodoDraft) => {
    if (!draft) return false;

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
      toast.success("Task updated.");
      return true;
    } catch (error) {
      console.error("Failed to update task", error);
      toast.error("Failed to update task.");
      return false;
    } finally {
      setSavingId(null);
    }
  }, []);

  const openUpdateModal = useCallback((row: TodoRow) => {
    setModalTarget(row);
    setModalDraft({ comments: row.comments || "", status: row.status });
    setModalOpen(true);
  }, []);

  const closeUpdateModal = useCallback(() => {
    setModalOpen(false);
    setModalTarget(null);
    setModalDraft({ comments: "", status: "TODO" });
  }, []);

  const handleModalSave = useCallback(async () => {
    if (!modalTarget) return;
    const ok = await handleSave(modalTarget, modalDraft);
    if (ok) closeUpdateModal();
  }, [closeUpdateModal, handleSave, modalDraft, modalTarget]);

  const tableMeta = useMemo<OverviewTableMeta>(
    () => ({
      savingId,
      openUpdateModal,
    }),
    [savingId, openUpdateModal],
  );

  const columns = useMemo<ColumnDef<TodoRow>[]>(() => {
    if (isAdmin) {
      return [
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
          size: 500,
          cell: ({ row }) => (
            <span className="rbac-muted">
              {row.original.description || "-"}
            </span>
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
          header: "Status",
          accessorKey: "status",
          cell: ({ row }) => (
            <span className="rbac-muted">
              {String(row.original.status || "").replaceAll("_", " ")}
            </span>
          ),
        },
        {
          header: "Assignee",
          id: "assignee",
          cell: ({ row }) => {
            const assignee = row.original.assignee;
            if (!assignee)
              return <span className="rbac-muted">Unassigned</span>;
            return (
              <span className="rbac-muted">
                {assignee.firstName} {assignee.lastName}
              </span>
            );
          },
        },
        {
          header: "Assignee Role",
          id: "assigneeRole",
          cell: ({ row }) => (
            <span className="rbac-muted">
              {row.original.assignee?.role || "-"}
            </span>
          ),
        },
      ];
    }

    return [
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
        size: 500,
        cell: ({ row }) => (
          <span className="rbac-muted">{row.original.description || "-"}</span>
        ),
      },
      {
        header: "Comments",
        id: "comments",
        size: 500,
        cell: ({ row }) => (
          <span className="rbac-muted">{row.original.comments || "-"}</span>
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
        header: "Status",
        accessorKey: "status",
        cell: ({ row }) => (
          <span className="rbac-muted">
            {String(row.original.status || "").replaceAll("_", " ")}
          </span>
        ),
      },
      {
        header: "Action",
        id: "action",
        cell: ({ row, table }) => {
          const meta = table.options.meta as OverviewTableMeta;
          const isSaving = meta?.savingId === row.original.id;

          return (
            <button
              className="rbac-button rbac-button-secondary"
              type="button"
              onClick={() => meta?.openUpdateModal(row.original)}
              disabled={isSaving}
            >
              {"Update"}
            </button>
          );
        },
      },
    ];
  }, [isAdmin]);

  const table = useReactTable({
    data: todos,
    columns,
    meta: tableMeta,
    getCoreRowModel: getCoreRowModel(),
  });

  const todoTotal = todos.length;
  const todoInProgress = todos.filter(
    (task) => task.status === "IN_PROGRESS",
  ).length;
  const todoTodo = todos.filter((task) => task.status === "TODO").length;
  const todoCompleted = todos.filter(
    (task) => task.status === "COMPLETED",
  ).length;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: { display: false },
      y: { display: false },
    },
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 2,
        borderColor: "#2596be",
        backgroundColor: "rgba(37,150,190,0.2)",
        fill: "start",
      },
      point: { radius: 0 },
    },
  };

  const statsChartData = (values: number[]) => ({
    labels: values.map((_, index) => `p${index}`),
    datasets: [
      {
        data: values,
        borderColor: "#2596be",
        backgroundColor: "rgba(37,150,190,0.2)",
        fill: true,
      },
    ],
  });

  const totalTasksChart = statsChartData([
    todoTotal * 0.4,
    todoTotal * 0.6,
    todoTotal * 0.55,
    todoTotal * 0.8,
    todoTotal,
  ]);
  const inProgressChart = statsChartData([
    todoInProgress * 0.3,
    todoInProgress * 0.5,
    todoInProgress * 0.7,
    todoInProgress * 0.6,
    todoInProgress,
  ]);
  const todoChart = statsChartData([
    todoTodo * 0.4,
    todoTodo * 0.8,
    todoTodo * 0.7,
    todoTodo * 0.9,
    todoTodo,
  ]);
  const doneChart = statsChartData([
    todoCompleted * 0.2,
    todoCompleted * 0.35,
    todoCompleted * 0.45,
    todoCompleted * 0.75,
    todoCompleted,
  ]);

  const isModalDirty =
    !!modalTarget &&
    ((modalDraft.comments || "") !== (modalTarget.comments || "") ||
      modalDraft.status !== modalTarget.status);
  const isModalSaving = savingId === modalTarget?.id;

  return (
    <>
      <header className="flex justify-between gap-3 z-50 bg-white border-b border-slate-200 p-3 ">
        <div>
          <h1 className="rbac-heading text-md sm:text-2xl font-medium">
            Welcome back, {displayName}
          </h1>
          <span className="text-xs sm:text-sm text-slate-500">
            Role-based workspace tailored for {user?.role || "your role"}.
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <div className="rbac-role px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200 bg-slate-50">
            <p className="rbac-label text-[10px] sm:text-xs">Role</p>
            <p className="rbac-role-name text-xs sm:text-sm">
              {user?.role || "Unknown"}
            </p>
          </div>
        </div>
      </header>
      <section className="rbac-section mt-4 rbac-container">
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <div className="rbac-card p-6 sm:p-8 flex items-center gap-4">
            <div className="bg-blue-500 text-white rounded-full p-3 flex-shrink-0">
              <FaListCheck size={24} />
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Total Tasks</p>
              <p className="text-2xl sm:text-3xl font-bold">{todoTotal}</p>
            </div>
          </div>
          <div className="rbac-card p-4 sm:p-6 flex items-center gap-4">
            <div className="bg-orange-500 text-white rounded-full p-3 flex-shrink-0">
              <FaHourglass size={24} />
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">In Progress</p>
              <p className="text-2xl sm:text-3xl font-bold">{todoInProgress}</p>
            </div>
          </div>
          <div className="rbac-card p-4 sm:p-6 flex items-center gap-4">
            <div className="bg-cyan-500 text-white rounded-full p-3 flex-shrink-0">
              <FaClock size={24} />
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">To Do</p>
              <p className="text-2xl sm:text-3xl font-bold">{todoTodo}</p>
            </div>
          </div>
          <div className="rbac-card p-4 sm:p-6 flex items-center gap-4">
            <div className="bg-green-500 text-white rounded-full p-3 flex-shrink-0">
              <FaCheckCircle size={24} />
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Completed</p>
              <p className="text-2xl sm:text-3xl font-bold">{todoCompleted}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rbac-section mt-4 rbac-container">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rbac-card">
            <div className="flex justify-between items-center">
              <h3 className="rbac-title-lg">Today's tasks</h3>
              <Link href="/dashboard/todo/new">
                <button className="rbac-button" type="button">
                  Add Todo
                </button>
              </Link>
            </div>

            <div className="mt-4">
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full border border-slate-200 border-separate border-spacing-0">
                  <thead className="bg-slate-50">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
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
                            <FaSpinner
                              className="animate-spin mr-2"
                              size={16}
                            />
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
                          No tasks for today
                        </td>
                      </tr>
                    )}
                    {!loading &&
                      table.getRowModel().rows.map((row, index) => (
                        <tr
                          key={row.original.id}
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-slate-50"
                          }
                        >
                          {row.getVisibleCells().map((cell) => (
                            <td
                              key={cell.id}
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
                {!loading && todos.length === 0 && (
                  <div className="rbac-card py-4 text-sm text-slate-500">
                    No tasks for today
                  </div>
                )}
                {!loading &&
                  todos.map((task) => (
                    <div key={task.id} className="rbac-card p-4">
                      <p className="text-xs uppercase text-slate-500">
                        {task.title}
                      </p>
                      <p className="text-sm text-slate-700">
                        {task.description || "No description"}
                      </p>
                      <p className="text-sm text-slate-500">
                        Status: {task.status.replaceAll("_", " ")}
                      </p>
                      <p className="text-sm text-slate-500">
                        Start: {formatToDDMMYYYY(task.startDate)}
                      </p>
                      <p className="text-sm text-slate-500">
                        Comments: {task.comments || "-"}
                      </p>
                      <div className="mt-2 flex gap-2  justify-end">
                        <button
                          className="rbac-button rbac-button-secondary"
                          type="button"
                          onClick={() => setModalOpen(true)}
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="rbac-card">
            <div className="flex justify-between items-center">
              <h3 className="rbac-title-lg">
                {isAdmin ? "Employees reporting" : "Today's reporting"}
              </h3>
              {!isAdmin && (
                <Link href="/dashboard/reports/new">
                  <button className="rbac-button" type="button">
                    Add Reporting
                  </button>
                </Link>
              )}
            </div>

            {isAdmin ? (
              <div className="mt-4">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    className="change-button change-button-secondary bg-slate-200 p-2 rounded-md"
                    type="button"
                    onClick={() =>
                      setAdminDate((prev) => shiftInputDate(prev, -1))
                    }
                  >
                    <FaChevronLeft size={15} />
                  </button>
                  <CustomDatePicker
                    value={adminDate}
                    onChange={setAdminDate}
                    placeholder="Select date"
                    className="date-input"
                  />
                  <button
                    className="change-button change-button-secondary bg-slate-200 p-2 rounded-md"
                    type="button"
                    onClick={() =>
                      setAdminDate((prev) => shiftInputDate(prev, 1))
                    }
                  >
                    <FaChevronRight size={15} />
                  </button>
                </div>

                <div className="mt-4">
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full border border-slate-200 border-separate border-spacing-0">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left text-xs font-semibold uppercase tracking-[0.2em] px-4 py-3 border-b border-slate-200">
                            Project
                          </th>
                          <th className="text-left text-xs font-semibold uppercase tracking-[0.2em] px-4 py-3 border-b border-slate-200">
                            Title
                          </th>
                          <th className="text-left text-xs font-semibold uppercase tracking-[0.2em] px-4 py-3 border-b border-slate-200">
                            Description
                          </th>
                          <th className="text-left text-xs font-semibold uppercase tracking-[0.2em] px-4 py-3 border-b border-slate-200">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminLoading && (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-4 py-3 text-sm text-slate-500"
                            >
                              <div className="flex items-center justify-center">
                                <FaSpinner
                                  className="animate-spin mr-2"
                                  size={16}
                                />
                              </div>
                            </td>
                          </tr>
                        )}
                        {!adminLoading && adminReports.length === 0 && (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-4 py-3 text-sm text-slate-500"
                            >
                              No reporting found for selected date.
                            </td>
                          </tr>
                        )}
                        {!adminLoading &&
                          adminReports.map((report, index) => (
                            <tr
                              key={report.id}
                              className={
                                index % 2 === 0 ? "bg-white" : "bg-slate-50"
                              }
                            >
                              <td className="px-4 py-3 text-sm border-b border-slate-100">
                                {report.projectName}
                              </td>
                              <td className="px-4 py-3 text-sm border-b border-slate-100">
                                {report.title}
                              </td>
                              <td className="px-4 py-3 text-sm border-b border-slate-100">
                                {report.description}
                              </td>
                              <td className="px-4 py-3 text-sm border-b border-slate-100">
                                <button
                                  className="rbac-link"
                                  type="button"
                                  onClick={() => openReportView(report)}
                                >
                                  <FaEye size={15} />
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="md:hidden space-y-3">
                    {adminReports.map((report) => (
                      <div key={report.id} className="rbac-card p-4">
                        <p className="text-xs uppercase text-slate-500">
                          {report.projectName}
                        </p>
                        <p className="text-sm font-semibold">{report.title}</p>
                        <p className="text-sm text-slate-700">
                          {report.description}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatToDDMMYYYY(report.reportDate)}
                        </p>
                        <div className="flex justify-end">
                          <button
                            className="rbac-link mt-2"
                            type="button"
                            onClick={() => openReportView(report)}
                          >
                            <FaEye size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                {userReportsLoading && (
                  <div className="flex items-center justify-center py-4">
                    <FaSpinner className="animate-spin mr-2" size={16} />
                  </div>
                )}
                {!userReportsLoading && userReports.length === 0 && (
                  <p>No reporting found for today.</p>
                )}
                {!userReportsLoading && userReports.length > 0 && (
                  <div>
                    <div className="hidden md:block overflow-x-auto">
                      <table className="min-w-full border border-slate-200 border-separate border-spacing-0">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="text-left text-xs font-semibold uppercase px-4 py-3 border-b border-slate-200">
                              Date
                            </th>
                            <th className="text-left text-xs font-semibold uppercase px-4 py-3 border-b border-slate-200">
                              Project
                            </th>
                            <th className="text-left text-xs font-semibold uppercase px-4 py-3 border-b border-slate-200">
                              Title
                            </th>
                            <th className="text-left text-xs font-semibold uppercase px-4 py-3 border-b border-slate-200">
                              Status
                            </th>
                            <th className="text-left text-xs font-semibold uppercase px-4 py-3 border-b border-slate-200">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {userReports.map((report, index) => (
                            <tr
                              key={report.id}
                              className={
                                index % 2 === 0 ? "bg-white" : "bg-slate-50"
                              }
                            >
                              <td className="px-4 py-3 text-sm border-b border-slate-100">
                                {formatToDDMMYYYY(report.reportDate)}
                              </td>
                              <td className="px-4 py-3 text-sm border-b border-slate-100">
                                {report.projectName || "-"}
                              </td>
                              <td className="px-4 py-3 text-sm border-b border-slate-100">
                                {report.title || "-"}
                              </td>
                              <td className="px-4 py-3 text-sm border-b border-slate-100">
                                {report.status.replaceAll("_", " ")}
                              </td>
                              <td className="px-4 py-3 text-sm border-b border-slate-100">
                                <button
                                  className="rbac-link"
                                  type="button"
                                  onClick={() => openReportView(report)}
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="md:hidden space-y-3">
                      {userReports.map((report) => (
                        <div key={report.id} className="rbac-card p-4">
                          <p className="text-xs uppercase text-slate-500">
                            {formatToDDMMYYYY(report.reportDate)}
                          </p>
                          <p className="text-sm font-semibold">
                            {report.projectName || "-"}
                          </p>
                          <p className="text-sm text-slate-700">
                            {report.title || "-"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {report.status.replaceAll("_", " ")}
                          </p>
                          <button
                            className="rbac-link mt-2"
                            type="button"
                            onClick={() => openReportView(report)}
                          >
                            View
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {modalOpen && !isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">
              Update task
            </h2>
            <p className="mt-2 text-sm text-slate-600">
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
                onClick={closeUpdateModal}
                disabled={isModalSaving}
              >
                Cancel
              </button>
              <button
                className="rbac-button"
                type="button"
                onClick={handleModalSave}
                disabled={!isModalDirty || isModalSaving}
              >
                {isModalSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {reportViewOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Report details
                </h2>
              </div>
              <button
                className="rbac-button rbac-button-secondary"
                type="button"
                onClick={() => {
                  setReportViewOpen(false);
                  setReportViewData(null);
                }}
              >
                Close
              </button>
            </div>

            {reportViewLoading && (
              <div className="flex items-center justify-center py-4">
                <FaSpinner className="animate-spin mr-2" size={16} />
              </div>
            )}

            {!reportViewLoading && reportViewData && (
              <div className="mt-4 grid gap-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <p className="text-sm">
                    <strong>Date:</strong>{" "}
                    {formatToDDMMYYYY(reportViewData.reportDate)}
                  </p>
                  <p className="text-sm">
                    <strong>Project:</strong> {reportViewData.projectName}
                  </p>
                  <p className="text-sm">
                    <strong>Employee:</strong>{" "}
                    {reportViewData.createdByName || "-"}
                  </p>
                  <p className="text-sm">
                    <strong>Status:</strong>{" "}
                    {String(reportViewData.status || "").replaceAll("_", " ")}
                  </p>
                </div>

                <p className="text-sm">
                  <strong>Title:</strong> {reportViewData.title}
                </p>
                <p className="text-sm whitespace-pre-wrap">
                  <strong>Description:</strong> {reportViewData.description}
                </p>

                <div>
                  {reportViewData.imageUrls?.length > 0 && (
                    <>
                      <p className="text-sm font-semibold text-slate-800">
                        Images
                      </p>
                      <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {reportViewData.imageUrls.map((url) => (
                          <div
                            key={url}
                            className="rounded-xl border border-slate-200 p-2"
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
                  {reportViewData.videoUrl && (
                    <>
                      <p className="text-sm font-semibold text-slate-800">
                        Video
                      </p>
                      <div className="mt-2 rounded-xl border border-slate-200 p-3">
                        <video
                          controls
                          className="w-full rounded-lg"
                          src={reportViewData.videoUrl}
                        />
                        <a
                          className="rbac-link mt-2 inline-block"
                          href={reportViewData.videoUrl}
                          download
                        >
                          Download video
                        </a>
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

export default function DashboardPage() {
  return (
    <DashboardShell>
      <OverviewContent />
    </DashboardShell>
  );
}
