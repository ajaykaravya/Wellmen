import { requestJson } from "../client";
import type { QueryParams } from "../query";

export function createCrudApi<TList, TDetail = TList, TCreate = unknown, TUpdate = TCreate>(
  basePath: string,
) {
  return {
    list(query?: QueryParams) {
      return requestJson<{ data: TList[]; total: number; totalPages?: number }>({
        path: basePath,
        query,
      });
    },
    get(id: string) {
      return requestJson<TDetail>({ path: `${basePath}/${id}` });
    },
    create(body: TCreate) {
      return requestJson<TDetail, TCreate>({
        path: basePath,
        method: "POST",
        body,
      });
    },
    update(id: string, body: TUpdate) {
      return requestJson<TDetail, TUpdate>({
        path: `${basePath}/${id}`,
        method: "PUT",
        body,
      });
    },
    patch<TPatch = unknown>(id: string, body: TPatch) {
      return requestJson<TDetail, TPatch>({
        path: `${basePath}/${id}`,
        method: "PATCH",
        body,
      });
    },
    remove(id: string) {
      return requestJson<void>({ path: `${basePath}/${id}`, method: "DELETE" });
    },
  };
}

