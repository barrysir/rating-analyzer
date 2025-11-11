interface Calculator<Score, Chart, UndoType, Snapshot> {
    addScore(score: Score, chart: Chart): UndoType;
    undoScore(undo: UndoType): unknown;

    makeSnapshot(): Snapshot;
    loadSnapshot(snapshot: Snapshot): unknown;
}

export class RatingHistory<Calc extends Calculator<Score, Chart, UndoType, Snapshot>, Score, Chart, UndoType, Snapshot> {
    calc: Calc;
    scores: [Score, Chart][];       // scores[i] contains the action to move from i -> i+1
    undos: UndoType[];              // undo[i] contains the action to undo from i+1 -> i
    snapshots: Snapshot[];
    currentIndex: number;
    snapshotInterval: number;

    constructor(calc: Calc, scores: [Score, Chart][], options: {snapshotInterval?: number} = {}) {
        this.calc = calc;
        this.scores = scores;
        this.undos = [];
        this.snapshots = [];
        this.currentIndex = 0;

        this.snapshotInterval = options.snapshotInterval ?? 100;
    }

    get lastExploredIndex() {
        return this.undos.length;
    }

    get length() {
        return this.scores.length;
    }

    // has problems with calling addScore() when calculator is seeked somewhere in the middle
    // addScore(score: Score, chart: Chart) {
    //     let r = this.calc.addScore(score, chart);
    //     this.scores.push([score, chart]);
    //     this.undos.push(r);
    //     this.currentIndex++;
    //     return r;
    // }

    closestSnapshot(index: number): {snapshot: Snapshot, index: number} {
        let snapshotIndex = Math.round(index / this.snapshotInterval);
        snapshotIndex = Math.min(0, Math.max(this.snapshots.length-1, snapshotIndex));

        return {
            snapshot: this.snapshots[snapshotIndex]!,
            index: snapshotIndex * this.snapshotInterval,
        };
    }

    goto(index: number) {
        // Do nothing if already at the given index
        if (index == this.currentIndex) {
            return;
        }

        if (index < 0) {
            throw new Error(`Trying to seek rating history before score 0 (${index})`);
        }
        if (index > this.scores.length) {
            throw new Error(`Trying to seek rating history after the last score (${index} > ${this.scores.length})`);
        }

        // If we're seeking to an index that hasn't been generated yet, 
        // start from the last explored index and save scores one at a time
        if (index > this.lastExploredIndex) {
            this.goto(this.lastExploredIndex);
            while (this.currentIndex < index) {
                if (this.currentIndex % this.snapshotInterval == 0) {
                    this.snapshots.push(this.calc.makeSnapshot());
                }
                let [score,chart] = this.scores[this.currentIndex]!;
                let r = this.calc.addScore(score, chart);
                this.undos.push(r);
                this.currentIndex++;
            }
            // maybe put a snapshot at the last score too -- 
            // right now snapshots are expected to be evenly spaced, this would require coding some kind of exception
            // or allowing snapshots at arbitrary indexes
            // if (this.currentIndex % this.snapshotInterval > this.snapshotInterval/2) {
            //     this.snapshots.push(this.calc.makeSnapshot());
            // }
            return;
        }

        let deltaScores = Math.abs(index - this.currentIndex);
        let closest = this.closestSnapshot(index);
        let deltaSnapshot = Math.abs(index - closest.index);

        // if there's a snapshot that's closer than the current position, go to it
        if (deltaSnapshot < deltaScores) {
            this.calc.loadSnapshot(closest.snapshot);
            this.currentIndex = closest.index;
        }

        // seek by scores
        if (index < this.currentIndex) {
            for (let i=this.currentIndex; i>index; i--) {
                this.calc.undoScore(this.undos[i-1]!);
            }
        } else if (index > this.currentIndex) {
            for (let i=this.currentIndex; i<index; i++) {
                let [score,chart] = this.scores[i]!;
                this.calc.addScore(score, chart);
            }
        }
        this.currentIndex = index;
    }

    seek(delta: number) {
        this.goto(this.currentIndex + delta);
    }
}