import { createCrudApi } from "./resource";

export type ReportingCategoryItem = {
  id: string;
  category: "REPORTING_WORK";
  name: string;
  createdAt: string;
};

export const reportingCategoriesApi = createCrudApi<
  ReportingCategoryItem,
  ReportingCategoryItem,
  { category: "REPORTING_WORK"; name: string }
>("/api/reporting-categories");
