import { GradeLamp } from "./data-types";

/** Returns the proper insertion index in an ascending sorted array. In a tie, it returns the left-most element. */
export function insertionIndexAsc<T>(array: T[], score: T, key: (value: T) => number): number {
    let low = 0;
    let high = array.length;

    while (low < high) {
        var mid = (low + high) >>> 1;
        if (key(array[mid]!) < key(score)) low = mid + 1;
        else high = mid;
    }
    return low;
}

/** Returns the proper insertion index in a descending sorted array. In a tie, it returns the left-most element. */
export function insertionIndexDesc<T>(array: T[], score: T, key: (value: T) => number): number {
    let low = 0;
    let high = array.length;

    while (low < high) {
        var mid = (low + high) >>> 1;
        if (key(array[mid]!) > key(score)) low = mid + 1;
        else high = mid;
    }
    return low;
}

/**
 * Given a list of "regions" [arr[0], arr[1]), [arr[1], arr[2]), ...,
 * find the index of the region which val should fall into.
 * 
 * The array is assumed to be sorted in ascending order by `key(a)`.
 *
 * Examples (keys shown):
 *   keys: [10, 20, 30]
 *   val = 5   -> null
 *   val = 10  -> 0
 *   val = 15  -> 0
 *   val = 25  -> 1
 *   val = 35  -> 2
 */
export function indexRegion<T>(arr: T[], val: number, key: (a: T) => number): number | null {
    function myInsert(element: number, array: T[]): number {
        if (array.length === 0)
            return 0;
    
        let start = 0;
        let end = array.length;
    
        while (true) {
            const pivot = (start + end) >> 1;  // should be faster than dividing by 2
            const c = element - key(array[pivot]!);
            if (end - start <= 1) return c < 0 ? pivot : pivot+1;
            
            if (c < 0) {
                end = pivot;
            } else if (c > 0) {
                start = pivot;
            } else {
                return pivot+1;
            }
        }
    }

    let pivot = myInsert(val, arr);
    return (pivot != 0) ? pivot-1 : null;
}

/**
 * Given a list of "regions" [arr[0], arr[1]), [arr[1], arr[2]), ...,
 * return the region object which val should fall into.
 * 
 * The array is assumed to be sorted in ascending order by `key(a)`.
 */
export function getRegion<T>(arr: T[], val: number, key: (a: T) => number): T | null {
    let index = indexRegion(arr, val, key);
    if (index === null) {
        return null;
    }
    return arr[index]!;
}

export function minIndex(array: number[]) {
    return array.reduce((iMax, x, i) => x < array[iMax]! ? i : iMax, 0);
}

export function lerp(x: number, points: [number, number][]) {
    // above the lerp range - return the highest point
    if (x >= points[0]![0]) {
        return points[0]![1];
    }

    for (let i = 1; i < points.length; i++) {
        let upper = points[i - 1]!;
        let lower = points[i]!;
        if (x >= lower[0]) {
            return lower[1] + (x - lower[0]) * (upper[1] - lower[1]) / (upper[0] - lower[0]);
        }

    }

    // below the lerp range - return the lowest point
    return points[points.length - 1]![1];
}

let pointsLampArray: [number, GradeLamp][] = [
    [0, GradeLamp.NONE],
    [970000, GradeLamp.S],
    [990000, GradeLamp.SS],
    [1000000, GradeLamp.SSS],
    [1007500, GradeLamp.SSS_PLUS],
];

export function pointsToGradeLamp(points: number): GradeLamp {
    let index = indexRegion(pointsLampArray, points, x => x[0]);
    if (index === null) {
        throw new Error(`Could not identify grade lamp for point value ${points}`);
    }
    return pointsLampArray[index]![1];
}

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

declare const id: unique symbol
export type UniqueType<A extends any, Id extends string | number | symbol> = {
    [id]: Id
} & A;

/**
 * Function which models this behaviour, converting "eventIndex" into ["scoreIndex", "versionIndex"]
 * 
 *                  eventIndex  scoreIndex  versionIndex
 * score 310        310         310         0
 * score 311        311         311         0
 * version change   312         311         1
 * score 312        313         312         1
 * score 313        314         313         1
 * version change   315         313         2
 * version change   316         313         3
 * score 314        317         314         3
 * 
 * This can be modeled as a function which counts up with "bumps" at certain score indexes [311, 313, 313]
 * where the score count stops for 1 unit and increments the version count instead
 */
export function xWithBumps(x: number, bumps: (number | null)[]): [number, number, boolean] {
    let bumpsBeforeX = bumps.findIndex((b, i) => b == null || (x - i) <= b);
    if (bumpsBeforeX == -1) {
        bumpsBeforeX = bumps.length;
    }

    let adjustedX = x - bumpsBeforeX;
    let justBumped: boolean;
    if (bumpsBeforeX < 1) {
        justBumped = false;
    } else {
        let previousBump = bumps[bumpsBeforeX - 1];
        justBumped = (adjustedX == previousBump);
    }
    return [adjustedX, bumpsBeforeX, justBumped];
}

/**
 * Returns whether obj is an empty object
 */
export function objectIsEmpty(obj: object): boolean {
    return Object.keys(obj).length == 0;
}

/**
 * Insert key with a value of default if key is not in the map.
   Return the value for key if key is in the map, else default.

   For objects, use obj.key ??= value.
 */
export function mapEmplace<K,V>(map: Map<K,V>, key: K, defaultValue: V): V {
    if (map.has(key)) {
        return map.get(key)!;
    } else {
        map.set(key, defaultValue);
        return defaultValue;
    }
}
export function dateToUnix(date: Date): number {
  return Math.floor(date.getTime());
}
