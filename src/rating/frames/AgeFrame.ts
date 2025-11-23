import { insertionIndexDesc, minIndex } from "../utils";


type PushUndo = { inserted: number };
type PopUndo<Score> = { removed: {index: number, age: number, score: {id: string, score: Score}} };

export type UndoScore<Score> = PushUndo | PopUndo<Score>;

export type AgeFrameSnapshot<Score> = {
  byRating: {id: string, score: Score}[];
  age: number[];
  ageCounter: number;
  totalRating: number;
}

/**
 * Frame which stores scores sorted by age and by rating
 */
export class AgeFrame<Score extends {rating: number}> {
  // scores in frame, sorted descending by rating
  byRating: {id: string, score: Score}[];
  age: number[];
  ageCounter: number;
  totalRating: number;

  constructor() {
    this.byRating = [];
    this.age = [];
    this.ageCounter = 0;
    this.totalRating = 0;
  }

  makeSnapshot(): AgeFrameSnapshot<Score> {
    return {
      byRating: structuredClone(this.byRating),
      age: structuredClone(this.age),
      ageCounter: this.ageCounter,
      totalRating: this.totalRating,
    };
  }

  loadSnapshot(snapshot: AgeFrameSnapshot<Score>) {
    this.byRating = structuredClone(snapshot.byRating);
    this.age = structuredClone(snapshot.age);
    this.ageCounter = snapshot.ageCounter;
    this.totalRating = snapshot.totalRating;
  }

  get length() {
    return this.byRating.length;
  }

  push(id: string, score: Score): PushUndo {
    let pair = {id, score};
    let index = insertionIndexDesc(this.byRating, pair, (s) => s.score.rating);
    this.byRating.splice(index, 0, pair);
    this.age.splice(index, 0, this.ageCounter);
    this.ageCounter++;
    this.totalRating += score.rating;
    return { inserted: index };
  }

  popOldest(): PopUndo<Score> | null {
    if (this.length == 0) {
        return null;
    }
    let oldestIndex = minIndex(this.age);
    return this.popIndex(oldestIndex);
  }

  popOldestWithLowerRating(rating: number): PopUndo<Score> | null {
    if (this.length == 0) {
        return null;
    }

    //  - find slice [i..] where all scores have lower rating
    let firstScoreWithLowerRating = this.byRating.findIndex(v => v.score.rating < rating);

    //  - find minimum age in [i..]
    let ageIndex = firstScoreWithLowerRating;
    let currentOldestAge = this.age[firstScoreWithLowerRating]!;
    for (let i=firstScoreWithLowerRating+1; i<this.age.length; i++) {
        let age = this.age[i]!;
        if (age < currentOldestAge) {
            ageIndex = i;
            currentOldestAge = age;
        }
    }
    return this.popIndex(ageIndex);
  }

  popIndex(index: number): PopUndo<Score> {
    let deletedScore = this.byRating.splice(index, 1)[0]!;
    let deletedAge = this.age.splice(index, 1)[0]!;
    this.totalRating -= deletedScore.score.rating;
    return { removed: { index: index, age: deletedAge, score: deletedScore} };
  }

  undoScore(undo: UndoScore<Score>) {
    if ('inserted' in undo) {
      let scoreRating = this.byRating[undo.inserted]!.score.rating;
      this.byRating.splice(undo.inserted, 1);
      this.age.splice(undo.inserted, 1);
      this.totalRating -= scoreRating;
    } else if ('removed' in undo) {
      let removed = undo.removed;
      this.byRating.splice(removed.index, 0, removed.score);
      this.age.splice(removed.index, 0, removed.age);
      this.totalRating += removed.score.score.rating;
    }
  }
}
