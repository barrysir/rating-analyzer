import { OngekiDifficulty } from "../rating/data-types";
import { KamaiScore } from "./kamai";

export type UserScoreDatabase = {
    scores: {
        chartId: string;
        kamai: KamaiScore;
    }[],
};