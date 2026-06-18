"use client";
export default function HeaderSection({
    section
}: {
    section: any
}) {
    return (
        <div className="rbac-card">
            <h3 className="rbac-title-lg">
                {section.title}
            </h3>
            <div className="grid grid-cols-2 gap-4 mt-4">
                {
                    section.fields.map((field: any) => (
                        <div key={field.key}>
                            <label>
                                {field.label}
                            </label>
                            <input
                                className="rbac-input w-full"
                                type={field.fieldType}
                                name={field.key}
                            />
                        </div>
                    ))
                }
            </div>
        </div>
    );
}