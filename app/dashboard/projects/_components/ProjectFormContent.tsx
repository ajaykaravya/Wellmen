"use client";

import { useEffect, useState } from "react";
import { FaSpinner } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Loading from "../../../components/Loading";
import CustomDatePicker from "../../../components/CustomDatePicker";
import Link from "next/link";
import { formatToDDMMYYYY, getTodayInputDate } from "@/lib/dateUtils";
import { projectsApi } from "@/lib/api/dashboard/projects";

type ProjectFormState = {
  name: string;
  address: string;
  city: string;
  contactNumber: string;
  email: string;
  startDate: string;
  endDate: string;
  description: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD";
};

type ProjectFormContentProps = {
  projectId?: string;
  entityType?: "project" | "hospital";
};

const formatDateForInput = (value?: string) => {
  if (!value) return "";
  const formatted = formatToDDMMYYYY(value);
  return formatted === "-" ? "" : formatted;
};

const isMobileValid = (mobile: string) => /^\d{10}$/.test(mobile);
const isEmailValid = (email: string) =>
  email === "" || /\S+@\S+\.\S+/.test(email);

export default function ProjectFormContent({
  projectId,
  entityType = "project",
}: ProjectFormContentProps) {
  const router = useRouter();
  const isHospital = entityType === "hospital";
  const [, setNote] = useState<string | null>(null);
  const [errors, setErrors] = useState<
    Partial<Record<keyof ProjectFormState, string>>
  >({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProjectFormState>({
    name: "",
    address: "",
    city: "",
    contactNumber: "",
    email: "",
    startDate: getTodayInputDate(),
    endDate: "",
    description: "",
    status: isHospital ? "COMPLETED" : "PENDING",
  });

  useEffect(() => {
    const loadData = async () => {
      if (!projectId) {
        setLoading(false);
        return;
      }

      try {
        const project = await projectsApi.get(projectId);
        setForm({
          name: project.name || "",
          address: project.address || "",
          city: project.city || "",
          contactNumber: project.contactNumber || "",
          email: project.email || "",
          startDate: formatDateForInput(project.startDate),
          endDate: formatDateForInput(project.endDate),
          description: project.description || "",
          status: isHospital ? "COMPLETED" : project.status || "PENDING",
        });
      } catch (error) {
        console.error("Failed to load project", error);
        setNote("Failed to load project.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [projectId, isHospital]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setNote(null);

    const newErrors: Partial<Record<keyof ProjectFormState, string>> = {};

    if (!form.name.trim()) newErrors.name = "Project name is required.";
    if (!form.address.trim()) newErrors.address = "Address is required.";
    if (!form.city.trim()) newErrors.city = "City is required.";
    if (!form.contactNumber.trim())
      newErrors.contactNumber = "Mobile number is required.";
    else if (!isMobileValid(form.contactNumber.trim())) {
      newErrors.contactNumber = "Mobile number must be 10 digits.";
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
      const payload = {
        name: form.name.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        contactNumber: form.contactNumber.trim(),
        email: form.email.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        description: form.description.trim(),
        status: isHospital ? "COMPLETED" : form.status,
      };

      if (projectId) {
        await projectsApi.update(projectId, payload);
      } else {
        await projectsApi.create(payload);
      }

      toast.success(
        `${isHospital ? "Hospital" : "Project"} ${
          projectId ? "updated" : "created"
        } successfully.`,
      );
      router.push(isHospital ? "/dashboard/hospitals" : "/dashboard/projects");
    } catch (error) {
      console.error("Failed to save project", error);
      const message = error instanceof Error ? error.message : "Failed to save project.";
      setNote(message);
      toast.error(message);
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
            <h3 className="rbac-title-lg">
              {projectId
                ? `Edit ${isHospital ? "Hospital" : "Project"}`
                : `Add New ${isHospital ? "Hospital" : "Project"}`}
            </h3>
          </div>
          <form className="rbac-form " onSubmit={handleSubmit}>
            <fieldset
              disabled={saving}
              className={saving ? "opacity-70 pointer-events-none" : ""}
            >
              <div className="">
                <label className="rbac-label">
                  Project name <span className="text-red-600">*</span>
                  <input
                    className="rbac-input mb-1"
                    placeholder="Project name"
                    value={form.name}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                  />
                </label>
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name}</p>
                )}

                <label className="rbac-label">
                  Description
                  <textarea
                    className="rbac-input"
                    rows={4}
                    placeholder="Project description"
                    value={form.description}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                  />
                </label>

                <div className="grid grid-cols-1 gap-0 md:gap-4 md:grid-cols-2">
                  <label className="rbac-label">
                    Address <span className="text-red-600">*</span>
                    <textarea
                      className="rbac-input"
                      placeholder="Project address"
                      value={form.address}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          address: event.target.value,
                        }))
                      }
                    />
                    {errors.address && (
                      <p className="text-sm text-red-600">
                        {errors.address}
                      </p>
                    )}
                  </label>

                  <label className="rbac-label">
                    City <span className="text-red-600">*</span>
                    <input
                      className="rbac-input mb-1"
                      placeholder="City"
                      value={form.city}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          city: event.target.value,
                        }))
                      }
                    />
                    {errors.city && (
                      <p className="text-sm text-red-600">
                        {errors.city}
                      </p>
                    )}
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-0 md:gap-4 md:grid-cols-2">
                  <label className="rbac-label">
                    Mobile number <span className="text-red-600">*</span>
                    <input
                      className="rbac-input mb-1"
                      placeholder="Mobile number"
                      maxLength={10}
                      value={form.contactNumber}
                      onChange={(event) => {
                        const onlyNumbers = event.target.value.replace(
                          /\D/g,
                          "",
                        );

                        setForm((prev) => ({
                          ...prev,
                          contactNumber: onlyNumbers,
                        }));
                      }}
                    />
                    {errors.contactNumber && (
                      <p className="text-sm text-red-600 mb-2">
                        {errors.contactNumber}
                      </p>
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
                        setForm((prev) => ({
                          ...prev,
                          email: event.target.value,
                        }))
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
                      <p className="text-sm text-red-600 mb-2">
                        {errors.startDate}
                      </p>
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
                {isHospital ? (
                  <label className="rbac-label">
                    Status <span className="text-red-600">*</span>
                    <input
                      className="rbac-input mb-2"
                      value="Completed"
                      disabled
                      readOnly
                    />
                  </label>
                ) : (
                  <label className="rbac-label">
                    Status <span className="text-red-600">*</span>
                    <select
                      className="rbac-input rbac-select mb-2"
                      value={form.status}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          status: event.target
                            .value as ProjectFormState["status"],
                        }))
                      }
                    >
                      <option value="PENDING">Pending</option>
                      <option value="IN_PROGRESS">In progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="ON_HOLD">On hold</option>
                    </select>
                  </label>
                )}
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
              <Link href={isHospital ? "/dashboard/hospitals" : "/dashboard/projects"}>
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
