import { Calculator, RatingHistory } from "./RatingHistory";

/* This class might be dead code unless I use it for something else */
export class MultiRatingHistory<Score, Chart> {
    histories: RatingHistory<Calculator<Score, Chart, unknown, unknown>, Score, Chart, unknown, unknown>[];
    scores: [Score, Chart][];
    calcSelector: (score: Score) => number;
    
    constructor(
        calculators: Calculator<Score, Chart, unknown, unknown>[], 
        scores: [Score, Chart][], 
        calcSelector: (score: Score) => number,
        options = {}
    ) {
        let test = calculators.map((calc) => (
            new RatingHistory(calc, scores, options)
        ));
        this.histories = test;
        this.scores = scores;
        this.calcSelector = calcSelector;
    }

    get length() {
        return this.scores.length;
    }

    get currentIndex() {
        return this.histories[0]!.currentIndex;
    }

    get selectedCalc() {
        let index = this.calcSelector(this.scores[Math.min(this.length-1, this.currentIndex)]![0]);
        return index;
    }

    get calc() {
        let index = this.selectedCalc;
        return this.histories[index]!.calc;
    }

    goto(index: number) {
        for (let history of this.histories) {
            history.goto(index);
        }
    }

    seek(delta: number) {
        this.goto(this.currentIndex + delta);
    }

}