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
      <div className="overflow-x-auto rounded-xl border border-[color:var(--theme-border)] bg-[var(--theme-surface)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--theme-surface-2)] text-[color:var(--theme-text-muted)] uppercase text-xs font-bold">
              <th className="px-4 py-3 text-left">Description</th>
              {section.columns?.map((col: any) => (
                <th key={col.key} className="px-4 py-3 text-center border-l">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--theme-border)]">
            {section.rows?.map((row: any) => (
              <tr key={row.key} className="hover:bg-[var(--theme-surface-2)]">
                <td className="px-4 py-3 font-medium text-[color:var(--theme-text)]">{row.label}</td>
                {section.columns?.map((col: any) => {
                  let key = "";
                  if (col.key === "size") {
                    // CompleteSiteSize handling
                    const l = formData?.[`${row.key}_size_L` ] || "-";
                    const w = formData?.[`${row.key}_size_W` ] || "-";
                    const h = formData?.[`${row.key}_size_H` ] || "-";
                    return (
                      <td key={col.key} className="px-4 py-3 text-center border-l text-[color:var(--theme-text)]">
                        {l} x {w} x {h}
                      </td>
                    );
                  } else {
                    key = `${row.key}_${col.key}`;
                    return (
                      <td key={col.key} className="px-4 py-3 text-center border-l text-[color:var(--theme-text)]">
                         {formData?.[key] || <span className="text-[color:var(--theme-text-muted)]">-</span>}
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
