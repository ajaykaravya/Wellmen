"use client";

export default function HeaderSection({
  section,
  setFormData,
  formData
}: {
  section: any;
  setFormData: any;
  formData: any;
}) {
  return (
    <div className="rbac-card">
      <h3 className="rbac-title-lg">{section.title}</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        {section.fields.map((field: any) => (
          <div key={field.key} className="w-full">
            <label className="block mb-1">{field.label}</label>

            <input
              className="rbac-input w-full"
              type={field.fieldType}
              name={field.key}
              value={formData?.[field.key] || ""}
              onChange={(e) => {
                setFormData((prev: any) => ({
                  ...prev,

                  [field.key]: e.target.value,
                }));
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
