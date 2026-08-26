import { SUPPLY_DUCT_CHECKING } from "./supplyDuctChecking";
import { RETURN_DUCT_CHECKING } from "./returnDuctChecking";
import { AHU_CHECKLIST_REPORT } from "./ahuChecklistReport";
import { COMPOSER_CHECKLIST_REPORT } from "./composerChecklistReport";
import { PLENUM_BOX_CHECKLIST_REPORT } from "./plenumBoxChecklistReport";

// Combines the five HVAC checklists into a single document. The sections are
// reused from the original templates rather than copied, so edits to any of
// them stay reflected here. Each section keeps its own key, which keeps saved
// form data separated per checklist.
export const SOP_AND_CHECKLIST_OF_HVAC_SYSTEM = {
  id: "sop-and-checklist-of-hvac-system",
  name: "SOP and Check List of HVAC System",

  sections: [
    ...SUPPLY_DUCT_CHECKING.sections,
    ...RETURN_DUCT_CHECKING.sections,
    ...AHU_CHECKLIST_REPORT.sections,
    // Source template titles this "Composer"; its rows are all compressor
    // checks, so the heading is corrected here without touching the original.
    ...COMPOSER_CHECKLIST_REPORT.sections.map((section) => ({
      ...section,
      title: "Compressor Checklist Report",
    })),
    ...PLENUM_BOX_CHECKLIST_REPORT.sections,
  ],
};
