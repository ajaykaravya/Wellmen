"use client";

export default function CompleteSiteMatrixRenderer({
  section,
}: {
  section: any;
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

            {section.columns.map((col: any) => (
              <td key={col.key} className="border p-2">
                <input className="rbac-input w-full" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
