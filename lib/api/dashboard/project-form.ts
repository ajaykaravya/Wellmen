import { createCrudApi } from "./resource";

export type ProjectFormItem = {
  id: string;
  formId: string;
  name: string;
  status: "PENDING" | "COMPLETED";
  formData: Record<string, any>
};

export const projectFormApi = createCrudApi<
  ProjectFormItem,
  ProjectFormItem,
  Partial<ProjectFormItem>,
  Partial<ProjectFormItem>
>("/api/project-form");
