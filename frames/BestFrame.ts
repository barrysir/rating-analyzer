
// export type BestFrameSnapshot<Score> = {
//   chartsInFrame: Map<ChartId, Score>;
//   frame: ChartId[];
//   rating: number;
// };

import { insertionIndex } from "../utils";

export type UndoScore<ChartId, Score> = null
 | { inserted: number; removed?: {chartId: ChartId, score: Score}; rating: number }
 | { old: {chartId: ChartId, score: Score}; rating: number }

/**
 * Frame that 
 *  - keeps track of the best N rated scores
 *  - duplicates are not allowed / only one score is allowed per chart
 */
export class BestFrame<ChartId extends string, Score extends {rating: number}> {
  chartsInFrame: Map<ChartId, Score>; // database of scores in frame
  frame: ChartId[]; // frame scores sorted descending by rating, stored as indices into database
  
  // this is a private variable so people don't confusedly use it instead of totalRating
  #rating: number; // current total rating in frame

  max: number; // maximum size of this frame

  constructor(max: number) {
    this.chartsInFrame = new Map();
    this.frame = [];
    this.max = max;
    this.#rating = 0;
  }

//   makeSnapshot(): BestFrameSnapshot<Score> {
//     return {
//       chartsInFrame: structuredClone(this.chartsInFrame),
//       frame: structuredClone(this.frame),
//       rating: this.#rating,
//     };
//   }

//   applySnapshot(snapshot: BestFrameSnapshot<Score>) {
//     this.chartsInFrame = structuredClone(snapshot.chartsInFrame);
//     this.frame = structuredClone(snapshot.frame);
//     this.#rating = snapshot.rating;
//   }

  get totalRating(): number {
    return this.#rating;
  }

  get totalSize(): number {
    return this.max;
  }

  get scores(): Score[] {
    return this.frame.map(id => this.chartsInFrame.get(id)!);
  }

  addScore(t: Score, chartID: ChartId): UndoScore<ChartId, Score> {
    let oldRating = this.#rating;

    // Check if a score for this chart already exists
    let existingEntry = this.chartsInFrame.get(chartID);
    if (existingEntry !== undefined) {
      if (t.rating > existingEntry.rating) {
        // add score to frame

        // grab old score for undo calculation
        let oldScore = this.chartsInFrame.get(chartID)!;
        // update rating
        this.chartsInFrame.set(chartID, t);
        this.frame.sort((a, b) => this.chartsInFrame.get(b)!.rating - this.chartsInFrame.get(a)!.rating);
        this.#rating += t.rating - existingEntry.rating;
        return { old: {chartId: chartID, score: oldScore }, rating: oldRating };
      } else {
        // ignore score
        return null;
      }
    }

    // If there is room, add score to frame
    if (this.frame.length < this.max) {
      let insertedIndex = this._insert(chartID, t);
      return {inserted: insertedIndex, rating: oldRating};
    }

    // if rating is too low for the frame, then skip and don't bother doing any memory operations
    if (t.rating <= this.chartsInFrame.get(this.frame.at(-1)!)!.rating) {
      return null;
    }

    // add score to frame and remove lowest score
    let insertedIndex = this._insert(chartID, t);
    let lowestScoreChartId = this.frame.pop()!;
    let deletedScore = this.chartsInFrame.get(lowestScoreChartId)!; 
    this.#rating -= deletedScore.rating;
    this.chartsInFrame.delete(lowestScoreChartId);
    return {inserted: insertedIndex, removed: {chartId: lowestScoreChartId, score: deletedScore}, rating: oldRating};
  }

  _insert(chartID: ChartId, t: Score): number {
    this.chartsInFrame.set(chartID, t);
    let insertIndex = insertionIndex(this.frame, chartID, (c) => this.chartsInFrame.get(c)!.rating);
    this.frame.splice(insertIndex, 0, chartID);
    this.#rating += t.rating;
    return insertIndex;
  }

  getFrame(): Score[] {
    return this.frame.map(id => this.chartsInFrame.get(id)!);
  }

  undoScore(undo: UndoScore<ChartId, Score>) {
    if (undo === null) {
      return;
    }

    if ('inserted' in undo) {
      this.frame.splice(undo.inserted, 1);
      if ('removed' in undo) {
        this._insert(undo.removed.chartId, undo.removed?.score);
      }
      this.#rating = undo.rating;
    } else if ('old' in undo) {
      this.chartsInFrame.set(undo.old.chartId, undo.old.score);
      this.#rating = undo.rating;
    }
  }
}
