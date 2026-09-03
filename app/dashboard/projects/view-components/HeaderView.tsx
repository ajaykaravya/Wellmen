"use client";

import { isFilled } from "@/lib/formViewUtils";

export default function HeaderView({
  section,
  formData,
}: {
  section: any;
  formData: any;
}) {
  const filledFields =
    section.fields?.filter((field: any) => isFilled(formData?.[field.key])) ??
    [];

  if (filledFields.length === 0) return null;

  return (
    <div className="rbac-card border-l-4 border-l-blue-600">
      <h3 className="rbac-title-lg mb-4 theme-text">{section.title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filledFields.map((field: any) => (
          <div key={field.key} className="space-y-1">
            <label className="text-xs font-semibold text-[color:var(--theme-text-muted)] uppercase tracking-wider">
              {field.label}
            </label>
            <div className="text-sm font-medium theme-text min-h-[1.25rem]">
              {formData[field.key]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
