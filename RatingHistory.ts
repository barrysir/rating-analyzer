interface Calculator<Score, Chart, UndoType> {
    addScore(score: Score, chart: Chart): UndoType;
    undoScore(undo: UndoType): unknown;
}

export class RatingHistory<Score, Chart, UndoType> {
    calc: Calculator<Score, Chart, UndoType>;
    scores: [Score, Chart][];
    undos: UndoType[];
    currentIndex: number;

    // how will I deal with changing versions in between scores?
    // I'll need multiple calculators, no way around it

    constructor(calc: Calculator<Score, Chart, UndoType>, scores: [Score, Chart][]) {
        this.calc = calc;
        this.scores = scores;
        this.undos = [];
        this.currentIndex = 0;

        for (let [score,chart] of scores) {
            // scores[i] contains the action to move from i -> i+1
            let r = this.calc.addScore(score, chart);
            this.undos.push(r);
            // undo[i] contains the action to undo from i+1 -> i
            this.currentIndex++;
        }
    }

    // has problems with calling addScore() when calculator is seeked somewhere in the middle
    // addScore(score: Score, chart: Chart) {
    //     let r = this.calc.addScore(score, chart);
    //     this.scores.push([score, chart]);
    //     this.undos.push(r);
    //     this.currentIndex++;
    //     return r;
    // }

    goto(index: number) {
        if (index < 0) {
            throw new Error(`Trying to seek rating history before score 0 (${index})`);
        }
        if (index >= this.scores.length) {
            throw new Error(`Trying to seek rating history after the last score (${index} >= ${this.scores.length})`);
        }

        if (index < this.currentIndex) {
            for (let i=this.currentIndex; i>index; i--) {
                this.calc.undoScore(this.undos[i-1]!);
            }
        }
        if (index > this.currentIndex) {
            for (let i=this.currentIndex; i<index; i++) {
                let [score,chart] = this.scores[i]!;
                this.calc.addScore(score, chart);
            }
        }
        this.currentIndex = index;
    }
}