"use client";

import {
  getCompleteSiteSizeValue,
  getSectionRowColValue,
  resolveSectionKey,
} from "@/lib/sectionFormKeys";
import {
  isCompleteSiteMatrixRowFilled,
  isCompleteSiteSizeRowFilled,
  isFilled,
} from "@/lib/formViewUtils";

export default function CompleteSiteView({
  section,
  formData,
  templateSections = [],
}: {
  section: any;
  formData: any;
  templateSections?: any[];
}) {
  const sectionKey = resolveSectionKey(section);
  const isSizeSection = section.type === "completeSiteSize";

  const filledRows =
    section.rows?.filter((row: any) =>
      isSizeSection
        ? isCompleteSiteSizeRowFilled(
            formData,
            sectionKey,
            row.key,
            templateSections,
          )
        : isCompleteSiteMatrixRowFilled(
            formData,
            sectionKey,
            row.key,
            section.columns,
            templateSections,
          ),
    ) ?? [];

  if (filledRows.length === 0) return null;

  if (isSizeSection) {
    return (
      <div className="rbac-card">
        <h3 className="rbac-title-lg mb-5">{section.title}</h3>
        <div className="overflow-x-auto rounded-xl border border-[color:var(--theme-border)] bg-[var(--theme-surface)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--theme-surface-2)] text-[color:var(--theme-text-muted)] uppercase text-xs font-bold">
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-center border-l">Size (L x W x H)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--theme-border)]">
              {filledRows.map((row: any) => {
                const parts = (["L", "W", "H"] as const)
                  .map((dimension) =>
                    getCompleteSiteSizeValue(
                      formData,
                      sectionKey,
                      row.key,
                      dimension,
                      templateSections,
                    ),
                  )
                  .filter((value) => isFilled(value));

                return (
                  <tr key={`${sectionKey}-${row.key}`} className="hover:bg-[var(--theme-surface-2)]">
                    <td className="px-4 py-3 font-medium text-[color:var(--theme-text)]">{row.label}</td>
                    <td className="px-4 py-3 text-center border-l text-[color:var(--theme-text)]">
                      {parts.length > 0 ? parts.map(String).join(" x ") : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="rbac-card">
      <h3 className="rbac-title-lg mb-5">{section.title}</h3>
      <div className="overflow-x-auto rounded-xl border border-[color:var(--theme-border)] bg-[var(--theme-surface)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--theme-surface-2)] text-[color:var(--theme-text-muted)] uppercase text-xs font-bold">
              <th className="px-4 py-3 text-left">Description</th>
              {section.columns?.map((col: any) => (
                <th key={col.key} className="px-4 py-3 text-center border-l">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--theme-border)]">
            {filledRows.map((row: any) => (
              <tr key={`${sectionKey}-${row.key}`} className="hover:bg-[var(--theme-surface-2)]">
                <td className="px-4 py-3 font-medium text-[color:var(--theme-text)]">{row.label}</td>
                {section.columns?.map((col: any) => {
                  const value = getSectionRowColValue(
                    formData,
                    sectionKey,
                    row.key,
                    col.key,
                    "completeSiteMatrix",
                    templateSections,
                  );
                  return (
                    <td key={col.key} className="px-4 py-3 text-center border-l text-[color:var(--theme-text)]">
                      {isFilled(value) ? String(value) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
