import { getMatrixCellValue } from "@/lib/matrixFormKeys";
import {
  getChecklistRemarkValue,
  getChecklistStatusValue,
  getCompleteSiteSizeValue,
  getContactMobileValue,
  getContactNameValue,
  getElectricSubZeroValue,
  getElectricTouchPanelValue,
  getSectionRowColChildValue,
  getSectionRowColValue,
  resolveSectionKey,
  type TemplateSection,
} from "@/lib/sectionFormKeys";

export function isFilled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return !Number.isNaN(value);
  if (typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export function isChecklistRowFilled(
  formData: Record<string, unknown> | undefined,
  sectionKey: string,
  rowKey: string,
  sections: TemplateSection[],
): boolean {
  const status = getChecklistStatusValue(formData, sectionKey, rowKey, sections);
  const remark = getChecklistRemarkValue(formData, sectionKey, rowKey, sections);
  return (
    status === "OK" ||
    status === "NOT_OK" ||
    isFilled(remark)
  );
}

export function isContactRowFilled(
  formData: Record<string, unknown> | undefined,
  sectionKey: string,
  rowKey: string,
  sections: TemplateSection[],
): boolean {
  return (
    isFilled(getContactNameValue(formData, sectionKey, rowKey, sections)) ||
    isFilled(getContactMobileValue(formData, sectionKey, rowKey, sections))
  );
}

export function isElectricRowFilled(
  formData: Record<string, unknown> | undefined,
  sectionKey: string,
  rowKey: string,
  sections: TemplateSection[],
): boolean {
  return (
    isFilled(getElectricSubZeroValue(formData, sectionKey, rowKey, sections)) ||
    isFilled(getElectricTouchPanelValue(formData, sectionKey, rowKey, sections))
  );
}

export function isSizeMatrixRowFilled(
  formData: Record<string, unknown> | undefined,
  sectionKey: string,
  rowKey: string,
  columns: Array<{ key: string; children?: Array<{ key: string }> }> | undefined,
  sections: TemplateSection[],
): boolean {
  if (!columns) return false;

  for (const col of columns) {
    if (col.children) {
      for (const child of col.children) {
        if (
          isFilled(
            getSectionRowColChildValue(
              formData,
              sectionKey,
              rowKey,
              col.key,
              child.key,
              "sizeMatrix",
              sections,
            ),
          )
        ) {
          return true;
        }
      }
    } else if (
      isFilled(
        getSectionRowColValue(
          formData,
          sectionKey,
          rowKey,
          col.key,
          "sizeMatrix",
          sections,
        ),
      )
    ) {
      return true;
    }
  }

  return false;
}

export function isCompleteSiteMatrixRowFilled(
  formData: Record<string, unknown> | undefined,
  sectionKey: string,
  rowKey: string,
  columns: Array<{ key: string }> | undefined,
  sections: TemplateSection[],
): boolean {
  if (!columns) return false;

  for (const col of columns) {
    if (
      isFilled(
        getSectionRowColValue(
          formData,
          sectionKey,
          rowKey,
          col.key,
          "completeSiteMatrix",
          sections,
        ),
      )
    ) {
      return true;
    }
  }

  return false;
}

export function isCompleteSiteSizeRowFilled(
  formData: Record<string, unknown> | undefined,
  sectionKey: string,
  rowKey: string,
  sections: TemplateSection[],
): boolean {
  return (["L", "W", "H"] as const).some((dimension) =>
    isFilled(
      getCompleteSiteSizeValue(
        formData,
        sectionKey,
        rowKey,
        dimension,
        sections,
      ),
    ),
  );
}

export function hasMatrixSelection(
  formData: Record<string, unknown> | undefined,
  groupKey: string,
): boolean {
  const selection = formData?.[groupKey];
  if (Array.isArray(selection)) return selection.length > 0;
  return isFilled(selection);
}

export function isMatrixSelectionGroupFilled(
  formData: Record<string, unknown> | undefined,
  groupKey: string,
  columns: Array<{ key: string }> | undefined,
): boolean {
  if (hasMatrixSelection(formData, groupKey)) return true;

  return (
    columns?.some((col) => isFilled(formData?.[`${groupKey}_${col.key}`])) ??
    false
  );
}

export function isMatrixRowFilled(
  formData: Record<string, unknown> | undefined,
  groupKey: string,
  rowKey: string,
  columns: Array<{ key: string }> | undefined,
  section?: TemplateSection,
): boolean {
  return (
    columns?.some((col) =>
      isFilled(getMatrixCellValue(formData, groupKey, rowKey, col.key, section)),
    ) ?? false
  );
}

export function isMatrixGroupFilled(
  formData: Record<string, unknown> | undefined,
  group: {
    key: string;
    selection?: { enabled?: boolean };
    rows?: Array<{ key: string }>;
  },
  columns: Array<{ key: string }> | undefined,
  section?: TemplateSection,
): boolean {
  if (group.selection?.enabled) {
    return isMatrixSelectionGroupFilled(formData, group.key, columns);
  }

  return (
    group.rows?.some((row) =>
      isMatrixRowFilled(formData, group.key, row.key, columns, section),
    ) ?? false
  );
}

export function getSectionKey(section: { key?: string; title?: string }): string {
  return resolveSectionKey(section);
}
