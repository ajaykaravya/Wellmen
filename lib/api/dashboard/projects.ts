import { createCrudApi } from "./resource";

export type ProjectItem = {
  id: string;
  name: string;
  address: string;
  contactNumber: string;
  email: string;
  startDate: string;
  endDate: string;
  description: string | null;
  city: string | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD";
};

export const projectsApi = createCrudApi<
  ProjectItem,
  ProjectItem,
  Partial<ProjectItem>,
  Partial<ProjectItem>
>("/api/projects");
