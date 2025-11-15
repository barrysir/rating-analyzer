import { createMutable, createStore } from 'solid-js/store';
import { UserScoreDatabase } from '../../get-kamai/UserScores';
import { createHistory } from '../Temp';
import { batch } from 'solid-js';

type HistoryType = ReturnType<typeof createHistory>['history'];
type ChartDataType = ReturnType<typeof createHistory>['chartData'];

interface HistoryStore {
  history: HistoryType | null;
  scoreIndex: number;
  chartData: ChartDataType;
}

const [history, setHistory] = createStore<HistoryStore>({
  history: null,
  scoreIndex: 0,
  chartData: {    
    timestamps: [] as number[],
    overallRating: [] as number[],
    naiveRating: [] as number[],
    version: [] as number[],
    maxRating: [] as number[],
  },
});

function initializeHistory(scoredb: UserScoreDatabase, options: Parameters<typeof createHistory>[1]) {
  let {history, chartData} = createHistory(scoredb, options);
  batch(() => {
    setHistory('history', createMutable(history));
    setHistory('chartData', chartData);
    setHistory('scoreIndex', history.currentIndex);
  });
}

function setScoreIndex(index: number) {
  batch(() => {
    history.history?.goto(index);
    setHistory('scoreIndex', index);
  });
}

export { history, initializeHistory, setScoreIndex };