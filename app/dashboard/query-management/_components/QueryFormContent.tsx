"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FaSpinner } from "react-icons/fa";
import { toast } from "react-toastify";
import Link from "next/link";
import Loading from "../../../components/Loading";
import { ButtonGroup } from "../../_components/ButtonGroup";

type ProjectOption = {
  id: string;
  name: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD";
};

type QueryCategory = "REMARKS" | "URGENCY" | "DECISION_PENDING" | "";
type QueryStatus = "PENDING" | "COMPLETED";
type PriorityLevel = "LOW" | "MEDIUM" | "HIGH";

type QueryFormState = {
  projectId: string;
  category: QueryCategory;
  description: string;
  status: QueryStatus;
  priority: PriorityLevel;
};

type QueryFormContentProps = {
  queryId?: string;
};

const categoryOptions: Array<{
  key: Exclude<QueryCategory, "">;
  label: string;
}> = [
  { key: "REMARKS", label: "Remarks" },
  { key: "URGENCY", label: "Urgency" },
  { key: "DECISION_PENDING", label: "Decision Pending" },
];

const statusOptions: Array<{ key: QueryStatus; label: string }> = [
  { key: "PENDING", label: "Pending" },
  { key: "COMPLETED", label: "Completed" },
];

const priorityOptions: Array<{ key: PriorityLevel; label: string }> = [
  { key: "LOW", label: "Low" },
  { key: "MEDIUM", label: "Medium" },
  { key: "HIGH", label: "High" },
];

export default function QueryFormContent({ queryId }: QueryFormContentProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [errors, setErrors] = useState<
    Partial<Record<keyof QueryFormState, string>>
  >({});
  const [form, setForm] = useState<QueryFormState>({
    projectId: "",
    category: "",
    description: "",
    status: "PENDING",
    priority: "MEDIUM",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [projectsRes, queryRes] = await Promise.all([
          fetch("/api/projects/options"),
          queryId
            ? fetch(`/api/query-management/${queryId}`)
            : Promise.resolve(null),
        ]);

        if (projectsRes.ok) {
          const data = await projectsRes.json();
          setProjects(Array.isArray(data) ? data : []);
        }

        if (queryRes?.ok) {
          const data = await queryRes.json();
          setForm({
            projectId: data.projectId || "",
            category: data.category || "",
            description: data.description || "",
            status: data.status || "PENDING",
            priority: data.priority || "MEDIUM",
          });
        } else if (queryRes && !queryRes.ok) {
          setNote("Failed to load query.");
        }
      } catch (error) {
        console.error("Failed to load query data", error);
        setNote("Failed to load query.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [queryId]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === form.projectId) || null,
    [form.projectId, projects],
  );

  const formatQueryLabel = (value: string) => value.replaceAll("_", " ");
  const setFieldValue = <K extends keyof QueryFormState>(
    field: K,
    value: QueryFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setNote(null);

    const newErrors: Partial<Record<keyof QueryFormState, string>> = {};
    if (!form.projectId.trim()) newErrors.projectId = "Project is required.";
    if (!form.category) newErrors.category = "Category is required.";
    if (!form.description.trim())
      newErrors.description = "Description is required.";
    if (!form.status) newErrors.status = "Status is required.";
    if (!form.priority) newErrors.priority = "Priority is required.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      setSaving(true);
      const res = await fetch(
        queryId ? `/api/query-management/${queryId}` : "/api/query-management",
        {
          method: queryId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: form.projectId.trim(),
            category: form.category,
            description: form.description.trim(),
            status: form.status,
            priority: form.priority,
          }),
        },
      );

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const errorMessage = payload.error || "Failed to save query.";
        setNote(errorMessage);
        toast.error(errorMessage);
        return;
      }

      toast.success(`Query ${queryId ? "updated" : "created"} successfully.`);
      router.push("/dashboard/query-management");
    } catch (error) {
      console.error("Failed to save query", error);
      setNote("Failed to save query.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-80 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <section className="rbac-section rbac-container">
      <div className="rbac-card">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="rbac-title-lg">
            {queryId ? "Edit Query" : "Add New Query"}
          </h3>
        </div>

        <form className="rbac-form" onSubmit={handleSubmit}>
          <fieldset
            disabled={saving}
            className={saving ? "pointer-events-none opacity-70" : ""}
          >
            <label className="rbac-label">
              Select Project <span className="text-red-600">*</span>
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
                <option value="">Select project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
            {selectedProject && (
              <p className="mb-4 text-xs text-slate-500">
                Selected: {selectedProject.name}{" "}
                <span className="text-slate-400">
                  ({formatQueryLabel(selectedProject.status)})
                </span>
              </p>
            )}
            {errors.projectId && (
              <p className="text-sm text-red-600 mb-2">{errors.projectId}</p>
            )}

            <div className="mt-4 grid gap-4">
              <ButtonGroup
                title="Category"
                selected={form.category || null}
                options={categoryOptions}
                onSelect={(value) => setFieldValue("category", value)}
                error={errors.category}
                required
              />

              <label className="rbac-label">
                Description <span className="text-red-600">*</span>
                <textarea
                  className="rbac-input"
                  rows={4}
                  placeholder="Describe the query"
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                />
              </label>
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description}</p>
              )}

              <ButtonGroup
                title="Status"
                selected={form.status}
                options={statusOptions}
                onSelect={(value) => setFieldValue("status", value)}
                error={errors.status}
                required
              />
              <ButtonGroup
                title="Priority"
                selected={form.priority}
                options={priorityOptions}
                onSelect={(value) => setFieldValue("priority", value)}
                error={errors.priority}
                required
              />
            </div>
          </fieldset>

          {note && <p className="text-sm text-red-600 mt-4">{note}</p>}

          <div className="rbac-actions mt-6">
            <button className="rbac-button" type="submit" disabled={saving}>
              {saving ? (
                <span className="inline-flex items-center gap-2">
                  <FaSpinner className="animate-spin" size={16} />
                  Saving...
                </span>
              ) : (
                "Save"
              )}
            </button>
            <Link href="/dashboard/query-management">
              <button className="text-red-500" type="button" disabled={saving}>
                Cancel
              </button>
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}
