/**
 * Enables autocompletion for a union type, while keeping the ability to use any string
 * or type of `T`
 * @internal
 */
export type Autocomplete<U extends T, T = string> = U | (T & Record<never, never>);
