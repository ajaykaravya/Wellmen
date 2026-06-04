"use client";

import { useEffect, useState } from "react";
import { FaSpinner } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Loading from "../../../components/Loading";
import Link from "next/link";

type IncomeTypeStatus = "ACTIVE" | "INACTIVE";

type IncomeTypeFormState = {
  name: string;
  status: IncomeTypeStatus;
};

type IncomeTypeFormContentProps = {
  incomeTypeId?: string;
};

const STATUS_OPTIONS: { value: IncomeTypeStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

export default function IncomeTypeFormContent({
  incomeTypeId,
}: IncomeTypeFormContentProps) {
  const router = useRouter();
  const [form, setForm] = useState<IncomeTypeFormState>({
    name: "",
    status: "ACTIVE",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof IncomeTypeFormState, string>>
  >({});
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!incomeTypeId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/income-types/${incomeTypeId}`);
        if (!res.ok) {
          setNote("Failed to load income type.");
          return;
        }

        const data = await res.json();
        setForm({
          name: data.name || "",
          status: data.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
        });
      } catch (error) {
        console.error("Failed to load income type", error);
        setNote("Failed to load income type.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [incomeTypeId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setNote(null);

    const newErrors: Partial<Record<keyof IncomeTypeFormState, string>> = {};
    if (!form.name.trim()) newErrors.name = "Name is required.";
    if (!form.status) newErrors.status = "Status is required.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(
        incomeTypeId ? `/api/income-types/${incomeTypeId}` : "/api/income-types",
        {
          method: incomeTypeId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            status: form.status,
          }),
        },
      );

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const errorMessage = payload.error || "Failed to save income type.";
        setNote(errorMessage);
        toast.error(errorMessage);
        return;
      }

      toast.success(
        `Income type ${incomeTypeId ? "updated" : "created"} successfully.`,
      );
      router.push("/dashboard/income-types");
    } catch (error) {
      console.error("Failed to save income type", error);
      setNote("Failed to save income type.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex min-h-80 items-center justify-center">
        <Loading />
      </div>
    );

  return (
    <section className="rbac-section rbac-container">
      <div className="rbac-card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="rbac-title-lg">
            {incomeTypeId ? "Edit Income Type" : "Add New Income Type"}
          </h3>
        </div>

        <form className="rbac-form" onSubmit={handleSubmit}>
          <fieldset
            disabled={saving}
            className={saving ? "pointer-events-none opacity-70" : ""}
          >
            <label className="rbac-label">
              Name <span className="text-red-600">*</span>
              <input
                className="rbac-input mb-1"
                placeholder="Name"
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
              Status <span className="text-red-600">*</span>
              <select
                className="rbac-input mb-2"
                value={form.status}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    status: event.target.value as IncomeTypeStatus,
                  }))
                }
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {errors.status && (
              <p className="mb-2 text-sm text-red-600">{errors.status}</p>
            )}
          </fieldset>

          {note && <p className="mb-4 text-sm text-red-600">{note}</p>}

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
            <Link href="/dashboard/income-types">
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
