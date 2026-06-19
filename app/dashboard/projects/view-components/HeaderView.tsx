"use client";

export default function HeaderView({
  section,
  formData,
}: {
  section: any;
  formData: any;
}) {
  return (
    <div className="rbac-card border-l-4 border-l-blue-600">
      <h3 className="rbac-title-lg mb-4 text-blue-700">{section.title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {section.fields?.map((field: any) => (
          <div key={field.key} className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {field.label}
            </label>
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 min-h-[1.25rem]">
              {formData?.[field.key] || <span className="text-gray-400 italic">Not set</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
