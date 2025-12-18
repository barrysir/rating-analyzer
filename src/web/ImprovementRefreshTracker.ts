import { OngekiRefreshCalculator } from '../rating/OngekiRefreshCalculator';

export class ImprovementRefreshTracker<Calc extends OngekiRefreshCalculator<any, any>> {
  calc: Calc;
  best: { total: number; best: number; new: number; plat: number };
  last: { total: number; best: number; new: number; plat: number };

  constructor(calc: Calc) {
    this.calc = calc;
    this.best = this.snapshot(calc);
    this.last = this.snapshot(calc);
  }

  snapshot(calc: Calc) {
    return {
      total: calc.overallRating,
      best: calc.best.overallRating,
      new: calc.new.overallRating,
      plat: calc.plat.overallRating,
    }
  }

  refresh(calc: Calc): FrameRating {
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
    if (now.plat > best.plat) {
      changes.plat = now.plat - best.plat;
      best.plat = now.plat;
      isImprovement = true;
    }

    this.last = now;

    return {
      ...now,
      isImprovement,
      changes: changes,
    };
  }
}

export type FrameRating = {
  total: number,
  best: number,
  new: number,
  plat: number,
  isImprovement: boolean,
  changes: {
    total ?: number,
    best ?: number,
    new ?: number,
    plat ?: number,
  }
}