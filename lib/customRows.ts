// Rows a user adds while filling a form.
//
// Templates are shared by every submission, so an extra row cannot be written
// there. It lives in the submission's own formData under a reserved key, and
// its cells use exactly the same key scheme as template rows — so the cell
// rendering and the saved data need no special handling.

export type CustomRow = { key: string; label: string };

const PREFIX = "__customRows";

export function customRowsKey(scope: string): string {
  return `${PREFIX}_${scope}`;
}

export function isCustomRowsKey(key: string): boolean {
  return key.startsWith(`${PREFIX}_`);
}

export function getCustomRows(
  formData: Record<string, unknown> | undefined,
  scope: string,
): CustomRow[] {
  const value = formData?.[customRowsKey(scope)];
  if (!Array.isArray(value)) return [];
  return value.filter(
    (row): row is CustomRow =>
      Boolean(row) &&
      typeof (row as CustomRow).key === "string" &&
      typeof (row as CustomRow).label === "string",
  );
}

function nextRowKey(existing: CustomRow[]): string {
  // Prefixed so it can never collide with a template row key.
  let n = existing.length + 1;
  const taken = new Set(existing.map((r) => r.key));
  let key = `custom_${n}`;
  while (taken.has(key)) key = `custom_${++n}`;
  return key;
}

export function addCustomRow(
  formData: Record<string, unknown> | undefined,
  scope: string,
): Record<string, unknown> {
  const rows = getCustomRows(formData, scope);
  return {
    ...(formData || {}),
    [customRowsKey(scope)]: [...rows, { key: nextRowKey(rows), label: "" }],
  };
}

export function setCustomRowLabel(
  formData: Record<string, unknown> | undefined,
  scope: string,
  rowKey: string,
  label: string,
): Record<string, unknown> {
  const rows = getCustomRows(formData, scope).map((row) =>
    row.key === rowKey ? { ...row, label } : row,
  );
  return { ...(formData || {}), [customRowsKey(scope)]: rows };
}

export function removeCustomRow(
  formData: Record<string, unknown> | undefined,
  scope: string,
  rowKey: string,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...(formData || {}) };

  // Drop every cell belonging to the row as well, so deleting it does not
  // leave orphaned values behind in the submission.
  Object.keys(next).forEach((key) => {
    if (!isCustomRowsKey(key) && key.includes(rowKey)) delete next[key];
  });

  next[customRowsKey(scope)] = getCustomRows(formData, scope).filter(
    (row) => row.key !== rowKey,
  );
  return next;
}
