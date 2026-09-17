"use client";

import { resolveSectionKey, scopedKey } from "@/lib/sectionFormKeys";

// Columns are declared by the template. Those carrying `source: "row"` are
// fixed sheet text printed from the row itself; the rest are user inputs.
export default function ElectricSection({
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
  const editable = columns.filter((col) => !col.source);

  const cellKey = (rowKey: string, colKey: string) =>
    scopedKey(sectionKey, rowKey, colKey);

  // A column may be gated by another: it only accepts input once the gate
  // column holds the required value.
  const isEnabled = (row: any, col: any) => {
    if (!col.enabledWhen) return true;
    const gate = formData?.[cellKey(row.key, col.enabledWhen.column)];
    return gate === col.enabledWhen.equals;
  };

  const renderField = (row: any, col: any) => {
    const name = cellKey(row.key, col.key);
    const value = formData?.[name] ?? "";

    const onChange = (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      const next = e.target.value;

      setFormData((prev: any) => {
        const updated = { ...prev, [name]: next };

        // Selecting the gate value fills the dependent field with the sheet's
        // own wording; anything else clears it, so a stale remark cannot be
        // left behind on a row marked "Not".
        columns
          .filter((dep) => dep.enabledWhen?.column === col.key)
          .forEach((dep) => {
            const depName = cellKey(row.key, dep.key);
            if (next === dep.enabledWhen.equals) {
              if (!updated[depName]) {
                updated[depName] = dep.defaultFrom
                  ? (row[dep.defaultFrom] ?? "")
                  : "";
              }
            } else {
              updated[depName] = "";
            }
          });

        return updated;
      });
    };

    if (col.fieldType === "select") {
      return (
        <select
          className="rbac-input rbac-select w-full"
          name={name}
          value={String(value)}
          onChange={onChange}
        >
          <option value="">Select</option>
          {(col.options || []).map((option: string) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    // Rows still carry the sheet's own wording (e.g. "For main power"), so use
    // it as the hint rather than a generic "Enter purpose".
    const placeholder = row[col.key]
      ? String(row[col.key])
      : `Enter ${String(col.label).toLowerCase()}`;

    const enabled = isEnabled(row, col);

    // These remarks run to a full sentence, so they wrap in a textarea rather
    // than scrolling sideways inside a single-line input.
    if (col.fieldType === "textarea") {
      return (
        <textarea
          className={`rbac-input w-full resize-y leading-snug ${
            enabled ? "" : "opacity-50"
          }`}
          rows={2}
          placeholder={enabled ? placeholder : ""}
          name={name}
          value={String(value)}
          disabled={!enabled}
          onChange={onChange}
        />
      );
    }

    return (
      <input
        className={`rbac-input w-full ${enabled ? "" : "opacity-50"}`}
        placeholder={enabled ? placeholder : ""}
        name={name}
        value={String(value)}
        disabled={!enabled}
        onChange={onChange}
      />
    );
  };

  return (
    <div className="rbac-card">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="rbac-title-lg">{section.title}</h3>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          {section.rows.length} Items
        </span>
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-gray-200 md:block dark:border-gray-700">
        <table className="w-full min-w-[1180px] border-collapse">
          <thead>
            <tr className="bg-[var(--theme-surface-2)] text-sm text-[color:var(--theme-text-muted)]">
              {columns.map((col) => (
                <th key={col.key} className="px-5 py-4 text-left">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {section.rows.map((row: any) => (
              <tr
                key={`${sectionKey}-${row.key}`}
                className="border-t border-gray-200 transition dark:border-gray-700 dark:hover:bg-gray-800"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-5 py-4 text-sm align-top ${
                      col.fieldType === "textarea" ? "min-w-[240px]" : ""
                    }`}
                  >
                    {col.source === "row"
                      ? (row[col.key] ?? (col.key === "description" ? row.label : ""))
                      : renderField(row, col)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 md:hidden">
        {section.rows.map((row: any) => (
          <div
            key={`${sectionKey}-${row.key}`}
            className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="text-sm font-medium">
              {row.srNo ? `${row.srNo}. ` : ""}
              {row.description ?? row.label}
            </div>

            {columns
              .filter(
                (col) =>
                  col.source === "row" &&
                  !["srNo", "description"].includes(col.key) &&
                  row[col.key],
              )
              .map((col) => (
                <div key={col.key} className="text-xs text-gray-500">
                  <span className="font-semibold">{col.label}: </span>
                  {row[col.key]}
                </div>
              ))}

            {editable.map((col) => (
              <div key={col.key}>
                <label className="mb-1 block text-xs text-gray-500">
                  {col.label}
                </label>
                {renderField(row, col)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
