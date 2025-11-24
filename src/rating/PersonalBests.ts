import { ChartDb } from "./chartdb/ChartDb";

type UndoScore<Score> = { id: string, score: Score|undefined };
type PersonalBestsSnapshot<Score> = {
    bests: Map<string, Score>;
}

export class PersonalBests<Chart, Score extends {points: number}> {
    db: ChartDb<Chart>;
    bests: Map<string, Score>;

    constructor(db: ChartDb<Chart>) {
        this.db = db;
        this.bests = new Map();
    }

    makeSnapshot(): PersonalBestsSnapshot<Score> {
        return {
            bests: structuredClone(this.bests),
        };
    }

    loadSnapshot(snapshot: PersonalBestsSnapshot<Score>) {
        this.bests = structuredClone(snapshot.bests);
    }

    addScore(score: Score, chart: Chart): UndoScore<Score> | null {
        let chartInfo = this.db.getChartInfo(chart);
        if (chartInfo === null) {
            throw new Error("Chart doesn't exist");
        }
        let chartId = chartInfo.chartId; 
        let pb = this.bests.get(chartId);
        if (pb === undefined || pb.points < score.points) {
            let undo = {id: chartId, score: pb};
            this.bests.set(chartId, score);
            return undo;
        }
        return null;
    }

    undoScore(undo: UndoScore<Score> | null) {
        if (undo === null) {
            return;
        }
        if (undo.score === undefined) {
            this.bests.delete(undo.id);
        } else {
            this.bests.set(undo.id, undo.score);
        }
    }
}