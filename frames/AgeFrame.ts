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

  insertionIndex(score: Score) {
    let low = 0;
    let high = this.byRating.length;

    while (low < high) {
        var mid = (low + high) >>> 1;
        if (this.byRating[mid]!.rating < score.rating) low = mid + 1;
        else high = mid;
    }
    return low;
  }

  _maxIndex(array: number[]) {
    return array.reduce((iMax, x, i) => x > array[iMax]! ? i : iMax, 0);
  }

  push(score: Score) {
    let index = this.insertionIndex(score);
    this.byRating.splice(index, 0, score);
    this.age.splice(index, 0, this.ageCounter);
    this.ageCounter++;
    this.totalRating += score.rating;
  }

  popOldest() {
    if (this.length == 0) {
        return;
    }
    let oldestIndex = this._maxIndex(this.age);
    this.popIndex(oldestIndex);
  }

  popIndex(index: number) {
    let deletedScore = this.byRating.splice(index, 1)[0]!;
    this.age.splice(index, 1);
    this.totalRating -= deletedScore.rating;
  }
}
