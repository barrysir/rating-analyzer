import { OngekiCalculator } from '../rating/OngekiCalculator';

/*
On each score, I want to show check if it improved
 (improved best rating, new rating, or maximum recent)
and then return what it improved, the old value, the new value, and the change in value
*/
// export type FrameImprovement = {
//   last: number;
//   now: number;
//   change: number;
// };

// export type Improvements = {
//   best: null | FrameImprovement;
//   new: null | FrameImprovement;
//   recent: null | FrameImprovement;
// };

// if total increases
// if best increases
// if new increases

// but i also want to track by how much best/new/recent increased
export class ImprovementTracker<Chart, Score> {
  calc: OngekiCalculator<Chart, Score>;
  best: { total: number; best: number; new: number; recent: number };
  last: { total: number; best: number; new: number; recent: number };
  maxRecent: number;

  constructor(calc: OngekiCalculator<Chart, Score>) {
    this.calc = calc;
    this.best = this.snapshot(calc);
    this.last = this.snapshot(calc);
    this.maxRecent = this.best.recent;
  }

  snapshot(calc: OngekiCalculator<Chart, Score>) {
    return {
      total: calc.overallRating,
      best: calc.best.overallRating,
      new: calc.new.overallRating,
      recent: calc.recent.overallRating,
    }
  }

  refresh(calc: OngekiCalculator<Chart, Score>): FrameRating {
    let now = this.snapshot(calc);
    let best = this.best;
    let changes = {} as FrameRating['changes'];
    let isImprovement = false;

    // general frame handling
    if (now.total > best.total) {
      changes.total = now.total - best.total;
      best.total = now.total;
      isImprovement = true;
    }
    if (now.best > best.best) {
      changes.best = now.best - best.best;
      best.best = now.best;
      isImprovement = true;
    }
    if (now.new > best.new) {
      changes.new = now.new - best.new;
      best.new = now.new;
      isImprovement = true;
    }

    // recent handling
    changes.recent = now.recent - this.last.recent;

    // max recent handling
    if (now.recent > best.recent) {
      changes.maxRecent = now.recent - best.recent;
      best.recent = now.recent;
    }

    this.last = now;

    return {
      ...now,
      maxRecent: this.maxRecent,
      isImprovement,
      changes: changes,
    };
  }
}

export type FrameRating = {
  total: number,
  best: number,
  new: number,
  recent: number,
  maxRecent: number,
  isImprovement: boolean,
  changes: {
    total ?: number,
    best ?: number,
    new ?: number,
    recent ?: number,
    maxRecent ?: number,
  }
}
