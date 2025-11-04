import { insertionIndexDesc, maxIndex } from "../utils";

/**
 * Frame which stores scores sorted by age and by rating
 */
export class AgeFrame<Score extends {rating: number}> {
  // scores in frame, sorted descending by rating
  byRating: Score[];
  age: number[];
  ageCounter: number;
  totalRating: number;

  constructor() {
    this.byRating = [];
    this.age = [];
    this.ageCounter = 0;
    this.totalRating = 0;
  }

  get length() {
    return this.byRating.length;
  }

  push(score: Score) {
    let index = insertionIndexDesc(this.byRating, score, (s) => s.rating);
    this.byRating.splice(index, 0, score);
    this.age.splice(index, 0, this.ageCounter);
    this.ageCounter++;
    this.totalRating += score.rating;
    return { inserted: index };
  }

  popOldest() {
    if (this.length == 0) {
        return;
    }
    let oldestIndex = maxIndex(this.age);
    return this.popIndex(oldestIndex);
  }

  popIndex(index: number) {
    let deletedScore = this.byRating.splice(index, 1)[0]!;
    let deletedAge = this.age.splice(index, 1)[0]!;
    this.totalRating -= deletedScore.rating;
    return { removed: { index: index, age: deletedAge, score: deletedScore} };
  }

  undoScore(undo: { inserted: number } | { removed: {index: number, age: number, score: Score} }) {
    if ('inserted' in undo) {
      let scoreRating = this.byRating[undo.inserted]!.rating;
      this.byRating.splice(undo.inserted, 1);
      this.age.splice(undo.inserted, 1);
      this.totalRating -= scoreRating;
    } else if ('removed' in undo) {
      let removed = undo.removed;
      this.byRating.splice(removed.index, 0, removed.score);
      this.age.splice(removed.index, 0, removed.age);
      this.totalRating += removed.score.rating;
    }
  }
}
