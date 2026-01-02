import { createMutable, createStore } from 'solid-js/store';
import { UserScoreDatabase } from '../../get-kamai/UserScores';
import { createHistory, HistoryType } from '../Temp';
import { batch } from 'solid-js';
import { RatingAlgo as OngekiScoreAlgo } from '../../rating/OngekiCalculator';
import { KamaiScore } from '../../get-kamai/UserScores';
import { FrameRating as OngekiFrameRating } from '../ImprovementTracker';
import { FrameRating as RefreshFrameRating } from '../ImprovementRefreshTracker';
import { Mode } from "../types";
import { RefreshPlatScoreAlgo, RefreshTechScoreAlgo } from '../../rating/OngekiRefreshCalculator';
import { ChartId } from '../../rating/chartdb/ChartDb';

export type OngekiJudgements = {
  cbreak: number;
  break: number;
  hit: number;
  miss: number;
  damage: number;
  bells: number;
}

export type ExtendedScore<M extends Mode> = {
  chartId: ChartId;
  attemptNumber: number;  // The number of times this chart has been played before this time: Attempt #0, Attempt #1, etc.
  rating: number;
  points: number;
  timeAchieved: number;
  kamai: KamaiScore;
  totalJudgements: number;    // used for completion percentage
} & (
  M extends Mode.ONGEKI ? {
    algo: OngekiScoreAlgo,
    judgements: OngekiJudgements,
  } :
  M extends Mode.REFRESH ? {
    platRating: number,
    platScore: number,
    techAlgo: RefreshTechScoreAlgo,
    platAlgo: RefreshPlatScoreAlgo,
    judgements: OngekiJudgements,
  } :
  never
);

export type VersionInformation = {
    name: string;
    version: string;
    timestamp: number;
    pointId: number;
    plotBackgroundColor: string;
  };

type PlotData = {
  name: string;
  data: number[];
};

type OngekiPlots = {
  maxRating: PlotData,
  naiveRating: PlotData,
  overallRating: PlotData,
};

type PlotDataAsdf<M extends Mode> = 
    M extends Mode.ONGEKI ? OngekiPlots :
    M extends Mode.REFRESH ? OngekiPlots :
    never;


export type ChartDataType<M extends Mode> = {
    timestamps: number[];
    version: number[];
    plots: PlotDataAsdf<M>;
};

export type FrameRating<M extends Mode> =
    M extends Mode.ONGEKI ? OngekiFrameRating :
    M extends Mode.REFRESH ? RefreshFrameRating :
    never;

export type VersionImproveRenderData<M extends Mode> = {
  versionId: number;
  improves: {
    pointId: number;
    scoreId: number;
    data: FrameRating<M>;
  }[];
};

type PersonalBestType = ReturnType<typeof createHistory>['bests'];

export type HistoryStore<M extends Mode> = {
  history: HistoryType<M>;
  // perPoint information
  // perScore information
  // perVersion information
  bests: PersonalBestType;
  scores: ExtendedScore<M>[];
  improves: VersionImproveRenderData<M>[];
  versions: VersionInformation[];
  pointId: number;
  chartData: ChartDataType<M>;
}

// const [history, setHistory] = createStore<HistoryStore<Mode.ONGEKI> | HistoryStore<Mode.REFRESH>>({
//   history: null,
//   bests: null,
//   scores: [],
//   improves: [],
//   versions: [],
//   pointId: 0,
//   chartData: {    
//     timestamps: [] as number[],
//     overallRating: [] as number[],
//     naiveRating: [] as number[],
//     version: [] as number[],
//     maxRating: [] as number[],
//   },
// });

export function initializeHistory<M extends Mode>(scoredb: UserScoreDatabase, mode: M, options: Parameters<typeof createHistory>[2]): HistoryStore<M> {
  let {history, bests, improves, scores, versions, chartData} = createHistory(scoredb, mode, options);
  return {
    bests,
    improves,
    scores,
    versions,
    chartData,
    history: createMutable(history),
    pointId: history.currentIndex,
  } as HistoryStore<M>;

  // let {history, bests, improves, scores, versions, chartData} = createHistory(scoredb, mode, options);
  // batch(() => {
  //   setHistory('history', createMutable(history));
  //   // setHistory('bests', createMutable(bests));
  //   setHistory('scores', scores);
  //   setHistory('improves', improves);
  //   setHistory('versions', versions);
  //   setHistory('chartData', chartData);
  //   setHistory('pointId', history.currentIndex);
  // });
}

