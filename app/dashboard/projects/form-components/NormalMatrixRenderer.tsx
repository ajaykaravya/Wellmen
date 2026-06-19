"use client";

export default function NormalMatrixRenderer({
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
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[700px] border-collapse border">
        <thead>
          <tr>
            <th className="border p-2 text-left whitespace-nowrap">
              Description
            </th>

            {columns.map((col) => (
              <th
                key={col.key}
                className="border p-2 text-left whitespace-nowrap"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {group.rows.map((row: any) => (
            <tr key={row.key}>
              <td className="border p-2 whitespace-nowrap">{row.label}</td>

              {columns.map((col) => {
                const name = `${row.key}_${col.key}`;
                return (
                  <td key={col.key} className="border p-2 min-w-[150px]">
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
    </div>
  );
}
