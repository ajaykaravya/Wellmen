"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
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
  const [errors, setErrors] = useState<Partial<Record<keyof ProjectFormState, string>>>({});
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

    const newErrors: Partial<Record<keyof ProjectFormState, string>> = {};

    if (!form.name.trim()) newErrors.name = "Project name is required.";
    if (!form.address.trim()) newErrors.address = "Address is required.";
    if (!form.contactNumber.trim()) newErrors.contactNumber = "Contact number is required.";
    if (!form.startDate) newErrors.startDate = "Start date is required.";

    setErrors(newErrors);

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

      toast.success(`Project ${projectId ? "updated" : "created"} successfully.`);
      router.push("/dashboard/projects");
    } catch (error) {
      console.error("Failed to save project", error);
      setNote("Failed to save project.");
    }
  };

  if (loading) return null;

  return (
    <>
      <section className="rbac-section">
        <div className="rbac-card">
          <form className="rbac-form " onSubmit={handleSubmit}>
            {note && <p className="rbac-note">{note}</p>}
            <div className="">
              <label className="rbac-label">
                Project name  <span className="text-red-600">*</span>
                <input
                  className="rbac-input mb-2"
                  placeholder="Project name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
              </label>
              {errors.name && <p className="text-sm text-red-600 mb-2">{errors.name}</p>}

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

              <label className="rbac-label">
                Address <span className="text-red-600">*</span>
                <textarea
                  className="rbac-input"
                  placeholder="Project address"
                  value={form.address}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, address: event.target.value }))
                  }
                />
              </label>
              {errors.address && <p className="text-sm text-red-600 mb-2">{errors.address}</p>}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="rbac-label">
                  Mobile number <span className="text-red-600">*</span>
                  <input
                    className="rbac-input mb-2"
                    placeholder="Contact number"
                    value={form.contactNumber}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, contactNumber: event.target.value }))
                    }
                  />
                </label>
                {errors.contactNumber && (
                  <p className="text-sm text-red-600 mb-2">{errors.contactNumber}</p>
                )}

                <label className="rbac-label">
                  Email
                  <input
                    className="rbac-input mb-2"
                    type="email"
                    placeholder="Project email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="rbac-label">
                  Start date <span className="text-red-600">*</span>
                  <input
                    className="rbac-input mb-2"
                    type="date"
                    value={form.startDate}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, startDate: event.target.value }))
                    }
                  />
                </label>
                {errors.startDate && (
                  <p className="text-sm text-red-600 mb-2">{errors.startDate}</p>
                )}

                <label className="rbac-label">
                  End date
                  <input
                    className="rbac-input mb-2"
                    type="date"
                    value={form.endDate}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, endDate: event.target.value }))
                    }
                  />
                </label>
              </div>
              <label className="rbac-label">
                Status
                <select
                  className="rbac-input rbac-select mb-2"
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
            <div className="rbac-actions">
              <button className="rbac-button" type="submit">
                Save
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
