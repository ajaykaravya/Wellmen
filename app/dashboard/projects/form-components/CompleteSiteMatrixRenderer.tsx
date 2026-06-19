"use client";

export default function CompleteSiteMatrixRenderer({
  section,
  formData,
  setFormData,
}: {
  section: any;
  formData: any;
  setFormData: any;
}) {
  return (
    <table className="w-full border">
      <thead>
        <tr>
          <th className="border p-2">Description</th>

          {section.columns.map((col: any) => (
            <th key={col.key} className="border p-2">
              {col.label}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {section.rows.map((row: any) => (
          <tr key={row.key}>
            <td className="border p-2">{row.label}</td>

            {section.columns.map((col: any) => {
              const name = `${row.key}_${col.key}`;
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
        ))}
      </tbody>
    </table>
  );
}
