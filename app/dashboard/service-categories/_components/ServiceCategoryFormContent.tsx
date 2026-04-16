"use client";

import { useEffect, useState } from "react";
import { FaSpinner } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Loading from "../../../components/Loading";
import Link from "next/link";

type ServiceCategoryFormState = {
  name: string;
};

type ServiceCategoryFormContentProps = {
  categoryId?: string;
};

export default function ServiceCategoryFormContent({ categoryId }: ServiceCategoryFormContentProps) {
  const router = useRouter();
  const [form, setForm] = useState<ServiceCategoryFormState>({
    name: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ServiceCategoryFormState, string>>>({});
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!categoryId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/service-categories/${categoryId}`);
        if (!res.ok) {
          setNote("Failed to load service category.");
          return;
        }

        const data = await res.json();
        setForm({ name: data.name || "" });
      } catch (error) {
        console.error("Failed to load service category", error);
        setNote("Failed to load service category.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [categoryId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setNote(null);

    const newErrors: Partial<Record<keyof ServiceCategoryFormState, string>> = {};
    if (!form.name.trim()) newErrors.name = "Category name is required.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(categoryId ? `/api/service-categories/${categoryId}` : "/api/service-categories", {
        method: categoryId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: "SERVICE_WORK", name: form.name.trim() }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const errorMessage = payload.error || "Failed to save service category.";
        setNote(errorMessage);
        toast.error(errorMessage);
        return;
      }

      toast.success(`Service category ${categoryId ? "updated" : "created"} successfully.`);
      router.push("/dashboard/service-categories");
    } catch (error) {
      console.error("Failed to save service category", error);
      setNote("Failed to save service category.");
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
          <h3 className="rbac-title-lg">{categoryId ? "Edit Service Category" : "Add New Service Category"}</h3>
        </div>

        <form className="rbac-form" onSubmit={handleSubmit}>
          <fieldset disabled={saving} className={saving ? "opacity-70 pointer-events-none" : ""}>
            <label className="rbac-label">
              Name <span className="text-red-600">*</span>
              <input
                className="rbac-input mb-2"
                placeholder="Name"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </label>
            {errors.name && <p className="text-sm text-red-600 mb-2">{errors.name}</p>}
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
            <Link href="/dashboard/service-categories">
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
