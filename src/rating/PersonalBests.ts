import { ChartDb, ChartId, ChartInfo } from "./chartdb/ChartDb";
import { HistoricalChartDb } from "./chartdb/HistoricalChartDb";
import { BellLamp, ClearLamp, GradeLamp } from "./data-types";
import { findRegion, getRegion, mapEmplace, objectIsEmpty, pointsToGradeLamp } from "./utils";

export type OngekiLampDisplay = {bell: BellLamp, clear: ClearLamp, grade: GradeLamp};

const bellLampComparison: Record<BellLamp, number> = {
    [BellLamp.NONE]: 0,
    [BellLamp.FB]: 1,
};

const clearLampComparison: Record<ClearLamp, number> = {
    [ClearLamp.NONE]: 0,
    [ClearLamp.FC]: 1,
    [ClearLamp.AB]: 2,
    [ClearLamp.ACB]: 3,
}

const gradeLampComparison: Record<GradeLamp, number> = {
    [GradeLamp.NONE]: 0,
    [GradeLamp.S]: 1,
    [GradeLamp.SS]: 2,
    [GradeLamp.SSS]: 3,
    [GradeLamp.SSS_PLUS]: 4,
};

type ScoreInput = {
    points: number,
    bells: number, 
    judgements: {cbreak: number, break: number, hit: number, miss: number},
};

function calculateOngekiLamps(score: ScoreInput, chart: ChartInfo): OngekiLampDisplay {
    // compute lamps from bell / judgement counts
    let judges = score.judgements;
    let clear: ClearLamp = ClearLamp.NONE;
    // make sure that the song was played to completion / all notes in the song received a judgement
    if (judges.cbreak + judges.break + judges.hit + judges.miss == chart.noteCount) {
        // normal FC / AB / AB+ detection
        if (judges.miss == 0) {
            clear = ClearLamp.FC;
            if (judges.hit == 0) {
                clear = ClearLamp.AB;
                if (judges.break == 0) {
                    clear = ClearLamp.ACB;
                }
            }
        }
    }

    return {
        bell: (score.bells == chart.maxBells) ? BellLamp.FB : BellLamp.NONE,
        clear: clear,
        grade: pointsToGradeLamp(score.points),
    }
}

function updateOngekiLamps(existing: OngekiLampDisplay | undefined, incoming: OngekiLampDisplay): {lamps: OngekiLampDisplay, changed: Partial<OngekiLampDisplay>} {
    if (existing === undefined) {
        return {
            lamps: incoming,
            changed: incoming,
        }
    } else {
        // update lamps - don't overwrite lamps with a lower tier one
        let changes = {} as Partial<OngekiLampDisplay>;
        if (bellLampComparison[incoming.bell] > bellLampComparison[existing.bell]) {
            changes.bell = incoming.bell;
        }
        if (clearLampComparison[incoming.clear] > clearLampComparison[existing.clear]) {
            changes.clear = incoming.clear;
        }
        if (gradeLampComparison[incoming.grade] > gradeLampComparison[existing.grade]) {
            changes.grade = incoming.grade;
        }
        return {
            lamps: objectIsEmpty(changes) ? existing : Object.assign(existing, changes),
            changed: changes,
        };
    }
}

export class PersonalBests<Score extends ScoreInput> {
    // sorted ascending by score index
    plays: Map<ChartId, number[]>;
    pbs: Map<ChartId, number[]>;
    lamps: Map<ChartId, {id: number, lamps: OngekiLampDisplay}[]>;

    scores: [Score, ChartId][];
    currentIndex: number;
    howManyTimesHasThisChartBeenPlayed: number[];

    constructor(scores: [Score, ChartId][], db: HistoricalChartDb) {
        this.scores = scores;
        this.plays = new Map();
        this.pbs = new Map();
        this.lamps = new Map();
        this.howManyTimesHasThisChartBeenPlayed = [];

        let currentLamps: Map<ChartId, OngekiLampDisplay> = new Map();

        // first, group each score by chart id
        for (let [index, [score, id]] of scores.entries()) {    
            // add points
            let plays = mapEmplace(this.plays, id, []);
            plays.push(index);
            this.howManyTimesHasThisChartBeenPlayed.push(plays.length - 1);

            // add pb
            let currpbindex = this.pbs.get(id)?.at(-1);
            if (currpbindex === undefined) {
                this.pbs.set(id, [index]);
            } else {
                let pb = this.scores[currpbindex]![0];
                if (pb.points < score.points) {
                    this.pbs.get(id)?.push(index);
                }
            }

            // add lamps
            let chart = db.getChart(id);
            if (chart === null) {
                throw new Error();
            }
            let scoreLamps = calculateOngekiLamps(score, chart);
            let { lamps: newLamps, changed } = updateOngekiLamps(currentLamps.get(id), scoreLamps);

            currentLamps.set(id, newLamps);
            if (!objectIsEmpty(changed)) {
                mapEmplace(this.lamps, id, []).push({id: index, lamps: newLamps});
            }
        }

        this.currentIndex = this.scores.length;
    }

    /**
     * Get the personal best score and lamps for a given chart.
     * If the song hasn't been played yet, return null.
     */
    getBest(chartid: ChartId): {score: Score, lamps: OngekiLampDisplay} | null {
        // if this chart has no plays, return null
        let scoreIndexes = this.pbs.get(chartid);
        if (scoreIndexes === undefined) {
            return null;
        }

        // if this chart doesn't have a score at this point in time, return null
        let scoreIndex = getRegion(scoreIndexes, this.currentIndex, (a) => a);
        if (scoreIndex == null) {
            return null;
        }

        // return the scores and lamps at this point in time
        let allLamps = this.lamps.get(chartid)!;
        let currLamps = getRegion(allLamps, this.currentIndex, (v) => v.id)!.lamps;

        return {
            score: this.scores[scoreIndex]![0],
            lamps: currLamps,
        };
    }

    // Get all scores for this chart, sorted descending by points
    // getBests(chartid: ChartId): Score[] {
    //     let scoreIndexes = this.bests.get(chartid);
    //     if (scoreIndexes === undefined) {
    //         return [];
    //     }
    //     return scoreIndexes.filter(i => i < this.currentIndex).map(i => this.scores[i]![0]);
    // }

    goto(index: number) {
        this.currentIndex = index;
    }
}