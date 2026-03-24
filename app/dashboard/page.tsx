"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { ColumnDef } from "@tanstack/table-core";
import { toast } from "react-toastify";
import DashboardShell, { useDashboardContext } from "./_components/DashboardShell";

type TodoStatus = "TODO" | "IN_PROGRESS" | "ON_HOLD" | "DONE";

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

const getTodayInputDate = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const shiftInputDate = (value: string, diffDays: number) => {
  const base = new Date(value || getTodayInputDate());
  if (Number.isNaN(base.getTime())) return getTodayInputDate();
  base.setDate(base.getDate() + diffDays);
  const local = new Date(base.getTime() - base.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

function OverviewContent() {
  const router = useRouter();
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
  const [reportViewOpen, setReportViewOpen] = useState(false);
  const [reportViewLoading, setReportViewLoading] = useState(false);
  const [reportViewData, setReportViewData] = useState<AdminReportRow | null>(null);

  const loadTodayTodos = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const endpoint = isAdmin ? "/api/todos" : "/api/my-todos";
      const res = await fetch(`${endpoint}?date=${today}&page=1&pageSize=10`);
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
          cell: (info) => <span className="rbac-name">{String(info.getValue() || "")}</span>,
        },
        {
          header: "Description",
          accessorKey: "description",
          size: 500,
          cell: ({ row }) => <span className="rbac-muted">{row.original.description || "-"}</span>,
        },
        {
          header: "Start Date",
          accessorKey: "startDate",
          cell: (info) => {
            const value = String(info.getValue() || "");
            return value ? new Date(value).toLocaleDateString() : "-";
          },
        },
        {
          header: "Status",
          accessorKey: "status",
          cell: ({ row }) => (
            <span className="rbac-muted">{String(row.original.status || "").replaceAll("_", " ")}</span>
          ),
        },
        {
          header: "Assignee",
          id: "assignee",
          cell: ({ row }) => {
            const assignee = row.original.assignee;
            if (!assignee) return <span className="rbac-muted">Unassigned</span>;
            return <span className="rbac-muted">{assignee.firstName} {assignee.lastName}</span>;
          },
        },
        {
          header: "Assignee Role",
          id: "assigneeRole",
          cell: ({ row }) => (
            <span className="rbac-muted">{row.original.assignee?.role || "-"}</span>
          ),
        },
      ];
    }

    return [
      {
        header: "Task Title",
        accessorKey: "title",
        cell: (info) => <span className="rbac-name">{String(info.getValue() || "")}</span>,
      },
      {
        header: "Description",
        accessorKey: "description",
        size: 500,
        cell: ({ row }) => <span className="rbac-muted">{row.original.description || "-"}</span>,
      },
      {
        header: "Comments",
        id: "comments",
        size: 500,
        cell: ({ row }) => <span className="rbac-muted">{row.original.comments || "-"}</span>,
      },
      {
        header: "Start Date",
        accessorKey: "startDate",
        cell: (info) => {
          const value = String(info.getValue() || "");
          return value ? new Date(value).toLocaleDateString() : "-";
        },
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: ({ row }) => (
          <span className="rbac-muted">{String(row.original.status || "").replaceAll("_", " ")}</span>
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

  const isModalDirty =
    !!modalTarget &&
    ((modalDraft.comments || "") !== (modalTarget.comments || "") ||
      modalDraft.status !== modalTarget.status);
  const isModalSaving = savingId === modalTarget?.id;

  return (
    <>
      <header className="rbac-header">
        <div>
          <p className="rbac-eyebrow">Dashboard</p>
          <h1 className="rbac-heading">Welcome back, {displayName}</h1>
          <p className="rbac-subtext">
            Role-based workspace tailored for {user?.role || "your role"}.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="rbac-role">
            <p className="rbac-label">Role</p>
            <p className="rbac-role-name">{user?.role || "Unknown"}</p>
          </div>
        </div>
      </header>

      {!isAdmin && (
        <section className="rbac-section">
          <div className="rbac-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="rbac-title-lg">Reporting</h3>
                <p className="rbac-subtext">Create your daily reporting update.</p>
              </div>
              <button
                className="rbac-button"
                type="button"
                onClick={() => router.push("/dashboard/reports/new")}
              >
                Add Reporting
              </button>
            </div>
          </div>
        </section>
      )}

      {isAdmin && (
        <section className="rbac-section">
          <div className="rbac-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="rbac-title-lg">Employee reporting</h3>
              <div className="flex items-center gap-2">
                <button
                  className="rbac-button rbac-button-secondary"
                  type="button"
                  onClick={() => setAdminDate((prev) => shiftInputDate(prev, -1))}
                >
                  Previous
                </button>
                <input
                  className="rbac-input"
                  type="date"
                  value={adminDate}
                  onChange={(event) => setAdminDate(event.target.value)}
                />
                <button
                  className="rbac-button rbac-button-secondary"
                  type="button"
                  onClick={() => setAdminDate((prev) => shiftInputDate(prev, 1))}
                >
                  Next
                </button>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Project</th>
                    <th className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Title</th>
                    <th className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Description</th>
                    <th className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {adminLoading && (
                    <tr>
                      <td colSpan={4} className="py-6 text-sm text-slate-500">Loading reporting...</td>
                    </tr>
                  )}
                  {!adminLoading && adminReports.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-sm text-slate-500">No reporting found for selected date.</td>
                    </tr>
                  )}
                  {!adminLoading &&
                    adminReports.map((report) => (
                      <tr key={report.id} className="bg-white">
                        <td className="py-4 text-sm text-slate-700">{report.projectName}</td>
                        <td className="py-4 text-sm text-slate-700">{report.title}</td>
                        <td className="py-4 text-sm text-slate-700">{report.description}</td>
                        <td className="py-4 text-sm text-slate-700">
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
          </div>
        </section>
      )}

      <section className="rbac-section">
        <div className="rbac-card">
          <h3 className="rbac-title-lg">{isAdmin ? "Today tasks (all employees)" : "Today tasks"}</h3>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="text-left text-xs font-semibold uppercase text-slate-400"
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
                    <td colSpan={columns.length}>Loading...</td>
                  </tr>
                )}
                {!loading && todos.length === 0 && (
                  <tr>
                    <td colSpan={columns.length}>No tasks for today</td>
                  </tr>
                )}
                {!loading &&
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.original.id} className="bg-white">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="py-3 text-sm">
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
        </div>
      </section>

      {modalOpen && !isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Update task</h2>
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
                  <option value="DONE">Done</option>
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
                <h2 className="text-lg font-semibold text-slate-900">Report details</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Full details with playable/downloadable media.
                </p>
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

            {reportViewLoading && <p className="mt-4 text-sm text-slate-500">Loading details...</p>}

            {!reportViewLoading && reportViewData && (
              <div className="mt-4 grid gap-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <p className="text-sm text-slate-700"><strong>Date:</strong> {new Date(reportViewData.reportDate).toLocaleDateString()}</p>
                  <p className="text-sm text-slate-700"><strong>Project:</strong> {reportViewData.projectName}</p>
                  <p className="text-sm text-slate-700"><strong>Employee:</strong> {reportViewData.createdByName || "-"}</p>
                  <p className="text-sm text-slate-700"><strong>Status:</strong> {String(reportViewData.status || "").replaceAll("_", " ")}</p>
                </div>

                <p className="text-sm text-slate-700"><strong>Title:</strong> {reportViewData.title}</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap"><strong>Description:</strong> {reportViewData.description}</p>

                <div>
                  <p className="text-sm font-semibold text-slate-800">Images</p>
                  {reportViewData.imageUrls?.length ? (
                    <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {reportViewData.imageUrls.map((url) => (
                        <div key={url} className="rounded-xl border border-slate-200 p-2">
                          <Image src={url} alt="Report" width={640} height={320} unoptimized className="h-40 w-full rounded-lg object-cover" />
                          <a className="rbac-link mt-2 inline-block" href={url} download>
                            Download image
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-slate-500">No images uploaded.</p>
                  )}
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-800">Video</p>
                  {reportViewData.videoUrl ? (
                    <div className="mt-2 rounded-xl border border-slate-200 p-3">
                      <video controls className="w-full rounded-lg" src={reportViewData.videoUrl} />
                      <a className="rbac-link mt-2 inline-block" href={reportViewData.videoUrl} download>
                        Download video
                      </a>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-slate-500">No video uploaded.</p>
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
