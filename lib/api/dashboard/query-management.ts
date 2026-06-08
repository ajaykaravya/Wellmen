import { createCrudApi } from "./resource";

export const queryManagementApi = createCrudApi("/api/query-management");

export function createQueryManagementApi(basePath = "/api/query-management") {
  return createCrudApi(basePath);
}
