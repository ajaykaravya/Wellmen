"use client";

import { useEffect, useState } from "react";
import { FaSpinner } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Loading from "../../../components/Loading";
import { useDashboardContext } from "../../_components/DashboardShell";
import CustomDatePicker from "../../../components/CustomDatePicker";
import Link from "next/link";
import { formatToDDMMYYYY, getTodayInputDate } from "@/lib/dateUtils";

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
  const formatted = formatToDDMMYYYY(value);
  return formatted === "-" ? "" : formatted;
};

const isMobileValid = (mobile: string) => /^\d{10}$/.test(mobile);
const isEmailValid = (email: string) => email === "" || /\S+@\S+\.\S+/.test(email);

export default function ProjectFormContent({ projectId }: ProjectFormContentProps) {
  const router = useRouter();
  const { setNavOpen } = useDashboardContext();
  const [note, setNote] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof ProjectFormState, string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProjectFormState>({
    name: "",
    address: "",
    contactNumber: "",
    email: "",
    startDate: getTodayInputDate(),
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
    else if (!isMobileValid(form.contactNumber.trim())) {
      newErrors.contactNumber = "Contact number must be 10 digits.";
    }
    if (form.email.trim() && !isEmailValid(form.email.trim())) {
      newErrors.email = "Email must contain @ and .";
    }
    if (!form.startDate) newErrors.startDate = "Start date is required.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      setSaving(true);
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
        const errorMessage = payload.error || "Failed to save project.";
        const backendErrors: Partial<Record<keyof ProjectFormState, string>> = {};

        if (errorMessage.toLowerCase().includes("end date")) {
          backendErrors.endDate = errorMessage;
        }
        if (errorMessage.toLowerCase().includes("start date")) {
          backendErrors.startDate = errorMessage;
        }

        setErrors((prev) => ({ ...prev, ...backendErrors }));
        setNote(errorMessage);
        toast.error(errorMessage);
        return;
      }

      toast.success(`Project ${projectId ? "updated" : "created"} successfully.`);
      router.push("/dashboard/projects");
    } catch (error) {
      console.error("Failed to save project", error);
      setNote("Failed to save project.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-80 flex items-center justify-center">
        <Loading />
      </div>
    );

  return (
    <>
      <section className="rbac-section rbac-container">
        <div className="rbac-card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="rbac-title-lg">{projectId ? "Edit Project" : "Add New Project"}</h3>
          </div>
          <form className="rbac-form " onSubmit={handleSubmit}>
            <fieldset disabled={saving} className={saving ? "opacity-70 pointer-events-none" : ""}>
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
                {errors.contactNumber && (
                  <p className="text-sm text-red-600 mb-2">{errors.contactNumber}</p>
                )}
                </label>

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
                {errors.email && (
                  <p className="text-sm text-red-600 mb-2">{errors.email}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="rbac-label">
                  Start date <span className="text-red-600">*</span>
                  <CustomDatePicker
                    value={form.startDate}
                    onChange={(value) =>
                      setForm((prev) => ({ ...prev, startDate: value }))
                    }
                    placeholder="DD/MM/YYYY"
                    className="rbac-input mb-2"
                  />
                {errors.startDate && (
                  <p className="text-sm text-red-600 mb-2">{errors.startDate}</p>
                )}
                </label>

                <label className="rbac-label">
                  End date
                  <CustomDatePicker
                    value={form.endDate}
                    onChange={(value) =>
                      setForm((prev) => ({ ...prev, endDate: value }))
                    }
                    placeholder="DD/MM/YYYY"
                    className="rbac-input mb-2"
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
            </fieldset>
            <div className="rbac-actions">
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
              <Link href="/dashboard/projects">
              <button
                className="text-red-500"
                type="button"
                disabled={saving}
              >
                Cancel
              </button>
              </Link>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
