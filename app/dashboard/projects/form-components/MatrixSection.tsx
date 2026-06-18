"use client";

import NormalMatrixRenderer from "./NormalMatrixRenderer";
import SelectionRenderer from "./SelectionRenderer";
import SizeMatrixRenderer from "./SizeMatrixRenderer";

export default function MatrixSection({ section }: { section: any }) {
  return (
    <div className="rbac-card">
      <h3 className="rbac-title-lg mb-4">{section.title}</h3>

      {section.type === "sizeMatrix" ? (
        <SizeMatrixRenderer section={section} />
      ) : (
        section.groups.map((group: any) => (
          <div key={group.key} className="mb-8">
            <h4 className="font-semibold mb-3">{group.label}</h4>

            {group.selection?.enabled ? (
              <SelectionRenderer group={group} columns={section.columns} />
            ) : (
              <NormalMatrixRenderer group={group} columns={section.columns} />
            )}
          </div>
        ))
      )}
    </div>
  );
}
