import { OngekiDifficulty } from "../rating/data-types";
import { KamaiScore } from "./kamai";

export type UserScoreDatabase = {
    scores: {
        tag: string;
        difficulty: OngekiDifficulty;
        kamai: KamaiScore;
    }[],
};