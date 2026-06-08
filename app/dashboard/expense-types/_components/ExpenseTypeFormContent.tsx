"use client";

import { useEffect, useState } from "react";
import { FaSpinner } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Loading from "../../../components/Loading";
import Link from "next/link";
import { expenseTypesApi } from "@/lib/api/dashboard/expense-types";

type ExpenseTypeStatus = "ACTIVE" | "INACTIVE";

type ExpenseTypeFormState = {
  name: string;
  status: ExpenseTypeStatus;
};

type ExpenseTypeFormContentProps = {
  expenseTypeId?: string;
};

const STATUS_OPTIONS: { value: ExpenseTypeStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

export default function ExpenseTypeFormContent({
  expenseTypeId,
}: ExpenseTypeFormContentProps) {
  const router = useRouter();
  const [form, setForm] = useState<ExpenseTypeFormState>({
    name: "",
    status: "ACTIVE",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof ExpenseTypeFormState, string>>
  >({});
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!expenseTypeId) {
        setLoading(false);
        return;
      }

      try {
        const data = await expenseTypesApi.get(expenseTypeId);
        setForm({
          name: data.name || "",
          status: data.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
        });
      } catch (error) {
        console.error("Failed to load expense type", error);
        setNote("Failed to load expense type.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [expenseTypeId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setNote(null);

    const newErrors: Partial<Record<keyof ExpenseTypeFormState, string>> = {};
    if (!form.name.trim()) newErrors.name = "Name is required.";
    if (!form.status) newErrors.status = "Status is required.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        status: form.status,
      };

      if (expenseTypeId) {
        await expenseTypesApi.update(expenseTypeId, payload);
      } else {
        await expenseTypesApi.create(payload);
      }

      toast.success(
        `Expense type ${expenseTypeId ? "updated" : "created"} successfully.`,
      );
      router.push("/dashboard/expense-types");
    } catch (error) {
      console.error("Failed to save expense type", error);
      const message =
        error instanceof Error ? error.message : "Failed to save expense type.";
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
    <section className="rbac-section rbac-container">
      <div className="rbac-card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="rbac-title-lg">
            {expenseTypeId ? "Edit Expense Type" : "Add New Expense Type"}
          </h3>
        </div>

        <form className="rbac-form" onSubmit={handleSubmit}>
          <fieldset
            disabled={saving}
            className={saving ? "opacity-70 pointer-events-none" : ""}
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
                    status: event.target.value as ExpenseTypeStatus,
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
              <p className="text-sm text-red-600 mb-2">{errors.status}</p>
            )}
          </fieldset>

          {note && <p className="text-sm text-red-600 mb-4">{note}</p>}

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
            <Link href="/dashboard/expense-types">
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
