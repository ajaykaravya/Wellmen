"use client";

export default function NormalMatrixRenderer({
  group,
  columns,
}: {
  group: any;
  columns: any[];
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

              {columns.map((col) => (
                <td key={col.key} className="border p-2 min-w-[150px]">
                  <input
                    className="rbac-input w-full"
                    name={`${row.key}_${col.key}`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
