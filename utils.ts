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

export function findRegion<T>(arr: T[], val: number, key: (a: T) => number): number | null {
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
    let index = findRegion(pointsLampArray, points, x => x[0]);
    if (index === null) {
        throw new Error(`Could not identify grade lamp for point value ${points}`);
    }
    return pointsLampArray[index]![1];
}

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};