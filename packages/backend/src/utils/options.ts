import type {RequestOptions } from "../tokens/types";

export type RuntimeOptions = Omit<RequestOptions, "apiUrl">;

export type buildTimeOptions = Partial<Pick<RequestOptions, "apiUrl" | "apiVersion">>;

const defaultOptions: buildTimeOptions = {
  apiUrl: undefined,
  apiVersion: undefined,
};

export function mergePreDefinedOptions(
  userOptions: buildTimeOptions = {}
): buildTimeOptions {
  return {
    ...defaultOptions,
    ...userOptions,
  };
}