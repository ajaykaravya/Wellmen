export type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<string | number | boolean>;

export type QueryParams = Record<string, QueryValue>;

export function buildQueryString(params: QueryParams | URLSearchParams) {
  const searchParams =
    params instanceof URLSearchParams ? new URLSearchParams(params) : new URLSearchParams();

  if (!(params instanceof URLSearchParams)) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") return;

      if (Array.isArray(value)) {
        value.forEach((item) => {
          searchParams.append(key, String(item));
        });
        return;
      }

      searchParams.set(key, String(value));
    });
  }

  return searchParams.toString();
}

export function normalizeArrayResponse<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];

  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    Array.isArray((payload as { data?: unknown }).data)
  ) {
    return (payload as { data: T[] }).data;
  }

  return [];
}

