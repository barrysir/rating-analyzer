import { batch, createSignal, JSXElement } from "solid-js";
import { UserScoreDatabase } from "../../get-kamai/UserScores";
import { createHistory } from "../Temp";
import { history, HistoryStore, initializeHistory, setPointId } from "./historyStore";
import { theme } from "./themeStore";
import { OngekiTheme } from "../themes/ongeki";

class HistoryHelpers<M extends Mode> {
  history: HistoryStore<M>;

  constructor(history: HistoryStore<M>) { 
    this.history = history;
  }

  getScore(scoreIndex: number) {
    let result = this.history.scores[scoreIndex];
    if (result === undefined) {
      // throw new Error(`Invalid score index given: ${scoreIndex} (max: ${history.scores.length-1})`);
    }
    return result;
  }

  pointToScoreId(pointId: number) : {type: 'version', versionId: number} | {type: 'score', scoreId: number} {
    let {scoreIndex, calcIndex, justBumped} = this.history.history!._makeComponents(pointId);
    if (justBumped) {
      return {type: 'version', versionId: calcIndex};
    }
    return {type: 'score', scoreId: scoreIndex};
  }

  getDb(pointId: number) {
    return this.history.history!.calcAtIndex(pointId).db;
  }

  getSong(pointId: number, chartId: string) {
    let db = this.getDb(pointId);
    let chart = db.getChart(chartId);
    if (chart === null) {
      // throw new Error(`Invalid chart id given: ${chartId} at point index ${pointId}`);
    }
    return chart?.song;
  }

  getChart(pointId: number, chartId: string) {
    // TODO: refactor this together with historyGetSong
    let db = this.getDb(pointId);
    let chart = db.getChart(chartId);
    if (chart === null) {
      // throw new Error(`Invalid chart id given: ${chartId} at point index ${pointId}`);
      return null;
    }
    return {chart: chart, song: chart.song};
  }

  getVersion(versionIndex: number) {
    let result = this.history.versions[versionIndex];
    if (result === undefined) {
      throw new Error(`Invalid version index given: ${versionIndex} (max: ${this.history.versions.length-1})`);
    }
    return result;
  }

  getTimestamp(pointId: number) {
    let timestamp = this.history.chartData.timestamps[pointId];
    if (timestamp === undefined) {
      throw new Error(`Invalid pointId given: ${pointId} (max: ${this.history.chartData.timestamps.length})`);
    }
    return new Date(timestamp);
  }

  numPoints() {
    return this.history.chartData.timestamps.length;
  }
}

export enum Mode {
    ONGEKI,
    REFRESH,
}

// TODO: make types for these
// type RefreshHistory = HistoryStore;
type RefreshTheme = typeof OngekiTheme;

type Theme<M extends Mode> =
    M extends Mode.ONGEKI ? typeof OngekiTheme :
    M extends Mode.REFRESH ? RefreshTheme :
    never;

type HistoryType<M extends Mode> = HistoryStore<M>;

type State<M extends Mode> = {
    mode: M,
    history: HistoryType<M>,
    setPointId: typeof setPointId,
    helpers: HistoryHelpers<M>,
    theme: Theme<M>,
}

const [STATE, setState] = createSignal<State<Mode.ONGEKI> | State<Mode.REFRESH> | null>(null);

// todo: rename this function to initializeHistory
export function initializeState(scoredb: UserScoreDatabase, options: Parameters<typeof createHistory>[1]) {
    batch(() => {
      initializeHistory(scoredb, options);
      let realHistory = history as HistoryType<Mode.REFRESH>;
      let _state = {
          mode: Mode.REFRESH as const,
          history: realHistory,
          setPointId: setPointId,
          helpers: new HistoryHelpers(realHistory),
          theme: theme,
      };
      console.log("Setting initializeState", _state);
      setState(_state);
    });
}

export function unpackHistory<M extends Mode>() {
    let state = STATE();
    if (state === null) {
        throw new Error();
    }
    // can typecast the state as needed
    return state as State<M>;
}

export function HistoryProvider<M extends Mode>(props: {children: (history: State<M>) => JSXElement}) {
    return (
        <>
        {(() => {
            const state = STATE();
            if (state === null) return null;
            return props.children(state as State<M>);
        })()}
        </>
    );
}