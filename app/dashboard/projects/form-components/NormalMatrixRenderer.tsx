"use client";

import { getMatrixCellValue, matrixCellKey } from "@/lib/matrixFormKeys";

export default function NormalMatrixRenderer({
  group,
  columns,
  formData,
  setFormData,
  section,
}: {
  group: any;
  columns: any[];
  formData: any;
  setFormData: any;
  section?: any;
}) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[700px] border-collapse border">
        <thead>
          <tr>
            <th className="border p-2 text-left whitespace-nowrap">
              Description
            </th>

            {columns.map((col) => (
              <th
                key={col.key}
                className="border p-2 text-left whitespace-nowrap"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {group.rows.map((row: any) => (
            <tr key={`${group.key}-${row.key}`}>
              <td className="border p-2 whitespace-nowrap">{row.label}</td>

              {columns.map((col) => {
                const name = matrixCellKey(group.key, row.key, col.key);

                // A group may override a column, e.g. Wall renders Size as a
                // dropdown while every other group keeps the free-text box.
                const override = group.columnOverrides?.[col.key];
                const field = { ...col, ...(override || {}) };

                const value = String(
                  getMatrixCellValue(
                    formData,
                    group.key,
                    row.key,
                    col.key,
                    section,
                  ) ?? "",
                );

                const onChange = (
                  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
                ) => {
                  setFormData((prev: any) => ({
                    ...prev,
                    [name]: e.target.value,
                  }));
                };

                return (
                  <td key={col.key} className="border p-2 min-w-[150px]">
                    {field.fieldType === "select" ? (
                      <select
                        className="rbac-input rbac-select w-full"
                        name={name}
                        value={value}
                        onChange={onChange}
                      >
                        <option value="">Select</option>
                        {(field.options || []).map((option: any) => {
                          const optValue =
                            typeof option === "string" ? option : option.value;
                          const optLabel =
                            typeof option === "string" ? option : option.label;
                          return (
                            <option key={optValue} value={optValue}>
                              {optLabel}
                            </option>
                          );
                        })}
                      </select>
                    ) : (
                      <input
                        className="rbac-input w-full"
                        name={name}
                        value={value}
                        onChange={onChange}
                      />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
