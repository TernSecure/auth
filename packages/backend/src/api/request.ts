import type {
  TernSecureAPIError,
  TernSecureApiErrorJSON,
} from "@tern-secure/types";
import { joinPaths } from "../utils/path";
import { runtime } from "../runtime";
import { constants } from "../constants";

export type HTTPMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
export type BackendApiRequestOptions = {
  method?: HTTPMethod;
  queryParams?: Record<string, unknown>;
  headerParams?: Record<string, string>;
  bodyParams?: Record<string, unknown>;
  formData?: FormData;
} & ({ url: string; path?: string } | { url?: string; path: string });

export type BackendApiResponse<T> =
  | {
      data: T;
      errors: null;
      totalCount?: number;
    }
  | {
      data: null;
      errors: TernSecureAPIError[];
      totalCount?: never;
      clerkTraceId?: string;
      status?: number;
      statusText?: string;
      retryAfter?: number;
    };

export type RequestFunction = ReturnType<typeof createRequest>;

type CreateRequestOptions = {
  apiUrl?: string;
  apiVersion?: string;
};

export function createRequest(options: CreateRequestOptions) {
  const requestFn = async <T>(
    requestOptions: BackendApiRequestOptions
  ): Promise<BackendApiResponse<T>> => {
    const { apiUrl, apiVersion } = options;
    const { path, method, queryParams, headerParams, bodyParams, formData } =
      requestOptions;

    const url = joinPaths(apiUrl, apiVersion, path);
    const finalUrl = new URL(url);

    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          finalUrl.searchParams.append(key, String(value));
        }
      });
    }

    const headers: Record<string, any> = {
      ...headerParams,
    };
    let res: Response | undefined;

    try {
      if (formData) {
        res = await runtime.fetch(finalUrl.href, {
          method,
          headers,
          body: formData,
        });
      } else {
        headers["Content-Type"] = "application/json";
        const hasBody =
          method !== "GET" && bodyParams && Object.keys(bodyParams).length > 0;
        const body = hasBody ? { body: JSON.stringify(bodyParams) } : null;

        res = await runtime.fetch(finalUrl.href, {
          method,
          headers,
          ...body,
        });
      }

      const isJSONResponse =
        res?.headers &&
        res.headers?.get(constants.Headers.ContentType) ===
          constants.ContentTypes.Json;
      const responseBody = await (isJSONResponse ? res.json() : res.text());

      if (!res.ok) {
        return {
          data: null,
          errors: parseErrors(responseBody),
          status: res?.status,
          statusText: res?.statusText,
        };
      }

      return {
        data: responseBody,
        errors: null,
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          data: null,
          errors: [
            {
              code: "unexpected_error",
              message: error.message || "An unexpected error occurred",
            },
          ],
        };
      }

      return {
        data: null,
        errors: parseErrors(error),
        status: res?.status,
        statusText: res?.statusText,
      };
    }
  };
  return requestFn;
}

function parseErrors(data: unknown): TernSecureAPIError[] {
  if (!!data && typeof data === "object" && "errors" in data) {
    const errors = data.errors as TernSecureApiErrorJSON[];
    return errors.length > 0 ? errors.map(parseError) : [];
  }
  return [];
}

export function parseError(error: TernSecureApiErrorJSON): TernSecureAPIError {
  return {
    code: error.code,
    message: error.message,
  };
}
