"use client";

import {
  getContactMobileValue,
  getContactNameValue,
  resolveSectionKey,
} from "@/lib/sectionFormKeys";
import { isContactRowFilled, isFilled } from "@/lib/formViewUtils";

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
  const filledRows =
    section.rows?.filter((row: any) =>
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
