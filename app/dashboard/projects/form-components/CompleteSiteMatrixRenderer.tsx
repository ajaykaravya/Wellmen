"use client";

import { resolveSectionKey, sectionRowColKey } from "@/lib/sectionFormKeys";

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

  return (
    <table className="w-full border">
      <thead>
        <tr>
          <th className="border p-2">Description</th>

          {section.columns.map((col: any) => (
            <th key={col.key} className="border p-2">
              {col.label}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {section.rows.map((row: any) => (
          <tr key={`${sectionKey}-${row.key}`}>
            <td className="border p-2">{row.label}</td>

            {section.columns.map((col: any) => {
              const name = sectionRowColKey(sectionKey, row.key, col.key);
              return (
                <td key={col.key} className="border p-2">
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
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
