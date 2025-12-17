import { createMutable, createStore } from 'solid-js/store';
import { UserScoreDatabase } from '../../get-kamai/UserScores';
import { createHistory } from '../Temp';
import { batch } from 'solid-js';
import { RatingAlgo } from '../../rating/OngekiCalculator';
import { KamaiScore } from '../../get-kamai/kamai';
import { FrameRating } from '../ImprovementTracker';

type ExtendedScore = {
  chartId: string;
  rating: number;
  algo: RatingAlgo;
  points: number;
  timeAchieved: number;
  kamai: KamaiScore;
};

export type VersionInformation = {
    name: string;
    version: string;
    timestamp: number;
    pointId: number;
    plotBackgroundColor: string;
  };

type HistoryType = ReturnType<typeof createHistory>['history'];

type ChartDataType = {
    timestamps: number[];
    overallRating: number[];
    naiveRating: number[];
    version: number[];
    maxRating: number[];
};

export type VersionImproveRenderData = {
  versionId: number;
  improves: {
    pointId: number;
    scoreId: number;
    data: FrameRating;
  }[];
};

type PersonalBestType = ReturnType<typeof createHistory>['bests'];
type ScoresType = ExtendedScore[];
type ImprovesType = VersionImproveRenderData[];
type VersionsType = VersionInformation[];

export interface HistoryStore {
  history: HistoryType | null;
  bests: PersonalBestType | null;
  scores: ScoresType;
  improves: ImprovesType;
  versions: VersionsType;
  pointId: number;
  chartData: ChartDataType;
}

const [history, setHistory] = createStore<HistoryStore>({
  history: null,
  bests: null,
  scores: [],
  improves: [],
  versions: [],
  pointId: 0,
  chartData: {    
    timestamps: [] as number[],
    overallRating: [] as number[],
    naiveRating: [] as number[],
    version: [] as number[],
    maxRating: [] as number[],
  },
});

export function initializeHistory(scoredb: UserScoreDatabase, options: Parameters<typeof createHistory>[1]) {
  let {history, bests, improves, scores, versions, chartData} = createHistory(scoredb, options);
  batch(() => {
    setHistory('history', createMutable(history));
    // setHistory('bests', createMutable(bests));
    setHistory('scores', scores);
    setHistory('improves', improves);
    setHistory('versions', versions);
    setHistory('chartData', chartData);
    setHistory('pointId', history.currentIndex);
  });
}

export function setPointId(pointId: number) {
  batch(() => {
    history.history?.goto(pointId);
    // history.bests?.goto(index);
    setHistory('pointId', pointId);
  });
}

export { history };
