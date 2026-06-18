"use client";

import HeaderSection from "./HeaderSection";
import ChecklistSection from "./ChecklistSection";
import ContactSection from "./ContactSection";
import MatrixSection from "./MatrixSection";
import ElectricSection from "./ElectricSection";
import SizeMatrixRenderer from "./SizeMatrixRenderer";
import CompleteSiteSection from "./CompleteSiteSection";

type Props = {
  template: any;
  formData?: any;
  setFormData: any;
  onSubmit: any;
};

export default function FormRenderer({
  template,
  formData,
  setFormData,
  onSubmit,
}: Props) {
  if (!template?.sections) {
    return <div>No form template found</div>;
  }

  return (
    <div className="space-y-6">
      {template.sections.map((section: any) => {
        switch (section.type) {
          case "header":
            return (
              <HeaderSection
                formData={formData}
                setFormData={setFormData}
                key={section.title}
                section={section}
              />
            );

          case "checklist":
            return <ChecklistSection key={section.key} section={section} />;

          case "contacts":
            return <ContactSection key={section.key} section={section} />;

          case "matrix":
            return <MatrixSection key={section.key} section={section} />;

          case "electric":
            return <ElectricSection key={section.key} section={section} />;

          case "sizeMatrix":
            return <SizeMatrixRenderer key={section.key} section={section} />;

          case "completeSiteMatrix":
            return <CompleteSiteSection key={section.key} section={section} />;

          case "completeSiteSize":
            return <CompleteSiteSection key={section.key} section={section} />;

          default:
            return null;
        }
      })}
      <div className="flex justify-end mt-6">
        <button type="button" onClick={onSubmit} className="rbac-button">
          Submit Form
        </button>
      </div>
    </div>
  );
}
