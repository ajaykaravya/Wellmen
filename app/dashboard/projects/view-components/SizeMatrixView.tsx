"use client";

import {
  getSectionRowColChildValue,
  getSectionRowColValue,
  resolveSectionKey,
} from "@/lib/sectionFormKeys";
import { isFilled, isSizeMatrixRowFilled } from "@/lib/formViewUtils";
import { getCustomRows } from "@/lib/customRows";

export default function SizeMatrixView({
  section,
  formData,
  templateSections = [],
}: {
  section: any;
  formData: any;
  templateSections?: any[];
}) {
  const sectionKey = resolveSectionKey(section);

  // Rows the user added while filling the form live in formData, not the
  // template, so they must be merged in or they vanish from the view and PDF.
  const viewRows = [
    ...(section.rows || []),
    ...getCustomRows(formData, sectionKey),
  ];
  const filledRows =
    viewRows.filter((row: any) =>
      isSizeMatrixRowFilled(
        formData,
        sectionKey,
        row.key,
        section.columns,
        templateSections,
      ),
    ) ?? [];

  if (filledRows.length === 0) return null;

  return (
    <div className="rbac-card">
      <h3 className="rbac-title-lg mb-5">{section.title}</h3>
      <div className="overflow-x-auto rounded-xl border border-[color:var(--theme-border)] bg-[var(--theme-surface)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--theme-surface-2)] text-[color:var(--theme-text-muted)] uppercase text-xs font-bold">
              <th className="px-4 py-3 text-left border-b">
                {section.descriptionLabel || "Description"}
              </th>
              {section.columns?.map((col: any) => (
                <th key={col.key} className="px-4 py-3 text-center border-b border-l" colSpan={col.children ? col.children.length : 1}>
                  {col.label}
                </th>
              ))}
            </tr>
            <tr className="bg-[var(--theme-surface-2)] text-[color:var(--theme-text-muted)] text-[10px] uppercase font-bold">
              <th className="border-b"></th>
              {section.columns?.map((col: any) => 
                col.children ? col.children.map((child: any) => (
                  <th key={child.key} className="px-2 py-2 text-center border-b border-l">{child.label}</th>
                )) : <th key={col.key} className="border-b border-l"></th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--theme-border)]">
            {filledRows.map((row: any) => (
              <tr key={`${sectionKey}-${row.key}`} className="hover:bg-[var(--theme-surface-2)]">
                <td className="px-4 py-3 font-medium text-[color:var(--theme-text)]">{row.label}</td>
                {section.columns?.map((col: any) => 
                  col.children ? col.children.map((child: any) => {
                    const value = getSectionRowColChildValue(
                      formData,
                      sectionKey,
                      row.key,
                      col.key,
                      child.key,
                      "sizeMatrix",
                      templateSections,
                    );
                    return (
                      <td key={`${sectionKey}-${row.key}-${col.key}-${child.key}`} className="px-2 py-3 text-center border-l text-[color:var(--theme-text)]">
                        {isFilled(value) ? String(value) : null}
                      </td>
                    );
                  }) : (
                    <td key={col.key} className="px-2 py-3 text-center border-l text-[color:var(--theme-text)]">
                      {(() => {
                        const value = getSectionRowColValue(
                          formData,
                          sectionKey,
                          row.key,
                          col.key,
                          "sizeMatrix",
                          templateSections,
                        );
                        return isFilled(value) ? String(value) : null;
                      })()}
                    </td>
                  )
                )}
              </tr>
            ))}
          </tbody>

          {(section.totals || []).length > 0 ? (
            <tfoot>
              {(section.totals || []).map((total: any) => {
                const width = (col: any) =>
                  col.children ? col.children.length : 1;
                const index = section.columns.findIndex(
                  (col: any) => col.key === total.column,
                );
                const leading =
                  1 +
                  section.columns
                    .slice(0, Math.max(index, 0))
                    .reduce((n: number, col: any) => n + width(col), 0);
                const trailing = section.columns
                  .slice(index + 1)
                  .reduce((n: number, col: any) => n + width(col), 0);

                // Sums the stored per-row values, so the figure matches what
                // the form showed when it was filled in.
                const sum = filledRows.reduce((acc: number, row: any) => {
                  const raw = getSectionRowColValue(
                    formData,
                    sectionKey,
                    row.key,
                    total.column,
                    "sizeMatrix",
                    templateSections,
                  );
                  const n = Number(raw);
                  return Number.isFinite(n) && String(raw ?? "").trim() !== ""
                    ? acc + n
                    : acc;
                }, 0);

                return (
                  <tr
                    key={total.column}
                    className="bg-[var(--theme-surface-2)] font-bold"
                  >
                    <td
                      className="px-4 py-3 text-right border-t"
                      colSpan={leading}
                    >
                      {total.label || "Total"}
                    </td>
                    <td className="px-2 py-3 text-center border-l border-t">
                      {Math.round(sum * 100) / 100}
                    </td>
                    {trailing > 0 ? (
                      <td className="border-l border-t" colSpan={trailing} />
                    ) : null}
                  </tr>
                );
              })}
            </tfoot>
          ) : null}
        </table>
      </div>
    </div>
  );
}
