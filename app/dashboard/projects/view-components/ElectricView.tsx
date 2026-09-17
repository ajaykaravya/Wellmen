"use client";

import { resolveSectionKey, scopedKey } from "@/lib/sectionFormKeys";
import { isFilled } from "@/lib/formViewUtils";

export default function ElectricView({
  section,
  formData,
}: {
  section: any;
  formData: any;
  templateSections?: any[];
}) {
  const sectionKey = resolveSectionKey(section);
  const columns: any[] = section.columns || [];
  const editable = columns.filter((col) => !col.source);

  const cellValue = (row: any, col: any) =>
    formData?.[scopedKey(sectionKey, row.key, col.key)];

  // A row earns its place in the view once any of its input columns is filled.
  const filledRows =
    section.rows?.filter((row: any) =>
      editable.some((col) => isFilled(cellValue(row, col))),
    ) ?? [];

  if (filledRows.length === 0) return null;

  return (
    <div className="rbac-card">
      <h3 className="rbac-title-lg mb-5">{section.title}</h3>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--theme-surface-2)] text-xs font-bold uppercase text-[color:var(--theme-text-muted)]">
              {columns.map((col) => (
                <th key={col.key} className="px-6 py-4 text-left">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filledRows.map((row: any) => (
              <tr key={`${sectionKey}-${row.key}`}>
                {columns.map((col) => {
                  if (col.source === "row") {
                    return (
                      <td
                        key={col.key}
                        className={`px-6 py-4 align-top ${
                          col.key === "description" ? "font-medium" : ""
                        }`}
                      >
                        {row[col.key] ??
                          (col.key === "description" ? row.label : null)}
                      </td>
                    );
                  }
                  const value = cellValue(row, col);
                  return (
                    <td key={col.key} className="px-6 py-4 align-top">
                      {isFilled(value) ? String(value) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
