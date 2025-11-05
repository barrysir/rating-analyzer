import { expect, test } from "bun:test";
import { barrageScores, makeChart, makeFixture } from "./fixture";
import { RatingHistory } from "../RatingHistory";

function randint(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


test("random seeking", () => {
    let ratings = [];
    {
        let {ongeki} = makeFixture();
        for (let [score,chart] of barrageScores) {
            ratings.push(ongeki.overallRating);
            ongeki.addScore(score, makeChart(chart));
        }
        ratings.push(ongeki.overallRating);
    }
    
    let {ongeki} = makeFixture();
    let a = barrageScores.map(([s,c]) => [s, makeChart(c)]);
    let history = new RatingHistory(ongeki, a);

    // console.log(JSON.stringify(ongeki.best.getFrame()));
    // function b() {
    //     console.log(ongeki.best.frame, [...ongeki.best.chartsInFrame.keys()], ongeki.best.totalRating);
    // }   
    // history.seek(-30);
    // history.seek(-1);
    // b();
    // history.seek(-1);
    // b();
    // history.seek(1);
    // b();
    // history.seek(1);
    // b();

    // random indexes
    let testIndexes = [];
    for (let i=0; i<10; i++) {
        testIndexes.push(randint(0, barrageScores.length-1));
    }

    for (let index of testIndexes) {
        history.goto(index);
        expect(ongeki.overallRating).toBeCloseTo(ratings[index]!);
    }
});