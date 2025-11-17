import { snakeToCamel } from "@tern-secure/shared/caseUtils";

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