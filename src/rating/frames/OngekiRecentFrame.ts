import { AgeFrame, type AgeFrameSnapshot } from "./AgeFrame";

export type UndoScore<Score> = null
    | {inserted: number; removed?: {index: number, age: number, score: {id: string, score: Score}}};


export class OngekiRecentFrame<Score extends { points: number; rating: number; }> {
    frame: AgeFrame<Score>;
    numTop: number;
    numMax: number;
    #temporaryRating: number | null;

    constructor(numTop: number, numMax: number) {
        this.numTop = numTop;
        this.numMax = numMax;
        this.#temporaryRating = null;

        this.frame = new AgeFrame();
    }
    
    makeSnapshot(): AgeFrameSnapshot<Score> {
        return this.frame.makeSnapshot();
    }

    loadSnapshot(snapshot: AgeFrameSnapshot<Score>) {
        this.frame.loadSnapshot(snapshot);
    }

    addScore(score: Score, chart: {chartId: string, isLunatic: boolean}): UndoScore<Chart, Score> {
        // Don't include LUNATIC songs in recent
        if (chart.isLunatic) {
            return null;
        }

        // if the frame is not full yet, add the score
        if (this.frame.length < this.numMax) {
            return this.frame.push(chart.chartId, score);
        }

        // if the score is in the top 10 ratings
        const topScores = this.frame.byRating.slice(0, this.numTop);
        if (score.rating >= topScores[topScores.length - 1]!.score.rating) {
            // kick out the oldest score with lower rating
            let removed = this.frame.popOldestWithLowerRating(score.rating);
            // add the current score to the front
            let inserted = this.frame.push(chart.chartId, score);
            return { ...removed, ...inserted };

            // if score is better than the lowest score in the top 10, then skip this score
        } else if (score.points >= Math.min(...topScores.map(s => s.score.points))) {
            // do nothing
            return null;
        } else {
            // remove the oldest score
            // add the current score as the newest
            let removed = this.frame.popOldest();
            let inserted = this.frame.push(chart.chartId, score);
            return { ...removed, ...inserted };
        }
    }

    undoScore(undo: UndoScore<Score>) {
        if (undo === null) {
            return;
        }

        this.frame.undoScore({inserted: undo.inserted});
        if ('removed' in undo) {
            this.frame.undoScore({removed: undo.removed!});
        }
    }

    get totalRating(): number {
        if (this.#temporaryRating !== null) {
            return this.#temporaryRating;
        }
        return this.frame.byRating.slice(0, this.numTop).reduce((sum, x) => sum + x.score.rating, 0);
    }

    temporaryRating(totalRating: number): void {
        this.#temporaryRating = totalRating;
    }

    popRating(): void {
        this.#temporaryRating = null;
    }
}
