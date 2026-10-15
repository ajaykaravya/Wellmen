"use client";

import { completeSiteSizeKey, resolveSectionKey } from "@/lib/sectionFormKeys";
import { getCustomRows } from "@/lib/customRows";
import { AddRowButton, CustomRowLabelCell } from "./CustomRowControls";

const DIMENSIONS = ["L", "W", "H"] as const;

export default function CompleteSiteSizeRenderer({
  section,
  formData,
  setFormData,
}: {
  section: any;
  formData: any;
  setFormData: any;
}) {
  const sectionKey = resolveSectionKey(section);

  const allRows = [
    ...(section.rows || []),
    ...getCustomRows(formData, sectionKey).map((row: any) => ({
      ...row,
      isCustom: true,
    })),
  ];

  const cellInput = (row: any, dimension: (typeof DIMENSIONS)[number]) => {
    const name = completeSiteSizeKey(sectionKey, row.key, dimension);
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
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr className="bg-[var(--theme-surface-2)] text-[color:var(--theme-text-muted)]">
              <th className="border p-2 text-left">Description</th>

              <th colSpan={3} className="border p-2">
                Size(mm)
              </th>
            </tr>

            <tr className="bg-[var(--theme-surface-2)] text-[color:var(--theme-text-muted)]">
              <th className="border"></th>

              {DIMENSIONS.map((dimension) => (
                <th key={dimension} className="border">
                  {dimension}
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

                {DIMENSIONS.map((dimension) => (
                  <td key={dimension} className="border p-2">
                    {cellInput(row, dimension)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: one card per row, with L / W / H side by side since they are
          short numeric fields. */}
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

            <div className="grid grid-cols-3 gap-2">
              {DIMENSIONS.map((dimension) => (
                <div key={dimension}>
                  <label className="mb-1 block text-xs text-gray-500">
                    {dimension} (mm)
                  </label>
                  {cellInput(row, dimension)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <AddRowButton scope={sectionKey} setFormData={setFormData} />
    </>
  );
}
