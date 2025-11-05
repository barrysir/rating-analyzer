import { expect, test } from "bun:test";
import { BestFrame } from "../frames/BestFrame";

test("undo", () => {
    let c = new BestFrame(30);
    let ratings = [];
    let undos = [];
    for (let i=1; i<=50; i++) {
        ratings.push(c.totalRating);
        undos.push(c.addScore({rating: i}, (i % 10).toString()));
    }

    for (let i=undos.length-1; i>=0; i--) {
        c.undoScore(undos[i]!);
        expect(c.totalRating).toBe(ratings[i]!);
    }
});