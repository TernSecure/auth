import type {RequestOptions } from "../tokens/types";

export type RuntimeOptions = Omit<RequestOptions, "apiUrl">;

export type buildTimeOptions = Partial<Pick<RequestOptions, "apiKey" |"apiUrl" | "apiVersion">>;

const defaultOptions: buildTimeOptions = {
  apiKey: undefined,
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