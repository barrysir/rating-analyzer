import type { ChartDb } from "./chartdb/ChartDb";
import { BellLamp, ClearLamp, GradeLamp } from "./data-types";
import { BestFrame, BestFrameSnapshot, UndoScore as BestUndo } from "./frames/BestFrame";
import { findRegion, lerp, pointsToGradeLamp, type Prettify } from "./utils";



const technicalBonusLerp: [number, number][] = [
    [1010000, 2],
    [1007500, 1.75],
    [1000000, 1.25],
    [ 990000, 0.75],
    [ 970000, 0],
    [ 900000, -4],
    [ 800000, -6],
];

const bellLampBonus: Record<BellLamp, number> = {
    [BellLamp.NONE]: 0,
    [BellLamp.FB]: 0.05,
};

const clearLampBonus: Record<ClearLamp, number> = {
    [ClearLamp.NONE]: 0,
    [ClearLamp.FC]: 0.1,
    [ClearLamp.AB]: 0.3,
    [ClearLamp.ACB]: 0.35,
}

const gradeLampBonus: Record<GradeLamp, number> = {
    [GradeLamp.NONE]: 0,
    [GradeLamp.S]: 0,
    [GradeLamp.SS]: 0.1,
    [GradeLamp.SSS]: 0.2,
    [GradeLamp.SSS_PLUS]: 0.3,
};

function ratingTrunc(num: number) {
    return Math.floor(num * 1000) / 1000;
}

function technicalBonus(points: number) {
    return lerp(points, technicalBonusLerp);
}

function scoreRating(points: number, lamps: LampDisplay, level: number) {
    if (points < 800000) {
        return Math.max(0, ratingTrunc((level - 6) * (points - 500000) / 300000));
    }

    return Math.max(0, level 
        + ratingTrunc(technicalBonus(points))
        + bellLampBonus[lamps.bell]
        + clearLampBonus[lamps.clear]
        + gradeLampBonus[lamps.grade]
    );
}

function pRating(platinum: number, maxPlatinum: number, level: number) {
    let percentage = Math.floor(platinum * 100 / maxPlatinum);
    let stars = Math.min(5, Math.max(0, percentage - 93));
    return stars * level * level / 1000;
}

// --------------------------------------

type WithExtra<Extra, T> = T & (Extra extends undefined ? {} : {extra: Extra});
type OngekiScore<Extra> = WithExtra<Extra, { points: number; rating: number; }>;
type PlatinumScore<Extra> = WithExtra<Extra, { platinum: number; rating: number; }>;

type ScoreInput<Extra> = WithExtra<Extra, 
    {points: number, platinum: number}
    & (
        {bells: number, judgements: {crit?: number, break: number, hit: number, miss: number}}
        | {lamps: {bell: BellLamp, clear: ClearLamp, grade?: GradeLamp}}
    )  
>;


type LampUndo = null | {chartId: string, prevLamps: LampDisplay|null};

type UndoScore<Extra> = {
    best?: BestUndo<string, OngekiScore<Extra>>; 
    new?: BestUndo<string, OngekiScore<Extra>>; 
    naive: BestUndo<string, OngekiScore<Extra>>;
    plat: BestUndo<string, PlatinumScore<Extra>>;
    lamps: LampUndo;
};

type LampDisplay = {bell: BellLamp, clear: ClearLamp, grade: GradeLamp};

type OngekiRefreshCalculatorSnapshot<ChartId, Extra> = {
    best: BestFrameSnapshot<ChartId, OngekiScore<Extra>>,
    new: BestFrameSnapshot<ChartId, OngekiScore<Extra>>,
    naive: BestFrameSnapshot<ChartId, OngekiScore<Extra>>,
    plat: BestFrameSnapshot<ChartId, PlatinumScore<Extra>>,
    lamps: Map<string, LampDisplay>,
};

export class OngekiRefreshCalculator<Chart, Extra = undefined> {
    db: ChartDb<Chart>;
    best: BestFrame<string, OngekiScore<Extra>>;
    new: BestFrame<string, OngekiScore<Extra>>;
    naive: BestFrame<string, OngekiScore<Extra>>;
    plat: BestFrame<string, PlatinumScore<Extra>>;

    lamps: Map<string, LampDisplay>;

    constructor(db: ChartDb<Chart>) {
        this.db = db;
        this.best = new BestFrame(50);
        this.new = new BestFrame(10);
        this.naive = new BestFrame(60);
        this.plat = new BestFrame(50);
        this.lamps = new Map();
    }

    static create<Extra>() {
        return function <Chart>(db: ChartDb<Chart>) { return new OngekiRefreshCalculator<Chart, Extra>(db); };
    }
    
    makeSnapshot(): OngekiRefreshCalculatorSnapshot<string, Extra> {
        return {
            best: this.best.makeSnapshot(),
            new: this.new.makeSnapshot(),
            naive: this.naive.makeSnapshot(),
            plat: this.plat.makeSnapshot(),
            lamps: structuredClone(this.lamps),
        }
    }

    loadSnapshot(snapshot: OngekiRefreshCalculatorSnapshot<string, Extra>) {
        this.best.loadSnapshot(snapshot.best);
        this.new.loadSnapshot(snapshot.new);
        this.naive.loadSnapshot(snapshot.naive);
        this.plat.loadSnapshot(snapshot.plat);
        this.lamps = structuredClone(snapshot.lamps);
    }

    // TODO: make this accept a Partial<LampDisplay> so API is easier to use
    updateLamps(lamps: LampDisplay, chartId: string): {} & {lamps: LampDisplay, changed: LampUndo} {
        let existingLamps = this.lamps.get(chartId);
        if (existingLamps === undefined) {
            this.lamps.set(chartId, lamps);
            existingLamps = lamps;
            return {
                lamps: existingLamps,
                changed: {chartId, prevLamps: null},
            }
        } else {
            // update lamps - don't overwrite lamps with a lower tier one
            let prevLamps = structuredClone(existingLamps);
            let changed = false;
            if (bellLampBonus[lamps.bell] > bellLampBonus[existingLamps.bell]) {
                existingLamps.bell = lamps.bell;
                changed = true;
            }
            if (clearLampBonus[lamps.clear] > clearLampBonus[existingLamps.clear]) {
                existingLamps.clear = lamps.clear;
                changed = true;
            }
            if (gradeLampBonus[lamps.grade] > gradeLampBonus[existingLamps.grade]) {
                existingLamps.grade = lamps.grade;
                changed = true;
            }
            this.lamps.set(chartId, existingLamps);
            return {
                lamps: existingLamps,
                changed: (changed == false) ? null : { chartId, prevLamps },
            };
        }
    }

    undoLamps(changed: LampUndo) {
        if (changed == null) {
            return;
        }

        let lamps = changed.prevLamps;
        if (lamps === null) {
            this.lamps.delete(changed.chartId);
        } else {
            this.lamps.set(changed.chartId, lamps);
        }
    }

    addScore(score: ScoreInput<Extra>, chart: Chart) {
        let chartData = this.db.getChartInfo(chart);
        if (chartData === null) {
            return null;
        }
        let { internalLevel: level, maxPlatinum, maxBells, chartId, isNew } = chartData;

        let scoreLamps;
        if ('bells' in score) {
            // compute lamps from bell / judgement counts
            let judges = score.judgements;
            let clear: ClearLamp = ClearLamp.NONE;
            if (judges.miss == 0) {
                clear = ClearLamp.FC;
                if (judges.hit == 0) {
                    clear = ClearLamp.AB;
                    if (judges.break == 0) {
                        clear = ClearLamp.ACB;
                    }
                }
            }

            scoreLamps = {
                bell: (score.bells == maxBells) ? BellLamp.FB : BellLamp.NONE,
                clear: clear,
                grade: pointsToGradeLamp(score.points),
            }
        } else {
            // use lamps provided in argument
            // compute grade lamp if not provided
            if (!('grade' in score.lamps)) {
                score.lamps.grade = pointsToGradeLamp(score.points);
            }
            scoreLamps = score.lamps as LampDisplay;
        }

        let {lamps, changed} = this.updateLamps(scoreLamps, chartId);

        let optionalScore = ('extra' in score) ? { extra: score.extra } : {};

        let normalRating = scoreRating(score.points, lamps, level);
        let normalScore = {points: score.points, rating: normalRating, ...optionalScore} as OngekiScore<Extra>;
        let platinumRating = pRating(score.platinum, maxPlatinum, level);
        let platinumScore = {platinum: score.platinum, rating: platinumRating, ...optionalScore} as PlatinumScore<Extra>;

        let undo: UndoScore<Extra> = {
            naive: this.naive.addScore(normalScore, chartId),
            plat: this.plat.addScore(platinumScore, chartId),
            lamps: changed,
        };
        if (isNew) {
            undo.new = this.new.addScore(normalScore, chartId);
        } else {
            undo.best = this.best.addScore(normalScore, chartId);
        }
        return undo;
    }

    undoScore(undo: UndoScore<Extra> | null) {
        if (undo === null) { 
            return; 
        }
        if ('new' in undo) { this.new.undoScore(undo.new!); }
        if ('best' in undo) { this.best.undoScore(undo.best!); }
        this.naive.undoScore(undo.naive);
        this.plat.undoScore(undo.plat);
        this.undoLamps(undo.lamps);
    }

    get overallRating() {
        return (
            this.best.totalRating / 50
            + this.new.totalRating / 50
            + this.plat.totalRating / 50
        );
    }

    get overallNaiveRating() {
        return (
            this.naive.totalRating / 50    // totalRating / 60 * 1.2 + plat
            + this.plat.totalRating / 50
        );
    }
}