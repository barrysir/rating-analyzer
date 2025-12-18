import { ChartDb, ChartId } from "./chartdb/ChartDb";

type UndoScore<Score> = { id: ChartId, score: Score|undefined };
type PersonalBestsSnapshot<Score> = {
    bests: Map<ChartId, Score>;
}

export class PersonalBests<Score extends {points: number}> {
    db: ChartDb;
    bests: Map<ChartId, Score>;

    constructor(db: ChartDb) {
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

    addScore(score: Score, chart: ChartId): UndoScore<Score> | null {
        let chartInfo = this.db.getChart(chart);
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