import { expect, test, describe } from "bun:test";
import { insertionIndexAsc, insertionIndexDesc, xWithBumps } from "../utils";

describe("insertionIndexDesc", () => {
    function run(array: number[], number: number) {
        return insertionIndexDesc(array, number, x => x);
    }

    test("empty", () => {
        expect(run([], 1)).toBe(0);
    });

    test("basic", () => {
        expect(run([7, 5, 3, 1], 8)).toBe(0);
        expect(run([7, 5, 3, 1], 6)).toBe(1);
        expect(run([7, 5, 3, 1], 4)).toBe(2);
        expect(run([7, 5, 3, 1], 2)).toBe(3);
        expect(run([7, 5, 3, 1], 0)).toBe(4);
    });

    test("In a tie, it returns the left-most element.", () => {
        expect(run([1, 1, 1, 1, 1, 1], 1)).toBe(0);
        expect(run([4, 4, 3, 3, 2, 2, 1, 1], 2)).toBe(4);
        expect(run([4, 4, 3, 3, 2, 2, 1, 1], 3)).toBe(2);
    });
});

describe("insertionIndexAsc", () => {
    function run(array: number[], number: number) {
        return insertionIndexAsc(array, number, x => x);
    }

    test("empty", () => {
        expect(run([], 1)).toBe(0);
    });

    test("basic", () => {
        expect(run([1, 3, 5, 7], 0)).toBe(0);
        expect(run([1, 3, 5, 7], 2)).toBe(1);
        expect(run([1, 3, 5, 7], 4)).toBe(2);
        expect(run([1, 3, 5, 7], 6)).toBe(3);
        expect(run([1, 3, 5, 7], 8)).toBe(4);
    });

    test("In a tie, it returns the left-most element.", () => {
        expect(run([1, 1, 1, 1, 1, 1], 1)).toBe(0);
        expect(run([1, 1, 2, 2, 3, 3, 4, 4], 2)).toBe(2);
        expect(run([1, 1, 2, 2, 3, 3, 4, 4], 3)).toBe(4);
    });
});

describe("xWithBumps", () => {
    test("basic", () => {
        let bump = (x: number) => xWithBumps(x, [2, 5, 7]);

        expect(bump(0)).toEqual([0, 0, false]);
        expect(bump(1)).toEqual([1, 0, false]);
        expect(bump(2)).toEqual([2, 0, false]);
        expect(bump(3)).toEqual([2, 1, true]);
        expect(bump(4)).toEqual([3, 1, false]);
        expect(bump(5)).toEqual([4, 1, false]);
        expect(bump(6)).toEqual([5, 1, false]);
        expect(bump(7)).toEqual([5, 2, true]);
        expect(bump(8)).toEqual([6, 2, false]);
        expect(bump(9)).toEqual([7, 2, false]);
        expect(bump(10)).toEqual([7, 3, true]);
        expect(bump(11)).toEqual([8, 3, false]);
        expect(bump(12)).toEqual([9, 3, false]);
    });

    test("duplicates", () => {
        let bump = (x: number) => xWithBumps(x, [2, 2, 4, 5]);

        expect(bump(0)).toEqual([0, 0, false]);
        expect(bump(1)).toEqual([1, 0, false]);
        expect(bump(2)).toEqual([2, 0, false]);
        expect(bump(3)).toEqual([2, 1, true]);
        expect(bump(4)).toEqual([2, 2, true]);
        expect(bump(5)).toEqual([3, 2, false]);
        expect(bump(6)).toEqual([4, 2, false]);
        expect(bump(7)).toEqual([4, 3, true]);
        expect(bump(8)).toEqual([5, 3, false]);
        expect(bump(9)).toEqual([5, 4, true]);
        expect(bump(10)).toEqual([6, 4, false]);
        expect(bump(11)).toEqual([7, 4, false]);
    });

    test("with null", () => {
        let bump = (x: number) => xWithBumps(x, [2, null, null]);

        expect(bump(0)).toEqual([0, 0, false]);
        expect(bump(1)).toEqual([1, 0, false]);
        expect(bump(2)).toEqual([2, 0, false]);
        expect(bump(3)).toEqual([2, 1, true]);
        expect(bump(4)).toEqual([3, 1, false]);
        expect(bump(5)).toEqual([4, 1, false]);
        expect(bump(6)).toEqual([5, 1, false]);
        expect(bump(7)).toEqual([6, 1, false]);
        expect(bump(8)).toEqual([7, 1, false]);
        expect(bump(9)).toEqual([8, 1, false]);
    });
});