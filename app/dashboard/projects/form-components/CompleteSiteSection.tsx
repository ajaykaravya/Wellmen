"use client";

import CompleteSiteMatrixRenderer from "./CompleteSiteMatrixRenderer";
import CompleteSiteSizeRenderer from "./CompleteSiteSizeRenderer";

export default function CompleteSiteSection({
  section,
  formData,
  setFormData,
}: {
  section: any;
  formData: any;
  setFormData: any;
}) {
  return (
    <div className="rbac-card">
      <h3 className="rbac-title-lg mb-4">{section.title}</h3>

      {section.type === "completeSiteSize" ? (
        <CompleteSiteSizeRenderer
          formData={formData}
          setFormData={setFormData}
          section={section}
        />
      ) : (
        <CompleteSiteMatrixRenderer
          formData={formData}
          setFormData={setFormData}
          section={section}
        />
      )}
    </div>
  );
}
