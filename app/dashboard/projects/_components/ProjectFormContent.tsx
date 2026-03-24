"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDashboardContext } from "../../_components/DashboardShell";

type ProjectFormState = {
  name: string;
  address: string;
  contactNumber: string;
  email: string;
  startDate: string;
  endDate: string;
  description: string;
  status: "PENDING" | "IN_PROGRESS" | "DONE" | "ON_HOLD";
};

type ProjectFormContentProps = {
  projectId?: string;
};

const formatDateForInput = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

export default function ProjectFormContent({ projectId }: ProjectFormContentProps) {
  const router = useRouter();
  const { setNavOpen } = useDashboardContext();
  const [note, setNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<ProjectFormState>({
    name: "",
    address: "",
    contactNumber: "",
    email: "",
    startDate: "",
    endDate: "",
    description: "",
    status: "PENDING",
  });

  useEffect(() => {
    const loadData = async () => {
      if (!projectId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (!res.ok) {
          setNote("Failed to load project.");
          return;
        }

        const project = await res.json();
        setForm({
          name: project.name || "",
          address: project.address || "",
          contactNumber: project.contactNumber || "",
          email: project.email || "",
          startDate: formatDateForInput(project.startDate),
          endDate: formatDateForInput(project.endDate),
          description: project.description || "",
          status: project.status || "PENDING",
        });
      } catch (error) {
        console.error("Failed to load project", error);
        setNote("Failed to load project.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [projectId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setNote(null);

    if (
      !form.name.trim() ||
      !form.address.trim() ||
      !form.contactNumber.trim() ||
      !form.email.trim() ||
      !form.startDate ||
      !form.endDate
    ) {
      setNote(
        "Project name, address, contact number, email, start date and end date are required.",
      );
      return;
    }

    try {
      const res = await fetch(projectId ? `/api/projects/${projectId}` : "/api/projects", {
        method: projectId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          address: form.address.trim(),
          contactNumber: form.contactNumber.trim(),
          email: form.email.trim(),
          startDate: form.startDate,
          endDate: form.endDate,
          description: form.description.trim(),
          status: form.status,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setNote(payload.error || "Failed to save project.");
        return;
      }

      router.push("/dashboard/projects");
    } catch (error) {
      console.error("Failed to save project", error);
      setNote("Failed to save project.");
    }
  };

  if (loading) return null;

  return (
    <>
      <header className="rbac-header">
        <div>
          <p className="rbac-eyebrow">Projects</p>
          <h1 className="rbac-heading">{projectId ? "Edit project" : "Add project"}</h1>
          <p className="rbac-subtext">Manage project details and lifecycle.</p>
        </div>
        <button
          className="rbac-button rbac-button-secondary"
          type="button"
          onClick={() => router.push("/dashboard/projects")}
        >
          Back to list
        </button>
      </header>

      <section className="rbac-section">
        <div className="rbac-card">
          <form className="rbac-form " onSubmit={handleSubmit}>
            <div className="">
              <label className="rbac-label">
                Project name
                <input
                  className="rbac-input"
                  placeholder="Project name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
              </label>

              <label className="rbac-label mt-5">
                Address
                <input
                  className="rbac-input"
                  placeholder="Project address"
                  value={form.address}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, address: event.target.value }))
                  }
                />
              </label>

              <label className="rbac-label mt-5">
                Contact number
                <input
                  className="rbac-input"
                  placeholder="Contact number"
                  value={form.contactNumber}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, contactNumber: event.target.value }))
                  }
                />
              </label>

              <label className="rbac-label mt-5">
                Email
                <input
                  className="rbac-input"
                  type="email"
                  placeholder="Project email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                />
              </label>

              <label className="rbac-label mt-5">
                Start date
                <input
                  className="rbac-input"
                  type="date"
                  value={form.startDate}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, startDate: event.target.value }))
                  }
                />
              </label>

              <label className="rbac-label mt-5">
                End date
                <input
                  className="rbac-input"
                  type="date"
                  value={form.endDate}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, endDate: event.target.value }))
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
                      status: event.target.value as ProjectFormState["status"],
                    }))
                  }
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="DONE">Done</option>
                  <option value="ON_HOLD">On hold</option>
                </select>
              </label>
            </div>

            <label className="rbac-label">
              Description
              <textarea
                className="rbac-input"
                rows={4}
                placeholder="Project description"
                value={form.description}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, description: event.target.value }))
                }
              />
            </label>

            {note && <p className="rbac-note">{note}</p>}

            <div className="rbac-actions">
              <button className="rbac-button" type="submit">
                {projectId ? "Save changes" : "Save project"}
              </button>
              <button
                className="text-red-500"
                type="button"
                onClick={() => router.push("/dashboard/projects")}
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
