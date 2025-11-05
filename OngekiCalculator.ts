import type { ChartDb } from "./chartdb/ChartDb";
import { BestFrame, UndoScore as BestUndo } from "./frames/BestFrame";
import { OngekiRecentFrame, UndoScore as RecentUndo } from "./frames/OngekiRecentFrame";
import { lerp } from "./utils";

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

type UndoScore<Chart> = {
    best?: BestUndo<string, OngekiScore>; 
    new?: BestUndo<string, OngekiScore>; 
    naive: BestUndo<string, OngekiScore>;
    recent: RecentUndo<Chart, OngekiScore>;
};

export class OngekiCalculator<Chart> {
    db: ChartDb<Chart>;
    best: BestFrame<string, OngekiScore>;
    new: BestFrame<string, OngekiScore>;
    naive: BestFrame<string, OngekiScore>;
    recent: OngekiRecentFrame<Chart, OngekiScore>;

    constructor(db: ChartDb<Chart>) {
        this.db = db;
        this.best = new BestFrame(30);
        this.new = new BestFrame(15);
        this.naive = new BestFrame(45);
        this.recent = new OngekiRecentFrame(10, 30, db);
    }

    addScore(points: number, chart: Chart): UndoScore<Chart> {
        let level = this.db.getInternalLevel(chart);
        let id = this.db.getChartId(chart);

        let undo: UndoScore<Chart> = {};

        let rating = scoreRating(points, level);
        let score = {points, rating};

        if (this.db.isNew(chart)) {
            undo.new = this.new.addScore(score, id);
        } else {
            undo.best = this.best.addScore(score, id);
        }
        undo.naive = this.naive.addScore(score, id);
        undo.recent = this.recent.addScore(score, chart);
        return undo;
    }

    undoScore(undo: UndoScore<Chart>) {
        if ('new' in undo) { this.new.undoScore(undo.new!); }
        if ('best' in undo) { this.best.undoScore(undo.best!); }
        this.naive.undoScore(undo.naive);
        this.recent.undoScore(undo.recent);
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