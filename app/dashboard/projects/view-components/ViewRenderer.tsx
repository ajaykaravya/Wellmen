"use client";

import HeaderView from "./HeaderView";
import ChecklistView from "./ChecklistView";
import ContactView from "./ContactView";
import MatrixView from "./MatrixView";
import ElectricView from "./ElectricView";
import SizeMatrixView from "./SizeMatrixView";
import FileUploadView from "./FileUploadView";
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

  const templateSections = template.sections;

  return (
    <div className="space-y-8">
      {templateSections.map((section: any) => {
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
                templateSections={templateSections}
              />
            );

          case "contacts":
            return (
              <ContactView
                formData={formData}
                key={section.key}
                section={section}
                templateSections={templateSections}
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
                templateSections={templateSections}
              />
            );

          case "sizeMatrix":
            return (
              <SizeMatrixView
                formData={formData}
                key={section.key}
                section={section}
                templateSections={templateSections}
              />
            );

          case "fileUpload":
            return (
              <FileUploadView
                key={section.key}
                section={section}
                formData={formData}
              />
            );

          case "completeSiteMatrix":
          case "completeSiteSize":
            return (
              <CompleteSiteView
                formData={formData}
                key={section.key}
                section={section}
                templateSections={templateSections}
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
