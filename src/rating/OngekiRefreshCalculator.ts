import type { ChartDb, ChartId } from "./chartdb/ChartDb";
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

export type RefreshTechScoreAlgo = RefreshTechScoreAlgoA | RefreshTechScoreAlgoB;

type RefreshTechScoreAlgoA = {
    level: number,
    techBonus: {points: number, change: number, total: number},
    gradeLamp: {lamp: GradeLamp, change: number, total: number},
    clearLamp: {lamp: ClearLamp, change: number, total: number},
    bellLamp: {lamp: BellLamp, change: number, total: number},
};

type RefreshTechScoreAlgoB = {
    level: number,
    techBonus: {points: number, change: number, total: number},
    multiplier: {multiplier: number, total: number},
}

export type RefreshPlatScoreAlgo = {
    level: {level: number, total: number},
    stars: {percentage: number, stars: number, multiplier: number, total: number},
}

function scoreRating(points: number, lamps: LampDisplay, level: number): {rating: number, algo: RefreshTechScoreAlgo} {
    if (points < 800000) {
        let multiplier = Math.max(0, (points - 500000) / 300000);
        let value1 = Math.max(0, (level - 6));
        let value2 = value1 * multiplier;
        return {
            rating: ratingTrunc(value2),
            algo: {
                level: level,
                techBonus: {points, change: -6, total: value1},
                multiplier: {multiplier, total: value2},
            } as RefreshTechScoreAlgoB,
        };
    }

    let total = level;
    const algo: Partial<RefreshTechScoreAlgoA> = {};
    algo.level = level;

    const techBonus = ratingTrunc(technicalBonus(points));
    total = Math.max(0, level + techBonus);
    algo.techBonus = { points, change: techBonus, total };

    const grade = gradeLampBonus[lamps.grade];
    total += grade;
    algo.gradeLamp = { lamp: lamps.grade, change: grade, total };

    const clear = clearLampBonus[lamps.clear];
    total += clear;
    algo.clearLamp = { lamp: lamps.clear, change: clear, total };

    const bell = bellLampBonus[lamps.bell];
    total += bell;
    algo.bellLamp = { lamp: lamps.bell, change: bell, total };

    return {
        rating: total,
        algo: algo as RefreshTechScoreAlgoA,
    }
}

export function getPlatinumInformation(platinum: number, maxPlatinum: number) {
    // if another place uses this function, maybe change it to return {stars: (0 to 5), isRainbow: boolean} 
    // since stars: 6 acts more like an edge case in the two places its used
    let percentage = platinum * 100 / maxPlatinum;
    let stars = Math.min(6, Math.max(0, Math.floor(percentage - 93)));
    return {percentage, stars};
}

export function getPlatinumStarBorder(maxPlatinum: number, stars: number) {
    return Math.ceil(maxPlatinum * 0.01 * (stars + 93));
}

function pRating(platinum: number, maxPlatinum: number, level: number): {rating: number, algo: RefreshPlatScoreAlgo} {
    let { percentage, stars } = getPlatinumInformation(platinum, maxPlatinum);
    let algo: Partial<RefreshPlatScoreAlgo> = {};

    let total = level * level / 1000;
    algo.level = { level, total };

    let multiplier = Math.min(5, stars);
    total *= multiplier;
    algo.stars = { percentage, stars, multiplier, total }; 

    return {
        rating: total,
        algo: algo as RefreshPlatScoreAlgo,
    };
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


type LampUndo = null | {chartId: ChartId, prevLamps: LampDisplay|null};

type InnerUndoScore<Extra> = {
    best?: BestUndo<OngekiScore<Extra>>; 
    new?: BestUndo<OngekiScore<Extra>>; 
    naive: BestUndo<OngekiScore<Extra>>;
    plat: BestUndo<PlatinumScore<Extra>>;
    lamps: LampUndo;
};

type UndoScore<Extra> = {
    undo: InnerUndoScore<Extra>,
    rating: number,
    algo: RefreshTechScoreAlgo,
    platRating: number,
    platAlgo: RefreshPlatScoreAlgo,
};

type LampDisplay = {bell: BellLamp, clear: ClearLamp, grade: GradeLamp};

type OngekiRefreshCalculatorSnapshot<Extra> = {
    best: BestFrameSnapshot<OngekiScore<Extra>>,
    new: BestFrameSnapshot<OngekiScore<Extra>>,
    naive: BestFrameSnapshot<OngekiScore<Extra>>,
    plat: BestFrameSnapshot<PlatinumScore<Extra>>,
    lamps: Map<ChartId, LampDisplay>,
};

export class OngekiRefreshCalculator<Extra = undefined> {
    db: ChartDb;
    best: BestFrame<OngekiScore<Extra>>;
    new: BestFrame<OngekiScore<Extra>>;
    naive: BestFrame<OngekiScore<Extra>>;
    plat: BestFrame<PlatinumScore<Extra>>;

    lamps: Map<ChartId, LampDisplay>;

    constructor(db: ChartDb) {
        this.db = db;
        this.best = new BestFrame(50);
        this.new = new BestFrame(10);
        this.naive = new BestFrame(60);
        this.plat = new BestFrame(50);
        this.lamps = new Map();
    }

    static create<Extra>() {
        return function (db: ChartDb) { return new OngekiRefreshCalculator<Extra>(db); };
    }
    
    makeSnapshot(): OngekiRefreshCalculatorSnapshot<Extra> {
        return {
            best: this.best.makeSnapshot(),
            new: this.new.makeSnapshot(),
            naive: this.naive.makeSnapshot(),
            plat: this.plat.makeSnapshot(),
            lamps: structuredClone(this.lamps),
        }
    }

    loadSnapshot(snapshot: OngekiRefreshCalculatorSnapshot<Extra>) {
        this.best.loadSnapshot(snapshot.best);
        this.new.loadSnapshot(snapshot.new);
        this.naive.loadSnapshot(snapshot.naive);
        this.plat.loadSnapshot(snapshot.plat);
        this.lamps = structuredClone(snapshot.lamps);
    }

    // TODO: make this accept a Partial<LampDisplay> so API is easier to use
    updateLamps(lamps: LampDisplay, chartId: ChartId): {} & {lamps: LampDisplay, changed: LampUndo} {
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

    addScore(score: ScoreInput<Extra>, chart: ChartId): UndoScore<Extra> | null {
        let chartData = this.db.getChart(chart);
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

        let {rating: normalRating, algo: ratingAlgo} = scoreRating(score.points, lamps, level);
        let normalScore = {points: score.points, rating: normalRating, ...optionalScore} as OngekiScore<Extra>;
        let {rating: platinumRating, algo: platinumAlgo} = pRating(score.platinum, maxPlatinum, level);
        let platinumScore = {platinum: score.platinum, rating: platinumRating, ...optionalScore} as PlatinumScore<Extra>;

        let undo: InnerUndoScore<Extra> = {
            naive: this.naive.addScore(normalScore, chartId),
            plat: this.plat.addScore(platinumScore, chartId),
            lamps: changed,
        };
        if (isNew) {
            undo.new = this.new.addScore(normalScore, chartId);
        } else {
            undo.best = this.best.addScore(normalScore, chartId);
        }
        return {
            undo,
            rating: normalRating,
            algo: ratingAlgo,
            platRating: platinumRating,
            platAlgo: platinumAlgo,
        };
    }

    undoScore(undo_: UndoScore<Extra> | null) {
        if (undo_ === null) { 
            return; 
        }
        const undo = undo_.undo;
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