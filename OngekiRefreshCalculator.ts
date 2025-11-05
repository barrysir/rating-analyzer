import type { ChartDb } from "./chartdb/ChartDb";
import { BellLamp, ClearLamp, GradeLamp } from "./data-types";
import { BestFrame, UndoScore as BestUndo } from "./frames/BestFrame";
import { findRegion, lerp, pointsToGradeLamp } from "./utils";



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
    [BellLamp.FB]: 0.5,
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
    let stars = Math.max(5, Math.min(0, percentage - 93));
    return stars * stars * level;
}

// --------------------------------------

type OngekiScore = { points: number; rating: number; };
type PlatinumScore = { platinum: number; rating: number; };

type ScoreInput = {points: number, platinum: number} & 
(
    {bells: number, judgements: {crit?: number, break: number, hit: number, miss: number}}
    | {lamps: {bell: BellLamp, clear: ClearLamp, grade?: GradeLamp}}
);

type UndoScore = {
    best?: BestUndo<string, OngekiScore>; 
    new?: BestUndo<string, OngekiScore>; 
    naive: BestUndo<string, OngekiScore>;
    plat: BestUndo<string, PlatinumScore>;
};

type LampDisplay = {bell: BellLamp, clear: ClearLamp, grade: GradeLamp};

export class OngekiRefreshCalculator<Chart> {
    db: ChartDb<Chart>;
    best: BestFrame<string, OngekiScore>;
    new: BestFrame<string, OngekiScore>;
    naive: BestFrame<string, OngekiScore>;
    plat: BestFrame<string, PlatinumScore>;

    // TODO: store this in a "PBs" class, actually
    lamps: Map<string, LampDisplay>;

    constructor(db: ChartDb<Chart>) {
        this.db = db;
        this.best = new BestFrame(50);
        this.new = new BestFrame(10);
        this.naive = new BestFrame(60);
        this.plat = new BestFrame(50);
        this.lamps = new Map();
    }

    // TODO: make this accept a Partial<LampDisplay> so API is easier to use
    updateLamps(lamps: LampDisplay, chartId: string) {
        let existingLamps = this.lamps.get(chartId);
        if (existingLamps === undefined) {
            this.lamps.set(chartId, lamps);
            existingLamps = lamps;
        } else {
            // update lamps - don't overwrite lamps with a lower tier one
            if (bellLampBonus[lamps.bell] > bellLampBonus[existingLamps.bell]) {
                existingLamps.bell = lamps.bell;
            }
            if (clearLampBonus[lamps.clear] > clearLampBonus[existingLamps.clear]) {
                existingLamps.clear = lamps.clear;
            }
            if (gradeLampBonus[lamps.grade] > gradeLampBonus[existingLamps.grade]) {
                existingLamps.grade = lamps.grade;
            }
            this.lamps.set(chartId, existingLamps);
        }
        return existingLamps;
    }

    addScore(score: ScoreInput, chart: Chart) {
        let level = this.db.getInternalLevel(chart);
        let maxPlatinum = this.db.getMaxPlatinum(chart);

        let scoreLamps;
        if ('bells' in score) {
            // compute lamps from bell / judgement counts
            let maxBells = this.db.getMaxBells(chart);
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

        let chartId = this.db.getChartId(chart);
        let lamps = this.updateLamps(scoreLamps, chartId);

        let normalRating = scoreRating(score.points, lamps, level);
        let normalScore = {points: score.points, rating: normalRating};
        let platinumRating = pRating(score.platinum, maxPlatinum, level);
        let platinumScore = {platinum: score.platinum, rating: platinumRating};

        let undo: UndoScore = {};
        if (this.db.isNew(chart)) {
            undo.new = this.new.addScore(normalScore, chartId);
        } else {
            undo.best = this.best.addScore(normalScore, chartId);
        }
        undo.naive = this.naive.addScore(normalScore, chartId);
        undo.plat = this.plat.addScore(platinumScore, chartId);
        return undo;
    }

    undoScore(undo: UndoScore) {
        if ('new' in undo) { this.new.undoScore(undo.new!); }
        if ('best' in undo) { this.best.undoScore(undo.best!); }
        this.naive.undoScore(undo.naive);
        this.plat.undoScore(undo.plat);
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