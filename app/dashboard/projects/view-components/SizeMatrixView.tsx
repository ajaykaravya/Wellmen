"use client";

export default function SizeMatrixView({
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
              <th className="px-4 py-3 text-left border-b">Description</th>
              {section.columns?.map((col: any) => (
                <th key={col.key} className="px-4 py-3 text-center border-b border-l" colSpan={col.children ? col.children.length : 1}>
                  {col.label}
                </th>
              ))}
            </tr>
            <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-gray-500 text-[10px] uppercase font-bold">
              <th className="border-b"></th>
              {section.columns?.map((col: any) => 
                col.children ? col.children.map((child: any) => (
                  <th key={child.key} className="px-2 py-2 text-center border-b border-l">{child.label}</th>
                )) : <th key={col.key} className="border-b border-l"></th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {section.rows?.map((row: any) => (
              <tr key={row.key} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{row.label}</td>
                {section.columns?.map((col: any) => 
                  col.children ? col.children.map((child: any) => {
                    const key = `${row.key}_${col.key}_${child.key}`;
                    return (
                      <td key={key} className="px-2 py-3 text-center border-l text-gray-900 dark:text-gray-100">
                        {formData?.[key] || <span className="text-gray-300">-</span>}
                      </td>
                    );
                  }) : (
                    <td key={col.key} className="px-2 py-3 text-center border-l text-gray-900 dark:text-gray-100">
                      {formData?.[`${row.key}_${col.key}`] || <span className="text-gray-300">-</span>}
                    </td>
                  )
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
