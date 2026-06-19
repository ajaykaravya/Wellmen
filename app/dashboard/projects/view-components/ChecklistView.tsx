"use client";

export default function ChecklistView({
  section,
  formData,
}: {
  section: any;
  formData: any;
}) {
  return (
    <div className="rbac-card">
      <h3 className="rbac-title-lg mb-5">{section.title}</h3>
      <div className="overflow-hidden rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 text-gray-600 uppercase text-xs font-bold">
              <th className="px-6 py-4 text-left">Description</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-left">Remark</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {section.rows?.map((row: any) => {
              const status = formData?.[row.key];
              const remark = formData?.[`${row.key}_remark`];
              return (
                <tr key={row.key} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 text-gray-800 dark:text-gray-200">{row.label}</td>
                  <td className="px-6 py-4 text-center">
                    {status === "OK" && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">OK</span>
                    )}
                    {status === "NOT_OK" && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">NOT OK</span>
                    )}
                    {!status && <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-6 py-4 text-gray-600 italic">
                    {remark || <span className="text-gray-400">-</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
