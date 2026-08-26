"use client";

import HeaderSection from "./HeaderSection";
import ChecklistSection from "./ChecklistSection";
import ContactSection from "./ContactSection";
import MatrixSection from "./MatrixSection";
import ElectricSection from "./ElectricSection";
import SizeMatrixRenderer from "./SizeMatrixRenderer";
import CompleteSiteSection from "./CompleteSiteSection";
import FileUploadSection from "./FileUploadSection";

type Props = {
  template: any;
  formData?: any;
  setFormData: any;
  onSubmit: any;
  onBack: () => void;
  projectId?: string;
};

export default function FormRenderer({
  template,
  formData,
  setFormData,
  onSubmit,
  onBack,
  projectId
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
            return (
              <ChecklistSection
                formData={formData}
                setFormData={setFormData}
                key={section.key}
                section={section}
              />
            );

          case "contacts":
            return (
              <ContactSection
                formData={formData}
                setFormData={setFormData}
                key={section.key}
                section={section}
              />
            );

          case "matrix":
            return (
              <MatrixSection
                formData={formData}
                setFormData={setFormData}
                key={section.key}
                section={section}
              />
            );

          case "electric":
            return (
              <ElectricSection
                formData={formData}
                setFormData={setFormData}
                key={section.key}
                section={section}
              />
            );

          case "sizeMatrix":
            return (
              <SizeMatrixRenderer
                formData={formData}
                setFormData={setFormData}
                key={section.key}
                section={section}
              />
            );

          case "fileUpload":
            return (
              <FileUploadSection
                formData={formData}
                setFormData={setFormData}
                projectId={projectId}
                key={section.key}
                section={section}
              />
            );

          case "completeSiteMatrix":
            return (
              <CompleteSiteSection
                formData={formData}
                setFormData={setFormData}
                key={section.key}
                section={section}
              />
            );

          case "completeSiteSize":
            return (
              <CompleteSiteSection
                formData={formData}
                setFormData={setFormData}
                key={section.key}
                section={section}
              />
            );

          default:
            return null;
        }
      })}
      <div className="flex justify-end mt-6 gap-3">
        <button type="button" onClick={onBack} className="rbac-button rbac-button-secondary">
          Cancel
        </button>
        <button type="button" onClick={onSubmit} className="rbac-button">
          Submit Form
        </button>
      </div>
    </div>
  );
}
