import type { ChartDb } from "./chartdb/ChartDb";
import { AgeFrame } from "./frames/AgeFrame";
import { BestFrame } from "./frames/BestFrame";

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

function maxIndex(array: number[]) {
    return array.reduce((iMax, x, i) => x > array[iMax]! ? i : iMax, 0);
}

class OngekiRecentFrame<Score extends {points: number, rating: number}, Chart> {
    frame: AgeFrame<Score>;
    numTop: number;
    numMax: number;
    db: ChartDb<Chart>;
    #temporaryRating: number | null;

    constructor(numTop: number, numMax: number, db: ChartDb<Chart>) {
        this.numTop = numTop;
        this.numMax = numMax;
        this.db = db;
        this.#temporaryRating = null;

        this.frame = new AgeFrame();
    }

    addScore(score: Score, chart: Chart) {
        // Don't include LUNATIC songs in recent
        if (this.db.isLunatic(chart)) {
            return;
        }

        // if the frame is not full yet, add the score
        if (this.frame.length < this.numMax) {
            this.frame.push(score);
        }

        // if the score is in the top 10 ratings
        const topScores = this.frame.byRating.slice(0, this.numTop);
        if (score.rating >= topScores[topScores.length-1]!.rating) {
            // kick out the oldest score with lower rating
            let largestAgeWithLowerRating = maxIndex(this.frame.age.slice(this.numTop, this.numMax));
            this.frame.popIndex(largestAgeWithLowerRating);
            // add the current score to the front
            this.frame.push(score);

        // if score is better than the lowest score in the top 10, then skip this score
        } else if (score.points >= Math.min(...topScores.map(s => s.points))) {
            // do nothing
        } else {
            // remove the oldest score
            // add the current score as the newest
            this.frame.popOldest();
            this.frame.push(score);
        }
    }
    
    get totalRating() : number {
        if (this.#temporaryRating !== null) {
            return this.#temporaryRating;
        }
        return this.frame.byRating.slice(0, this.numTop).reduce((sum, x) => sum+x.rating, 0);
    }

    temporaryRating(totalRating: number): void {
        this.#temporaryRating = totalRating;
    }

    popRating(): void {
        this.#temporaryRating = null;
    }
}

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