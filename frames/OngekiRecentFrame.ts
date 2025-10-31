import type { ChartDb } from "../chartdb/ChartDb";
import { AgeFrame } from "./AgeFrame";
import { maxIndex } from "../utils";

export class OngekiRecentFrame<Score extends { points: number; rating: number; }, Chart> {
    frame: AgeFrame<Score>;
    numTop: number;
    numMax: number;
    db: ChartDb<Chart>;
    #temporaryRating: number | null;

    constructor(numTop: number, numMax: number, db: ChartDb<Chart>) {
        this.numTop = numTop;
        this.numMax = numMax;
        this.db = db;
        this.#temporaryRating = null;

        this.frame = new AgeFrame();
    }

    addScore(score: Score, chart: Chart) {
        // Don't include LUNATIC songs in recent
        if (this.db.isLunatic(chart)) {
            return;
        }

        // if the frame is not full yet, add the score
        if (this.frame.length < this.numMax) {
            this.frame.push(score);
        }

        // if the score is in the top 10 ratings
        const topScores = this.frame.byRating.slice(0, this.numTop);
        if (score.rating >= topScores[topScores.length - 1]!.rating) {
            // kick out the oldest score with lower rating
            let largestAgeWithLowerRating = maxIndex(this.frame.age.slice(this.numTop, this.numMax));
            this.frame.popIndex(largestAgeWithLowerRating);
            // add the current score to the front
            this.frame.push(score);

            // if score is better than the lowest score in the top 10, then skip this score
        } else if (score.points >= Math.min(...topScores.map(s => s.points))) {
            // do nothing
        } else {
            // remove the oldest score
            // add the current score as the newest
            this.frame.popOldest();
            this.frame.push(score);
        }
    }

    get totalRating(): number {
        if (this.#temporaryRating !== null) {
            return this.#temporaryRating;
        }
        return this.frame.byRating.slice(0, this.numTop).reduce((sum, x) => sum + x.rating, 0);
    }

    temporaryRating(totalRating: number): void {
        this.#temporaryRating = totalRating;
    }

    popRating(): void {
        this.#temporaryRating = null;
    }
}
