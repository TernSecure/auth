/**
 * Enables autocompletion for a union type, while keeping the ability to use any string
 * or type of `T`
 * @internal
 */
export type Autocomplete<U extends T, T = string> = U | (T & Record<never, never>);

/**
 * Omit without union flattening
 * */
export type Without<T, W> = {
  [P in keyof T as Exclude<P, W>]: T[P];
};