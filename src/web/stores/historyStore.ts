import { createMutable, createStore } from 'solid-js/store';
import { UserScoreDatabase } from '../../get-kamai/UserScores';
import { createHistory } from '../Temp';
import { batch } from 'solid-js';

type HistoryType = ReturnType<typeof createHistory>['history'];
type ChartDataType = ReturnType<typeof createHistory>['chartData'];
type PersonalBestType = ReturnType<typeof createHistory>['bests'];
type ScoresType = ReturnType<typeof createHistory>['scores'];
type ImprovesType = ReturnType<typeof createHistory>['improves'];
type VersionsType = ReturnType<typeof createHistory>['versions'];

interface HistoryStore {
  history: HistoryType | null;
  bests: PersonalBestType | null;
  scores: ScoresType;
  improves: ImprovesType;
  versions: VersionsType;
  scoreIndex: number;
  chartData: ChartDataType;
}

const [history, setHistory] = createStore<HistoryStore>({
  history: null,
  bests: null,
  scores: [],
  improves: [],
  versions: [],
  scoreIndex: 0,
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
    setHistory('scoreIndex', history.currentIndex);
  });
}

export function setScoreIndex(index: number) {
  batch(() => {
    history.history?.goto(index);
    // history.bests?.goto(index);
    setHistory('scoreIndex', index);
  });
}

export function historyGetScore(scoreIndex: number) {
  let result = history.scores[scoreIndex];
  if (result === undefined) {
    throw new Error(`Invalid score index given: ${scoreIndex} (max: ${history.scores.length-1})`);
  }
  return result;
}

export function historyGetDb(pointIndex: number) {
 return history.history!.calcAtIndex(pointIndex).db;
}

export function historyGetSong(pointIndex: number, chartId: string) {
  let db = historyGetDb(pointIndex);
  let chart = db.getChart(chartId);
  if (chart === null) {
    throw new Error(`Invalid chart id given: ${chartId} at point index ${pointIndex}`);
  }
  return chart.song;
}

export function historyGetVersion(versionIndex: number) {
  let result = history.versions[versionIndex];
  if (result === undefined) {
    throw new Error(`Invalid version index given: ${versionIndex} (max: ${history.versions.length-1})`);
  }
  return result;
}

export function historyGetTimestamp(pointId: number) {
  let timestamp = history.chartData.timestamps[pointId];
  if (timestamp === undefined) {
    throw new Error(`Invalid pointId given: ${pointId} (max: ${history.chartData.timestamps.length})`);
  }
  return new Date(timestamp);
}

export function historyNumPoints() {
  return history.chartData.timestamps.length;
}

export { history };