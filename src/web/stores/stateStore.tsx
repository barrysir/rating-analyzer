import { batch, createSignal, JSXElement } from "solid-js";
import { UserScoreDatabase } from "../../UserScoreDatabase";
import { createHistory } from "../Temp";
import { HistoryStore, initializeHistory, VersionInformation } from "./historyStore";
import { theme } from "./themeStore";
import { OngekiTheme } from "../themes/ongeki";
import { ChartId } from "../../rating/chartdb/ChartDb";
import { createStore } from "solid-js/store";
import { Mode } from "../types";
import { SongData } from "../../rating/data/SongData";

export class HistoryHelpers<M extends Mode> {
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

  getUndo(scoreIndex: number, calcIndex?: number) {
    if (calcIndex === undefined) {
      // if not specified, default to the calculator this score "belongs" to
      calcIndex = this.history.history.scoreIndexToCalcIndex(scoreIndex);
    }
    return this.history.history.getUndo(scoreIndex, calcIndex);
  }

  pointToScoreId(pointId: number) : {type: 'version', versionId: number} | {type: 'score', scoreId: number} {
    let {scoreIndex, calcIndex, justBumped} = this.history.history!._makeComponents(pointId);
    if (justBumped) {
      return {type: 'version', versionId: calcIndex};
    }
    return {type: 'score', scoreId: scoreIndex};
  }

  scoreToPointId(scoreId: number) {
    // Probably something like (scoreId) + (calculator index at scoreId)
    // but not needed right now
    throw new Error("Not implemented");
  }

  getDb(pointId: number) {
    return this.history.history!.calcAtIndex(pointId).db;
  }

  getSong(pointId: number, chartId: ChartId) {
    let db = this.getDb(pointId);
    let chart = db.getChart(chartId);
    if (chart === null) {
      // throw new Error(`Invalid chart id given: ${chartId} at point index ${pointId}`);
    }
    return chart?.song;
  }

  getChart(pointId: number, chartId: ChartId) {
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

// TODO: make types for these
// type RefreshHistory = HistoryStore;
type RefreshTheme = typeof OngekiTheme;

export type Theme<M extends Mode> =
    M extends Mode.ONGEKI ? typeof OngekiTheme :
    M extends Mode.REFRESH ? RefreshTheme :
    never;

export type State<M extends Mode> = {
    mode: M,
    history: HistoryStore<M>,
    setPointId: (pointId: number) => void,
    helpers: HistoryHelpers<M>,
    theme: Theme<M>,
}

function setPointId(pointId: number) {
  batch(() => {
    STATE.history!.history.goto(pointId);
    STATE.history!.bests.goto(pointId);
    setState('history', 'pointId', pointId);
  });
}

const [STATE, setState] = createStore<State<Mode.ONGEKI> | State<Mode.REFRESH> | Partial<State<Mode.ONGEKI>>>({
  setPointId: setPointId,
});

// todo: rename this function to initializeHistory
export function initializeState<M extends Mode>(scoredb: UserScoreDatabase, db: SongData, mode: M, versions: VersionInformation[], options: Parameters<typeof createHistory>[4]) {
    batch(() => {
      let history = initializeHistory(scoredb, db, mode, versions, options);
      // let _state: State<M> = {
      //     mode: mode,
      //     history: history,
      //     setPointId: setPointId,
      //     helpers: new HistoryHelpers(history),
      //     theme: theme as Theme<M>,
      // };
      console.log("Setting initializeState", history.history.currentIndex);
      setState('mode', mode);
      setState('history', history);
      setState('helpers', new HistoryHelpers(history));
      setState('theme', theme);
    });
}

export function unpackHistory<M extends Mode>() {
    let state = STATE;
    if (state.mode == null) {
        throw new Error();
    }
    // can typecast the state as needed
    return state as State<M>;
}

export function HistoryProvider<M extends Mode>(props: {children: (history: State<M>) => JSXElement}) {
    return (
        <>
        {(() => {
            const state = STATE;
            if (state.mode == null) return null;
            return props.children(state as State<M>);
        })()}
        </>
    );
}