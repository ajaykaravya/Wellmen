"use client";

export default function ChecklistSection({
  section,
  formData,
  setFormData,
}: {
  section: any;
  formData: any;
  setFormData: any;
}) {
  return (
    <div className="rbac-card">
      <div className="flex items-center justify-between mb-5">
        <h3 className="rbac-title-lg">{section.title}</h3>
        <span className="text-xs  px-3  py-1  rounded-full bg-gray-100 dark:bg-gray-800">
          {section.rows.length} Items
        </span>
      </div>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-hidden rounded-xl border">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900 text-sm">
              <th className="px-5 py-4 text-left">Description</th>
              <th className="px-5 py-4 text-left">Status</th>
              <th className="px-5 py-4 text-left">Remark</th>
            </tr>
          </thead>
          <tbody>
            {section.rows.map((row: any, index: number) => (
              <tr key={row.key} className="border-t dark:hover:bg-gray-800">
                <td className="px-5 py-4">{row.label}</td>
                <td className="px-5 py-4">
                  <StatusRadio
                    name={row.key}
                    idPrefix={`desktop_${row.key}`}
                    value={formData?.[row.key]}
                    onChange={(val: string) => {
                      setFormData((prev: any) => ({
                        ...prev,
                        [row.key]: val,
                      }));
                    }}
                  />
                </td>
                <td className="px-5 py-4">
                  <input
                    className="rbac-input"
                    placeholder="Add remark..."
                    name={`${row.key}_remark`}
                    value={formData?.[`${row.key}_remark`] || ""}
                    onChange={(e) => {
                      setFormData((prev: any) => ({
                        ...prev,
                        [`${row.key}_remark`]: e.target.value,
                      }));
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {section.rows.map((row: any, index: number) => (
          <div
            key={row.key}
            className="border rounded-xl p-4 bg-white dark:bg-gray-900 space-y-4 "
          >
            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {row.label}
            </div>
            <StatusRadio
              name={`${row.key}_mobile`}
              idPrefix={`mobile_${row.key}`}
              value={formData?.[row.key]}
              onChange={(val: string) => {
                setFormData((prev: any) => ({
                  ...prev,
                  [row.key]: val,
                }));
              }}
            />
            <input
              className="rbac-input"
              placeholder="Add remark..."
              name={`${row.key}_remark`}
              value={formData?.[`${row.key}_remark`] || ""}
              onChange={(e) => {
                setFormData((prev: any) => ({
                  ...prev,
                  [`${row.key}_remark`]: e.target.value,
                }));
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusRadio({
  name,
  idPrefix,
  value,
  onChange,
}: {
  name: string;
  idPrefix: string;
  value: string;
  onChange: any;
}) {
  return (
    <div className="flex gap-6">
      <label
        htmlFor={`${idPrefix}_ok`}
        className="flex items-center gap-2 cursor-pointer text-sm text-green-600 "
      >
        <input
          type="radio"
          id={`${idPrefix}_ok`}
          name={name}
          value="OK"
          className="accent-green-600 w-4 h-4 "
          checked={value === "OK"}
          onChange={(e) => onChange(e.target.value)}
        />
        OK
      </label>
      <label
        htmlFor={`${idPrefix}_not_ok`}
        className="flex items-center gap-2 cursor-pointer text-red-600 "
      >
        <input
          type="radio"
          id={`${idPrefix}_not_ok`}
          name={name}
          value="NOT_OK"
          className="accent-red-600 w-4 h-4 "
          checked={value === "NOT_OK"}
          onChange={(e) => onChange(e.target.value)}
        />
        NOT OK
      </label>
    </div>
  );
}

