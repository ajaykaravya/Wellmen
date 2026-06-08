"use client";

import { useEffect, useState } from "react";
import { FaSpinner } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Loading from "../../../components/Loading";
import Link from "next/link";
import { reportingCategoriesApi } from "@/lib/api/dashboard/reporting-categories";

type ReportingCategoryFormState = {
  name: string;
};

type ReportingCategoryFormContentProps = {
  categoryId?: string;
};

export default function ReportingCategoryFormContent({
  categoryId,
}: ReportingCategoryFormContentProps) {
  const router = useRouter();
  const [form, setForm] = useState<ReportingCategoryFormState>({
    name: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof ReportingCategoryFormState, string>>
  >({});
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!categoryId) {
        setLoading(false);
        return;
      }

      try {
        const data = await reportingCategoriesApi.get(categoryId);
        setForm({ name: data.name || "" });
      } catch (error) {
        console.error("Failed to load reporting category", error);
        setNote("Failed to load reporting category.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [categoryId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setNote(null);

    const newErrors: Partial<Record<keyof ReportingCategoryFormState, string>> =
      {};
    if (!form.name.trim()) newErrors.name = "Category name is required.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      setSaving(true);
      const payload = {
        category: "REPORTING_WORK" as const,
        name: form.name.trim(),
      };

      if (categoryId) {
        await reportingCategoriesApi.update(categoryId, payload);
      } else {
        await reportingCategoriesApi.create(payload);
      }

      toast.success(
        `Reporting category ${categoryId ? "updated" : "created"} successfully.`,
      );
      router.push("/dashboard/reporting-categories");
    } catch (error) {
      console.error("Failed to save reporting category", error);
      const message =
        error instanceof Error ? error.message : "Failed to save reporting category.";
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
            {categoryId ? "Edit Reporting Category" : "Add New Reporting Category"}
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
            <Link href="/dashboard/reporting-categories">
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
