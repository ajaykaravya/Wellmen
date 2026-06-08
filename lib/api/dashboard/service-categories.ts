import { createCrudApi } from "./resource";

export type ServiceCategoryItem = {
  id: string;
  category: "SERVICE_WORK";
  name: string;
  createdAt: string;
};

export const serviceCategoriesApi = createCrudApi<
  ServiceCategoryItem,
  ServiceCategoryItem,
  { name: string }
>("/api/service-categories");
