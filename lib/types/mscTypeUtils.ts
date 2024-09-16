/**
 * Merges two objects where each property holds an array of values.
 * For each matching property between the two objects, their arrays are concatenated.
 * The function preserves literal types of array elements (if marked with `as const`).
 *
 * @template T - The type of the first object, where each property is an array.
 * @template U - The type of the second object, where each property is an array.
 * @param {T} obj1 - The first object containing arrays of values.
 * @param {U} obj2 - The second object containing arrays of values.
 * @returns {{ [K in keyof T & keyof U]: [...T[K], ...U[K]] }} A new object where the arrays from both objects are merged for each property.
 *
 * @example
 * const a = { x: ['10', '20', '30'] } as const;
 * const b = { x: ['40', '50', '60'] } as const;
 * const combined = mergeObjectArrays(a, b);
 * // Result: { x: ['10', '20', '30', '40', '50', '60'] }
 */
export function mergeObjArrays<T extends Record<string, readonly any[]>, U extends Record<string, readonly any[]>>(obj1: T, obj2: U): {
  [K in keyof T & keyof U]: [...T[K], ...U[K]]
} {
  const result: any = {}

  for (const key in obj1) {
    if (Object.prototype.hasOwnProperty.call(obj1, key) && Object.prototype.hasOwnProperty.call(obj2, key)) {
      result[key] = [...obj1[key], ...obj2[key]]
    }
  }

  return result
}


/**
 * @PartialRecord<K, T> is a utility type that allows you to create a type with a subset of properties from another type.
 */
export type PartialRecord<K extends keyof any, T> = {
  // eslint-disable-next-line no-unused-vars
  [P in K]?: T;
}
