// export type BestFrameSnapshot<Score> = {
//   chartsInFrame: Map<ChartId, Score>;
//   frame: ChartId[];
//   rating: number;
// };

import { insertionIndexDesc } from "../utils";

type InsertUndo = number;
type PopUndo<ChartId, Score> = {id: ChartId, score: Score};
type UpdateUndo<Score> = {curr: number, next: number, oldScore: Score};

export type UndoScore<ChartId, Score> = null
 | { inserted: InsertUndo; removed?: PopUndo<ChartId, Score> }
 | { updated: UpdateUndo<Score> };

export type BestFrameSnapshot<ChartId, Score> = {
  frame: {id: ChartId, score: Score}[];
  rating: number;
}

function moveIndex<T>(array: T[], a: number, b: number) {
  if (a == b) {
    return;
  }
  let item = array.splice(a, 1)[0]!;
  array.splice(b, 0, item);
  // since the array changes size between the splice operations there could be an off-by-one error, but it turns out it works out
  // ABCDE  1 3
  // ACDE   
  // ACDBE

  // ABCDE 3 1
  // ABCE
  // ADBCE
}

/**
 * Frame that 
 *  - keeps track of the best N rated scores
 *  - duplicates are not allowed / only one score is allowed per chart
 */
export class BestFrame<ChartId extends string, Score extends {rating: number}> {
  frame: {id: ChartId, score: Score}[]; // scores sorted descending by rating
  
  // this is a private variable so people don't confusedly use it instead of totalRating
  #rating: number; // current total rating in frame

  max: number; // maximum size of this frame

  constructor(max: number) {
    this.frame = [];
    this.max = max;
    this.#rating = 0;
  }

  makeSnapshot(): BestFrameSnapshot<ChartId, Score> {
    return {
      frame: structuredClone(this.frame),
      rating: this.#rating,
    };
  }

  loadSnapshot(snapshot: BestFrameSnapshot<ChartId, Score>) {
    this.frame = structuredClone(snapshot.frame);
    this.#rating = snapshot.rating;
  }

  get totalRating(): number {
    return this.#rating;
  }

  get totalSize(): number {
    return this.max;
  }

  get overallRating(): number {
    return this.totalRating / this.totalSize;
  }

  addScore(t: Score, chartID: ChartId): UndoScore<ChartId, Score> {
    let before = this.makeSnapshot();
    let result = this._addScore(t, chartID);

    if (!this.validateFrame()) {
      console.log(before);
      console.log(this.makeSnapshot());
      throw new Error(`Something didn't process correctly on forward ${JSON.stringify({t, chartID})}`);
    }
    return result;
  }

  _addScore(t: Score, chartID: ChartId): UndoScore<ChartId, Score> {
    // Check if a score for this chart already exists
    let existingScore = this._findScore(chartID);
    if (existingScore !== null) {
      // If the new score has higher rating, update, otherwise ignore
      let [existingEntry,index] = existingScore;
      if (t.rating > existingEntry.rating) {
        let updated = this._update(index, t);
        return { updated };
      } else {
        return null;
      }
    }

    // If there is room, add score to frame
    if (this.frame.length < this.max) {
      let inserted = this._insert(chartID, t);
      return { inserted };
    }

    // if rating is too low for the frame, then skip
    if (t.rating <= this.frame.at(-1)!.score.rating) {
      return null;
    }

    // add score to frame and remove lowest score
    let inserted = this._insert(chartID, t);
    let removed = this._pop();
    return {inserted, removed};
  }

  _findScore(chartID: ChartId): [Score, number] | null {
    let index = this.frame.findIndex(({id, score}) => chartID == id);
    if (index == -1) {
      return null;
    }
    return [this.frame[index]!.score, index];
  }

  _insert(id: ChartId, score: Score): InsertUndo {
    let pair = {id, score};
    let insertIndex = insertionIndexDesc(this.frame, pair, (c) => c!.score.rating);
    this.frame.splice(insertIndex, 0, pair);
    this.#rating += score.rating;
    return insertIndex;
  }

  _undoInsert(index: InsertUndo) {
    let {score: removedScore} = this.frame.splice(index, 1)[0]!;
    this.#rating -= removedScore.rating;
  }

  _pop() : PopUndo<ChartId, Score> {
    let {id, score} = this.frame.pop()!;
    this.#rating -= score.rating;
    return {id: id, score: score};
  }

  _undoPop(obj: PopUndo<ChartId, Score>) {
    this.frame.push(obj);
    this.#rating += obj.score.rating;
  }

  _update(index: number, score: Score): UpdateUndo<Score> {
    // hack here to get insertionIndexDesc to work
    let newIndex = insertionIndexDesc(this.frame, {id: 'fake', score}, ({id,score}) => score.rating);
    let oldScore = this.frame[index]!.score;
    this.frame[index]!.score = score;
    moveIndex(this.frame, index, newIndex);
    this.#rating += score.rating - oldScore.rating;
    return {curr: index, next: newIndex, oldScore: oldScore};
  }

  _undoUpdate(obj: UpdateUndo<Score>) {
    let currScore = this.frame[obj.next]!.score;
    this.#rating += obj.oldScore.rating - currScore.rating;
    moveIndex(this.frame, obj.next, obj.curr);
    this.frame[obj.curr]!.score = obj.oldScore;
  }

  undoScore(undo: UndoScore<ChartId, Score>) {
    if (undo === null) {
      return;
    }

    let before = JSON.stringify(this.frame);

    if ('inserted' in undo) {
      this._undoInsert(undo.inserted);
      if ('removed' in undo) {
        this._undoPop(undo.removed!);
      }
    } else {
      this._undoUpdate(undo.updated);
    }

    if (!this.validateFrame()) {
      console.log(before);
      console.log(this.frame);
      throw new Error(`Something didn't process correctly on undo ${JSON.stringify(undo)}`);
    }
  }

  validateFrame() {
    for (let i=1; i<this.frame.length; i++) {
      if (this.frame.at(i)?.score.rating < this.frame.at(i+1)?.score.rating) {
        return false;
      }
    }
    return true;
  }
}
