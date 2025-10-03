import type {
  TernSecureAPIError,
  TernSecureApiErrorJSON,
} from "@tern-secure/types";

import { constants } from "../constants";
import { runtime } from "../runtime";
import {
  getCustomTokenEndpoint,
  getRefreshTokenEndpoint,
  passwordResetEndpoint,
  signInWithPassword,
  signUpEndpoint,
} from "./endpointUrl";

export type HTTPMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
export type FirebaseEndpoint =
  | "refreshToken"
  | "signInWithPassword"
  | "signUp"
  | "signInWithCustomToken"
  | "passwordReset"
  | "sendOobCode"

export type BackendApiRequestOptions = {
  endpoint: FirebaseEndpoint;
  method?: HTTPMethod;
  apiKey?: string;
  queryParams?: Record<string, unknown>;
  headerParams?: Record<string, string>;
  bodyParams?: Record<string, unknown>;
  formData?: FormData;
}

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
      status?: number;
      statusText?: string;
      retryAfter?: number;
    };

export type RequestFunction = ReturnType<typeof createRequest>;

type CreateRequestOptions = {
  apiKey?: string;
  apiUrl?: string;
  apiVersion?: string;
};

const FIREBASE_ENDPOINT_MAP: Record<FirebaseEndpoint, (apiKey: string) => string> = {
  refreshToken: getRefreshTokenEndpoint,
  signInWithPassword: signInWithPassword,
  signUp: signUpEndpoint,
  signInWithCustomToken: getCustomTokenEndpoint,
  passwordReset: passwordResetEndpoint,
  sendOobCode: signInWithPassword,
};


export function createRequest(options: CreateRequestOptions) {
  const requestFn = async <T>(
    requestOptions: BackendApiRequestOptions
  ): Promise<BackendApiResponse<T>> => {
    const { endpoint, method, apiKey, queryParams, headerParams, bodyParams, formData } =
      requestOptions;


    if (!apiKey) {
      return {
        data: null,
        errors: [
          {
            code: "missing_api_key",
            message: "Firebase API key is required",
          },
        ],
      };
    }

    const endpointUrl = FIREBASE_ENDPOINT_MAP[endpoint](apiKey);
    const finalUrl = new URL(endpointUrl);

    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value) {
          [value].flat().forEach(v => finalUrl.searchParams.append(key, v as string));
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
