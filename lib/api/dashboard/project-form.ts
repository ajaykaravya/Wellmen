import { createCrudApi } from "./resource";

export type ProjectFormItem = {
  id: string;
  name: string;
  status:boolean
};

export const projectFormApi = createCrudApi<
  ProjectFormItem,
  ProjectFormItem,
  Partial<ProjectFormItem>,
  Partial<ProjectFormItem>
>("/api/project-form");
