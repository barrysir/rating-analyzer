import { expect, test } from "bun:test";
import { barrageScores, makeChart, makeFixture, makeFixtureWithExtra } from "./fixture";


// simple adding score
// overwriting score with better, worse, same score
test("single score", () => {
    let {ongeki} = makeFixture();

    // score should go into best + recent
    ongeki.addScore({points: 1000000}, makeChart({id: "1", level: 12}));
    expect(ongeki.overallRating).toBeCloseTo(2 * (12 + 1.5) / 55);
    expect(ongeki.overallNaiveRating).toBeCloseTo((12 + 1.5) / 45);
    expect(ongeki.overallNoRecentRating).toBeCloseTo((12 + 1.5) / 45);
});

test("scores go into best and new", () => {
    let {ongeki} = makeFixture();

    // score should go into best + recent
    ongeki.addScore({points: 1000000}, makeChart({id: "1", level: 12}));
    expect(ongeki.overallRating).toBeCloseTo(2 * (12 + 1.5) / 55);
    expect(ongeki.overallNaiveRating).toBeCloseTo((12 + 1.5) / 45);
    expect(ongeki.overallNoRecentRating).toBeCloseTo((12 + 1.5) / 45);

    // score should go into new + recent
    ongeki.addScore({points: 1000000}, makeChart({id: "2", level: 12, isNew: true}));
    expect(ongeki.overallRating).toBeCloseTo(4 * (12 + 1.5) / 55);
    expect(ongeki.overallNaiveRating).toBeCloseTo(2 * (12 + 1.5) / 45);
    expect(ongeki.overallNoRecentRating).toBeCloseTo(2 * (12 + 1.5) / 45);
});

test("overwriting a score", () => {
    let {ongeki} = makeFixture();

    let SSS = 12 + 1.5;
    let SS = 12 + 1;
    let SSSP = 12 + 2;

    // score should go into best + recent
    ongeki.addScore({points: 1000000}, makeChart({id: "1", level: 12}));
    expect(ongeki.overallRating).toBeCloseTo((SSS + SSS) / 55);
    expect(ongeki.overallNaiveRating).toBeCloseTo(SSS / 45);
    expect(ongeki.overallNoRecentRating).toBeCloseTo(SSS / 45);

    // add worse score, should only go into recent
    ongeki.addScore({points: 990000}, makeChart({id: "1", level: 12}));
    expect(ongeki.overallRating).toBeCloseTo((SSS + SSS + SS) / 55);
    expect(ongeki.overallNaiveRating).toBeCloseTo(SSS / 45);
    expect(ongeki.overallNoRecentRating).toBeCloseTo(SSS / 45);
    
    // add better score, should go into best + recent
    ongeki.addScore({points: 1007500}, makeChart({id: "1", level: 12}));
    expect(ongeki.overallRating).toBeCloseTo((SSSP + SSS + SS + SSSP) / 55);
    expect(ongeki.overallNaiveRating).toBeCloseTo(SSSP / 45);
    expect(ongeki.overallNoRecentRating).toBeCloseTo(SSSP / 45);
});

test("filling frame", () => {
    let {ongeki} = makeFixture();

    // fill best frame with the same score
    let SAMPLE = 12 + 1.5;
    for (let i=1; i<=30; i++) {
        ongeki.addScore({points: 1000000}, makeChart({id: i.toString(), level: 12}));
        expect(ongeki.overallRating).toBeCloseTo((i * SAMPLE + Math.min(i, 10) * SAMPLE) / 55);
        expect(ongeki.overallNaiveRating).toBeCloseTo(i * SAMPLE / 45);
        expect(ongeki.overallNoRecentRating).toBeCloseTo(i * SAMPLE / 45);
    }

    // continue to add scores to fill naive frame
    let previous = {
        overallRating: ongeki.overallRating,
        overallNoRecentRating: ongeki.overallNoRecentRating,
    };

    for (let i=31; i<=45; i++) {
        ongeki.addScore({points: 1000000}, makeChart({id: i.toString(), level: 12}));
        expect(ongeki.overallRating).toBeCloseTo(previous.overallRating);
        expect(ongeki.overallNaiveRating).toBeCloseTo(i * SAMPLE / 45);
        expect(ongeki.overallNoRecentRating).toBeCloseTo(previous.overallNoRecentRating);
    }

    // add the same score, shouldn't change rating
    previous = {
        overallRating: ongeki.overallRating,
        overallNaiveRating: ongeki.overallNaiveRating,
        overallNoRecentRating: ongeki.overallNoRecentRating,
    };

    for (let i=46; i<=50; i++) {
        ongeki.addScore({points: 1000000}, makeChart({id: i.toString(), level: 12}));
        expect(ongeki.overallRating).toBeCloseTo(previous.overallRating);
        expect(ongeki.overallNaiveRating).toBeCloseTo(previous.overallNaiveRating);
        expect(ongeki.overallNoRecentRating).toBeCloseTo(previous.overallNoRecentRating);
    }

    // add a better score, should increase rating
    let BETTER = 12.5 + 1.5;
    ongeki.addScore({points: 1000000}, makeChart({id: "100", level: 12.5}));
    expect(ongeki.overallRating).toBeCloseTo((29 * SAMPLE + 1 * BETTER + 9 * SAMPLE + 1 * BETTER) / 55);
    expect(ongeki.overallNaiveRating).toBeCloseTo((44 * SAMPLE + 1 * BETTER) / 45);
    expect(ongeki.overallNoRecentRating).toBeCloseTo((29 * SAMPLE + 1 * BETTER) / 45);
});

test("barrage", () => {
    // get a bunch of random scores, throw it at the calculator and see if it works
    let {ongeki} = makeFixture();
    let ratings = [];
    for (let [points, chart] of barrageScores) {
        ongeki.addScore({points}, makeChart(chart));
        ratings.push(Math.round(ongeki.overallRating * 100) / 100);
    }
    expect(ratings).toMatchSnapshot();
});

function randint(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

test("undo", () => {
    // put a bunch of random scores into the calculator and save their undo states, 
    // then reverse and make sure the ratings match the same value
    let {ongeki} = makeFixture();
    let undos = [];
    let ratings = [];
    for (let [points, chart] of barrageScores) {
        ratings.push(ongeki.overallRating);
        undos.push(ongeki.addScore({points}, makeChart(chart)));
    }

    for (let i=undos.length-1; i>=0; i--) {
        let rating = ratings[i]!;
        ongeki.undoScore(undos[i]!);
        expect(Math.abs(ongeki.overallRating - rating)).toBeLessThanOrEqual(0.01);
    }
});

test("snapshot", () => {
    let {ongeki} = makeFixture();
    let ratings = [];
    let snapshot;
    for (let i=0; i<barrageScores.length; i++) {
        let [points, chart] = barrageScores[i]!;
        if (i == 20) {
            snapshot = ongeki.makeSnapshot();
        }

        ongeki.addScore({points}, makeChart(chart));
        ratings.push(ongeki.overallRating);
    }

    // load the snapshot twice -- if the snapshot memory wasn't copied properly,
    // the snapshot itself could be mutated by the calculations
    // loading it again should cause an error if the snapshot was mutated
    for (let s=0; s<2; s++) {
        ongeki.loadSnapshot(snapshot);
        for (let i=20; i<barrageScores.length; i++) {
            let [points, chart] = barrageScores[i]!;

            ongeki.addScore({points}, makeChart(chart));
            expect(ongeki.overallRating).toBe(ratings[i]!);
        }
    }
});

test("storing additional score information", () => {
    let {ongeki} = makeFixtureWithExtra();

    ongeki.addScore({points: 1000000, score: 'foo'}, makeChart({id: "1", level: 12}));
    ongeki.addScore({points: 990000, score: 'bar'}, makeChart({id: "2", level: 12}));

    expect(ongeki.best.frame[0]!.score.score).toBe('foo');
    expect(ongeki.best.frame[1]!.score.score).toBe('bar');
});