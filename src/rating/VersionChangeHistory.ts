import { Calculator, RatingHistory } from "./RatingHistory";
import { xWithBumps } from "./utils";

export class VersionChangeHistory<Calc extends Calculator<Score, Chart, UndoType, unknown>, Score, Chart, UndoType> {
    histories: RatingHistory<Calc, Score, Chart, UndoType, unknown>[];
    
    // index i -> timestamp of changing from version i => version i+1
    // versionChanges: {
    //     timestamp: number,
    //     scoreIndex: number|null,
    // }[];
    versionChangeTimestamps: number[];
    versionChangeScoreIndexes: number[];
    getScoreTimestamp: (s: Score) => number;

    scores: [Score, Chart][];
    currentIndex: number;
    
    constructor(
        changes: {
            calculator: Calc, 
            timestamp: number,
        }[],
        scores: [Score, Chart][], 
        getTimestamp: (s: Score) => number,
        options = {}
    ) {
        this.histories = changes.map((entry) => (
            new RatingHistory(entry.calculator, scores, options)
        ));

        let timestamps = changes.map(entry => entry.timestamp).slice(1);
        this.versionChangeTimestamps = timestamps;
        this.getScoreTimestamp = getTimestamp;

        // calculate the score indexes: 
        // find the last score before each version change
        let scoreIndexes = [];
        let i = 0;
        for (let timeIndex=0; timeIndex<timestamps.length; timeIndex++) {
            let stamp = timestamps[timeIndex]!;
            while (true) {
                if (i >= scores.length) {
                    scoreIndexes.push(scores.length-1);
                    break;
                }
                let score = scores[i]![0]; 
                let scoreTimestamp = getTimestamp(score);               
                if (scoreTimestamp > stamp) {
                    scoreIndexes.push(i-1);
                    break;
                }
                i++;
            }
        }

        this.versionChangeScoreIndexes = scoreIndexes;
        
        this.scores = scores;
        this.currentIndex = 0;
    }

    get length() {
        return this.scores.length + this.versionChangeTimestamps.length;
    }

    get currentTimestamp() {
        let {scoreIndex, calcIndex, justBumped} = this._makeComponents(this.currentIndex);
        if (justBumped) {
            return this.versionChangeTimestamps[calcIndex-1]!;
        } else {
            return this.getScoreTimestamp(this.scores[scoreIndex]![0]);
        }
    }

    get whichCalc() {
        let {calcIndex} = this._makeComponents(this.currentIndex);
        return calcIndex;
    }

    get whichScore() {
        let {scoreIndex} = this._makeComponents(this.currentIndex);
        return scoreIndex;
    }

    get versionPointIndexes() {
        return this.versionChangeScoreIndexes.map((value, index) => value+index+1);
    }

    // todo: name this function
    _makeComponents(index: number) {
        let [scoreIndex,calc,justBumped] = xWithBumps(index, this.versionChangeScoreIndexes);
        scoreIndex = Math.min(this.scores.length-1, scoreIndex);
        return {
            scoreIndex: scoreIndex,
            calcIndex: calc,
            justBumped: justBumped,
        }
    }

    get calc() {
        let {calcIndex} = this._makeComponents(this.currentIndex);
        return this.histories[calcIndex]!.calc;
    }

    // TODO: refactor all these _makeComponents functions, turning into a mess
    calcAtIndex(index: number) {
        let {calcIndex} = this._makeComponents(index);
        return this.histories[calcIndex]!.calc;
    }

    goto(index: number) {
        let {scoreIndex, calcIndex} = this._makeComponents(index);
        let result = this.histories[calcIndex]!.goto(scoreIndex);
        this.currentIndex = index;
    }

    seek(delta: number) {
        this.goto(this.currentIndex + delta);
    }

    // TODO: When I use this function I get 'unknown' as the return type -- I don't know why this doesn't type resolve correctly, try to figure it out
    getCalcOutput(index: number): UndoType | null {
        let {scoreIndex, calcIndex, justBumped} = this._makeComponents(index);
        
        let result = this.histories[calcIndex]!.undos[scoreIndex];
        // The only time there should be no score is if a version change just happened,
        // verify that this is true and throw an assertion error if not
        if (result === undefined) {
            if (!justBumped) {
                throw new Error(`assertion error - could not find score at index ${index} which is not a version change: scores should only ever not be found at version changes`);
            } else {
                return null;
            }
        }
        return result;
    }
}