"use client";

export default function MatrixView({
  section,
  formData,
}: {
  section: any;
  formData: any;
}) {
  return (
    <div className="rbac-card">
      <h3 className="rbac-title-lg mb-5">{section.title}</h3>
      <div className="space-y-8">
        {section.groups?.map((group: any) => (
          <div key={group.key} className="space-y-4">
            <h4 className="text-md font-bold theme-text border-b pb-2">
              {group.label || group.title}
            </h4>

            {group.selection?.enabled ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs font-semibold text-[color:var(--theme-text-muted)] uppercase">Selected:</span>
                  {Array.isArray(formData?.[group.key]) ? (
                    formData?.[group.key].map((optKey: string) => {
                      const opt = group.selection.options.find((o: any) => o.key === optKey);
                      return (
                        <span key={optKey} className="px-2 py-0.5 rounded bg-[var(--theme-surface-2)] text-[color:var(--theme-text)] text-xs font-medium border border-[color:var(--theme-border)]">
                          {opt?.label || optKey}
                        </span>
                      );
                    })
                  ) : formData?.[group.key] ? (
                    <span className="px-2 py-0.5 rounded bg-[var(--theme-surface-2)] text-[color:var(--theme-text)] text-xs font-medium border border-[color:var(--theme-border)]">
                      {group.selection.options.find((o: any) => o.key === formData?.[group.key])?.label || formData?.[group.key]}
                    </span>
                  ) : (
                    <span className="text-xs text-[color:var(--theme-text-muted)] italic">None</span>
                  )}
                </div>
                <div className="overflow-x-auto rounded-lg border border-[color:var(--theme-border)] bg-[var(--theme-surface)]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[var(--theme-surface-2)] text-[color:var(--theme-text-muted)] uppercase text-xs font-bold">
                        {section.columns?.map((col: any) => (
                          <th key={col.key} className="px-4 py-3 text-left">{col.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {section.columns?.map((col: any) => {
                          const val = formData?.[`${group.key}_${col.key}`];
                          return (
                            <td key={col.key} className="px-4 py-3 text-[color:var(--theme-text)]">
                              {val || <span className="text-[color:var(--theme-text-muted)]">-</span>}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-[color:var(--theme-border)] bg-[var(--theme-surface)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--theme-surface-2)] text-[color:var(--theme-text-muted)] uppercase text-xs font-bold">
                      <th className="px-4 py-3 text-left">Description</th>
                      {section.columns?.map((col: any) => (
                        <th key={col.key} className="px-4 py-3 text-left">{col.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[color:var(--theme-border)]">
                    {group.rows?.map((row: any) => (
                      <tr key={row.key} className="hover:bg-[var(--theme-surface-2)]">
                        <td className="px-4 py-3 text-[color:var(--theme-text)] font-medium">{row.label}</td>
                        {section.columns?.map((col: any) => {
                          const val = formData?.[`${row.key}_${col.key}`];
                          return (
                            <td key={col.key} className="px-4 py-3 text-[color:var(--theme-text)]">
                              {val || <span className="text-[color:var(--theme-text-muted)]">-</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
