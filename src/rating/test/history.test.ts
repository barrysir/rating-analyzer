import { expect, test } from "bun:test";
import { barrageScores, makeChart, makeFixture } from "./fixture";
import { RatingHistory } from "../RatingHistory";

function makeHistory(scores) {
    let {ongeki} = makeFixture();
    // todo: turn the scores that are passed into RatingHistory into an argument to this function
    let a = scores.map(([s,c]) => [{points: s}, makeChart(c)]);
    let history = new RatingHistory(ongeki, a);
    return {ongeki, history};
}

test("initialize", () => {
    let {history} = makeHistory(barrageScores);

    // Freshly initialized history should be at index 0
    // (in past versions, history would process the whole score array at initialization and leave the current index at the end)
    expect(history.currentIndex).toBe(0);
});

test("random seeking", () => {
    let ratings = [];
    {
        let {ongeki} = makeFixture();
        for (let [score,chart] of barrageScores) {
            ongeki.addScore({points: score}, makeChart(chart));
            ratings.push(ongeki.overallRating);
        }
    }

    let {ongeki, history} = makeHistory(barrageScores);

    // random indexes
    let testIndexes = [ 10, 28, 57, 28, 10, 60, 71, 16, 13, 34 ];
    for (let index of testIndexes) {
        history.goto(index);
        expect(ongeki.overallRating).toBeCloseTo(ratings[index]!);
    }
});

test("code sample - iterate over every score", () => {
    // Whether this code works doesn't really matter (the functionality is tested by other tests),
    // just make sure that this code doesn't error
    let {history} = makeHistory(barrageScores);
    let ratings = [];
    for (let i=0; i<history.length; i++) {
        let [score, chart] = history.scores[i]!;
        ratings.push(history.calc.overallRating);
        if (i != history.length-1) {
            history.seek(1);
        }
    }
});