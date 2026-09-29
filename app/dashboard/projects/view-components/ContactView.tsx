"use client";

import {
  getContactMobileValue,
  getContactNameValue,
  resolveSectionKey,
} from "@/lib/sectionFormKeys";
import { isContactRowFilled, isFilled } from "@/lib/formViewUtils";
import { getCustomRows } from "@/lib/customRows";

export default function ContactView({
  section,
  formData,
  templateSections = [],
}: {
  section: any;
  formData: any;
  templateSections?: any[];
}) {
  const sectionKey = resolveSectionKey(section);

  // Rows the user added while filling the form live in formData, not the
  // template, so they must be merged in or they vanish from the view and PDF.
  const viewRows = [
    ...(section.rows || []),
    ...getCustomRows(formData, sectionKey),
  ];
  const filledRows =
    viewRows.filter((row: any) =>
      isContactRowFilled(formData, sectionKey, row.key, templateSections),
    ) ?? [];

  if (filledRows.length === 0) return null;

  return (
    <div className="rbac-card">
      <h3 className="rbac-title-lg mb-5">{section.title}</h3>
      <div className="overflow-hidden rounded-xl border border-[color:var(--theme-border)] bg-[var(--theme-surface)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--theme-surface-2)] text-[color:var(--theme-text-muted)] uppercase text-xs font-bold">
              <th className="px-6 py-4 text-left">Department</th>
              <th className="px-6 py-4 text-left">Name</th>
              <th className="px-6 py-4 text-left">Mobile</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--theme-border)]">
            {filledRows.map((row: any) => {
              const name = getContactNameValue(
                formData,
                sectionKey,
                row.key,
                templateSections,
              );
              const mobile = getContactMobileValue(
                formData,
                sectionKey,
                row.key,
                templateSections,
              );
              return (
                <tr key={`${sectionKey}-${row.key}`} className="hover:bg-[var(--theme-surface-2)]">
                  <td className="px-6 py-4 font-medium text-[color:var(--theme-text)]">{row.label}</td>
                  <td className="px-6 py-4 text-[color:var(--theme-text)]">
                    {isFilled(name) ? String(name) : null}
                  </td>
                  <td className="px-6 py-4 text-[color:var(--theme-text)]">
                    {isFilled(mobile) ? String(mobile) : null}
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
