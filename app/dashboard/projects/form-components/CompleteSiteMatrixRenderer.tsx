"use client";

import { resolveSectionKey, sectionRowColKey } from "@/lib/sectionFormKeys";
import { getCustomRows } from "@/lib/customRows";
import { AddRowButton, CustomRowLabelCell } from "./CustomRowControls";

export default function CompleteSiteMatrixRenderer({
  section,
  formData,
  setFormData,
}: {
  section: any;
  formData: any;
  setFormData: any;
}) {
  const sectionKey = resolveSectionKey(section);
  const columns: any[] = section.columns || [];

  const allRows = [
    ...(section.rows || []),
    ...getCustomRows(formData, sectionKey).map((row: any) => ({
      ...row,
      isCustom: true,
    })),
  ];

  // Each column holds a text input, so the table cannot shrink below roughly
  // this width. Stating it lets the wrapper scroll instead of the trailing
  // columns being cut off the side of the card on a phone.
  const tableMinWidth = 200 + columns.length * 120;

  const cellInput = (row: any, col: any) => {
    const name = sectionRowColKey(sectionKey, row.key, col.key);
    return (
      <input
        className="rbac-input w-full"
        name={name}
        value={formData?.[name] || ""}
        onChange={(e) => {
          setFormData((prev: any) => ({
            ...prev,
            [name]: e.target.value,
          }));
        }}
      />
    );
  };

  return (
    <>
      {/* Desktop / tablet: the full grid, scrolled sideways when it is wider
          than the card. */}
      <div className="hidden overflow-x-auto rounded-xl border md:block">
        <table
          className="w-full border-collapse"
          style={{ minWidth: `${tableMinWidth}px` }}
        >
          <thead>
            <tr className="bg-[var(--theme-surface-2)] text-[color:var(--theme-text-muted)]">
              <th className="border p-2 text-left">Description</th>

              {columns.map((col: any) => (
                <th key={col.key} className="border p-2 whitespace-nowrap">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {allRows.map((row: any) => (
              <tr key={`${sectionKey}-${row.key}`}>
                <td className="border p-2">
                  {row.isCustom ? (
                    <CustomRowLabelCell
                      scope={sectionKey}
                      row={row}
                      setFormData={setFormData}
                    />
                  ) : (
                    row.label
                  )}
                </td>

                {columns.map((col: any) => (
                  <td key={col.key} className="border p-2">
                    {cellInput(row, col)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: one card per row, so every column stays reachable without
          sideways scrolling. */}
      <div className="space-y-4 md:hidden">
        {allRows.map((row: any) => (
          <div
            key={`${sectionKey}-${row.key}`}
            className="space-y-3 rounded-xl border p-4"
          >
            <div className="text-sm font-medium">
              {row.isCustom ? (
                <CustomRowLabelCell
                  scope={sectionKey}
                  row={row}
                  setFormData={setFormData}
                />
              ) : (
                row.label
              )}
            </div>

            {columns.map((col: any) => (
              <div key={col.key}>
                <label className="mb-1 block text-xs text-gray-500">
                  {col.label}
                </label>
                {cellInput(row, col)}
              </div>
            ))}
          </div>
        ))}
      </div>

      <AddRowButton scope={sectionKey} setFormData={setFormData} />
    </>
  );
}
