import { expect, test, describe } from "bun:test";
import { insertionIndexAsc, insertionIndexDesc } from "../utils";

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