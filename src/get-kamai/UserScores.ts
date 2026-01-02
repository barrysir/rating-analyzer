import { ChartId } from "../rating/chartdb/ChartDb";

export type UserScoreDatabase = {
    scores: {
        chartId: ChartId;
        kamai: KamaiScore;
    }[],
};

export type OngekiKamaiJudgements = {
  cbreak: number;
  break: number;
  hit: number;
  miss: number;
};

export type KamaiScore = {
  timeAchieved: number;
  scoreData: {
    score: number;
    platinumScore: number;
    judgements: OngekiKamaiJudgements;
    optional: {
      damage: number;
      bellCount: number;
    };
  };
  chartID: string;
};
export type KamaiSong = { [key: string]: unknown; };
export type KamaiChart = {
  chartID: string;
  songID: number;
  difficulty: string;
};
