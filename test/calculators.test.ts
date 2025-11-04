import { expect, test } from "bun:test";
import { BasicChartDb, type BasicChart } from "../chartdb/BasicChartDb";
import { OngekiCalculator } from "../OngekiCalculator";

function makeDb(): BasicChartDb {
    return new BasicChartDb();
}

function makeChart(options: {
    id: string;
    level: number;
    maxPlatinumScore?: number;
    bells?: number;
    isLunatic?: boolean;
    isNew?: boolean;
}): BasicChart {
    let defaults = {maxPlatinumScore: 100, bells: 100, isLunatic: false, isNew: false};
    return {...defaults, ...options};
}

function makeFixture() {
    let songdb = makeDb();
    let ongeki = new OngekiCalculator(songdb);
    return {songdb, ongeki};
}

// simple adding score
// overwriting score with better, worse, same score
test("single score", () => {
    let {ongeki} = makeFixture();

    // score should go into best + recent
    ongeki.addScore(1000000, makeChart({id: "1", level: 12}));
    expect(ongeki.overallRating).toBeCloseTo(2 * (12 + 1.5) / 55);
    expect(ongeki.overallNaiveRating).toBeCloseTo((12 + 1.5) / 45);
    expect(ongeki.overallNoRecentRating).toBeCloseTo((12 + 1.5) / 45);
});

test("scores go into best and new", () => {
    let {ongeki} = makeFixture();

    // score should go into best + recent
    ongeki.addScore(1000000, makeChart({id: "1", level: 12}));
    expect(ongeki.overallRating).toBeCloseTo(2 * (12 + 1.5) / 55);
    expect(ongeki.overallNaiveRating).toBeCloseTo((12 + 1.5) / 45);
    expect(ongeki.overallNoRecentRating).toBeCloseTo((12 + 1.5) / 45);

    // score should go into new + recent
    ongeki.addScore(1000000, makeChart({id: "2", level: 12, isNew: true}));
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
    ongeki.addScore(1000000, makeChart({id: "1", level: 12}));
    expect(ongeki.overallRating).toBeCloseTo((SSS + SSS) / 55);
    expect(ongeki.overallNaiveRating).toBeCloseTo(SSS / 45);
    expect(ongeki.overallNoRecentRating).toBeCloseTo(SSS / 45);

    // add worse score, should only go into recent
    ongeki.addScore(990000, makeChart({id: "1", level: 12}));
    expect(ongeki.overallRating).toBeCloseTo((SSS + SSS + SS) / 55);
    expect(ongeki.overallNaiveRating).toBeCloseTo(SSS / 45);
    expect(ongeki.overallNoRecentRating).toBeCloseTo(SSS / 45);
    
    // add better score, should go into best + recent
    ongeki.addScore(1007500, makeChart({id: "1", level: 12}));
    expect(ongeki.overallRating).toBeCloseTo((SSSP + SSS + SS + SSSP) / 55);
    expect(ongeki.overallNaiveRating).toBeCloseTo(SSSP / 45);
    expect(ongeki.overallNoRecentRating).toBeCloseTo(SSSP / 45);
});

test("filling frame", () => {
    let {ongeki} = makeFixture();

    // fill best frame with the same score
    let SAMPLE = 12 + 1.5;
    for (let i=1; i<=30; i++) {
        ongeki.addScore(1000000, makeChart({id: i.toString(), level: 12}));
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
        ongeki.addScore(1000000, makeChart({id: i.toString(), level: 12}));
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
        ongeki.addScore(1000000, makeChart({id: i.toString(), level: 12}));
        expect(ongeki.overallRating).toBeCloseTo(previous.overallRating);
        expect(ongeki.overallNaiveRating).toBeCloseTo(previous.overallNaiveRating);
        expect(ongeki.overallNoRecentRating).toBeCloseTo(previous.overallNoRecentRating);
    }

    // add a better score, should increase rating
    let BETTER = 12.5 + 1.5;
    ongeki.addScore(1000000, makeChart({id: "100", level: 12.5}));
    expect(ongeki.overallRating).toBeCloseTo((29 * SAMPLE + 1 * BETTER + 9 * SAMPLE + 1 * BETTER) / 55);
    expect(ongeki.overallNaiveRating).toBeCloseTo((44 * SAMPLE + 1 * BETTER) / 45);
    expect(ongeki.overallNoRecentRating).toBeCloseTo((29 * SAMPLE + 1 * BETTER) / 45);
});

const barrageScores = [
    [991499, {"id": "20", "level": 12.8, "isNew": false}],
    [981717, {"id": "37", "level": 12.4, "isNew": true}],
    [984233, {"id": "26", "level": 14.0, "isNew": false}],
    [1005465, {"id": "18", "level": 12.4, "isNew": false}],
    [991794, {"id": "48", "level": 14.6, "isNew": true}],
    [1004171, {"id": "14", "level": 14.8, "isNew": false}],
    [920835, {"id": "28", "level": 14.4, "isNew": false}],
    [995137, {"id": "6", "level": 13.2, "isNew": false}],
    [990777, {"id": "33", "level": 12.2, "isNew": false}],
    [1003215, {"id": "22", "level": 13.2, "isNew": false}],
    [974052, {"id": "21", "level": 13.0, "isNew": false}],
    [1008497, {"id": "19", "level": 12.6, "isNew": false}],
    [990992, {"id": "15", "level": 15.0, "isNew": false}],
    [985108, {"id": "17", "level": 12.2, "isNew": false}],
    [906402, {"id": "40", "level": 13.0, "isNew": true}],
    [991806, {"id": "10", "level": 14.0, "isNew": false}],
    [997359, {"id": "11", "level": 14.2, "isNew": false}],
    [991477, {"id": "37", "level": 12.4, "isNew": true}],
    [1009202, {"id": "23", "level": 13.4, "isNew": false}],
    [915271, {"id": "39", "level": 12.8, "isNew": true}],
    [1000018, {"id": "42", "level": 13.4, "isNew": true}],
    [919322, {"id": "7", "level": 13.4, "isNew": false}],
    [1002352, {"id": "39", "level": 12.8, "isNew": true}],
    [998941, {"id": "34", "level": 12.4, "isNew": false}],
    [1007014, {"id": "35", "level": 12.0, "isNew": true}],
    [1009328, {"id": "19", "level": 12.6, "isNew": false}],
    [1006879, {"id": "41", "level": 13.2, "isNew": true}],
    [1009137, {"id": "33", "level": 12.2, "isNew": false}],
    [992935, {"id": "9", "level": 13.8, "isNew": false}],
    [985795, {"id": "25", "level": 13.8, "isNew": false}],
    [987632, {"id": "6", "level": 13.2, "isNew": false}],
    [994237, {"id": "38", "level": 12.6, "isNew": true}],
    [1003202, {"id": "47", "level": 14.4, "isNew": true}],
    [1004265, {"id": "47", "level": 14.4, "isNew": true}],
    [992891, {"id": "4", "level": 12.8, "isNew": false}],
    [973679, {"id": "1", "level": 12.2, "isNew": false}],
    [987712, {"id": "8", "level": 13.6, "isNew": false}],
    [1006338, {"id": "31", "level": 15.0, "isNew": false}],
    [1008791, {"id": "44", "level": 13.8, "isNew": true}],
    [960193, {"id": "2", "level": 12.4, "isNew": false}],
    [1007225, {"id": "48", "level": 14.6, "isNew": true}],
    [915681, {"id": "25", "level": 13.8, "isNew": false}],
    [1003652, {"id": "49", "level": 14.8, "isNew": true}],
    [1006475, {"id": "42", "level": 13.4, "isNew": true}],
    [1007556, {"id": "29", "level": 14.6, "isNew": false}],
    [1007781, {"id": "43", "level": 13.6, "isNew": true}],
    [998468, {"id": "45", "level": 14.0, "isNew": true}],
    [996782, {"id": "4", "level": 12.8, "isNew": false}],
    [997836, {"id": "30", "level": 14.8, "isNew": false}],
    [975494, {"id": "46", "level": 14.2, "isNew": true}],
    [1008853, {"id": "43", "level": 13.6, "isNew": true}],
    [982204, {"id": "24", "level": 13.6, "isNew": false}],
    [1001384, {"id": "16", "level": 12.0, "isNew": false}],
    [969696, {"id": "45", "level": 14.0, "isNew": true}],
    [989334, {"id": "27", "level": 14.2, "isNew": false}],
    [982146, {"id": "32", "level": 12.0, "isNew": false}],
    [999276, {"id": "35", "level": 12.0, "isNew": true}],
    [1009331, {"id": "26", "level": 14.0, "isNew": false}],
    [1007589, {"id": "28", "level": 14.4, "isNew": false}],
    [993164, {"id": "13", "level": 14.6, "isNew": false}],
    [1004077, {"id": "29", "level": 14.6, "isNew": false}],
    [936180, {"id": "46", "level": 14.2, "isNew": true}],
    [1006542, {"id": "41", "level": 13.2, "isNew": true}],
    [999963, {"id": "36", "level": 12.2, "isNew": true}],
    [1003880, {"id": "44", "level": 13.8, "isNew": true}],
    [1002332, {"id": "1", "level": 12.2, "isNew": false}],
    [1008189, {"id": "30", "level": 14.8, "isNew": false}],
    [989393, {"id": "32", "level": 12.0, "isNew": false}],
    [975136, {"id": "12", "level": 14.4, "isNew": false}],
    [997821, {"id": "3", "level": 12.6, "isNew": false}],
    [1008946, {"id": "2", "level": 12.4, "isNew": false}],
    [983309, {"id": "16", "level": 12.0, "isNew": false}],
    [1008351, {"id": "36", "level": 12.2, "isNew": true}],
    [1001512, {"id": "5", "level": 13.0, "isNew": false}],
    [1008175, {"id": "13", "level": 14.6, "isNew": false}],
    [925060, {"id": "0", "level": 12.0, "isNew": false}],
    [1006848, {"id": "27", "level": 14.2, "isNew": false}],
    [1009611, {"id": "38", "level": 12.6, "isNew": true}],
    [994539, {"id": "49", "level": 14.8, "isNew": true}],
    [946754, {"id": "40", "level": 13.0, "isNew": true}],
] as const;

test("barrage", () => {
    // get a bunch of random scores, throw it at the calculator and see if it works
    let {ongeki} = makeFixture();
    let ratings = [];
    for (let [points, chart] of barrageScores) {
        ongeki.addScore(points, makeChart(chart));
        ratings.push(Math.round(ongeki.overallRating * 100) / 100);
    }
    expect(ratings).toMatchSnapshot();
});

test("undo", () => {
    // put a bunch of random scores into the calculator and save their undo states, 
    // then reverse and make sure the ratings match the same value
    let {ongeki} = makeFixture();
    let undos = [];
    let ratings = [];
    for (let [points, chart] of barrageScores) {
        ratings.push(ongeki.overallRating);
        undos.push(ongeki.addScore(points, makeChart(chart)));
    }

    for (let i=undos.length-1; i>=0; i--) {
        let rating = ratings[i]!;
        ongeki.undoScore(undos[i]!);
        expect(Math.abs(ongeki.overallRating - rating)).toBeLessThanOrEqual(0.01);
    }
});