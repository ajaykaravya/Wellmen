"use client";

export default function ElectricView({
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
              <th className="px-6 py-4 text-left">Sub Zero Panel Board</th>
              <th className="px-6 py-4 text-left">Touch Panel Board</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {section.rows?.map((row: any) => {
              const subZero = formData?.[`${row.key}_sub_zero_remark`];
              const touchPanel = formData?.[`${row.key}_touch_panel_remark`];
              return (
                <tr key={row.key} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">{row.label}</td>
                  <td className="px-6 py-4 text-gray-900 dark:text-gray-100">{subZero || <span className="text-gray-400">-</span>}</td>
                  <td className="px-6 py-4 text-gray-900 dark:text-gray-100">{touchPanel || <span className="text-gray-400">-</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
