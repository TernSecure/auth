import { TernSecureBase } from "../resources/internal";

export type HTTPMethod =
  | "CONNECT"
  | "DELETE"
  | "GET"
  | "HEAD"
  | "OPTIONS"
  | "PATCH"
  | "POST"
  | "PUT"
  | "TRACE";

export interface ApiResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface ApiRequestParams {
  body?: any;
  method?: HTTPMethod;
  pathRoot: string;
  action?: string;
  headers?: Record<string, string>;
}

function constructFullUrl(pathRoot: string): string {
  const baseUrl = TernSecureBase.ternsecure.apiUrl;
  return `${baseUrl}${pathRoot}`;
}

function prepareHeaders(customHeaders?: Record<string, string>): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...customHeaders,
  };
}

function prepareRequestBody(body?: any): string | undefined {
  return body ? JSON.stringify(body) : undefined;
}

function handleApiError(error: unknown): ApiResponse {
  console.error("API request failed:", error);
  
  if (error instanceof Error) {
    if (error.message.includes("404") || error.message.includes("not found")) {
      return {
        success: false,
        message: "API endpoint not found",
        error: "ENDPOINT_NOT_FOUND",
      };
    }
  }
  
  return {
    success: false,
    message: "API request failed",
    error: "Unknown error",
  };
}

function processApiResponse(response: any): ApiResponse {
  if (!response.success) {
    console.error("[API Request] Request unsuccessful:", {
      error: response.error,
      message: response.message,
    });
  }
  
  return {
    success: response.success,
    message: response.message,
    error: response.error,
  };
}

export async function apiRequest(params: ApiRequestParams): Promise<ApiResponse> {
  const { body, method = "POST", pathRoot, headers } = params;
  
  try {
    const fullUrl = constructFullUrl(pathRoot);
    const requestHeaders = prepareHeaders(headers);
    const requestBody = prepareRequestBody(body);

    const response = await fetch(fullUrl, {
      method,
      headers: requestHeaders,
      body: requestBody,
    });

    if (!response.ok) {
      return {
        success: false,
        message: `API request failed: ${response.statusText}`,
        error: "API request failed",
      };
    }

    const responseData = await response.json();
    return processApiResponse(responseData);
  } catch (error) {
    return handleApiError(error);
  }
}