"use client";

import {
  contactMobileKey,
  contactNameKey,
  resolveSectionKey,
} from "@/lib/sectionFormKeys";

export default function ContactSection({
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
    <div className="rbac-card">
      <div className="flex items-center justify-between mb-5">
        <h3 className="rbac-title-lg">{section.title}</h3>
      </div>

      <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[var(--theme-surface-2)] text-[color:var(--theme-text-muted)] text-sm">
              <th className="px-5 py-4 text-left">Department</th>
              <th className="px-5 py-4 text-left">Name</th>
              <th className="px-5 py-4 text-left">Mobile</th>
            </tr>
          </thead>

          <tbody>
            {section.rows.map((row: any, index: number) => {
              const nameKey = contactNameKey(sectionKey, row.key);
              const mobileKey = contactMobileKey(sectionKey, row.key);
              return (
                <tr
                  key={`${sectionKey}-${row.key}`}
                  className="border-t border-gray-200 dark:border-gray-700 dark:hover:bg-gray-800 transition"
                >
                  <td className="px-5 py-4 text-sm">
                    <div className="flex items-center gap-3">{row.label}</div>
                  </td>

                  <td className="px-5 py-4">
                    <input
                      className="rbac-input focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter name"
                      name={nameKey}
                      value={formData?.[nameKey] || ""}
                      onChange={(e) => {
                        setFormData((prev: any) => ({
                          ...prev,
                          [nameKey]: e.target.value,
                        }));
                      }}
                    />
                  </td>

                  <td className="px-5 py-4">
                    <input
                      className="rbac-input focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter mobile number"
                      name={mobileKey}
                      type="tel"
                      value={formData?.[mobileKey] || ""}
                      onChange={(e) => {
                        setFormData((prev: any) => ({
                          ...prev,
                          [mobileKey]: e.target.value,
                        }));
                      }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-4">
        {section.rows.map((row: any, index: number) => {
          const nameKey = contactNameKey(sectionKey, row.key);
          const mobileKey = contactMobileKey(sectionKey, row.key);
          return (
            <div
              key={`${sectionKey}-${row.key}`}
              className="border rounded-xl p-4 space-y-4 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3 text-sm font-medium">
                <span className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs">
                  {index + 1}
                </span>
                {row.label}
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Name</label>
                <input
                  className="rbac-input focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter name"
                  name={nameKey}
                  value={formData?.[nameKey] || ""}
                  onChange={(e) => {
                    setFormData((prev: any) => ({
                      ...prev,
                      [nameKey]: e.target.value,
                    }));
                  }}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Mobile
                </label>
                <input
                  className="rbac-input focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter mobile number"
                  name={mobileKey}
                  type="tel"
                  value={formData?.[mobileKey] || ""}
                  onChange={(e) => {
                    setFormData((prev: any) => ({
                      ...prev,
                      [mobileKey]: e.target.value,
                    }));
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
