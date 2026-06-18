"use client";

export default function ElectricSection({ section }: { section: any }) {
  return (
    <div className="rbac-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="rbac-title-lg">{section.title}</h3>

        <span className="text-xs px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
          {section.rows.length} Items
        </span>
      </div>

      {/* Desktop Table */}

      <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 ">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900 text-sm ">
              <th className="px-5 py-4 text-left">Description</th>

              <th className="px-5 py-4 text-left">
                Sub Zero Panel Board Remark
              </th>

              <th className="px-5 py-4 text-left">Touch Panel Board Remark</th>
            </tr>
          </thead>

          <tbody>
            {section.rows.map((row: any, index: number) => (
              <tr
                key={row.key}
                className="border-t border-gray-200 dark:border-gray-700 dark:hover:bg-gray-800 transition "
              >
                <td className="px-5 py-4 text-sm">
                  <div className="flex items-center gap-3">
                    {row.label}
                  </div>
                </td>

                <td className="px-5 py-4">
                  <input
                    className="rbac-input focus:ring-2 focus:ring-blue-500 "
                    placeholder="Enter remark"
                    name={`${row.key}_sub_zero_remark`}
                  />
                </td>

                <td className="px-5 py-4">
                  <input
                    className="rbac-input focus:ring-2 focus:ring-blue-500 "
                    placeholder="Enter remark"
                    name={`${row.key}_touch_panel_remark`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}

      <div className="md:hidden space-y-4 ">
        {section.rows.map((row: any, index: number) => (
          <div
            key={row.key}
            className="border rounded-xl p-4 space-y-4 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 "
          >
            {/* Title */}

            <div className="flex items-center gap-3 text-sm font-medium ">
              {row.label}
            </div>

            {/* Sub Zero */}

            <div>
              <label className="block text-xs mb-1 text-gray-500 ">
                Sub Zero Panel Board Remark
              </label>

              <input
                className="rbac-input focus:ring-2 focus:ring-blue-500 "
                placeholder="Enter remark"
                name={`${row.key}_sub_zero_remark`}
              />
            </div>

            {/* Touch Panel */}

            <div>
              <label className="block text-xs mb-1 text-gray-500 ">
                Touch Panel Board Remark
              </label>

              <input
                className="rbac-input focus:ring-2 focus:ring-blue-500 "
                placeholder="Enter remark"
                name={`${row.key}_touch_panel_remark`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
