"use client";

export default function CompleteSiteView({
  section,
  formData,
}: {
  section: any;
  formData: any;
}) {
  return (
    <div className="rbac-card">
      <h3 className="rbac-title-lg mb-5">{section.title}</h3>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 text-gray-600 uppercase text-xs font-bold">
              <th className="px-4 py-3 text-left">Description</th>
              {section.columns?.map((col: any) => (
                <th key={col.key} className="px-4 py-3 text-center border-l">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {section.rows?.map((row: any) => (
              <tr key={row.key} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{row.label}</td>
                {section.columns?.map((col: any) => {
                  let key = "";
                  if (col.key === "size") {
                    // CompleteSiteSize handling
                    const l = formData?.[`${row.key}_size_L` ] || "-";
                    const w = formData?.[`${row.key}_size_W` ] || "-";
                    const h = formData?.[`${row.key}_size_H` ] || "-";
                    return (
                      <td key={col.key} className="px-4 py-3 text-center border-l text-gray-900 dark:text-gray-100">
                        {l} x {w} x {h}
                      </td>
                    );
                  } else {
                    key = `${row.key}_${col.key}`;
                    return (
                      <td key={col.key} className="px-4 py-3 text-center border-l text-gray-900 dark:text-gray-100">
                         {formData?.[key] || <span className="text-gray-300">-</span>}
                      </td>
                    );
                  }
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
