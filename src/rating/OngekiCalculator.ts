import type { ChartDb } from "./chartdb/ChartDb";
import type { AgeFrameSnapshot } from "./frames/AgeFrame";
import { BestFrame, UndoScore as BestUndo, type BestFrameSnapshot } from "./frames/BestFrame";
import { OngekiRecentFrame, UndoScore as RecentUndo } from "./frames/OngekiRecentFrame";
import { lerp, type Prettify } from "./utils";

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

type OngekiScore<Score> = 
    Prettify<{ points: number; rating: number; } & 
    (Score extends undefined ? {} : {score: Score})>;

type UndoScore<Chart, Score> = {
    best?: BestUndo<string, OngekiScore<Score>>; 
    new?: BestUndo<string, OngekiScore<Score>>; 
    naive: BestUndo<string, OngekiScore<Score>>;
    recent: RecentUndo<Chart, OngekiScore<Score>>;
};

export type OngekiCalculatorSnapshot<ChartId, Score> = {
    best: BestFrameSnapshot<ChartId, Score>,
    new: BestFrameSnapshot<ChartId, Score>,
    naive: BestFrameSnapshot<ChartId, Score>,
    recent: AgeFrameSnapshot<Score>,
}

export class OngekiCalculator<Chart, Score = undefined> {
    db: ChartDb<Chart>;
    best: BestFrame<string, OngekiScore<Score>>;
    new: BestFrame<string, OngekiScore<Score>>;
    naive: BestFrame<string, OngekiScore<Score>>;
    recent: OngekiRecentFrame<Chart, OngekiScore<Score>>;

    // constructor(db: ChartDb<Chart>);
    // constructor(db: ChartDb<Chart>, extra: Extra);

    // while this works for no extra at all and for simple cases,
    //   - if automatically infers the type of extra which may be wrong
    //   - it doesn't let you specify the type of extra explicitly to fix it
    // so maybe it's better to have people use the create() method...
    // the create() method is also a "Typescript only" construct,
    // I wouldn't need it at all if I was doing this in plain javascript
    // the problem is new OngekiCalculator<Score, ChartType>(db)
    //      it's hard to infer ChartType
    //      if I could find an easy way to do it it might not be that bad
    constructor(db: ChartDb<Chart>, extra?: Score) {
        this.db = db;
        this.best = new BestFrame(30);
        this.new = new BestFrame(15);
        this.naive = new BestFrame(45);
        this.recent = new OngekiRecentFrame(10, 30);
    }

    static create<Extra>() {
        return function <Chart>(db: ChartDb<Chart>) { return new OngekiCalculator<Chart, Extra>(db); };
    }

    makeSnapshot(): OngekiCalculatorSnapshot<string, OngekiScore<Score>> {
        return {
            best: this.best.makeSnapshot(),
            new: this.new.makeSnapshot(),
            naive: this.naive.makeSnapshot(),
            recent: this.recent.makeSnapshot(),
        }
    }

    loadSnapshot(snapshot: OngekiCalculatorSnapshot<string, OngekiScore<Score>>) {
        this.best.loadSnapshot(snapshot.best);
        this.new.loadSnapshot(snapshot.new);
        this.naive.loadSnapshot(snapshot.naive);
        this.recent.loadSnapshot(snapshot.recent);
    }

    addScore(score: {points: number} & (Score extends undefined ? {} : {score: Score}), chart: Chart): UndoScore<Chart, Score> {
        let { internalLevel: level, chartId: id, isNew, isLunatic } = this.db.getChartInfo(chart);

        let rating = scoreRating(score.points, level);
        let entry: OngekiScore<Score> = {
            points: score.points,
            rating,
        };
        if ('score' in score) {
            entry.score = score.score;
        }

        let undo: UndoScore<Chart, Score> = {};
        if (isNew) {
            undo.new = this.new.addScore(entry, id);
        } else {
            undo.best = this.best.addScore(entry, id);
        }
        undo.naive = this.naive.addScore(entry, id);
        undo.recent = this.recent.addScore(entry, {isLunatic});
        return undo;
    }

    undoScore(undo: UndoScore<Chart, Score>) {
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