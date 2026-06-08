import { ApiError, type ApiErrorPayload } from "./errors";
import { buildQueryString, type QueryParams } from "./query";

type RequestJsonOptions<TBody = unknown> = {
  path: string;
  method?: string;
  query?: QueryParams;
  body?: TBody;
  headers?: HeadersInit;
  signal?: AbortSignal;
};

const JSON_CONTENT_TYPE = "application/json";

async function safeParseResponse(response: Response) {
  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes(JSON_CONTENT_TYPE)) return null;

  try {
    return await response.json();
  } catch {
    return null;
  }
}

function hasExplicitContentType(headers: HeadersInit | undefined) {
  if (!headers) return false;
  if (headers instanceof Headers) return headers.has("Content-Type");
  if (Array.isArray(headers)) {
    return headers.some(([key]) => key.toLowerCase() === "content-type");
  }

  return Object.keys(headers).some((key) => key.toLowerCase() === "content-type");
}

function resolveBodyAndHeaders<TBody>(
  body: TBody | undefined,
  headers: HeadersInit | undefined,
) {
  if (body === undefined) {
    return { body: undefined, headers };
  }

  if (
    typeof FormData !== "undefined" &&
    body instanceof FormData
  ) {
    return { body, headers };
  }

  if (
    typeof Blob !== "undefined" &&
    body instanceof Blob
  ) {
    return { body, headers };
  }

  if (typeof body === "string" || body instanceof URLSearchParams) {
    return { body, headers };
  }

  const nextHeaders = new Headers(headers || undefined);
  if (!hasExplicitContentType(headers)) {
    nextHeaders.set("Content-Type", JSON_CONTENT_TYPE);
  }

  return {
    body: JSON.stringify(body),
    headers: nextHeaders,
  };
}

function isApiErrorPayload(payload: unknown): payload is ApiErrorPayload {
  return Boolean(payload && typeof payload === "object");
}

export async function requestJson<TResponse, TBody = unknown>({
  path,
  method = "GET",
  query,
  body,
  headers,
  signal,
}: RequestJsonOptions<TBody>): Promise<TResponse> {
  const queryString = query ? buildQueryString(query) : "";
  const url = queryString ? `${path}?${queryString}` : path;
  const { body: resolvedBody, headers: resolvedHeaders } = resolveBodyAndHeaders(
    body,
    headers,
  );

  const response = await fetch(url, {
    method,
    headers: resolvedHeaders,
    body: resolvedBody as BodyInit | null | undefined,
    signal,
  });

  const payload = await safeParseResponse(response);

  if (!response.ok) {
    const errorPayload = isApiErrorPayload(payload) ? payload : null;
    const message =
      (errorPayload?.error as string | undefined) ||
      `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, errorPayload);
  }

  return payload as TResponse;
}
