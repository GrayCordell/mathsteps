/* eslint-disable jsdoc/check-param-names */
// noinspection JSCommentMatchesSignature

// I made each have a duplicate jsdoc comment so it'd describe every overload on hover.
// This is the best way I know to have it be typesafe and have the hover description be accurate.
// AI generated the overloads.

/**
 * A function type representing a transformation function that takes an input of type `T`
 * and returns a result of type `R`.
 *
 * @template T - The input type for the function.
 * @template R - The return type of the function.
 */
type PipeFn<T, R> = (input: T) => R

/**
 * Creates a pipeline of functions where the output of each function is passed as the input to the next.
 * Ensures type safety by enforcing that the return type of each function matches the input type of the next.
 *
 * @template T - All Functions input types.
 * @template D - The return type of the last function
 *
 * @param {...PipeFn<any, any>[]} ...fns - A list of functions to compose in a pipeline.
 * @returns {PipeFn<T, D>} A function that takes an input of type `T` and produces an output of type `D`.
 *
 * @example
 * // Example usage:
 * const add = (x: number) => x + 1;
 * const toString = (x: number) => x.toString();
 * const appendExclamation = (x: string) => x + '!';
 *
 * const transform = pipe(add, toString, appendExclamation);
 * const result = transform(5); // Result is "6!"
 */
export function pipe<T, U>(fn1: PipeFn<T, U>): PipeFn<T, U>

/**
 * Creates a pipeline of functions where the output of each function is passed as the input to the next.
 * Ensures type safety by enforcing that the return type of each function matches the input type of the next.
 *
 * @template T - All Functions input types.
 * @template D - The return type of the last function
 *
 * @param {...PipeFn<any, any>[]} ...fns - A list of functions to compose in a pipeline.
 * @returns {PipeFn<T, D>} A function that takes an input of type `T` and produces an output of type `D`.
 *
 * @example
 * // Example usage:
 * const add = (x: number) => x + 1;
 * const toString = (x: number) => x.toString();
 * const appendExclamation = (x: string) => x + '!';
 *
 * const transform = pipe(add, toString, appendExclamation);
 * const result = transform(5); // Result is "6!"
 */
export function pipe<T, U, V>(fn1: PipeFn<T, U>, fn2: PipeFn<U, V>): PipeFn<T, V>

/**
 * Creates a pipeline of functions where the output of each function is passed as the input to the next.
 * Ensures type safety by enforcing that the return type of each function matches the input type of the next.
 *
 * @template T - All Functions input types.
 * @template D - The return type of the last function
 *
 * @param {...PipeFn<any, any>[]} ...fns - A list of functions to compose in a pipeline.
 * @returns {PipeFn<T, D>} A function that takes an input of type `T` and produces an output of type `D`.
 *
 * @example
 * // Example usage:
 * const add = (x: number) => x + 1;
 * const toString = (x: number) => x.toString();
 * const appendExclamation = (x: string) => x + '!';
 *
 * const transform = pipe(add, toString, appendExclamation);
 * const result = transform(5); // Result is "6!"
 */
export function pipe<T, U, V, W>(fn1: PipeFn<T, U>, fn2: PipeFn<U, V>, fn3: PipeFn<V, W>): PipeFn<T, W>

/**
 * Creates a pipeline of functions where the output of each function is passed as the input to the next.
 * Ensures type safety by enforcing that the return type of each function matches the input type of the next.
 *
 * @template T - All Functions input types.
 * @template D - The return type of the last function
 *
 * @param {...PipeFn<any, any>[]} ...fns - A list of functions to compose in a pipeline.
 * @returns {PipeFn<T, D>} A function that takes an input of type `T` and produces an output of type `D`.
 *
 * @example
 * // Example usage:
 * const add = (x: number) => x + 1;
 * const toString = (x: number) => x.toString();
 * const appendExclamation = (x: string) => x + '!';
 *
 * const transform = pipe(add, toString, appendExclamation);
 * const result = transform(5); // Result is "6!"
 */
export function pipe<T, U, V, W, X>(fn1: PipeFn<T, U>, fn2: PipeFn<U, V>, fn3: PipeFn<V, W>, fn4: PipeFn<W, X>): PipeFn<T, X>

/**
 * Creates a pipeline of functions where the output of each function is passed as the input to the next.
 * Ensures type safety by enforcing that the return type of each function matches the input type of the next.
 *
 * @template T - All Functions input types.
 * @template D - The return type of the last function
 *
 * @param {...PipeFn<any, any>[]} ...fns - A list of functions to compose in a pipeline.
 * @returns {PipeFn<T, D>} A function that takes an input of type `T` and produces an output of type `D`.
 *
 * @example
 * // Example usage:
 * const add = (x: number) => x + 1;
 * const toString = (x: number) => x.toString();
 * const appendExclamation = (x: string) => x + '!';
 *
 * const transform = pipe(add, toString, appendExclamation);
 * const result = transform(5); // Result is "6!"
 */
export function pipe<T, U, V, W, X, Y>(fn1: PipeFn<T, U>, fn2: PipeFn<U, V>, fn3: PipeFn<V, W>, fn4: PipeFn<W, X>, fn5: PipeFn<X, Y>): PipeFn<T, Y>

/**
 * Creates a pipeline of functions where the output of each function is passed as the input to the next.
 * Ensures type safety by enforcing that the return type of each function matches the input type of the next.
 *
 * @template T - All Functions input types.
 * @template D - The return type of the last function
 *
 * @param {...PipeFn<any, any>[]} ...fns - A list of functions to compose in a pipeline.
 * @returns {PipeFn<T, D>} A function that takes an input of type `T` and produces an output of type `D`.
 *
 * @example
 * // Example usage:
 * const add = (x: number) => x + 1;
 * const toString = (x: number) => x.toString();
 * const appendExclamation = (x: string) => x + '!';
 *
 * const transform = pipe(add, toString, appendExclamation);
 * const result = transform(5); // Result is "6!"
 */
export function pipe<T, U, V, W, X, Y, Z>(fn1: PipeFn<T, U>, fn2: PipeFn<U, V>, fn3: PipeFn<V, W>, fn4: PipeFn<W, X>, fn5: PipeFn<X, Y>, fn6: PipeFn<Y, Z>): PipeFn<T, Z>

/**
 * Creates a pipeline of functions where the output of each function is passed as the input to the next.
 * Ensures type safety by enforcing that the return type of each function matches the input type of the next.
 *
 * @template T - All Functions input types.
 * @template D - The return type of the last function
 *
 * @param {...PipeFn<any, any>[]} ...fns - A list of functions to compose in a pipeline.
 * @returns {PipeFn<T, D>} A function that takes an input of type `T` and produces an output of type `D`.
 *
 * @example
 * // Example usage:
 * const add = (x: number) => x + 1;
 * const toString = (x: number) => x.toString();
 * const appendExclamation = (x: string) => x + '!';
 *
 * const transform = pipe(add, toString, appendExclamation);
 * const result = transform(5); // Result is "6!"
 */
export function pipe<T, U, V, W, X, Y, Z, A>(fn1: PipeFn<T, U>, fn2: PipeFn<U, V>, fn3: PipeFn<V, W>, fn4: PipeFn<W, X>, fn5: PipeFn<X, Y>, fn6: PipeFn<Y, Z>, fn7: PipeFn<Z, A>): PipeFn<T, A>

/**
 * Creates a pipeline of functions where the output of each function is passed as the input to the next.
 * Ensures type safety by enforcing that the return type of each function matches the input type of the next.
 *
 * @template T - All Functions input types.
 * @template D - The return type of the last function
 *
 * @param {...PipeFn<any, any>[]} ...fns - A list of functions to compose in a pipeline.
 * @returns {PipeFn<T, D>} A function that takes an input of type `T` and produces an output of type `D`.
 *
 * @example
 * // Example usage:
 * const add = (x: number) => x + 1;
 * const toString = (x: number) => x.toString();
 * const appendExclamation = (x: string) => x + '!';
 *
 * const transform = pipe(add, toString, appendExclamation);
 * const result = transform(5); // Result is "6!"
 */
export function pipe<T, U, V, W, X, Y, Z, A, B>(fn1: PipeFn<T, U>, fn2: PipeFn<U, V>, fn3: PipeFn<V, W>, fn4: PipeFn<W, X>, fn5: PipeFn<X, Y>, fn6: PipeFn<Y, Z>, fn7: PipeFn<Z, A>, fn8: PipeFn<A, B>): PipeFn<T, B>

/**
 * Creates a pipeline of functions where the output of each function is passed as the input to the next.
 * Ensures type safety by enforcing that the return type of each function matches the input type of the next.
 *
 * @template T - All Functions input types.
 * @template D - The return type of the last function
 *
 * @param {...PipeFn<any, any>[]} ...fns - A list of functions to compose in a pipeline.
 * @returns {PipeFn<T, D>} A function that takes an input of type `T` and produces an output of type `D`.
 *
 * @example
 * // Example usage:
 * const add = (x: number) => x + 1;
 * const toString = (x: number) => x.toString();
 * const appendExclamation = (x: string) => x + '!';
 *
 * const transform = pipe(add, toString, appendExclamation);
 * const result = transform(5); // Result is "6!"
 */
export function pipe<T, U, V, W, X, Y, Z, A, B, C>(fn1: PipeFn<T, U>, fn2: PipeFn<U, V>, fn3: PipeFn<V, W>, fn4: PipeFn<W, X>, fn5: PipeFn<X, Y>, fn6: PipeFn<Y, Z>, fn7: PipeFn<Z, A>, fn8: PipeFn<A, B>, fn9: PipeFn<B, C>): PipeFn<T, C>

/**
 * Creates a pipeline of functions where the output of each function is passed as the input to the next.
 * Ensures type safety by enforcing that the return type of each function matches the input type of the next.
 *
 * @template T - All Functions input types.
 * @template D - The return type of the last function
 *
 * @param {...PipeFn<any, any>[]} ...fns - A list of functions to compose in a pipeline.
 * @returns {PipeFn<T, D>} A function that takes an input of type `T` and produces an output of type `D`.
 *
 * @example
 * // Example usage:
 * const add = (x: number) => x + 1;
 * const toString = (x: number) => x.toString();
 * const appendExclamation = (x: string) => x + '!';
 *
 * const transform = pipe(add, toString, appendExclamation);
 * const result = transform(5); // Result is "6!"
 */
export function pipe<T, U, V, W, X, Y, Z, A, B, C, D>(fn1: PipeFn<T, U>, fn2: PipeFn<U, V>, fn3: PipeFn<V, W>, fn4: PipeFn<W, X>, fn5: PipeFn<X, Y>, fn6: PipeFn<Y, Z>, fn7: PipeFn<Z, A>, fn8: PipeFn<A, B>, fn9: PipeFn<B, C>, fn10: PipeFn<C, D>): PipeFn<T, D>

/**
 * Creates a pipeline of functions where the output of each function is passed as the input to the next.
 * Ensures type safety by enforcing that the return type of each function matches the input type of the next.
 *
 * @template T - All Functions input types.
 * @template D - The return type of the last function
 *
 * @param {...PipeFn<any, any>[]} ...fns - A list of functions to compose in a pipeline.
 * @returns {PipeFn<T, D>} A function that takes an input of type `T` and produces an output of type `D`.
 *
 * @example
 * // Example usage:
 * const add = (x: number) => x + 1;
 * const toString = (x: number) => x.toString();
 * const appendExclamation = (x: string) => x + '!';
 *
 * const transform = pipe(add, toString, appendExclamation);
 * const result = transform(5); // Result is "6!"
 */
export function pipe<T, D>(...fns: PipeFn<any, any>[]): PipeFn<T, D> {
  return (input: any) => fns.reduce((value, fn) => fn(value), input)
}
