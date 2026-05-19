"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getTodayInputDate } from "@/lib/dateUtils";
import { toast } from "react-toastify";
import DashboardShell, {
  clearCachedSession,
  useDashboardContext,
} from "./_components/DashboardShell";
import { TaskTableCard } from "./_components/TaskTableCard";
import ConfirmDialog from "../components/ConfirmDialog";
import CustomDatePicker from "../components/CustomDatePicker";
import {
  FaChevronLeft,
  FaChevronRight,
  FaClock,
  FaHourglass,
  FaCheckCircle,
  FaSpinner,
  FaMoon,
  FaSun,
  FaEdit,
  FaTrash,
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
import { QueryTableCard } from "./_components/QueryTableCard";
import { ReportingCardList } from "./_components/ReportingCardList";
import { ReportDetailsDialog } from "./_components/ReportDetailsDialog";

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
  canManage?: boolean;
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
  canManage?: boolean;
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

type DailyExpenseTransactionType = "INCOME" | "EXPENSE";

const formatAmount = (value: number) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [userReports, setUserReports] = useState<AdminReportRow[]>([]);
  const [userReportsLoading, setUserReportsLoading] = useState(false);
  const [reportViewOpen, setReportViewOpen] = useState(false);
  const [reportViewLoading, setReportViewLoading] = useState(false);
  const [reportViewData, setReportViewData] = useState<AdminReportRow | null>(
    null,
  );
  const [reportImageIndex, setReportImageIndex] = useState<number | null>(null);
  const [reportVideoIndex, setReportVideoIndex] = useState<number | null>(null);

  const [confirmTodoOpen, setConfirmTodoOpen] = useState(false);
  const [confirmTodoTarget, setConfirmTodoTarget] = useState<TodoRow | null>(null);
  const [deletingTodo, setDeletingTodo] = useState(false);

  const [confirmQueryOpen, setConfirmQueryOpen] = useState(false);
  const [confirmQueryTarget, setConfirmQueryTarget] = useState<QueryRow | null>(null);
  const [deletingQuery, setDeletingQuery] = useState(false);

  const [confirmReportOpen, setConfirmReportOpen] = useState(false);
  const [confirmReportTarget, setConfirmReportTarget] = useState<AdminReportRow | null>(null);
  const [deletingReport, setDeletingReport] = useState(false);

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
        date: adminDate,
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

  const loadCurrentBalance = useCallback(async () => {
    if (!isAdmin) {
      setCurrentBalance(null);
      return;
    }

    setBalanceLoading(true);
    try {
      const res = await fetch("/api/daily-expenses?page=1&pageSize=1");
      if (!res.ok) return;

      const data = await res.json();
      setCurrentBalance(typeof data?.balance === "number" ? data.balance : 0);
    } catch (error) {
      console.error("Failed to load current balance", error);
    } finally {
      setBalanceLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadCurrentBalance();
  }, [loadCurrentBalance]);

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

  const openDailyExpenseEntry = useCallback(
    (transactionType: DailyExpenseTransactionType) => {
      router.push(`/dashboard/daily-expenses/new?type=${transactionType}`);
    },
    [router],
  );

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

  const isModalDirty =
    !!modalTarget &&
    ((modalDraft.comments || "") !== (modalTarget.comments || "") ||
      modalDraft.status !== modalTarget.status);
  const isModalSaving = savingId === modalTarget?.id;

  const handleDeleteTodo = useCallback((row: TodoRow) => {
    setConfirmTodoTarget(row);
    setConfirmTodoOpen(true);
  }, []);

  const confirmDeleteTodo = useCallback(async () => {
    if (!confirmTodoTarget) return;
    setDeletingTodo(true);
    try {
      const endpoint = isAdmin ? "/api/todos" : "/api/my-todos";
      const res = await fetch(`${endpoint}/${confirmTodoTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error || "Failed to delete task.");
        return;
      }
      await loadTodos();
      toast.success("Task deleted successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete task.");
    } finally {
      setDeletingTodo(false);
      setConfirmTodoOpen(false);
      setConfirmTodoTarget(null);
    }
  }, [confirmTodoTarget, isAdmin, loadTodos]);

  const handleDeleteQuery = useCallback((row: QueryRow) => {
    setConfirmQueryTarget(row);
    setConfirmQueryOpen(true);
  }, []);

  const confirmDeleteQuery = useCallback(async () => {
    if (!confirmQueryTarget) return;
    setDeletingQuery(true);
    try {
      const endpoint = isAdmin ? "/api/query-management" : "/api/my-query-management";
      const res = await fetch(`${endpoint}/${confirmQueryTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error || "Failed to delete query.");
        return;
      }
      await loadQuery();
      toast.success("Query deleted successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete query.");
    } finally {
      setDeletingQuery(false);
      setConfirmQueryOpen(false);
      setConfirmQueryTarget(null);
    }
  }, [confirmQueryTarget, isAdmin, loadQuery]);

  const handleEditReport = useCallback((row: AdminReportRow) => {
    router.push(`/dashboard/reports/${row.id}`);
  }, [router]);

  const handleDeleteReport = useCallback((row: AdminReportRow) => {
    setConfirmReportTarget(row);
    setConfirmReportOpen(true);
  }, []);

  const confirmDeleteReport = useCallback(async () => {
    if (!confirmReportTarget) return;
    setDeletingReport(true);
    try {
      const res = await fetch(`/api/reports/${confirmReportTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error || "Failed to delete reporting.");
        return;
      }
      if (isAdmin) {
        await loadAdminReports();
      } else {
        await loadUserReports();
      }
      toast.success("Reporting deleted successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete reporting.");
    } finally {
      setDeletingReport(false);
      setConfirmReportOpen(false);
      setConfirmReportTarget(null);
    }
  }, [confirmReportTarget, isAdmin, loadAdminReports, loadUserReports]);

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
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"
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
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${focus
                    ? "theme-button-secondary theme-text"
                    : "theme-text-muted"
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
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${focus
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
                  className={`rounded-xl px-3 py-2 text-sm ${passwordNotice.type === "success"
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

      <ConfirmDialog
        open={confirmTodoOpen}
        title="Delete task?"
        description="Are you sure you want to delete this task?"
        confirmLabel="Delete"
        confirmLoading={deletingTodo}
        confirmLoadingLabel="Deleting..."
        cancelLabel="Cancel"
        onConfirm={confirmDeleteTodo}
        onClose={() => setConfirmTodoOpen(false)}
      />
      <ConfirmDialog
        open={confirmQueryOpen}
        title="Delete query?"
        description="Are you sure you want to delete this query?"
        confirmLabel="Delete"
        confirmLoading={deletingQuery}
        confirmLoadingLabel="Deleting..."
        cancelLabel="Cancel"
        onConfirm={confirmDeleteQuery}
        onClose={() => setConfirmQueryOpen(false)}
      />
      <ConfirmDialog
        open={confirmReportOpen}
        title="Delete reporting?"
        description="Are you sure you want to delete this reporting?"
        confirmLabel="Delete"
        confirmLoading={deletingReport}
        confirmLoadingLabel="Deleting..."
        cancelLabel="Cancel"
        onConfirm={confirmDeleteReport}
        onClose={() => setConfirmReportOpen(false)}
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
          title="Queries"
          rows={pendingQuery}
          loading={loading}
          emptyLabel="No queries found"
          addHref={isAdmin ? "/dashboard/query-management/new" : "/dashboard/my-query-management/new"}
          addLabel="Add Query"
          secondaryHref={isAdmin ? "/dashboard/query-management" : "/dashboard/my-query-management"}
          secondaryLabel="View All"
          renderActions={(q) => (
            <div className="flex gap-2">
              <Link className="mt-1" href={isAdmin ? `/dashboard/query-management/${q.id}` : `/dashboard/my-query-management/${q.id}`}>
                <button className="rbac-link" type="button" title="Edit">
                  <FaEdit size={18} />
                </button>
              </Link>
              <button
                style={{ padding: "2px" }}
                className="rbac-link danger"
                type="button"
                onClick={() => handleDeleteQuery(q)}
                title="Delete"
              >
                <FaTrash size={18} />
              </button>
            </div>
          )}
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
              addTaskHref="/dashboard/task-management/new?type=PROJECT"
              renderActions={(task) => (
                <>
                  {(isAdmin || task.canManage) && (
                    <div className="flex justify-end gap-2 items-center">
                      <Link className="mt-1" href={`/dashboard/task-management/${task.id}`}>
                        <button className="rbac-link" type="button" title="Edit">
                          <FaEdit size={18} />
                        </button>
                      </Link>
                      <button
                        style={{ padding: "2px" }}
                        className="rbac-link danger"
                        type="button"
                        onClick={() => handleDeleteTodo(task)}
                        title="Delete"
                      >
                        <FaTrash size={18} />
                      </button>
                    </div>
                  )}
                  {!isAdmin && (
                    <button
                      className="rbac-button rbac-button-secondary ml-2"
                      type="button"
                      onClick={() => openUpdateModal(task)}
                    >
                      Update
                    </button>
                  )}
                </>
              )}
            />
            <TaskTableCard
              title="Office Work"
              rows={officeTasks}
              loading={loading}
              emptyLabel="No office work tasks for today"
              addTaskHref="/dashboard/task-management/new?type=OFFICE"
              renderActions={(task) => (
                <>
                  {(isAdmin || task.canManage) && (
                    <div className="flex justify-end gap-2 items-center">
                      <Link className="mt-1" href={`/dashboard/task-management/${task.id}`}>
                        <button className="rbac-link" type="button" title="Edit">
                          <FaEdit size={18} />
                        </button>
                      </Link>
                      <button
                        style={{ padding: "2px" }}
                        className="rbac-link danger"
                        type="button"
                        onClick={() => handleDeleteTodo(task)}
                        title="Delete"
                      >
                        <FaTrash size={18} />
                      </button>
                    </div>
                  )}
                  {!isAdmin && (
                    <button
                      className="rbac-button rbac-button-secondary ml-2"
                      type="button"
                      onClick={() => openUpdateModal(task)}
                    >
                      Update
                    </button>
                  )}
                </>
              )}
            />
          </div>
          <div className="flex flex-col gap-4">
            <TaskTableCard
              title="Service Work"
              rows={serviceTasks}
              loading={loading}
              emptyLabel="No service work tasks for today"
              addTaskHref="/dashboard/task-management/new?type=SERVICE"
              renderActions={(task) => (
                <>
                  {(isAdmin || task.canManage) && (
                    <div className="flex justify-end gap-2 items-center">
                      <Link className="mt-1" href={`/dashboard/task-management/${task.id}`}>
                        <button className="rbac-link" type="button" title="Edit">
                          <FaEdit size={18} />
                        </button>
                      </Link>
                      <button
                        style={{ padding: "2px" }}
                        className="rbac-link danger"
                        type="button"
                        onClick={() => handleDeleteTodo(task)}
                        title="Delete"
                      >
                        <FaTrash size={18} />
                      </button>
                    </div>
                  )}
                  {!isAdmin && (
                    <button
                      className="rbac-button rbac-button-secondary ml-2"
                      type="button"
                      onClick={() => openUpdateModal(task)}
                    >
                      Update
                    </button>
                  )}
                </>
              )}
            />
            <div className="grid gap-4">
              <div className="rbac-card">
                <div className="flex items-center justify-between gap-2 w-full">
                  <div className="flex items-center">
                    <h3 className="sm:text-base text-sm font-medium w-full">
                      {isAdmin ? "Employees reporting" : "Today's reporting"}
                    </h3>
                    <p className=" text-white text-sm font-normal bg-[#2596be] px-2 py-1 rounded-full">{isAdmin ? adminReports.length : userReports.length}</p>
                  </div>
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
                        className={`transition-transform duration-200 ${collapsed ? "" : "rotate-90"
                          }`}
                        size={14}
                      />
                    </button>
                  </div>
                </div>

                {isAdmin ? (
                  <div
                    className={`overflow-hidden transition-[max-height,opacity,transform,margin-top] duration-300 ease-in-out ${collapsed
                      ? "mt-0 max-h-0 opacity-0 -translate-y-2 pointer-events-none"
                      : "mt-4 max-h-[4000px] opacity-100 translate-y-0"
                      }`}
                  >
                    <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
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
                        <ReportingCardList
                          rows={adminReports}
                          loading={adminLoading}
                          emptyLabel="No reporting found for selected date."
                          onView={openReportView}
                          onEdit={handleEditReport}
                          onDelete={handleDeleteReport}
                          showEmployee={true}
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    className={`overflow-hidden transition-[max-height,opacity,transform,margin-top] duration-300 ease-in-out ${collapsed
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
                      <ReportingCardList
                        rows={userReports}
                        loading={userReportsLoading}
                        emptyLabel="No reporting found for today."
                        onView={openReportView}
                        onEdit={handleEditReport}
                        onDelete={handleDeleteReport}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {isAdmin && (
        <section className="rbac-section mt-4 rbac-container">
          <div className="rbac-card p-5 sm:p-6">
            <div className="flex flex-wrap justify-between">
              <div className="flex items-center gap-2">
                <h3 className="sm:text-base text-sm font-medium">
                  Current balance:
                </h3>
                <p className="text-slate-500 sm:text-base text-sm">
                  {balanceLoading
                    ? "Loading..."
                    : currentBalance === null
                      ? "0"
                      : formatAmount(currentBalance)}
                </p>
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  className="rbac-button h-fit"
                  onClick={() => openDailyExpenseEntry("INCOME")}
                >
                  Add Income
                </button>
                <button
                  type="button"
                  className="rbac-button rbac-button-secondary h-fit"
                  onClick={() => openDailyExpenseEntry("EXPENSE")}
                >
                  Add Expense
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

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
        <ReportDetailsDialog
          open={reportViewOpen}
          loading={reportViewLoading}
          report={reportViewData}
          showEmployee={true}
          viewImageUrls={reportViewData?.imageUrls ?? []}
          viewVideoUrls={reportViewData?.videoUrls?.length
            ? reportViewData.videoUrls
            : reportViewData?.videoUrl
              ? [reportViewData.videoUrl]
              : []}
          onClose={closeReportView}
          onOpenImage={openReportImage}
          onOpenVideo={openReportVideo}
        />
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
                    alt={`Report image ${reportImageIndex !== null ? reportImageIndex + 1 : 1
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
