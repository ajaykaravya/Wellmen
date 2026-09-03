"use client";

import { completeSiteSizeKey, resolveSectionKey } from "@/lib/sectionFormKeys";

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

  return (
    <table className="w-full border">
      <thead>
        <tr>
          <th className="border p-2">Description</th>

          <th colSpan={3} className="border p-2">
            Size(mm)
          </th>
        </tr>

        <tr>
          <th></th>

          <th className="border">L</th>

          <th className="border">W</th>

          <th className="border">H</th>
        </tr>
      </thead>

      <tbody>
        {section.rows.map((row: any) => (
          <tr key={`${sectionKey}-${row.key}`}>
            <td className="border p-2">{row.label}</td>

            {(["L", "W", "H"] as const).map((dimension) => {
              const name = completeSiteSizeKey(sectionKey, row.key, dimension);
              return (
                <td key={dimension} className="border p-2">
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
