"use client";

type RowField = {
  key: string;
  label: string;
  fieldType: string;
  defaultValue?: string;
};

type Props = {
  fields?: RowField[];

  value?: Record<string, any>;

  onChange?: (key: string, value: any) => void;
};

export default function RowFieldRenderer({
  fields = [],
  value = {},
  onChange,
}: Props) {
  if (!fields.length) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {fields.map((field) => (
        <div key={field.key} className="flex items-center gap-2">
          <label className="text-sm font-medium">{field.label}</label>

          {field.fieldType === "text" && (
            <input
              type="text"
              className="border rounded px-2 py-1 w-full"
              value={value[field.key] ?? field.defaultValue ?? ""}
              onChange={(e) => {
                onChange?.(field.key, e.target.value);
              }}
            />
          )}

          {field.fieldType === "number" && (
            <input
              type="number"
              className="border rounded px-2 py-1 w-full"
              value={value[field.key] ?? ""}
              onChange={(e) => {
                onChange?.(field.key, e.target.value);
              }}
            />
          )}

          {field.fieldType === "date" && (
            <input
              type="date"
              className="border rounded px-2 py-1"
              value={value[field.key] ?? ""}
              onChange={(e) => {
                onChange?.(field.key, e.target.value);
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
