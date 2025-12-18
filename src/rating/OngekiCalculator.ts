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

function scoreRating(points: number, level: number): {rating: number, info: RatingAlgo} {
    if (points >= 800000) {
        let techBonus = ratingTrunc(technicalBonus(points));
        let rating = Math.max(0, level + techBonus);
        return {
            rating: rating,
            info: {
                level: level,
                techBonus: [techBonus, rating],
            }
        };
    }
    let multiplier = Math.max(0, (points - 500000) / 300000);
    let value1 = Math.max(0, (level - 6));
    let value2 = value1 * multiplier;
    return {
        rating: ratingTrunc(value2),
        info: {
            level: level,
            techBonus: [-6, value1],
            multiplier: [multiplier, value2],
        }
    };
}

// --------------------------------------

export type RatingAlgo = {
    level: number,
    techBonus: [number, number],
    multiplier?: [number, number],
};

type WithExtra<Extra, T> = T & (Extra extends undefined ? {} : {extra: Extra});

type OngekiScore<Extra> = WithExtra<Extra, { points: number; rating: number; }>;

type UndoScore<Extra> = {
    rating: number;
    algo: RatingAlgo;
    undo: InnerUndoScore<Extra>;
};

type InnerUndoScore<Extra> = {
    best?: BestUndo<string, OngekiScore<Extra>>; 
    new?: BestUndo<string, OngekiScore<Extra>>; 
    naive: BestUndo<string, OngekiScore<Extra>>;
    recent: RecentUndo<OngekiScore<Extra>>;
};

export type OngekiCalculatorSnapshot<ChartId, Extra> = {
    best: BestFrameSnapshot<ChartId, Extra>,
    new: BestFrameSnapshot<ChartId, Extra>,
    naive: BestFrameSnapshot<ChartId, Extra>,
    recent: AgeFrameSnapshot<Extra>,
}

export class OngekiCalculator<Chart, Extra = undefined> {
    db: ChartDb<Chart>;
    best: BestFrame<string, OngekiScore<Extra>>;
    new: BestFrame<string, OngekiScore<Extra>>;
    naive: BestFrame<string, OngekiScore<Extra>>;
    recent: OngekiRecentFrame<OngekiScore<Extra>>;

    constructor(db: ChartDb<Chart>) {
        this.db = db;
        this.best = new BestFrame(30);
        this.new = new BestFrame(15);
        this.naive = new BestFrame(45);
        this.recent = new OngekiRecentFrame(10, 30);
    }

    static create<Extra>() {
        return function <Chart>(db: ChartDb<Chart>) { return new OngekiCalculator<Chart, Extra>(db); };
    }

    makeSnapshot(): OngekiCalculatorSnapshot<string, OngekiScore<Extra>> {
        return {
            best: this.best.makeSnapshot(),
            new: this.new.makeSnapshot(),
            naive: this.naive.makeSnapshot(),
            recent: this.recent.makeSnapshot(),
        }
    }

    loadSnapshot(snapshot: OngekiCalculatorSnapshot<string, OngekiScore<Extra>>) {
        this.best.loadSnapshot(snapshot.best);
        this.new.loadSnapshot(snapshot.new);
        this.naive.loadSnapshot(snapshot.naive);
        this.recent.loadSnapshot(snapshot.recent);
    }

    addScore(score: WithExtra<Extra, {points: number}>, chart: Chart): UndoScore<Extra> | null {
        let chartData = this.db.getChartInfo(chart);
        if (chartData === null) {
            return null;
        }
        let { internalLevel: level, chartId: id, isNew, isLunatic } = chartData;

        let {rating, info} = scoreRating(score.points, level);
        
        const entry = { points: score.points, rating } as OngekiScore<Extra>;
        if ('extra' in score) {
            // @ts-expect-error
            entry.extra = score.extra; 
        }

        let undo: InnerUndoScore<Extra> = {
            naive: this.naive.addScore(entry, id),
            recent: this.recent.addScore(entry, {chartId: id, isLunatic}),
        };
        
        if (isNew) {
            undo.new = this.new.addScore(entry, id);
        } else {
            undo.best = this.best.addScore(entry, id);
        }
        
        return {rating, algo: info, undo};
    }

    undoScore(undo_: UndoScore<Extra> | null) {
        if (undo_ === null) { 
            return; 
        }
        let undo = undo_.undo;
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