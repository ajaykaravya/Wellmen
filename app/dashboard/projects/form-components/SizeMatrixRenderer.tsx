"use client";

export default function SizeMatrixRenderer({ section }: { section: any }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-[900px] w-full border-collapse border">
        <thead>
          <tr>
            <th rowSpan={2} className="border p-2 text-sm whitespace-nowrap">
              Description
            </th>

            {section.columns.map((col: any) =>
              col.children ? (
                <th
                  key={col.key}
                  colSpan={col.children.length}
                  className="border p-2 text-sm whitespace-nowrap"
                >
                  {col.label}
                </th>
              ) : (
                <th
                  key={col.key}
                  rowSpan={2}
                  className="border p-2 text-sm whitespace-nowrap"
                >
                  {col.label}
                </th>
              ),
            )}
          </tr>

          <tr>
            {section.columns.map(
              (col: any) =>
                col.children &&
                col.children.map((child: any) => (
                  <th
                    key={`${col.key}-${child.key}`}
                    className="border p-2 text-sm"
                  >
                    {child.label}
                  </th>
                )),
            )}
          </tr>
        </thead>

        <tbody>
          {section.rows.map((row: any) => (
            <tr key={row.key}>
              <td className="border p-2 text-sm whitespace-nowrap">
                {row.label}
              </td>

              {section.columns.map((col: any) =>
                col.children ? (
                  col.children.map((child: any) => (
                    <td
                      key={`${row.key}-${col.key}-${child.key}`}
                      className="border p-2"
                    >
                      <input className="rbac-input w-full min-w-[80px]" />
                    </td>
                  ))
                ) : (
                  <td key={`${row.key}-${col.key}`} className="border p-2">
                    <input className="rbac-input w-full min-w-[100px]" />
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
