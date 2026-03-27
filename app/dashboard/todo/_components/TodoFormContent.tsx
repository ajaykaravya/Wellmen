"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { getTodayInputDate } from "@/lib/dateUtils";
import { useDashboardContext } from "../../_components/DashboardShell";

type UserOption = {
  id: string;
  firstName: string;
  lastName: string;
  mobileNumber: string;
  role?: string | null;
};

type ProjectOption = {
  id: string;
  name: string;
};

type TodoFormState = {
  title: string;
  description: string;
  comments: string;
  startDate: string;
  status: "TODO" | "IN_PROGRESS" | "ON_HOLD" | "DONE";
  projectId: string;
  assigneeId: string;
};

type TodoFormContentProps = {
  todoId?: string;
};

const formatDateForInput = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

export default function TodoFormContent({ todoId }: TodoFormContentProps) {
  const router = useRouter();
  const { setNavOpen, isAdmin } = useDashboardContext();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof TodoFormState, string>>>({});
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<TodoFormState>({
    title: "",
    description: "",
    comments: "",
    startDate: getTodayInputDate(),
    status: "TODO",
    projectId: "",
    assigneeId: "",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const endpoint = isAdmin ? "/api/todos" : "/api/my-todos";

        const [usersRes, projectsRes, todoRes] = await Promise.all([
          isAdmin ? fetch("/api/users/options") : Promise.resolve(null),
          fetch("/api/projects/options"),
          todoId ? fetch(`${endpoint}/${todoId}`) : Promise.resolve(null),
        ]);

        if (usersRes?.ok) {
          const data = await usersRes.json();
          setUsers(Array.isArray(data) ? data : []);
        }

        if (projectsRes.ok) {
          const data = await projectsRes.json();
          setProjects(Array.isArray(data) ? data : []);
        }

        if (todoRes?.ok) {
          const todo = await todoRes.json();
          setForm({
            title: todo.title || "",
            description: todo.description || "",
            comments: todo.comments || "",
            startDate: formatDateForInput(todo.startDate),
            status: todo.status || "TODO",
            projectId: todo.projectId || "",
            assigneeId: todo.assigneeId || "",
          });
        }
      } catch (error) {
        console.error("Failed to load todo data", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAdmin, todoId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setNote(null);

    const newErrors: Partial<Record<keyof TodoFormState, string>> = {};
    if (!form.title.trim()) newErrors.title = "Task title is required.";
    if (!form.startDate) newErrors.startDate = "Start date is required.";
    if (!form.projectId.trim()) newErrors.projectId = "Project is required.";
    if (isAdmin && !form.assigneeId.trim()) newErrors.assigneeId = "Assignee is required for admins.";

    setErrors(newErrors);

    try {
      const endpoint = isAdmin ? "/api/todos" : "/api/my-todos";
      const res = await fetch(todoId ? `${endpoint}/${todoId}` : endpoint, {
        method: todoId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          comments: form.comments.trim(),
          startDate: form.startDate,
          status: form.status,
          projectId: form.projectId,
          ...(isAdmin ? { assigneeId: form.assigneeId } : {}),
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setNote(payload.error || "Failed to save todo.");
        return;
      }

      toast.success(`Todo ${todoId ? "updated" : "created"} successfully.`);
      router.push("/dashboard/todo");
    } catch (error) {
      console.error("Failed to save todo", error);
      setNote("Failed to save todo.");
    }
  };

  if (loading) return null;

  return (
    <>
      <section className="rbac-section">
        <div className="rbac-card">
          <form className="rbac-form" onSubmit={handleSubmit}>
            {note && <p className="rbac-note">{note}</p>}
            <div>

              <label className="rbac-label">
                Project <span className="text-red-600">*</span>
                <select
                  className="rbac-input rbac-select mb-2"
                  value={form.projectId}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      projectId: event.target.value,
                    }))
                  }
                >
                  <option value="">No project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>
              {errors.projectId && (
                <p className="text-sm text-red-600 mb-2">{errors.projectId}</p>
              )}

              {isAdmin && (
                <label className="rbac-label mt-5">
                  Assign
                  <select
                    className="rbac-input rbac-select mb-2"
                    value={form.assigneeId}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        assigneeId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} · {user.role || "User"}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className="rbac-label">
                Task title <span className="text-red-600">*</span>
                <input
                  className="rbac-input mb-2"
                  placeholder="Task title"
                  value={form.title}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                />
              </label>
              {errors.title && (
                <p className="text-sm text-red-600 mb-2">{errors.title}</p>
              )}

              <label className="rbac-label">
                Description
                <textarea
                  className="rbac-input"
                  rows={4}
                  placeholder="Task details"
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="rbac-label mt-3">
                Comments
                <textarea
                  className="rbac-input"
                  rows={3}
                  placeholder="Enter comments"
                  value={form.comments}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, comments: event.target.value }))
                  }
                />
              </label>

              <label className="rbac-label mt-5">
                Date <span className="text-red-600">*</span>
                <input
                  type="date"
                  className="rbac-input mb-2"
                  value={form.startDate}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      startDate: event.target.value,
                    }))
                  }
                />
              </label>
              {errors.startDate && (
                <p className="text-sm text-red-600 mb-2">{errors.startDate}</p>
              )}

              <label className="rbac-label">
                Status
                <select
                  className="rbac-input rbac-select"
                  value={form.status}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      status: event.target.value as TodoFormState["status"],
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

            <div className="rbac-actions">
              <button className="rbac-button" type="submit">
                Save
              </button>
              <button
                className="text-red-500"
                type="button"
                onClick={() => router.push("/dashboard/todo")}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
