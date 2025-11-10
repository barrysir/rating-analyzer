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
            ongeki.addScore({points: score}, makeChart(chart));
        }
        ratings.push(ongeki.overallRating);
    }
    
    let {ongeki} = makeFixture();
    let a = barrageScores.map(([s,c]) => [{points: s}, makeChart(c)]);
    let history = new RatingHistory(ongeki, a);

    // random indexes
    let testIndexes = [ 10, 28, 57, 28, 10, 60, 71, 16, 13, 34 ];
    // for (let i=0; i<10; i++) {
    //     testIndexes.push(randint(0, barrageScores.length-1));
    // }

    for (let index of testIndexes) {
        history.goto(index);
        expect(ongeki.overallRating).toBeCloseTo(ratings[index]!);
    }
});