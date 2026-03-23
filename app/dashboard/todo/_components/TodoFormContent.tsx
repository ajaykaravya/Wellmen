"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDashboardContext } from "../../_components/DashboardShell";

type UserOption = {
  id: string;
  firstName: string;
  lastName: string;
  mobileNumber: string;
  role?: string | null;
};

type TodoFormState = {
  title: string;
  description: string;
  startDate: string;
  status: "TODO" | "IN_PROGRESS" | "ON_HOLD" | "DONE";
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
  const [note, setNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<TodoFormState>({
    title: "",
    description: "",
    startDate: "",
    status: "TODO",
    assigneeId: "",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const endpoint = isAdmin ? "/api/todos" : "/api/my-todos";

        const [usersRes, todoRes] = await Promise.all([
          isAdmin ? fetch("/api/users/options") : Promise.resolve(null),
          todoId ? fetch(`${endpoint}/${todoId}`) : Promise.resolve(null),
        ]);

        if (usersRes?.ok) {
          const data = await usersRes.json();
          setUsers(Array.isArray(data) ? data : []);
        }

        if (todoRes?.ok) {
          const todo = await todoRes.json();
          setForm({
            title: todo.title || "",
            description: todo.description || "",
            startDate: formatDateForInput(todo.startDate),
            status: todo.status || "TODO",
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

    if (!form.title.trim() || !form.startDate) {
      setNote("Task title and start date are required.");
      return;
    }

    try {
      const endpoint = isAdmin ? "/api/todos" : "/api/my-todos";
      const res = await fetch(todoId ? `${endpoint}/${todoId}` : endpoint, {
        method: todoId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          startDate: form.startDate,
          status: form.status,
          ...(isAdmin ? { assigneeId: form.assigneeId } : {}),
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setNote(payload.error || "Failed to save todo.");
        return;
      }

      router.push("/dashboard/todo");
    } catch (error) {
      console.error("Failed to save todo", error);
      setNote("Failed to save todo.");
    }
  };

  if (loading) return null;

  return (
    <>
      <header className="rbac-header">
        <div>
          <button
            className="rbac-hamburger"
            type="button"
            onClick={() => setNavOpen(true)}
          >
            <span />
          </button>
          <p className="rbac-eyebrow">To-Do</p>
          <h1 className="rbac-heading">{todoId ? "Edit task" : "Add a task"}</h1>
          <p className="rbac-subtext">
            {isAdmin ? "Assign a task to your team." : "Create a personal task."}
          </p>
        </div>
        <button
          className="rbac-button rbac-button-secondary"
          type="button"
          onClick={() => router.push("/dashboard/todo")}
        >
          Back to list
        </button>
      </header>

      <section className="rbac-section">
        <div className="rbac-card">
          <form className="rbac-form" onSubmit={handleSubmit}>
            <div>
              <label className="rbac-label">
                Task title
                <input
                  className="rbac-input"
                  placeholder="Task title"
                  value={form.title}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                />
              </label>

              <label className="rbac-label mt-5">
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

              <label className="rbac-label mt-5">
                Start date
                <input
                  type="date"
                  className="rbac-input"
                  value={form.startDate}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      startDate: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="rbac-label mt-5">
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

              {isAdmin && (
                <label className="rbac-label mt-5">
                  Assign
                  <select
                    className="rbac-input rbac-select"
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
            </div>

            {note && <p className="rbac-note">{note}</p>}

            <div className="rbac-actions">
              <button className="rbac-button" type="submit">
                {todoId ? "Save changes" : "Save todo"}
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
