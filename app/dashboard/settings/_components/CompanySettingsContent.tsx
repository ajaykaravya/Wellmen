"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaBuilding } from "react-icons/fa";
import { toast } from "react-toastify";
import {
  loadCompanies,
  updateCompany,
  uploadCompanyLogo,
  type CompanyDetails,
} from "@/lib/api/dashboard/companies";

type Draft = {
  name: string;
  code: string;
  contactPerson: string;
  contactNumber: string;
  email: string;
  address: string;
};

const toDraft = (company: CompanyDetails): Draft => ({
  name: company.name || "",
  code: company.code || "",
  contactPerson: company.contactPerson || "",
  contactNumber: company.contactNumber || "",
  email: company.email || "",
  address: company.address || "",
});

export default function CompanySettingsContent() {
  const [companies, setCompanies] = useState<CompanyDetails[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const selected = companies.find((item) => item.id === selectedId) || null;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const rows = await loadCompanies();
      setCompanies(rows);
      if (rows.length > 0) {
        setSelectedId((prev) => prev || rows[0].id);
      }
    } catch (error) {
      console.error("Failed to load companies", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load companies.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (selected) setDraft(toDraft(selected));
  }, [selected]);

  const setField = (key: keyof Draft, value: string) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async () => {
    if (!selected || !draft) return;

    const nextErrors: Record<string, string> = {};
    if (!draft.name.trim()) nextErrors.name = "Company name is required.";
    if (!draft.code.trim()) nextErrors.code = "Company code is required.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setSaving(true);
      const result = await updateCompany(selected.id, draft);
      const updated = result?.data;
      if (updated) {
        setCompanies((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item)),
        );
      }
      toast.success("Company details saved.");
    } catch (error) {
      console.error("Failed to save company", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save company.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogo = async (file: File | null) => {
    if (!file || !selected) return;

    try {
      setUploading(true);
      const result = await uploadCompanyLogo(selected.id, file);
      const logoUrl = result?.data?.logoUrl;
      if (logoUrl) {
        setCompanies((prev) =>
          prev.map((item) =>
            item.id === selected.id ? { ...item, logoUrl } : item,
          ),
        );
      }
      toast.success("Logo updated.");
    } catch (error) {
      console.error("Failed to upload logo", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload logo.",
      );
    } finally {
      setUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <section className="rbac-section rbac-container">
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
          Loading company details...
        </div>
      </section>
    );
  }

  return (
    <section className="rbac-section rbac-container">
      <div className="rbac-card">
        <div className="mb-4">
          <h3 className="rbac-title-lg">Company Details</h3>
          <p className="text-xs text-slate-500">
            These details identify your company on documents and reports.
          </p>
        </div>

        {companies.length > 1 ? (
          <div className="mb-4 flex flex-wrap gap-2">
            {companies.map((company) => (
              <button
                key={company.id}
                type="button"
                onClick={() => setSelectedId(company.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  selectedId === company.id
                    ? "border-teal-700 bg-teal-700 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                {company.name}
              </button>
            ))}
          </div>
        ) : null}

        {draft && selected ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                {selected.logoUrl ? (
                  <Image
                    src={selected.logoUrl}
                    alt={`${selected.name} logo`}
                    width={80}
                    height={80}
                    unoptimized
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <FaBuilding className="text-slate-300" size={28} />
                )}
              </div>

              <div>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Company Logo
                </p>
                <label
                  className={`inline-block cursor-pointer rounded-lg border border-dashed border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 ${
                    uploading ? "pointer-events-none opacity-60" : ""
                  }`}
                >
                  {uploading
                    ? "Uploading..."
                    : selected.logoUrl
                      ? "Replace Logo"
                      : "Upload Logo"}
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => handleLogo(e.target.files?.[0] || null)}
                  />
                </label>
                <p className="mt-1 text-[11px] text-slate-400">
                  PNG or JPG. Saved immediately.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Company Name<span className="ml-0.5 text-rose-600">*</span>
                </label>
                <input
                  className={`rbac-input w-full ${errors.name ? "!border-rose-400" : ""}`}
                  value={draft.name}
                  onChange={(e) => setField("name", e.target.value)}
                />
                {errors.name ? (
                  <p className="mt-1 text-xs text-rose-600">{errors.name}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Company Code<span className="ml-0.5 text-rose-600">*</span>
                </label>
                <input
                  className={`rbac-input w-full ${errors.code ? "!border-rose-400" : ""}`}
                  value={draft.code}
                  onChange={(e) => setField("code", e.target.value)}
                />
                {errors.code ? (
                  <p className="mt-1 text-xs text-rose-600">{errors.code}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Contact Person
                </label>
                <input
                  className="rbac-input w-full"
                  value={draft.contactPerson}
                  onChange={(e) => setField("contactPerson", e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Contact Number
                </label>
                <input
                  className="rbac-input w-full"
                  value={draft.contactNumber}
                  onChange={(e) => setField("contactNumber", e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Email
                </label>
                <input
                  className="rbac-input w-full"
                  value={draft.email}
                  onChange={(e) => setField("email", e.target.value)}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Contact Address
                </label>
                <textarea
                  className="rbac-input w-full"
                  rows={3}
                  value={draft.address}
                  onChange={(e) => setField("address", e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="rbac-button disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            No companies found.
          </div>
        )}
      </div>
    </section>
  );
}
