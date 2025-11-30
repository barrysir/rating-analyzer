import { OngekiCalculator } from '../rating/OngekiCalculator';

/*
On each score, I want to show check if it improved
 (improved best rating, new rating, or maximum recent)
and then return what it improved, the old value, the new value, and the change in value
*/
export type FrameImprovement = {
  last: number;
  now: number;
  change: number;
};

export type Improvements = {
  best: null | FrameImprovement;
  new: null | FrameImprovement;
  recent: null | FrameImprovement;
};

export class ImprovementTracker<Chart, Score> {
  calc: OngekiCalculator<Chart, Score>;
  best: number;
  new: number;
  maxRecent: number;

  constructor(calc: OngekiCalculator<Chart, Score>) {
    this.calc = calc;
    this.best = calc.best.totalRating;
    this.new = calc.new.totalRating;
    this.maxRecent = calc.recent.totalRating;
  }

  refresh(calc: OngekiCalculator<Chart, Score>): Improvements {
    let best = calc.best.totalRating;
    let new_ = calc.new.totalRating;
    let recent = calc.recent.totalRating;

    let output: Improvements = { best: null, new: null, recent: null };
    if (best > this.best) {
      output.best = {
        last: this.best,
        now: best,
        change: best - this.best,
      };
      this.best = best;
    }
    if (new_ > this.new) {
      output.new = {
        last: this.new,
        now: new_,
        change: new_ - this.new,
      };
      this.new = new_;
    }
    if (recent > this.maxRecent) {
      output.recent = {
        last: this.maxRecent,
        now: recent,
        change: recent - this.maxRecent
      };
      this.maxRecent = recent;
    }

    return output;
  }
}

type FrameRating = {
  best: number,
  new: number,
  recent: number,
  maxRecent: number,
  improvements: {
    best ?: number,
    new ?: number,
    maxRecent ?: number,
  }
}
