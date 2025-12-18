import { ChartDb, ChartId } from "./chartdb/ChartDb";

export class PersonalBests<Score extends {points: number}> {
    bests: Map<ChartId, number[]>;
    scores: [Score, ChartId][];
    currentIndex: number;
    howManyTimesHasThisChartBeenPlayed: number[];

    constructor(scores: [Score, ChartId][]) {
        this.scores = scores;
        this.bests = new Map();
        this.howManyTimesHasThisChartBeenPlayed = [];

        // first, group each score by chart id
        for (let [index, [score, id]] of scores.entries()) {    
            let pb = this.bests.get(id);
            if (pb === undefined) {
                pb = [];
                this.bests.set(id, pb);
            }
            pb.push(index);
            this.howManyTimesHasThisChartBeenPlayed.push(pb.length - 1);
        }

        // sort the scores for each chart id by points descending
        for (let scoreIndexes of this.bests.values()) {
            scoreIndexes.sort((a, b) => {
                let scoreA = this.scores[a]![0];
                let scoreB = this.scores[b]![0];
                return scoreB.points - scoreA.points;
            });
        }

        this.currentIndex = this.scores.length;
    }

    // Get all scores for this chart, sorted descending by points
    getBests(chartid: ChartId): Score[] {
        let scoreIndexes = this.bests.get(chartid);
        if (scoreIndexes === undefined) {
            return [];
        }
        return scoreIndexes.filter(i => i < this.currentIndex).map(i => this.scores[i]![0]);
    }

    goto(index: number) {
        this.currentIndex = index;
    }
}