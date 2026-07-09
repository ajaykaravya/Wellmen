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
      <div className="overflow-x-auto rounded-xl border border-[color:var(--theme-border)] bg-[var(--theme-surface)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--theme-surface-2)] text-[color:var(--theme-text-muted)] uppercase text-xs font-bold">
              <th className="px-6 py-4 text-left">Description</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-left">Remark</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--theme-border)]">
            {section.rows?.map((row: any) => {
              const status = formData?.[row.key];
              const remark = formData?.[`${row.key}_remark`];
              return (
                <tr key={row.key} className="hover:bg-[var(--theme-surface-2)]">
                  <td className="px-6 py-4 text-[color:var(--theme-text)]">{row.label}</td>
                  <td className="px-6 py-4 text-center">
                    {status === "OK" && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[var(--theme-success-bg)] text-[var(--theme-success-text)]">OK</span>
                    )}
                    {status === "NOT_OK" && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[var(--theme-danger-bg)] text-[var(--theme-danger-text)]">Not Ok</span>
                    )}
                    {!status && <span className="text-[color:var(--theme-text-muted)]">-</span>}
                  </td>
                  <td className="px-6 py-4 text-[color:var(--theme-text-muted)] italic">
                    {remark || <span className="text-[color:var(--theme-text-muted)]">-</span>}
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
