import { expect, test } from "bun:test";
import { BestFrame } from "../frames/BestFrame";
import { OngekiRecentFrame } from "../frames/OngekiRecentFrame";

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

test("snapshot", () => {
    let c = new BestFrame(30);
    let ratings = [];

    let scores = [];
    for (let i=1; i<=50; i++) {
        scores.push({
            score: {rating: i},
            chart: (i % 10).toString()
        });
    }

    let snapshot;
    for (let i=0; i<scores.length; i++) {
        let {score,chart} = scores[i]!;
        if (i == 10) {
            snapshot = c.makeSnapshot();   
        }
        c.addScore(score, chart);
        ratings.push(c.totalRating);
    }

    // load the snapshot twice -- if the snapshot memory wasn't copied properly,
    // the snapshot itself could be mutated by the calculations
    // loading it again should cause an error if the snapshot was mutated
    for (let s=0; s<2; s++) {
        c.loadSnapshot(snapshot);
        for (let i=10; i<scores.length; i++) {
            let {score,chart} = scores[i]!;
            c.addScore(score, chart);
            expect(c.totalRating).toBe(ratings[i]!);
        }
    }
});