"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatToDDMMYYYY, getTodayInputDate } from "@/lib/dateUtils";
import { toast } from "react-toastify";
import DashboardShell, {
  clearCachedSession,
  useDashboardContext,
} from "./_components/DashboardShell";
import ConfirmDialog from "../components/ConfirmDialog";
import CustomDatePicker from "../components/CustomDatePicker";
import {
  FaChevronLeft,
  FaChevronRight,
  FaEye,
  FaClock,
  FaHourglass,
  FaCheckCircle,
  FaPlay,
  FaSpinner,
  FaMoon,
  FaSun,
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
import { FaListCheck } from "react-icons/fa6";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { useThemeMode } from "../components/ThemeProvider";
import { IoIosClose } from "react-icons/io";
import { FaEdit } from "react-icons/fa";
import { MdOutlineFileDownload } from "react-icons/md";
import { FaLink } from "react-icons/fa6";

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
  type: "PROJECT" | "OFFICE" | "SERVICE";
  projectName?: string | null;
  projectCity?: string | null;
  categoryName?: string | null;
  assignee: {
    id: string;
    firstName: string;
    lastName: string;
    mobileNumber: string;
    role?: string | null;
  } | null;
};

type QueryRow = {
  id: string;
  projectId: string;
  projectName: string;
  projectCity: string | null;
  category: "REMARKS" | "URGENCY" | "DECISION_PENDING" | "";
  description: string;
  status: "PENDING" | "COMPLETED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  createdById: string;
  createdByName: string;
};

type TodoDraft = {
  comments: string;
  status: TodoStatus;
};

type AdminReportRow = {
  id: string;
  reportDate: string;
  projectName: string;
  projectCity: string | null;
  categoryName: string;
  description: string;
  createdByName: string;
  imageUrls: string[];
  videoUrl: string | null;
  videoUrls?: string[];
};

type TaskTableCardProps = {
  title: string;
  rows: TodoRow[];
  loading: boolean;
  emptyLabel: string;
  addTaskType: TodoRow["type"];
  onUpdate?: (row: TodoRow) => void;
};

type QueryTableCardProps = {
  title: string;
  rows: QueryRow[];
  loading: boolean;
  emptyLabel: string;
  viewAllHref: string;
  addQueryHref: string;
};

const formatText = (text: string) => {
  const formation = text.replaceAll("_", " ").toLowerCase();
  const formatted = formation.charAt(0).toUpperCase() + formation.slice(1);
  return formatted;
};

const getTaskStatusBadgeClass = (status: TodoStatus) => {
  switch (status) {
    case "TODO":
      return "bg-amber-100 text-amber-800 ring-1 ring-amber-200";
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-800 ring-1 ring-blue-200";
    case "ON_HOLD":
      return "bg-orange-100 text-orange-800 ring-1 ring-orange-200";
    case "COMPLETED":
      return "bg-green-100 text-green-800 ring-1 ring-green-200";
    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  }
};

const getQueryStatusBadgeClass = (status: QueryRow["status"]) => {
  switch (status) {
    case "PENDING":
      return "bg-rose-100 text-rose-800 ring-1 ring-rose-200";
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200";
    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  }
};

const getQueryPriorityBadgeClass = (priority: QueryRow["priority"]) => {
  switch (priority) {
    case "LOW":
      return "bg-amber-100 text-amber-800 ring-1 ring-amber-200";
    case "MEDIUM":
      return "bg-orange-100 text-orange-800 ring-1 ring-orange-200";
    case "HIGH":
      return "bg-red-100 text-red-800 ring-1 ring-red-200";
    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  }
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

function TaskTableCard({
  title,
  rows,
  loading,
  emptyLabel,
  addTaskType,
  onUpdate,
}: TaskTableCardProps) {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="rbac-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center justify-between gap-2 w-full">
          <h3 className="sm:text-base text-sm font-medium w-full">{title}</h3>
          <div className="flex items-center gap-2 justify-end w-full">
            <Link href={`/dashboard/task-management/new?type=${addTaskType}`}>
              <button className="rbac-button" type="button">
                Add Task
              </button>
            </Link>
            <button
              className="change-button change-button-secondary px-3 py-2 rounded-md"
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              aria-expanded={!collapsed}
              aria-label={`${collapsed ? "Expand" : "Collapse"} ${title}`}
            >
              <FaChevronRight
                className={`transition-transform duration-200 ${
                  collapsed ? "" : "rotate-90"
                }`}
                size={14}
              />
            </button>
          </div>
        </div>
      </div>

      <div
        className={`overflow-hidden transition-[max-height,opacity,transform,margin-top] duration-300 ease-in-out ${
          collapsed
            ? "mt-0 max-h-0 opacity-0 -translate-y-2 pointer-events-none"
            : "mt-4 max-h-[4000px] opacity-100 translate-y-0"
        }`}
        aria-hidden={collapsed}
      >
        <div className="space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-4">
              <FaSpinner className="animate-spin mr-2" size={16} />
            </div>
          )}
          {!loading && rows.length === 0 && (
            <div className="rbac-card py-4 text-sm ">{emptyLabel}</div>
          )}
          {!loading &&
            rows.map((task) => (
              <div key={task.id} className="flex rbac-card p-4 sm:p-5">
                <div className="w-full mt-3 grid text-sm">
                  {task.projectName && (
                    <p className="font-semibold text-base">
                      {task.projectName}
                    </p>
                  )}
                  {task.projectCity && (
                    <p className="text-sm text-slate-500">{task.projectCity}</p>
                  )}
                  {"categoryName" in task && (
                    <p className="text-sm mt-1">{task.categoryName || "-"}</p>
                  )}
                  {task.description && (
                    <p className="text-sm">{task.description}</p>
                  )}
                  {"comments" in task && (
                    <p className="text-sm">{task.comments || "-"}</p>
                  )}
                  {task.assignee && (
                    <p className="text-sm">
                      {task.assignee.firstName} {task.assignee.lastName}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="mt-1 text-base font-semibold theme-text">
                      {task.title}
                    </h4>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium tracking-[0.2em] w-max ${getTaskStatusBadgeClass(
                      task.status,
                    )}`}
                  >
                    {formatText(task.status)}
                  </span>
                </div>

                <div className="flex gap-2 justify-end">
                  {onUpdate && (
                    <button
                      className="h-fit"
                      type="button"
                      onClick={() => onUpdate(task)}
                    >
                      <FaEdit />
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function QueryTableCard({
  title,
  rows,
  loading,
  emptyLabel,
  viewAllHref,
  addQueryHref,
}: QueryTableCardProps) {
  const [collapsed, setCollapsed] = useState(true);
  const { theme } = useThemeMode();

  return (
    <div className="rbac-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center justify-between gap-2 w-full">
          <h3 className="sm:text-base text-sm font-medium w-full">{title}</h3>
          <div className="flex items-center gap-2 justify-end w-full">
            <Link href={addQueryHref}>
              <button className="rbac-button" type="button">
                Add Query
              </button>
            </Link>
            <Link href={viewAllHref}>
              <button
                className="rbac-button rbac-button-secondary"
                type="button"
              >
                View All
              </button>
            </Link>
            <button
              className="change-button change-button-secondary px-3 py-2 rounded-md"
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              aria-expanded={!collapsed}
              aria-label={`${collapsed ? "Expand" : "Collapse"} ${title}`}
            >
              <FaChevronRight
                className={`transition-transform duration-200 ${
                  theme === "dark" ? "text-white" : "text-black"
                } ${collapsed ? "" : "rotate-90"}`}
                size={14}
              />
            </button>
          </div>
        </div>
      </div>

      <div
        className={`overflow-hidden transition-[max-height,opacity,transform,margin-top] duration-300 ease-in-out ${
          collapsed
            ? "mt-0 max-h-0 opacity-0 -translate-y-2 pointer-events-none"
            : "mt-4 max-h-[4000px] opacity-100 translate-y-0"
        }`}
        aria-hidden={collapsed}
      >
        <div className="space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-4">
              <FaSpinner className="animate-spin mr-2" size={16} />
            </div>
          )}
          {!loading && rows.length === 0 && (
            <div className="rbac-card py-4 text-sm">{emptyLabel}</div>
          )}
          {!loading &&
            rows.map((query) => (
              <div key={query.id} className="rbac-card p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold ">
                      {query.projectName || "Project"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {query.projectCity || "Project"}
                    </p>
                    <h4 className="mt-1 text-sm">
                      {query.category ? formatText(query.category) : "Query"}
                    </h4>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium tracking-[0.2em] ${getQueryStatusBadgeClass(
                        query.status,
                      )}`}
                    >
                      {formatText(query.status)}
                    </span>
                    <p>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium tracking-[0.2em] ${getQueryPriorityBadgeClass(
                          query.priority,
                        )}`}
                      >
                        {formatText(query.priority)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="grid text-sm">
                  <p>{query.description || "No description"}</p>

                  <p>
                    <span>By:</span> {query.createdByName || "-"}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function OverviewContent() {
  const { user, isAdmin } = useDashboardContext();
  const { theme, toggleTheme } = useThemeMode();
  const router = useRouter();
  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : "";

  const [todos, setTodos] = useState<TodoRow[]>([]);
  const [query, setQuery] = useState<QueryRow[]>([]);
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
  const [reportImageIndex, setReportImageIndex] = useState<number | null>(null);
  const [reportVideoIndex, setReportVideoIndex] = useState<number | null>(null);

  const [collapsed, setCollapsed] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [changePasswordSubmitting, setChangePasswordSubmitting] =
    useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordNotice, setPasswordNotice] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const passwordsDoNotMatch =
    !!passwordForm.newPassword &&
    !!passwordForm.confirmPassword &&
    passwordForm.newPassword !== passwordForm.confirmPassword;

  const projectTasks = useMemo(
    () => todos.filter((task) => task.type === "PROJECT"),
    [todos],
  );
  const officeTasks = useMemo(
    () => todos.filter((task) => task.type === "OFFICE"),
    [todos],
  );
  const serviceTasks = useMemo(
    () => todos.filter((task) => task.type === "SERVICE"),
    [todos],
  );

  const pendingQuery = useMemo(
    () => query.filter((q) => q.status === "PENDING"),
    [query],
  );
  const reportImageUrls = useMemo(
    () => reportViewData?.imageUrls ?? [],
    [reportViewData],
  );
  const reportVideoUrls = useMemo(
    () =>
      reportViewData
        ? reportViewData.videoUrls?.length
          ? reportViewData.videoUrls
          : reportViewData.videoUrl
          ? [reportViewData.videoUrl]
          : []
        : [],
    [reportViewData],
  );
  const selectedReportImage =
    reportImageIndex !== null ? reportImageUrls[reportImageIndex] : null;
  const selectedReportVideo =
    reportVideoIndex !== null ? reportVideoUrls[reportVideoIndex] : null;

  const loadTodos = useCallback(async () => {
    setLoading(true);
    try {
      const today = getTodayInputDate();
      const endpoint = isAdmin ? "/api/todos" : "/api/my-todos";
      const res = await fetch(
        `${endpoint}?fromDate=${today}&includePendingOld=true&page=1&pageSize=10`,
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
    loadTodos();
  }, [loadTodos]);

  const loadQuery = useCallback(async () => {
    try {
      const endpoint = isAdmin
        ? "/api/query-management"
        : "/api/my-query-management";
      const res = await fetch(endpoint);
      if (!res.ok) return;

      const data = await res.json();
      const rows = Array.isArray(data?.data) ? data.data : [];
      setQuery(rows);
    } catch (error) {
      console.error("Failed to load query", error);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadQuery();
  }, [loadQuery]);

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
    setReportImageIndex(null);
    setReportVideoIndex(null);

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

  const closeReportView = useCallback(() => {
    setReportViewOpen(false);
    setReportViewData(null);
    setReportImageIndex(null);
    setReportVideoIndex(null);
  }, []);

  const openReportImage = useCallback((index: number) => {
    setReportVideoIndex(null);
    setReportImageIndex(index);
  }, []);

  const openReportVideo = useCallback((index: number) => {
    setReportImageIndex(null);
    setReportVideoIndex(index);
  }, []);

  const showPreviousReportImage = useCallback(() => {
    if (!reportImageUrls.length) return;
    setReportImageIndex((current) => {
      if (current === null) return 0;
      return (current - 1 + reportImageUrls.length) % reportImageUrls.length;
    });
  }, [reportImageUrls.length]);

  const showNextReportImage = useCallback(() => {
    if (!reportImageUrls.length) return;
    setReportImageIndex((current) => {
      if (current === null) return 0;
      return (current + 1) % reportImageUrls.length;
    });
  }, [reportImageUrls.length]);

  const showPreviousReportVideo = useCallback(() => {
    if (!reportVideoUrls.length) return;
    setReportVideoIndex((current) => {
      if (current === null) return 0;
      return (current - 1 + reportVideoUrls.length) % reportVideoUrls.length;
    });
  }, [reportVideoUrls.length]);

  const showNextReportVideo = useCallback(() => {
    if (!reportVideoUrls.length) return;
    setReportVideoIndex((current) => {
      if (current === null) return 0;
      return (current + 1) % reportVideoUrls.length;
    });
  }, [reportVideoUrls.length]);

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

  const todoTotal = todos.length;
  const todoInProgress = todos.filter(
    (task) => task.status === "IN_PROGRESS",
  ).length;
  const todoTodo = todos.filter((task) => task.status === "TODO").length;
  const todoCompleted = todos.filter(
    (task) => task.status === "COMPLETED",
  ).length;

  const queryPending = query
    ? query.filter((q) => q.status === "PENDING").length
    : 0;

  const queryCompleted = query
    ? query.filter((q) => q.status === "COMPLETED").length
    : 0;

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

  const isModalDirty =
    !!modalTarget &&
    ((modalDraft.comments || "") !== (modalTarget.comments || "") ||
      modalDraft.status !== modalTarget.status);
  const isModalSaving = savingId === modalTarget?.id;

  const closeChangePasswordModal = useCallback(() => {
    setChangePasswordOpen(false);
    setChangePasswordSubmitting(false);
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  }, []);

  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      clearCachedSession();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setLogoutLoading(false);
    }
  }, [router]);

  const handleChangePassword = useCallback(async () => {
    const currentPassword = passwordForm.currentPassword.trim();
    const newPassword = passwordForm.newPassword.trim();
    const confirmPassword = passwordForm.confirmPassword.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordNotice({
        type: "error",
        message: "Please fill in all password fields.",
      });
      return;
    }

    if (!/^\d{4}$/.test(newPassword)) {
      setPasswordNotice({
        type: "error",
        message: "New password must be exactly 4 digits.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordNotice({
        type: "error",
        message: "New password and confirm password must match.",
      });
      return;
    }

    setChangePasswordSubmitting(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPasswordNotice({
          type: "error",
          message: payload.error || "Failed to change password.",
        });
        return;
      }

      setPasswordNotice({
        type: "success",
        message: "Password changed successfully.",
      });
      closeChangePasswordModal();
    } catch (error) {
      console.error("Failed to change password", error);
      setPasswordNotice({
        type: "error",
        message: "Failed to change password.",
      });
    } finally {
      setChangePasswordSubmitting(false);
    }
  }, [closeChangePasswordModal, passwordForm]);

  return (
    <>
      <header
        className="flex justify-between gap-3 z-50 p-4 sm:p-3"
        style={{
          background: "var(--card)",
          borderBottom: "1px solid var(--stroke)",
        }}
      >
        <div className="w-full">
          <h1 className="rbac-heading text-lg sm:text-2xl font-medium">
            Welcome back, {displayName}
          </h1>
        </div>
        <Menu
          as="div"
          className="relative flex flex-wrap items-center justify-end gap-2 w-full"
        >
          <button
            className="rbac-theme-toggle hidden xl:inline-flex"
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${
              theme === "light" ? "dark" : "light"
            } mode`}
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? <FaMoon size={14} /> : <FaSun size={14} />}
          </button>
          <MenuButton
            className="theme-input flex items-center gap-2 rounded-xl px-2 py-1 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400/40 sm:px-3 sm:py-1.5"
            style={{ width: "fit-content" }}
          >
            <div>
              <p className="rbac-role-name text-xs sm:text-sm">
                {user?.role || "Unknown"}
              </p>
            </div>
            <ChevronDownIcon
              className="h-4 w-4"
              style={{ color: "var(--muted)" }}
            />
          </MenuButton>

          <MenuItems
            modal={false}
            anchor="bottom end"
            className="theme-modal-surface z-50 mt-2 w-56 origin-top-right rounded-2xl border p-1 shadow-lg outline-none transition duration-150 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
          >
            <MenuItem>
              {({ focus }) => (
                <button
                  type="button"
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                    focus ? "theme-button-secondary theme-text" : "theme-text-muted"
                  }`}
                  onClick={() => {
                    setPasswordNotice(null);
                    setChangePasswordOpen(true);
                  }}
                >
                  Change password
                </button>
              )}
            </MenuItem>
            <MenuItem>
              {({ focus }) => (
                <button
                  type="button"
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                    focus
                      ? "theme-status-danger"
                      : "text-[color:var(--theme-danger-text)]"
                  }`}
                  onClick={() => setConfirmLogoutOpen(true)}
                >
                  Logout
                </button>
              )}
            </MenuItem>
          </MenuItems>
        </Menu>
      </header>

      <Dialog
        open={changePasswordOpen}
        onClose={closeChangePasswordModal}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="theme-modal-surface w-full max-w-md rounded-2xl p-6 shadow-xl">
            <DialogTitle className="text-lg font-semibold theme-text">
              Change password
            </DialogTitle>
            <p className="mt-1 text-sm theme-text-muted">
              Enter your current password and choose a new 4-digit password.
            </p>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium theme-text">
                  Current password
                </span>
                <input
                  type="password"
                  maxLength={4}
                  value={passwordForm.currentPassword}
                  onChange={(event) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      currentPassword: event.target.value,
                    }))
                  }
                  className="theme-input w-full rounded-xl px-3 py-2 text-sm outline-none transition"
                  placeholder="Enter current password"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium theme-text">
                  New password
                </span>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      newPassword: event.target.value,
                    }))
                  }
                  className="theme-input w-full rounded-xl px-3 py-2 text-sm outline-none transition"
                  placeholder="Enter 4-digit password"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium theme-text">
                  Confirm password
                </span>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      confirmPassword: event.target.value,
                    }))
                  }
                  className="theme-input w-full rounded-xl px-3 py-2 text-sm outline-none transition"
                  placeholder="Re-enter new password"
                />
              </label>

              {passwordsDoNotMatch && (
                <p className="text-sm text-rose-600">
                  New password and confirm password must match.
                </p>
              )}

              {passwordNotice && (
                <div
                  className={`rounded-xl px-3 py-2 text-sm ${
                    passwordNotice.type === "success"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-rose-50 text-rose-700"
                  }`}
                >
                  {passwordNotice.message}
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                className="rbac-button rbac-button-secondary"
                onClick={closeChangePasswordModal}
                disabled={changePasswordSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rbac-button"
                onClick={handleChangePassword}
                disabled={changePasswordSubmitting || passwordsDoNotMatch}
              >
                {changePasswordSubmitting ? "Saving..." : "Save password"}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <ConfirmDialog
        open={confirmLogoutOpen}
        title="Confirm logout"
        description="Are you sure you want to logout?"
        confirmLabel="Yes"
        confirmLoading={logoutLoading}
        confirmLoadingLabel="Logging out..."
        cancelLabel="No"
        onConfirm={handleLogout}
        onClose={() => setConfirmLogoutOpen(false)}
      />

      <section className="rbac-section mt-4 rbac-container">
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <div className="rbac-card p-4 sm:p-6 flex items-center gap-4">
            <div className="bg-cyan-500 text-white rounded-full p-3 shrink-0">
              <FaClock size={24} />
            </div>
            <div>
              <p className="text-xs uppercase">Pending Queries</p>
              <p className="text-2xl sm:text-3xl font-bold">{queryPending}</p>
            </div>
          </div>
          <div className="rbac-card p-4 sm:p-6 flex items-center gap-4">
            <div className="bg-green-500 text-white rounded-full p-3 shrink-0">
              <FaCheckCircle size={24} />
            </div>
            <div>
              <p className="text-xs uppercase">Completed Query</p>
              <p className="text-2xl sm:text-3xl font-bold">{queryCompleted}</p>
            </div>
          </div>
        </div>
        <QueryTableCard
          title="Pending Queries"
          rows={pendingQuery}
          loading={loading}
          emptyLabel="No pending queries for today"
          viewAllHref={
            isAdmin
              ? "/dashboard/query-management?status=PENDING"
              : "/dashboard/my-query-management?status=PENDING"
          }
          addQueryHref={
            isAdmin
              ? "/dashboard/query-management/new"
              : "/dashboard/my-query-management/new"
          }
        />
      </section>
      <section className="rbac-section mt-4 rbac-container">
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <div className="rbac-card p-6 sm:p-8 flex items-center gap-4">
            <div className="bg-blue-500 text-white rounded-full p-3 shrink-0">
              <FaListCheck size={24} />
            </div>
            <div>
              <p className="text-xs uppercase">Total Tasks</p>
              <p className="text-2xl sm:text-3xl font-bold">{todoTotal}</p>
            </div>
          </div>
          <div className="rbac-card p-4 sm:p-6 flex items-center gap-4">
            <div className="bg-orange-500 text-white rounded-full p-3 shrink-0">
              <FaHourglass size={24} />
            </div>
            <div>
              <p className="text-xs uppercase">In Progress</p>
              <p className="text-2xl sm:text-3xl font-bold">{todoInProgress}</p>
            </div>
          </div>
          <div className="rbac-card p-4 sm:p-6 flex items-center gap-4">
            <div className="bg-cyan-500 text-white rounded-full p-3 shrink-0">
              <FaClock size={24} />
            </div>
            <div>
              <p className="text-xs uppercase">To Do</p>
              <p className="text-2xl sm:text-3xl font-bold">{todoTodo}</p>
            </div>
          </div>
          <div className="rbac-card p-4 sm:p-6 flex items-center gap-4">
            <div className="bg-green-500 text-white rounded-full p-3 shrink-0">
              <FaCheckCircle size={24} />
            </div>
            <div>
              <p className="text-xs uppercase">Completed</p>
              <p className="text-2xl sm:text-3xl font-bold">{todoCompleted}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rbac-section mt-4 rbac-container">
        <div className="grid gap-4">
          <div className="flex justify-between items-center">
            <h3 className="rbac-title-lg">Today&apos;s tasks</h3>
          </div>

          <div className="flex flex-col gap-4">
            <TaskTableCard
              title="Project Work"
              rows={projectTasks}
              loading={loading}
              emptyLabel="No project work tasks for today"
              addTaskType="PROJECT"
              onUpdate={isAdmin ? undefined : openUpdateModal}
            />
            <TaskTableCard
              title="Office Work"
              rows={officeTasks}
              loading={loading}
              emptyLabel="No office work tasks for today"
              addTaskType="OFFICE"
              onUpdate={isAdmin ? undefined : openUpdateModal}
            />
          </div>
          <div className="flex flex-col gap-4">
            <TaskTableCard
              title="Service Work"
              rows={serviceTasks}
              loading={loading}
              emptyLabel="No service work tasks for today"
              addTaskType="SERVICE"
              onUpdate={isAdmin ? undefined : openUpdateModal}
            />
            <div className="grid gap-4">
              <div className="rbac-card">
                <div className="flex items-center justify-between gap-2 w-full">
                  <h3 className="sm:text-base text-sm font-medium w-full">
                    {isAdmin ? "Employees reporting" : "Today's reporting"}
                  </h3>
                  <div className="flex items-center gap-2 justify-end w-full">
                    {!isAdmin && (
                      <Link href="/dashboard/reports/new">
                        <button className="rbac-button" type="button">
                          Add Reporting
                        </button>
                      </Link>
                    )}
                    <button
                      className="change-button change-button-secondary px-3 py-2 rounded-md"
                      type="button"
                      onClick={() => setCollapsed((prev) => !prev)}
                      aria-expanded={!collapsed}
                    >
                      <FaChevronRight
                        className={`transition-transform duration-200 ${
                          collapsed ? "" : "rotate-90"
                        }`}
                        size={14}
                      />
                    </button>
                  </div>
                </div>

                {isAdmin ? (
                  <div
                    className={`overflow-hidden transition-[max-height,opacity,transform,margin-top] duration-300 ease-in-out ${
                      collapsed
                        ? "mt-0 max-h-0 opacity-0 -translate-y-2 pointer-events-none"
                        : "mt-4 max-h-[4000px] opacity-100 translate-y-0"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <button
                        className="change-button change-button-secondary p-2 rounded-md"
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
                        className="change-button change-button-secondary p-2 rounded-md"
                        type="button"
                        onClick={() =>
                          setAdminDate((prev) => shiftInputDate(prev, 1))
                        }
                      >
                        <FaChevronRight size={15} />
                      </button>
                    </div>

                    <div className="mt-4">
                      {adminLoading && (
                        <div className="flex items-center justify-center py-4">
                          <FaSpinner className="animate-spin mr-2" size={16} />
                        </div>
                      )}
                      {!adminLoading && adminReports.length === 0 && (
                        <div className="rbac-card p-4 text-sm ">
                          No reporting found for selected date.
                        </div>
                      )}
                      {!adminLoading && adminReports.length > 0 && (
                        <div className="space-y-3">
                          {adminReports.map((report) => (
                            <div
                              key={report.id}
                              className="rbac-card p-4 sm:p-5"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="text-xs uppercase tracking-[0.2em]">
                                    {formatToDDMMYYYY(report.reportDate)}
                                  </p>
                                  <p className="font-semibold text-base">
                                    {report.projectName}
                                  </p>
                                  <p className="text-sm text-slate-500">
                                    {report.projectCity || "-"}
                                  </p>
                                </div>
                                <div className="flex justify-center items-center gap-4">
                                  {((report.imageUrls?.length ?? 0) > 0 ||
                                    (report.videoUrls?.length ?? 0) > 0 ||
                                    !!report.videoUrl) && <FaLink />}
                                  <button
                                    className="rbac-link"
                                    type="button"
                                    onClick={() => openReportView(report)}
                                  >
                                    <FaEye size={15} />
                                  </button>
                                </div>
                              </div>

                              <div className="mt-1 grid text-sm">
                                <p>{report.categoryName || "-"}</p>
                                <p>{report.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    className={`overflow-hidden transition-[max-height,opacity,transform,margin-top] duration-300 ease-in-out ${
                      collapsed
                        ? "mt-0 max-h-0 opacity-0 -translate-y-2 pointer-events-none"
                        : "mt-4 max-h-[4000px] opacity-100 translate-y-0"
                    }`}
                  >
                    {userReportsLoading && (
                      <div className="flex items-center justify-center py-4">
                        <FaSpinner className="animate-spin mr-2" size={16} />
                      </div>
                    )}
                    {!userReportsLoading && userReports.length === 0 && (
                      <div className="rbac-card p-4 text-sm ">
                        No reporting found for today.
                      </div>
                    )}
                    {!userReportsLoading && userReports.length > 0 && (
                      <div className="space-y-3">
                        {userReports.map((report) => (
                          <div key={report.id} className="rbac-card p-4 sm:p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-xs uppercase tracking-[0.2em] ">
                                  {formatToDDMMYYYY(report.reportDate)}
                                </p>
                                <p className="font-semibold">
                                  {report.projectName || "-"}
                                </p>
                                <p className="text-sm text-slate-500">
                                  {report.projectCity || "-"}
                                </p>
                              </div>
                              <button
                                className="rbac-link"
                                type="button"
                                onClick={() => openReportView(report)}
                              >
                                <FaEye size={15} />
                              </button>
                            </div>

                            <div className="mt-3 grid gap-2 text-sm theme-text-muted">
                              <p>
                                <span className="theme-text">
                                  Reporting Category:
                                </span>{" "}
                                {report.categoryName || "-"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className=""></section>

      {modalOpen && !isAdmin && (
        <div className="theme-modal-overlay fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="theme-modal-surface w-full max-w-lg rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-semibold theme-text">Update task</h2>
            <p className="mt-2 text-sm theme-text-muted">
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

      {reportViewOpen && (
        <div className="theme-modal-overlay fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="theme-modal-surface w-full max-w-4xl rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold theme-text">
                  Report details
                </h2>
              </div>
              <button type="button" onClick={closeReportView}>
                <IoIosClose size={30} />
              </button>
            </div>

            {reportViewLoading && (
              <div className="flex items-center justify-center py-4">
                <FaSpinner className="animate-spin mr-2" size={16} />
              </div>
            )}

            {!reportViewLoading && reportViewData && (
              <div className="mt-4 grid gap-3">
                <p className="text-xs uppercase tracking-[0.2em]">
                  {formatToDDMMYYYY(reportViewData.reportDate)}
                </p>
                <p className="text-base font-semibold">
                  {reportViewData.projectName}
                </p>
                <p className="text-sm">{reportViewData.createdByName || "-"}</p>

                <p className="text-sm">{reportViewData.categoryName || "-"}</p>
                <p className="text-sm whitespace-pre-wrap">
                  {reportViewData.description}
                </p>

                <div>
                  {reportViewData.imageUrls?.length > 0 && (
                    <>
                      <p className="text-sm font-semibold text-slate-800">
                        Images
                      </p>
                      <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {reportViewData.imageUrls.map((url, index) => (
                          <div
                            key={url}
                            className="rounded-xl border p-2"
                            style={{ borderColor: "var(--theme-border)" }}
                          >
                            <button
                              type="button"
                              className="block w-full text-left"
                              onClick={() => openReportImage(index)}
                            >
                              <Image
                                src={url}
                                alt={`Report image ${index + 1}`}
                                width={640}
                                height={320}
                                unoptimized
                                className="h-40 w-full rounded-lg object-cover transition-transform duration-200 hover:scale-[1.01]"
                              />
                            </button>
                            <a
                              className="rbac-link mt-2 inline-block"
                              href={url}
                              download
                            >
                              <MdOutlineFileDownload size={25} />
                            </a>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div>
                  {(reportViewData.videoUrls &&
                  reportViewData.videoUrls.length > 0
                    ? reportViewData.videoUrls
                    : reportViewData.videoUrl
                    ? [reportViewData.videoUrl]
                    : []
                  ).length > 0 && (
                    <>
                      <p className="text-sm font-semibold text-slate-800">
                        Video
                      </p>
                      <div
                        className="mt-2 rounded-xl border p-3"
                        style={{ borderColor: "var(--theme-border)" }}
                      >
                        <div className="grid gap-3">
                          {reportVideoUrls.map((url, index) => (
                            <div key={url}>
                              <button
                                type="button"
                                className="group relative block w-full overflow-hidden rounded-lg theme-surface-2"
                                onClick={() => openReportVideo(index)}
                                aria-label={`Open video ${index + 1}`}
                              >
                                <video
                                  className="h-48 w-full object-cover"
                                  src={url}
                                  muted
                                  playsInline
                                  preload="metadata"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition group-hover:bg-black/30">
                                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-lg">
                                    <FaPlay className="ml-1" size={18} />
                                  </span>
                                </div>
                              </button>
                              <a
                                className="rbac-link mt-2 inline-block"
                                href={url}
                                download
                              >
                                <MdOutlineFileDownload size={25} />
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

      <Dialog
        open={reportImageIndex !== null && !!selectedReportImage}
        onClose={() => setReportImageIndex(null)}
        className="relative z-[60]"
      >
        <div className="theme-modal-overlay fixed inset-0" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center px-4 py-6">
          <DialogPanel className="theme-modal-surface w-full max-w-5xl rounded-2xl p-3 shadow-2xl">
            <div className="flex items-center justify-between gap-3 px-2 py-2 theme-text">
              <div className="text-sm theme-text-muted">
                Image {reportImageIndex !== null ? reportImageIndex + 1 : 0} of{" "}
                {reportImageUrls.length}
              </div>
              <button
                type="button"
                onClick={() => setReportImageIndex(null)}
                className="rounded-full p-1 transition theme-text-muted hover:bg-black/5 hover:opacity-80"
                aria-label="Close image preview"
              >
                <IoIosClose size={30} />
              </button>
            </div>

            <div className="flex justify-center items-center gap-4 px-2 py-4">
              <button
                type="button"
                onClick={showPreviousReportImage}
                className="mx-auto flex h-11 w-11 items-center justify-center rounded-full theme-button-secondary transition disabled:cursor-not-allowed disabled:opacity-40"
                disabled={reportImageUrls.length <= 1}
                aria-label="Previous image"
              >
                <FaChevronLeft size={18} />
              </button>

              <div className="flex items-center justify-center rounded-xl theme-surface-2 p-2">
                {selectedReportImage && (
                  <Image
                    src={selectedReportImage}
                    alt={`Report image ${
                      reportImageIndex !== null ? reportImageIndex + 1 : 1
                    }`}
                    width={1400}
                    height={900}
                    unoptimized
                    className="max-h-[75vh] w-full max-w-full rounded-xl object-contain"
                  />
                )}
              </div>

              <button
                type="button"
                onClick={showNextReportImage}
                className="mx-auto flex h-11 w-11 items-center justify-center rounded-full theme-button-secondary transition disabled:cursor-not-allowed disabled:opacity-40"
                disabled={reportImageUrls.length <= 1}
                aria-label="Next image"
              >
                <FaChevronRight size={18} />
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <Dialog
        open={reportVideoIndex !== null && !!selectedReportVideo}
        onClose={() => setReportVideoIndex(null)}
        className="relative z-[60]"
      >
        <div className="theme-modal-overlay fixed inset-0" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center px-4 py-6">
          <DialogPanel className="theme-modal-surface w-full max-w-5xl rounded-2xl p-3 shadow-2xl">
            <div className="flex items-center justify-between gap-3 px-2 py-2 theme-text">
              <div className="text-sm theme-text-muted">
                Video {reportVideoIndex !== null ? reportVideoIndex + 1 : 0} of{" "}
                {reportVideoUrls.length}
              </div>
              <button
                type="button"
                onClick={() => setReportVideoIndex(null)}
                className="rounded-full p-1 transition theme-text-muted hover:bg-black/5 hover:opacity-80"
                aria-label="Close video preview"
              >
                <IoIosClose size={30} />
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 px-2 py-4">
              <button
                type="button"
                onClick={showPreviousReportVideo}
                className="mx-auto flex h-11 w-11 items-center justify-center rounded-full theme-button-secondary transition disabled:cursor-not-allowed disabled:opacity-40"
                disabled={reportVideoUrls.length <= 1}
                aria-label="Previous video"
              >
                <FaChevronLeft size={18} />
              </button>

              <div className="flex w-full items-center justify-center rounded-xl theme-surface-2 p-2">
                {selectedReportVideo && (
                  <video
                    controls
                    autoPlay
                    src={selectedReportVideo}
                    className="max-h-[75vh] w-full rounded-xl"
                  />
                )}
              </div>

              <button
                type="button"
                onClick={showNextReportVideo}
                className="mx-auto flex h-11 w-11 items-center justify-center rounded-full theme-button-secondary transition disabled:cursor-not-allowed disabled:opacity-40"
                disabled={reportVideoUrls.length <= 1}
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

export default function DashboardPage() {
  return (
    <DashboardShell>
      <OverviewContent />
    </DashboardShell>
  );
}
