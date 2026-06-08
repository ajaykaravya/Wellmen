import { createCrudApi } from "./resource";

export type OfficeCategoryItem = {
  id: string;
  category: "OFFICE_WORK";
  name: string;
  createdAt: string;
};

export const officeCategoriesApi = createCrudApi<
  OfficeCategoryItem,
  OfficeCategoryItem,
  { name: string }
>("/api/office-categories");
