"use client";

import CompleteSiteMatrixRenderer from "./CompleteSiteMatrixRenderer";
import CompleteSiteSizeRenderer from "./CompleteSiteSizeRenderer";

export default function CompleteSiteSection({ section }: { section: any }) {
  return (
    <div className="rbac-card">
      <h3 className="rbac-title-lg mb-4">{section.title}</h3>

      {section.type === "completeSiteSize" ? (
        <CompleteSiteSizeRenderer section={section} />
      ) : (
        <CompleteSiteMatrixRenderer section={section} />
      )}
    </div>
  );
}
