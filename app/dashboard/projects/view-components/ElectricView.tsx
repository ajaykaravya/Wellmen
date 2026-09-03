"use client";

import {
  getElectricSubZeroValue,
  getElectricTouchPanelValue,
  resolveSectionKey,
} from "@/lib/sectionFormKeys";
import { isElectricRowFilled, isFilled } from "@/lib/formViewUtils";

export default function ElectricView({
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
      isElectricRowFilled(formData, sectionKey, row.key, templateSections),
    ) ?? [];

  if (filledRows.length === 0) return null;

  return (
    <div className="rbac-card">
      <h3 className="rbac-title-lg mb-5">{section.title}</h3>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--theme-surface-2)] text-[color:var(--theme-text-muted)] uppercase text-xs font-bold">
              <th className="px-6 py-4 text-left">Description</th>
              <th className="px-6 py-4 text-left">Sub Zero Panel Board</th>
              <th className="px-6 py-4 text-left">Touch Panel Board</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filledRows.map((row: any) => {
              const subZero = getElectricSubZeroValue(
                formData,
                sectionKey,
                row.key,
                templateSections,
              );
              const touchPanel = getElectricTouchPanelValue(
                formData,
                sectionKey,
                row.key,
                templateSections,
              );
              return (
                <tr key={`${sectionKey}-${row.key}`} className="">
                  <td className="px-6 py-4 font-medium">{row.label}</td>
                  <td className="px-6 py-4">
                    {isFilled(subZero) ? String(subZero) : null}
                  </td>
                  <td className="px-6 py-4">
                    {isFilled(touchPanel) ? String(touchPanel) : null}
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
