import { createCrudApi } from "./resource";

export type CategoryItem = {
  id: string;
  category: "PROJECT_WORK";
  name: string;
  createdAt: string;
};

export const categoriesApi = createCrudApi<
  CategoryItem,
  CategoryItem,
  { category: "PROJECT_WORK"; name: string }
>("/api/categories");
