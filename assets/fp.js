// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Curtis Franks <curtisfranks@gmail.com>

'use strict';

/**
 * @file Functional programming utilities for composition, currying, and immutability.
 * @module fp
 * @description Provides core FP primitives: pipe, compose, curry, and immutable helpers.
 * All functions in this module are pure and have no side effects.
 * @author Curtis Franks <curtisfranks@gmail.com>
 * @copyright 2026 Curtis Franks
 * @license MIT
 * @see {@link https://github.com/chf3198/mini-scada-hmi-dashboard}
 */

// ============================================================================
// FUNCTION COMPOSITION
// ============================================================================

/**
 * Pipes a value through a series of functions from left to right.
 * Each function receives the result of the previous one.
 * @param {*} initialValue - The initial value to pipe through
 * @param {...Function} functions - Functions to apply in order
 * @returns {*} The result of applying all functions
 * @example
 * pipe(5, x => x + 1, x => x * 2) // => 12
 * pipe([1,2,3], arr => arr.filter(x => x > 1), arr => arr.map(x => x * 2)) // => [4, 6]
 * @pure
 */
function pipe(initialValue, ...functions) {
    return functions.reduce((value, fn) => fn(value), initialValue);
}

/**
 * Creates a composed function that pipes values from left to right.
 * Unlike pipe(), this returns a function rather than immediately executing.
 * @param {...Function} functions - Functions to compose
 * @returns {Function} A new function that applies all functions in order
 * @example
 * const addOneThenDouble = flow(x => x + 1, x => x * 2);
 * addOneThenDouble(5) // => 12
 * @pure
 */
function flow(...functions) {
    return (initialValue) => functions.reduce((value, fn) => fn(value), initialValue);
}

/**
 * Composes functions from right to left (traditional mathematical composition).
 * Opposite order of flow().
 * @param {...Function} functions - Functions to compose (applied right to left)
 * @returns {Function} A new composed function
 * @example
 * const doubleThenAddOne = compose(x => x + 1, x => x * 2);
 * doubleThenAddOne(5) // => 11
 * @pure
 */
function compose(...functions) {
    return (initialValue) => functions.reduceRight((value, fn) => fn(value), initialValue);
}

// ============================================================================
// CURRYING & PARTIAL APPLICATION
// ============================================================================

/**
 * Curries a function, allowing partial application of arguments.
 * Returns a new function that accumulates arguments until enough are provided.
 * @param {Function} fn - The function to curry
 * @returns {Function} A curried version of the function
 * @example
 * const add = (a, b, c) => a + b + c;
 * const curriedAdd = curry(add);
 * curriedAdd(1)(2)(3) // => 6
 * curriedAdd(1, 2)(3) // => 6
 * curriedAdd(1)(2, 3) // => 6
 * @pure
 */
function curry(fn) {
    return function curried(...args) {
        if (args.length >= fn.length) {
            return fn.apply(this, args);
        }
        return function(...nextArgs) {
            return curried.apply(this, args.concat(nextArgs));
        };
    };
}

/**
 * Partially applies arguments to a function from the left.
 * @param {Function} fn - The function to partially apply
 * @param {...*} presetArgs - Arguments to preset
 * @returns {Function} A new function with preset arguments
 * @example
 * const greet = (greeting, name) => `${greeting}, ${name}!`;
 * const sayHello = partial(greet, 'Hello');
 * sayHello('World') // => 'Hello, World!'
 * @pure
 */
function partial(fn, ...presetArgs) {
    return (...laterArgs) => fn(...presetArgs, ...laterArgs);
}

// ============================================================================
// IMMUTABLE DATA HELPERS
// ============================================================================

/**
 * Creates a shallow frozen copy of an object.
 * Prevents accidental mutation at the top level.
 * @param {Object} obj - The object to freeze
 * @returns {Object} A frozen shallow copy
 * @example
 * const frozen = freezeShallow({ a: 1, b: { c: 2 } });
 * frozen.a = 5; // Throws in strict mode, silently fails otherwise
 * @pure
 */
function freezeShallow(obj) {
    return Object.freeze({ ...obj });
}

/**
 * Deep freezes an object and all nested objects.
 * @param {Object} obj - The object to deep freeze
 * @returns {Object} The deeply frozen object
 * @pure
 */
function freezeDeep(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    Object.keys(obj).forEach(key => {
        const value = obj[key];
        if (typeof value === 'object' && value !== null) {
            freezeDeep(value);
        }
    });
    
    return Object.freeze(obj);
}

/**
 * Immutably updates a nested property in an object.
 * Creates new objects along the path, preserving the rest.
 * @param {Object} obj - The source object
 * @param {string[]} path - Array of keys forming the path to the property
 * @param {*} value - The new value to set
 * @returns {Object} A new object with the updated property
 * @example
 * const state = { user: { name: 'Alice', age: 30 } };
 * setIn(state, ['user', 'age'], 31) // => { user: { name: 'Alice', age: 31 } }
 * @pure
 */
function setIn(obj, path, value) {
    if (path.length === 0) {
        return value;
    }
    
    const [head, ...tail] = path;
    const currentValue = obj && typeof obj === 'object' ? obj[head] : undefined;
    
    return {
        ...obj,
        [head]: tail.length === 0 ? value : setIn(currentValue || {}, tail, value)
    };
}

/**
 * Immutably updates a value in an object using an updater function.
 * @param {Object} obj - The source object
 * @param {string[]} path - Array of keys forming the path
 * @param {Function} updater - Function that receives old value, returns new value
 * @returns {Object} A new object with the updated property
 * @example
 * const state = { count: 5 };
 * updateIn(state, ['count'], x => x + 1) // => { count: 6 }
 * @pure
 */
function updateIn(obj, path, updater) {
    const currentValue = path.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
    return setIn(obj, path, updater(currentValue));
}

/**
 * Gets a nested value from an object safely.
 * Returns undefined if any part of the path doesn't exist.
 * @param {Object} obj - The object to get from
 * @param {string[]} path - Array of keys forming the path
 * @param {*} defaultValue - Value to return if path doesn't exist
 * @returns {*} The value at the path, or defaultValue
 * @example
 * getIn({ a: { b: { c: 3 } } }, ['a', 'b', 'c']) // => 3
 * getIn({ a: 1 }, ['x', 'y'], 'default') // => 'default'
 * @pure
 */
function getIn(obj, path, defaultValue = undefined) {
    const result = path.reduce(
        (acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined),
        obj
    );
    return result !== undefined ? result : defaultValue;
}

// ============================================================================
// ARRAY UTILITIES (CURRIED)
// ============================================================================

/**
 * Curried map function for use in pipelines.
 * @param {Function} fn - Mapping function
 * @returns {Function} A function that takes an array and maps it
 * @example
 * pipe([1, 2, 3], map(x => x * 2)) // => [2, 4, 6]
 * @pure
 */
const map = curry((fn, arr) => arr.map(fn));

/**
 * Curried filter function for use in pipelines.
 * @param {Function} predicate - Filter predicate
 * @returns {Function} A function that takes an array and filters it
 * @example
 * pipe([1, 2, 3, 4], filter(x => x > 2)) // => [3, 4]
 * @pure
 */
const filter = curry((predicate, arr) => arr.filter(predicate));

/**
 * Curried reduce function for use in pipelines.
 * @param {Function} reducer - Reducer function (accumulator, current) => newAccumulator
 * @param {*} initial - Initial accumulator value
 * @returns {Function} A function that takes an array and reduces it
 * @example
 * pipe([1, 2, 3], reduce((sum, x) => sum + x, 0)) // => 6
 * @pure
 */
const reduce = curry((reducer, initial, arr) => arr.reduce(reducer, initial));

/**
 * Curried find function for use in pipelines.
 * @param {Function} predicate - Find predicate
 * @returns {Function} A function that takes an array and finds an element
 * @example
 * pipe([1, 2, 3], find(x => x > 1)) // => 2
 * @pure
 */
const find = curry((predicate, arr) => arr.find(predicate));

/**
 * Curried slice function for use in pipelines.
 * @param {number} start - Start index
 * @param {number} end - End index (exclusive)
 * @returns {Function} A function that takes an array and slices it
 * @example
 * pipe([1, 2, 3, 4, 5], slice(1, 4)) // => [2, 3, 4]
 * @pure
 */
const slice = curry((start, end, arr) => arr.slice(start, end));

/**
 * Takes the first n elements from an array.
 * @param {number} n - Number of elements to take
 * @returns {Function} A function that takes an array
 * @example
 * pipe([1, 2, 3, 4, 5], take(3)) // => [1, 2, 3]
 * @pure
 */
const take = curry((n, arr) => arr.slice(0, n));

/**
 * Curried join function for use in pipelines.
 * @param {string} separator - String to join with
 * @returns {Function} A function that takes an array and joins it
 * @example
 * pipe(['a', 'b', 'c'], join('-')) // => 'a-b-c'
 * @pure
 */
const join = curry((separator, arr) => arr.join(separator));

// ============================================================================
// PREDICATE UTILITIES
// ============================================================================

/**
 * Creates a property equality predicate.
 * @param {string} prop - Property name to check
 * @param {*} value - Value to compare against
 * @returns {Function} A predicate function
 * @example
 * const isActive = propEq('status', 'active');
 * [{ status: 'active' }, { status: 'inactive' }].filter(isActive)
 * // => [{ status: 'active' }]
 * @pure
 */
const propEq = curry((prop, value, obj) => obj[prop] === value);

/**
 * Gets a property value from an object.
 * @param {string} prop - Property name
 * @returns {Function} A function that gets the property from an object
 * @example
 * pipe([{ name: 'Alice' }, { name: 'Bob' }], map(prop('name'))) // => ['Alice', 'Bob']
 * @pure
 */
const prop = curry((propName, obj) => obj[propName]);

/**
 * Negates a predicate function.
 * @param {Function} predicate - The predicate to negate
 * @returns {Function} A negated predicate
 * @example
 * const isOdd = x => x % 2 !== 0;
 * const isEven = not(isOdd);
 * @pure
 */
const not = (predicate) => (...args) => !predicate(...args);

// ============================================================================
// IDENTITY & CONSTANT
// ============================================================================

/**
 * Identity function - returns its argument unchanged.
 * @param {*} x - Any value
 * @returns {*} The same value
 * @pure
 */
const identity = x => x;

/**
 * Creates a function that always returns the same value.
 * @param {*} x - The value to always return
 * @returns {Function} A function that always returns x
 * @example
 * const alwaysZero = always(0);
 * [1, 2, 3].map(alwaysZero) // => [0, 0, 0]
 * @pure
 */
const always = x => () => x;
