import { KamaiScore } from "./get-kamai/kamai-types";
import { ChartId } from "./rating/chartdb/ChartDb";
import { Game } from "./web/types";

export type UserScoreDatabase = {
  game: Game,
  kamaiSearchParams: {
    game: string;
    playtype: string;
  },
  user: {
    id: number,
    name: string,
  },
  scores: {
      chartId: ChartId;
      kamai: KamaiScore;
  }[],
};


