import { ChartId } from "../rating/chartdb/ChartDb";
import { KamaiScore } from "./kamai";

export type UserScoreDatabase = {
    scores: {
        chartId: ChartId;
        kamai: KamaiScore;
    }[],
};