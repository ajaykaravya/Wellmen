"use client";

export default function ContactView({
  section,
  formData,
}: {
  section: any;
  formData: any;
}) {
  return (
    <div className="rbac-card">
      <h3 className="rbac-title-lg mb-5">{section.title}</h3>
      <div className="overflow-hidden rounded-xl border border-[color:var(--theme-border)] bg-[var(--theme-surface)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--theme-surface-2)] text-[color:var(--theme-text-muted)] uppercase text-xs font-bold">
              <th className="px-6 py-4 text-left">Department</th>
              <th className="px-6 py-4 text-left">Name</th>
              <th className="px-6 py-4 text-left">Mobile</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--theme-border)]">
            {section.rows?.map((row: any) => {
              const name = formData?.[`${row.key}_name`];
              const mobile = formData?.[`${row.key}_mobile`];
              return (
                <tr key={row.key} className="hover:bg-[var(--theme-surface-2)]">
                  <td className="px-6 py-4 font-medium text-[color:var(--theme-text)]">{row.label}</td>
                  <td className="px-6 py-4 text-[color:var(--theme-text)]">{name || <span className="text-[color:var(--theme-text-muted)]">-</span>}</td>
                  <td className="px-6 py-4 text-[color:var(--theme-text)]">{mobile || <span className="text-[color:var(--theme-text-muted)]">-</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
