"use client";

export default function SelectionRenderer({
  group,
  columns,
  formData,
  setFormData,
}: {
  group: any;
  columns: any[];
  formData: any;
  setFormData: any;
}) {
  return (
    <div>
      <div className="mb-4 flex gap-3 overflow-x-auto">
        {group.selection.options.map((option: any) => {
          const isMultiple = group.selection.type === "multiple";
          const name = group.key;
          const isChecked = isMultiple
            ? (formData?.[name] || []).includes(option.key)
            : formData?.[name] === option.key;

          return (
            <label key={option.key} className="flex gap-2 mb-2">
              <input
                type={isMultiple ? "checkbox" : "radio"}
                name={name}
                value={option.key}
                checked={isChecked}
                onChange={(e) => {
                  if (isMultiple) {
                    const currentValues = formData?.[name] || [];
                    const nextValues = e.target.checked
                      ? [...currentValues, option.key]
                      : currentValues.filter((v: string) => v !== option.key);
                    setFormData((prev: any) => ({
                      ...prev,
                      [name]: nextValues,
                    }));
                  } else {
                    setFormData((prev: any) => ({
                      ...prev,
                      [name]: option.key,
                    }));
                  }
                }}
              />
              {option.label}
            </label>
          );
        })}
      </div>
      <table className="w-full border">
        <thead>
          <tr>
            {columns.map((col: any) => (
              <th key={col.key} className="border p-2">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {columns.map((col: any) => {
              const name = `${group.key}_${col.key}`;
              return (
                <td key={col.key} className="border p-2">
                  <input
                    className="rbac-input w-full"
                    name={name}
                    value={formData?.[name] || ""}
                    onChange={(e) => {
                      setFormData((prev: any) => ({
                        ...prev,
                        [name]: e.target.value,
                      }));
                    }}
                  />
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
