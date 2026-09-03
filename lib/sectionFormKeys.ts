function isFilledValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return !Number.isNaN(value);
  if (typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export type TemplateSection = {
  type?: string;
  key?: string;
  title?: string;
  rows?: Array<{ key: string }>;
  groups?: Array<{
    key: string;
    rows?: Array<{ key: string }>;
    selection?: { enabled?: boolean };
  }>;
  columns?: Array<{ key: string; children?: Array<{ key: string }> }>;
};

export function resolveSectionKey(
  section: { key?: string; title?: string },
  index = 0,
): string {
  return section.key || `section_${index}`;
}

export function scopedKey(...parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join("_");
}

function getScopedFieldValue(
  formData: Record<string, unknown> | undefined,
  newKey: string,
  legacyKey: string,
  isLegacyOwner: boolean,
): unknown {
  const newValue = formData?.[newKey];
  if (isFilledValue(newValue)) return newValue;
  if (!isLegacyOwner) return undefined;
  return formData?.[legacyKey];
}

function migrateKeyPair(
  formData: Record<string, unknown>,
  newKey: string,
  legacyKey: string,
  shouldMigrate: boolean,
): Record<string, unknown> {
  if (!shouldMigrate) return formData;

  const next = { ...formData };
  if (!isFilledValue(next[newKey]) && isFilledValue(next[legacyKey])) {
    next[newKey] = next[legacyKey];
    delete next[legacyKey];
  }

  return next;
}

function firstSectionKeyForRow(
  sections: TemplateSection[],
  sectionType: string,
  rowKey: string,
): string | undefined {
  for (const [index, section] of sections.entries()) {
    if (section.type !== sectionType) continue;
    if (section.rows?.some((row) => row.key === rowKey)) {
      return resolveSectionKey(section, index);
    }
  }

  return undefined;
}

function firstGroupKeyForRow(
  section: TemplateSection | undefined,
  rowKey: string,
): string | undefined {
  for (const group of section?.groups ?? []) {
    if (group.selection?.enabled) continue;
    if (group.rows?.some((row) => row.key === rowKey)) {
      return group.key;
    }
  }

  return undefined;
}

export function matrixCellKey(
  groupKey: string,
  rowKey: string,
  colKey: string,
): string {
  return scopedKey(groupKey, rowKey, colKey);
}

export function legacyMatrixCellKey(rowKey: string, colKey: string): string {
  return scopedKey(rowKey, colKey);
}

export function getMatrixCellValue(
  formData: Record<string, unknown> | undefined,
  groupKey: string,
  rowKey: string,
  colKey: string,
  section?: TemplateSection,
): unknown {
  return getScopedFieldValue(
    formData,
    matrixCellKey(groupKey, rowKey, colKey),
    legacyMatrixCellKey(rowKey, colKey),
    firstGroupKeyForRow(section, rowKey) === groupKey,
  );
}

export function checklistStatusKey(sectionKey: string, rowKey: string): string {
  return scopedKey(sectionKey, rowKey);
}

export function checklistRemarkKey(sectionKey: string, rowKey: string): string {
  return scopedKey(sectionKey, rowKey, "remark");
}

export function getChecklistStatusValue(
  formData: Record<string, unknown> | undefined,
  sectionKey: string,
  rowKey: string,
  sections: TemplateSection[],
): unknown {
  return getScopedFieldValue(
    formData,
    checklistStatusKey(sectionKey, rowKey),
    rowKey,
    firstSectionKeyForRow(sections, "checklist", rowKey) === sectionKey,
  );
}

export function getChecklistRemarkValue(
  formData: Record<string, unknown> | undefined,
  sectionKey: string,
  rowKey: string,
  sections: TemplateSection[],
): unknown {
  const legacyKey = `${rowKey}_remark`;
  return getScopedFieldValue(
    formData,
    checklistRemarkKey(sectionKey, rowKey),
    legacyKey,
    firstSectionKeyForRow(sections, "checklist", rowKey) === sectionKey,
  );
}

export function contactNameKey(sectionKey: string, rowKey: string): string {
  return scopedKey(sectionKey, rowKey, "name");
}

export function contactMobileKey(sectionKey: string, rowKey: string): string {
  return scopedKey(sectionKey, rowKey, "mobile");
}

export function getContactNameValue(
  formData: Record<string, unknown> | undefined,
  sectionKey: string,
  rowKey: string,
  sections: TemplateSection[],
): unknown {
  const legacyKey = `${rowKey}_name`;
  return getScopedFieldValue(
    formData,
    contactNameKey(sectionKey, rowKey),
    legacyKey,
    firstSectionKeyForRow(sections, "contacts", rowKey) === sectionKey,
  );
}

export function getContactMobileValue(
  formData: Record<string, unknown> | undefined,
  sectionKey: string,
  rowKey: string,
  sections: TemplateSection[],
): unknown {
  const legacyKey = `${rowKey}_mobile`;
  return getScopedFieldValue(
    formData,
    contactMobileKey(sectionKey, rowKey),
    legacyKey,
    firstSectionKeyForRow(sections, "contacts", rowKey) === sectionKey,
  );
}

export function electricSubZeroKey(sectionKey: string, rowKey: string): string {
  return scopedKey(sectionKey, rowKey, "sub_zero_remark");
}

export function electricTouchPanelKey(sectionKey: string, rowKey: string): string {
  return scopedKey(sectionKey, rowKey, "touch_panel_remark");
}

export function getElectricSubZeroValue(
  formData: Record<string, unknown> | undefined,
  sectionKey: string,
  rowKey: string,
  sections: TemplateSection[],
): unknown {
  const legacyKey = `${rowKey}_sub_zero_remark`;
  return getScopedFieldValue(
    formData,
    electricSubZeroKey(sectionKey, rowKey),
    legacyKey,
    firstSectionKeyForRow(sections, "electric", rowKey) === sectionKey,
  );
}

export function getElectricTouchPanelValue(
  formData: Record<string, unknown> | undefined,
  sectionKey: string,
  rowKey: string,
  sections: TemplateSection[],
): unknown {
  const legacyKey = `${rowKey}_touch_panel_remark`;
  return getScopedFieldValue(
    formData,
    electricTouchPanelKey(sectionKey, rowKey),
    legacyKey,
    firstSectionKeyForRow(sections, "electric", rowKey) === sectionKey,
  );
}

export function sectionRowColKey(
  sectionKey: string,
  rowKey: string,
  colKey: string,
): string {
  return scopedKey(sectionKey, rowKey, colKey);
}

export function legacySectionRowColKey(rowKey: string, colKey: string): string {
  return scopedKey(rowKey, colKey);
}

export function sectionRowColChildKey(
  sectionKey: string,
  rowKey: string,
  colKey: string,
  childKey: string,
): string {
  return scopedKey(sectionKey, rowKey, colKey, childKey);
}

export function legacySectionRowColChildKey(
  rowKey: string,
  colKey: string,
  childKey: string,
): string {
  return scopedKey(rowKey, colKey, childKey);
}

export function getSectionRowColValue(
  formData: Record<string, unknown> | undefined,
  sectionKey: string,
  rowKey: string,
  colKey: string,
  sectionType: string,
  sections: TemplateSection[],
): unknown {
  return getScopedFieldValue(
    formData,
    sectionRowColKey(sectionKey, rowKey, colKey),
    legacySectionRowColKey(rowKey, colKey),
    firstSectionKeyForRow(sections, sectionType, rowKey) === sectionKey,
  );
}

export function getSectionRowColChildValue(
  formData: Record<string, unknown> | undefined,
  sectionKey: string,
  rowKey: string,
  colKey: string,
  childKey: string,
  sectionType: string,
  sections: TemplateSection[],
): unknown {
  return getScopedFieldValue(
    formData,
    sectionRowColChildKey(sectionKey, rowKey, colKey, childKey),
    legacySectionRowColChildKey(rowKey, colKey, childKey),
    firstSectionKeyForRow(sections, sectionType, rowKey) === sectionKey,
  );
}

export function completeSiteSizeKey(
  sectionKey: string,
  rowKey: string,
  dimension: "L" | "W" | "H",
): string {
  return scopedKey(sectionKey, rowKey, "size", dimension);
}

export function legacyCompleteSiteSizeKey(
  rowKey: string,
  dimension: "L" | "W" | "H",
): string {
  return scopedKey(rowKey, "size", dimension);
}

export function getCompleteSiteSizeValue(
  formData: Record<string, unknown> | undefined,
  sectionKey: string,
  rowKey: string,
  dimension: "L" | "W" | "H",
  sections: TemplateSection[],
): unknown {
  return getScopedFieldValue(
    formData,
    completeSiteSizeKey(sectionKey, rowKey, dimension),
    legacyCompleteSiteSizeKey(rowKey, dimension),
    firstSectionKeyForRow(sections, "completeSiteSize", rowKey) === sectionKey,
  );
}

function migrateMatrixSection(
  formData: Record<string, unknown>,
  section: TemplateSection,
): Record<string, unknown> {
  let next = { ...formData };
  const columns = section.columns ?? [];

  for (const group of section.groups ?? []) {
    if (group.selection?.enabled || !group.rows) continue;

    for (const row of group.rows) {
      for (const col of columns) {
        const newKey = matrixCellKey(group.key, row.key, col.key);
        const oldKey = legacyMatrixCellKey(row.key, col.key);
        next = migrateKeyPair(
          next,
          newKey,
          oldKey,
          firstGroupKeyForRow(section, row.key) === group.key,
        );
      }
    }
  }

  return next;
}

function migrateSectionRowColumns(
  formData: Record<string, unknown>,
  section: TemplateSection,
  sectionKey: string,
  sectionType: string,
  sections: TemplateSection[],
): Record<string, unknown> {
  let next = { ...formData };

  for (const row of section.rows ?? []) {
    for (const col of section.columns ?? []) {
      if (col.children) {
        for (const child of col.children) {
          const newKey = sectionRowColChildKey(
            sectionKey,
            row.key,
            col.key,
            child.key,
          );
          const oldKey = legacySectionRowColChildKey(row.key, col.key, child.key);
          next = migrateKeyPair(
            next,
            newKey,
            oldKey,
            firstSectionKeyForRow(sections, sectionType, row.key) === sectionKey,
          );
        }
      } else {
        const newKey = sectionRowColKey(sectionKey, row.key, col.key);
        const oldKey = legacySectionRowColKey(row.key, col.key);
        next = migrateKeyPair(
          next,
          newKey,
          oldKey,
          firstSectionKeyForRow(sections, sectionType, row.key) === sectionKey,
        );
      }
    }
  }

  return next;
}

export function migrateFormData(
  formData: Record<string, unknown>,
  template: { sections?: TemplateSection[] },
): Record<string, unknown> {
  const sections = template.sections ?? [];
  let next = { ...formData };

  for (const [index, section] of sections.entries()) {
    const sectionKey = resolveSectionKey(section, index);

    switch (section.type) {
      case "matrix":
        next = migrateMatrixSection(next, section);
        break;

      case "checklist":
        for (const row of section.rows ?? []) {
          next = migrateKeyPair(
            next,
            checklistStatusKey(sectionKey, row.key),
            row.key,
            firstSectionKeyForRow(sections, "checklist", row.key) === sectionKey,
          );
          next = migrateKeyPair(
            next,
            checklistRemarkKey(sectionKey, row.key),
            `${row.key}_remark`,
            firstSectionKeyForRow(sections, "checklist", row.key) === sectionKey,
          );
        }
        break;

      case "contacts":
        for (const row of section.rows ?? []) {
          next = migrateKeyPair(
            next,
            contactNameKey(sectionKey, row.key),
            `${row.key}_name`,
            firstSectionKeyForRow(sections, "contacts", row.key) === sectionKey,
          );
          next = migrateKeyPair(
            next,
            contactMobileKey(sectionKey, row.key),
            `${row.key}_mobile`,
            firstSectionKeyForRow(sections, "contacts", row.key) === sectionKey,
          );
        }
        break;

      case "electric":
        for (const row of section.rows ?? []) {
          next = migrateKeyPair(
            next,
            electricSubZeroKey(sectionKey, row.key),
            `${row.key}_sub_zero_remark`,
            firstSectionKeyForRow(sections, "electric", row.key) === sectionKey,
          );
          next = migrateKeyPair(
            next,
            electricTouchPanelKey(sectionKey, row.key),
            `${row.key}_touch_panel_remark`,
            firstSectionKeyForRow(sections, "electric", row.key) === sectionKey,
          );
        }
        break;

      case "sizeMatrix":
      case "completeSiteMatrix":
        next = migrateSectionRowColumns(
          next,
          section,
          sectionKey,
          section.type,
          sections,
        );
        break;

      case "completeSiteSize":
        for (const row of section.rows ?? []) {
          for (const dimension of ["L", "W", "H"] as const) {
            next = migrateKeyPair(
              next,
              completeSiteSizeKey(sectionKey, row.key, dimension),
              legacyCompleteSiteSizeKey(row.key, dimension),
              firstSectionKeyForRow(sections, "completeSiteSize", row.key) ===
                sectionKey,
            );
          }
        }
        break;
    }
  }

  return next;
}

export function migrateMatrixFormData(
  formData: Record<string, unknown>,
  template: { sections?: TemplateSection[] },
): Record<string, unknown> {
  return migrateFormData(formData, template);
}

export function migrateMatrixFormDataForSection(
  formData: Record<string, unknown>,
  section: TemplateSection,
): Record<string, unknown> {
  return migrateMatrixSection(formData, section);
}
