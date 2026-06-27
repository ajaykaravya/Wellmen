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
            <tr className="bg-[var(--theme-surface-2)] text-[color:var(--theme-text-muted)] uppercase text-xs font-bold">
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
                <tr key={row.key} className="">
                  <td className="px-6 py-4 font-medium">{row.label}</td>
                  <td className="px-6 py-4">{subZero || <span className="">-</span>}</td>
                  <td className="px-6 py-4">{touchPanel || <span className="">-</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
