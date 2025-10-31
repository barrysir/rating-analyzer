import type { ChartDb } from "./chartdb/ChartDb";
import { BestFrame } from "./frames/BestFrame";
import { OngekiRecentFrame } from "./frames/OngekiRecentFrame";

// -----------------------------------------
function lerp(x: number, points: [number, number][]) {
    // above the lerp range - return the highest point
    if (x >= points[0]![0]) {
        return points[0]![1]; 
    }

    for (let i=1; i<points.length; i++) {
        let upper = points[i-1]!;
        let lower = points[i]!;
        if (x >= lower[0]) {
            return lower[1] + (x - lower[0]) * (upper[1] - lower[1])/(upper[0] - lower[0])
        }

    }

    // below the lerp range - return the lowest point
    return points[points.length-1]![1];
}

const technicalBonusLerp: [number, number][] = [
    [1007500, 2],
    [1000000, 1.5],
    [ 990000, 1.0],
    [ 970000, 0],
    [ 900000, -4],
    [ 800000, -6],
];

function ratingTrunc(num: number) {
    return Math.floor(num * 100) / 100;
}

function technicalBonus(points: number) {
    return lerp(points, technicalBonusLerp);
}

function scoreRating(points: number, level: number) {
    if (points >= 800000) {
        return Math.max(0, level + ratingTrunc(technicalBonus(points)));
    }
    return Math.max(0, ratingTrunc((level - 6) * (points - 500000) / 300000));
}

// --------------------------------------

type OngekiScore = { points: number; rating: number; };

export class OngekiCalculator<Chart> {
    db: ChartDb<Chart>;
    best: BestFrame<string, OngekiScore>;
    new: BestFrame<string, OngekiScore>;
    naive: BestFrame<string, OngekiScore>;
    recent: OngekiRecentFrame<OngekiScore, Chart>;

    constructor(db: ChartDb<Chart>) {
        this.db = db;
        this.best = new BestFrame(30);
        this.new = new BestFrame(15);
        this.naive = new BestFrame(45);
        this.recent = new OngekiRecentFrame(10, 30, db);
    }

    addScore(points: number, chart: Chart) {
        let level = this.db.getInternalLevel(chart);
        let id = this.db.getChartId(chart);

        let rating = scoreRating(points, level);
        let score = {points, rating};

        if (this.db.isNew(chart)) {
            this.new.addScore(score, id);
        } else {
            this.best.addScore(score, id);
        }
        this.naive.addScore(score, id);
        this.recent.addScore(score, chart);
    }

    get overallRating() {
        return (
            this.best.totalRating
            + this.new.totalRating
            + this.recent.totalRating
        ) / (30 + 15 + 10);
    }

    get overallNoRecentRating() {
        return (
            this.best.totalRating
            + this.new.totalRating
        ) / (30 + 15);
    }

    get overallNaiveRating() {
        return (
            this.naive.totalRating
        ) / 45;
    }
}