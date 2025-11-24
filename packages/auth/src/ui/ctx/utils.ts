import { snakeToCamel } from "@tern-secure/shared/caseUtils";
import type { SignInFactor } from '@tern-secure/types';

export function getInitialValuesFromQueryParams(queryString: string, params: string[]) {
  const props: Record<string, string> = {};
  const searchParams = new URLSearchParams(queryString);
  searchParams.forEach((value, key) => {
    if (params.includes(key) && typeof value === 'string') {
      props[snakeToCamel(key)] = value;
    }
  });

  return props;
}

export function determineCurrentFactor(
  selectedFactor: SignInFactor | null,
  supportedFirstFactors: SignInFactor[] | null | undefined,
): SignInFactor | null {
  if (selectedFactor) {
    return selectedFactor;
  }
  return supportedFirstFactors?.[0] || null;
}