"use client";

import {
  resolveSectionKey,
  sectionRowColChildKey,
  sectionRowColKey,
} from "@/lib/sectionFormKeys";
import { getCustomRows } from "@/lib/customRows";
import {
  AddRowButton,
  CustomRowLabelCell,
} from "./CustomRowControls";

export default function SizeMatrixRenderer({
  section,
  formData,
  setFormData,
}: {
  section: any;
  formData: any;
  setFormData: any;
}) {
  const sectionKey = resolveSectionKey(section);

  const operandKey = (rowKey: string, path: string) => {
    const [colKey, childKey] = String(path).split(".");
    return childKey
      ? sectionRowColChildKey(sectionKey, rowKey, colKey, childKey)
      : sectionRowColKey(sectionKey, rowKey, colKey);
  };

  // A computed column (e.g. Sq.Ft = W x H) is derived from its operands rather
  // than typed. Blank if any operand is missing, so an untouched row stays
  // empty instead of showing 0.
  const computeCell = (
    row: any,
    col: any,
    data: Record<string, any> = formData,
  ) => {
    const paths: string[] = col.computed?.multiply || [];
    if (paths.length === 0) return "";

    const numbers = paths.map((path) => {
      const raw = data?.[operandKey(row.key, path)];
      if (raw === undefined || raw === null || String(raw).trim() === "") {
        return NaN;
      }
      return Number(raw);
    });

    if (numbers.some((n) => !Number.isFinite(n))) return "";

    const product = numbers.reduce((acc, n) => acc * n, 1);
    return String(Math.round(product * 100) / 100);
  };

  const computedColumns = (section.columns || []).filter(
    (col: any) => col.computed,
  );

  // Writing an operand refreshes every column derived from it, so the stored
  // value stays in step and the view/PDF need no calculation of their own.
  const setCell = (name: string, value: string, row: any) =>
    setFormData((prev: any) => {
      const updated = { ...prev, [name]: value };
      computedColumns.forEach((col: any) => {
        updated[sectionRowColKey(sectionKey, row.key, col.key)] = computeCell(
          row,
          col,
          updated,
        );
      });
      return updated;
    });

  const customRows = getCustomRows(formData, sectionKey);
  const allRows = [
    ...(section.rows || []),
    ...customRows.map((row) => ({ ...row, isCustom: true })),
  ];

  const columnTotal = (colKey: string) => {
    const sum = allRows.reduce((acc: number, row: any) => {
      const raw = formData?.[sectionRowColKey(sectionKey, row.key, colKey)];
      const n = Number(raw);
      return Number.isFinite(n) && String(raw ?? "").trim() !== "" ? acc + n : acc;
    }, 0);
    return Math.round(sum * 100) / 100;
  };

  const totals: any[] = section.totals || [];


  return (
    <div className="rbac-card">
      <h3 className="rbac-title-lg mb-4">{section.title}</h3>

      <div className="w-full overflow-x-auto">
        <table className="min-w-[900px] w-full border-collapse border">
        <thead>
          <tr>
            <th rowSpan={2} className="border p-2 text-sm whitespace-nowrap">
              {section.descriptionLabel || "Description"}
            </th>

            {section.columns.map((col: any) =>
              col.children ? (
                <th
                  key={col.key}
                  colSpan={col.children.length}
                  className="border p-2 text-sm whitespace-nowrap"
                >
                  {col.label}
                </th>
              ) : (
                <th
                  key={col.key}
                  rowSpan={2}
                  className="border p-2 text-sm whitespace-nowrap"
                >
                  {col.label}
                </th>
              ),
            )}
          </tr>

          <tr>
            {section.columns.map(
              (col: any) =>
                col.children &&
                col.children.map((child: any) => (
                  <th
                    key={`${col.key}-${child.key}`}
                    className="border p-2 text-sm"
                  >
                    {child.label}
                  </th>
                )),
            )}
          </tr>
        </thead>

        <tbody>
          {allRows.map((row: any) => (
            <tr key={`${sectionKey}-${row.key}`}>
              <td className="border p-2 text-sm whitespace-nowrap">
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

              {section.columns.map((col: any) =>
                col.children ? (
                  col.children.map((child: any) => {
                    const name = sectionRowColChildKey(
                      sectionKey,
                      row.key,
                      col.key,
                      child.key,
                    );
                    return (
                      <td
                        key={`${sectionKey}-${row.key}-${col.key}-${child.key}`}
                        className="border p-2"
                      >
                        <input
                          className="rbac-input w-full min-w-[80px]"
                          name={name}
                          value={formData?.[name] || ""}
                          onChange={(e) => setCell(name, e.target.value, row)}
                        />
                      </td>
                    );
                  })
                ) : (
                  <td key={`${sectionKey}-${row.key}-${col.key}`} className="border p-2">
                    {(() => {
                      const name = sectionRowColKey(sectionKey, row.key, col.key);

                      if (col.computed) {
                        return (
                          <input
                            className="rbac-input w-full min-w-[100px] bg-slate-50 font-semibold"
                            name={name}
                            value={computeCell(row, col)}
                            readOnly
                            tabIndex={-1}
                          />
                        );
                      }

                      return (
                        <input
                          className="rbac-input w-full min-w-[100px]"
                          name={name}
                          value={formData?.[name] || ""}
                          onChange={(e) => setCell(name, e.target.value, row)}
                        />
                      );
                    })()}
                  </td>
                ),
              )}
            </tr>
          ))}
          </tbody>

          {totals.length > 0 ? (
            <tfoot>
              {totals.map((total: any) => {
                const width = (col: any) =>
                  col.children ? col.children.length : 1;
                const index = section.columns.findIndex(
                  (col: any) => col.key === total.column,
                );
                // Description cell plus every column before the total column.
                const leading =
                  1 +
                  section.columns
                    .slice(0, Math.max(index, 0))
                    .reduce((n: number, col: any) => n + width(col), 0);
                const trailing = section.columns
                  .slice(index + 1)
                  .reduce((n: number, col: any) => n + width(col), 0);

                return (
                  <tr key={total.column} className="bg-slate-100 font-semibold">
                    <td className="border p-2 text-right text-sm" colSpan={leading}>
                      {total.label || "Total"}
                    </td>
                    <td className="border p-2 text-sm">
                      {columnTotal(total.column)}
                    </td>
                    {trailing > 0 ? (
                      <td className="border p-2" colSpan={trailing} />
                    ) : null}
                  </tr>
                );
              })}
            </tfoot>
          ) : null}
        </table>
      </div>

      <AddRowButton scope={sectionKey} setFormData={setFormData} />
    </div>
  );
}
