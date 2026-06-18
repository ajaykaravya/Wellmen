"use client";

export default function ContactSection({ section }: { section: any }) {
  return (
    <div className="rbac-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="rbac-title-lg">{section.title}</h3>

        <span className="text-xs px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
          {section.rows.length} Contacts
        </span>
      </div>

      {/* Desktop View */}

      <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900 text-sm">
              <th className="px-5 py-4 text-left">Department</th>

              <th className="px-5 py-4 text-left">Name</th>

              <th className="px-5 py-4 text-left">Mobile</th>
            </tr>
          </thead>

          <tbody>
            {section.rows.map((row: any, index: number) => (
              <tr
                key={row.key}
                className="border-t border-gray-200 dark:border-gray-700 dark:hover:bg-gray-800 transition"
              >
                <td className="px-5 py-4 text-sm">
                  <div className="flex items-center gap-3">{row.label}</div>
                </td>

                <td className="px-5 py-4">
                  <input
                    className="rbac-input focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter name"
                    name={`${row.key}_name`}
                  />
                </td>

                <td className="px-5 py-4">
                  <input
                    className="rbac-input focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter mobile number"
                    name={`${row.key}_mobile`}
                    type="tel"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}

      <div className="md:hidden space-y-4">
        {section.rows.map((row: any, index: number) => (
          <div
            key={row.key}
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
                name={`${row.key}_name`}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Mobile</label>
              <input
                className="rbac-input focus:ring-2 focus:ring-blue-500"
                placeholder="Enter mobile number"
                name={`${row.key}_mobile`}
                type="tel"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
