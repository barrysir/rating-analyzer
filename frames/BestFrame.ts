
// export type BestFrameSnapshot<Score> = {
//   chartsInFrame: Map<ChartId, Score>;
//   frame: ChartId[];
//   rating: number;
// };


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

  // Returns boolean of whether the score made the frame rating change
  addScore(t: Score, chartID: ChartId): boolean {
    let rating = t.rating;

    // Check if a score for this chart already exists
    let existingEntry = this.chartsInFrame.get(chartID);
    if (existingEntry !== undefined) {
      if (rating > existingEntry.rating) {
        // add score to frame
        this.chartsInFrame.set(chartID, t);
        this.frame.sort((a, b) => this.chartsInFrame.get(b)!.rating - this.chartsInFrame.get(a)!.rating);
        this.#rating += rating - existingEntry.rating;
        return true;
      } else {
        // ignore score
        return false;
      }
    }

    // If there is room, add score to frame
    if (this.frame.length < this.max) {
      this._insert(chartID, t);
      return true;
    }

    // if rating is too low for the frame, then skip and don't bother doing any memory operations
    if (rating <= this.chartsInFrame.get(this.frame[this.frame.length - 1]!)!.rating) {
      return false;
    }

    // add score to frame and remove lowest score
    this._insert(chartID, t);
    let lowestScoreChartId = this.frame.pop()!;
    this.#rating -= this.chartsInFrame.get(lowestScoreChartId)!.rating;
    this.chartsInFrame.delete(lowestScoreChartId);
    return true;
  }

  _insert(chartID: ChartId, t: Score) {
    this.chartsInFrame.set(chartID, t);
    this.frame.push(chartID);
    this.frame.sort((a, b) => this.chartsInFrame.get(b)!.rating - this.chartsInFrame.get(a)!.rating);
    this.#rating += t.rating;
  }

  getFrame(): Score[] {
    return this.frame.map(id => this.chartsInFrame.get(id)!);
  }
}
