"use client";

export default function SelectionRenderer({
  group,
  columns,
}: {
  group: any;
  columns: any[];
}) {
  return (
    <div>
      <div className="mb-4 flex gap-3">
        {group.selection.options.map((option: any) => (
          <label key={option.key} className="flex gap-2 mb-2">
            <input
              type={group.selection.type === "multiple" ? "checkbox" : "radio"}
              name={group.key}
              value={option.key}
            />
            {option.label}
          </label>
        ))}
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
            {columns.map((col: any) => (
              <td key={col.key} className="border p-2">
                <input
                  className="rbac-input w-full"
                  name={`${group.key}_${col.key}`}
                />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
