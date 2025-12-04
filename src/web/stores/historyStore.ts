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

export function historyGetScore(scoreIndex: number) {
  let result = history.scores[scoreIndex];
  if (result === undefined) {
    throw new Error(`Invalid score index given: ${scoreIndex} (max: ${history.scores.length-1})`);
  }
  return result;
}

export function historyPointToScoreId(pointId: number) : {type: 'version', versionId: number} | {type: 'score', scoreId: number} {
  let {scoreIndex, calcIndex, justBumped} = history.history!._makeComponents(pointId);
  if (justBumped) {
    return {type: 'version', versionId: calcIndex};
  }
  return {type: 'score', scoreId: scoreIndex};
}

export function historyGetDb(pointId: number) {
 return history.history!.calcAtIndex(pointId).db;
}

export function historyGetSong(pointId: number, chartId: string) {
  let db = historyGetDb(pointId);
  let chart = db.getChart(chartId);
  if (chart === null) {
    // throw new Error(`Invalid chart id given: ${chartId} at point index ${pointId}`);
  }
  return chart?.song;
}

export function historyGetChart(pointId: number, chartId: string) {
  // TODO: refactor this together with historyGetSong
  let db = historyGetDb(pointId);
  let chart = db.getChart(chartId);
  if (chart === null) {
    // throw new Error(`Invalid chart id given: ${chartId} at point index ${pointId}`);
    return null;
  }
  return {chart: chart, song: chart.song};
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