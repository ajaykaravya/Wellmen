"use client";

import HeaderView from "./HeaderView";
import ChecklistView from "./ChecklistView";
import ContactView from "./ContactView";
import MatrixView from "./MatrixView";
import ElectricView from "./ElectricView";
import SizeMatrixView from "./SizeMatrixView";
import CompleteSiteView from "./CompleteSiteView";

type Props = {
  template: any;
  formData?: any;
  onBack: () => void;
};

export default function ViewRenderer({
  template,
  formData,
  onBack
}: Props) {
  if (!template?.sections) {
    return <div>No form template found</div>;
  }

  return (
    <div className="space-y-8">
      {template.sections.map((section: any) => {
        switch (section.type) {
          case "header":
            return (
              <HeaderView
                formData={formData}
                key={section.title}
                section={section}
              />
            );

          case "checklist":
            return (
              <ChecklistView
                formData={formData}
                key={section.key || section.title}
                section={section}
              />
            );

          case "contacts":
            return (
              <ContactView
                formData={formData}
                key={section.key}
                section={section}
              />
            );

          case "matrix":
            return (
              <MatrixView
                formData={formData}
                key={section.key}
                section={section}
              />
            );

          case "electric":
            return (
              <ElectricView
                formData={formData}
                key={section.key}
                section={section}
              />
            );

          case "sizeMatrix":
            return (
              <SizeMatrixView
                formData={formData}
                key={section.key}
                section={section}
              />
            );

          case "completeSiteMatrix":
          case "completeSiteSize":
            return (
              <CompleteSiteView
                formData={formData}
                key={section.key}
                section={section}
              />
            );

          default:
            return null;
        }
      })}
      <div className="flex justify-end mt-10 print:hidden">
        <button type="button" onClick={onBack} className="rbac-button rbac-button-secondary">
          Back to List
        </button>
      </div>
    </div>
  );
}
