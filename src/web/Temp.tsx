import { UserScoreDatabase } from '../get-kamai/UserScores';
import { RatingHistory } from '../rating/RatingHistory';
import { OngekiCalculator } from '../rating/OngekiCalculator';
import { HistoricalChartDb } from '../rating/chartdb/HistoricalChartDb';
import SONG_DATA from '../../data/song-db.json';
import MY_SCORE_DATA from '../../data/score-data.json';
import { SongData } from '../rating/data/SongData';
import { BellLamp, ClearLamp, OngekiDifficulty } from '../rating/data-types';
import { VersionChangeHistory } from '../rating/VersionChangeHistory';
import { PersonalBests } from '../rating/PersonalBests';
import { ImprovementTracker } from './ImprovementTracker';
import { OngekiRefreshCalculator } from '../rating/OngekiRefreshCalculator';
import { ImprovementRefreshTracker } from './ImprovementRefreshTracker';
import { ChartDataType, ExtendedScore, HistoryStore, VersionImproveRenderData, VersionInformation } from './stores/historyStore';
import { Mode } from "./types";
import { ChartId } from '../rating/chartdb/ChartDb';
import { addWarning } from './stores/warningStore';
import { KamaiScore } from '../get-kamai/UserScores';

function calculateMaxOngekiRating(db: HistoricalChartDb) {
  // Returns a calculator
  let ongeki = new OngekiCalculator(db);

  // For now, doing it "inefficiently" which is adding a score for each chart,
  // I can make it more efficient by iterating every chart, sorting by level,
  // and only adding the hardest best 30 + new 15
  let maximumLevelChart = {
    key: null as null | ChartId,
    level: 0,
  };
  for (let song of Object.values(db.songs)) {
    for (let [diff,chart] of Object.entries(song.charts)) {
      let chartid = db.findChartId({tag: song.tag, difficulty: diff as OngekiDifficulty})!;
      ongeki.addScore({points: 1010000}, chartid);
      if (maximumLevelChart.level < chart.level) {
        maximumLevelChart.key = chartid;
        maximumLevelChart.level = chart.level;
      }
    }
  }

  if (maximumLevelChart.key === null) {
    throw new Error("Error calculating max rating -- maximum level chart is still null");
  }
  for (let i=0; i<10; i++) {
    ongeki.addScore({points: 1010000}, maximumLevelChart.key);
  }
  return ongeki;
}

function calculateMaxRefreshRating(db: HistoricalChartDb) {
  let ongeki = new OngekiRefreshCalculator(db);
  for (let song of Object.values(db.songs)) {
    for (let [diff,chart] of Object.entries(song.charts)) {
      let chartid = db.findChartId({tag: song.tag, difficulty: diff as OngekiDifficulty})!;
      ongeki.addScore({points: 1010000, platinum: chart.maxPlatinumScore, lamps: { bell: BellLamp.FB, clear: ClearLamp.ACB }}, chartid);
    }
  }
  return ongeki;
}

class StuffForOngeki {
  makeScores(scores: UserScoreDatabase['scores']) {
    return scores.map((score, i) => {
      let temp = {
          points: score.kamai.scoreData.score, 
          bells: score.kamai.scoreData.optional.bellCount,
          judgements: score.kamai.scoreData.judgements,
          extra: {id: i, timestamp: score.kamai.timeAchieved}
        };
      return [temp, score.chartId] as [typeof temp, ChartId];
    });
  }

  makeCalculator(db: HistoricalChartDb) {
    return OngekiCalculator.create<{id: number, timestamp: number}>()(db);
  }

  calculateMaxRating(db: HistoricalChartDb) {
    return calculateMaxOngekiRating(db);
  }

  makeImprovementTracker<Calc extends OngekiCalculator<any>>(calc: Calc) {
    return new ImprovementTracker(calc);
  }  

  makeExtendedScore(score: UserScoreDatabase['scores'][number], _calcOutput: any, attemptNumber: number): ExtendedScore<Mode.ONGEKI> {
    let calcOutput = _calcOutput as NonNullable<ReturnType<HistoryStore<Mode.ONGEKI>['history']['getCalcOutput']>>;
    let judges = score.kamai.scoreData.judgements;
    return {
      chartId: score.chartId,
      attemptNumber: attemptNumber,
      points: score.kamai.scoreData.score,
      timeAchieved: score.kamai.timeAchieved,
      kamai: score.kamai,
      rating: calcOutput.rating,
      algo: calcOutput.algo,
      judgements: {
        ...judges,
        damage: score.kamai.scoreData.optional.damage,
        bells: score.kamai.scoreData.optional.bellCount,
      },
      totalJudgements: judges.cbreak + judges.break + judges.hit + judges.miss,
    };
  }

  makeChartData(): ChartDataType<Mode.ONGEKI> {
    return {
      timestamps: [] as number[],
      version: [] as number[],
      plots: {
        naiveRating: { name: 'Naive Rating', data: [] as number[] },
        overallRating: { name: 'Overall Rating', data: [] as number[] },
        maxRating: { name: 'Max Rating', data: [] as number[] },
      }
    };
  }

  addToChartData(chartData: ChartDataType<Mode.ONGEKI>, history: HistoryStore<Mode.ONGEKI>['history'], maxRatings: number[]) {
    chartData.timestamps.push(history.currentTimestamp);
    chartData.plots.overallRating.data.push(history.calc.overallRating);
    chartData.plots.naiveRating.data.push(history.calc.overallNaiveRating);
    chartData.version.push(history.whichCalc);
    chartData.plots.maxRating.data.push(maxRatings[history.whichCalc]!);
  }
}

class StuffForRefresh {
  makeScores(scores: UserScoreDatabase['scores']) {
    return scores.map((score, i) => {
      let temp = {
          points: score.kamai.scoreData.score, 
          platinum: score.kamai.scoreData.platinumScore, 
          bells: score.kamai.scoreData.optional.bellCount,
          judgements: score.kamai.scoreData.judgements,
          extra: {id: i, timestamp: score.kamai.timeAchieved}
        };
      return [temp, score.chartId] as [typeof temp, ChartId];
    });
  }

  makeCalculator(db: HistoricalChartDb) {
    return OngekiRefreshCalculator.create<{id: number, timestamp: number}>()(db);
  }

  calculateMaxRating(db: HistoricalChartDb) {
    return calculateMaxRefreshRating(db);
  }

  makeImprovementTracker<Calc extends OngekiRefreshCalculator<any>>(calc: Calc) {
    return new ImprovementRefreshTracker(calc);
  }

  makeExtendedScore(score: UserScoreDatabase['scores'][number], _calcOutput: any, attemptNumber: number): ExtendedScore<Mode.REFRESH> {
    let calcOutput = _calcOutput as NonNullable<ReturnType<HistoryStore<Mode.REFRESH>['history']['getCalcOutput']>>;
    let judges = score.kamai.scoreData.judgements;
    return {
      chartId: score.chartId,
      points: score.kamai.scoreData.score,
      attemptNumber: attemptNumber,
      timeAchieved: score.kamai.timeAchieved,
      kamai: score.kamai,
      rating: calcOutput.rating,
      techAlgo: calcOutput.algo,
      platAlgo: calcOutput.platAlgo,
      platRating: calcOutput.platRating,
      platScore: score.kamai.scoreData.platinumScore,
      judgements: {
        ...judges,
        damage: score.kamai.scoreData.optional.damage,
        bells: score.kamai.scoreData.optional.bellCount,
      },
      totalJudgements: judges.cbreak + judges.break + judges.hit + judges.miss,
    };
  }

  makeChartData(): ChartDataType<Mode.REFRESH> {
    return {
      timestamps: [] as number[],
      version: [] as number[],
      plots: {
        naiveRating: { name: 'Naive Rating', data: [] as number[] },
        overallRating: { name: 'Overall Rating', data: [] as number[] },
        maxRating: { name: 'Max Rating', data: [] as number[] },
      }
    };
  }

  addToChartData(chartData: ChartDataType<Mode.REFRESH>, history: HistoryStore<Mode.REFRESH>['history'], maxRatings: number[]) {
    chartData.timestamps.push(history.currentTimestamp);
    chartData.plots.overallRating.data.push(history.calc.overallRating);
    chartData.plots.naiveRating.data.push(history.calc.overallNaiveRating);
    chartData.version.push(history.whichCalc);
    chartData.plots.maxRating.data.push(maxRatings[history.whichCalc]!);
  }
}

type ScoresOf<T> =
  T extends { makeScores: (...args: any[]) => infer U } ? U : never;

type CalculatorOf<T> =
  T extends { makeCalculator: (...args: any[]) => infer V } ? V : never;

function makeHistoryTempFunction<
  T extends {
    makeScores: (scores: any[]) => any;
    makeCalculator: (db: HistoricalChartDb) => any;
  }
>(
  versionChanges: { db: HistoricalChartDb; timestamp: number; }[],
  scores: { chartId: ChartId; kamai: KamaiScore; }[], 
  getRefresh: T
) {
  let scoresArray: ScoresOf<T> = getRefresh.makeScores(scores);

  let history = new VersionChangeHistory(
    versionChanges.map(entry => (
      {
        calculator: getRefresh.makeCalculator(entry.db) as CalculatorOf<T>,
        timestamp: entry.timestamp,
      }
    )),
    scoresArray,
    (s) => s.extra.timestamp
  );

  return {scoresArray, history};
}

type StuffForType<M extends Mode> = 
    M extends Mode.ONGEKI ? StuffForOngeki :
    M extends Mode.REFRESH ? StuffForRefresh :
    never;
  
export type HistoryType<M extends Mode> = ReturnType<typeof makeHistoryTempFunction<StuffForType<M>>>['history'];

export function createHistory<M extends Mode>(scoredb: UserScoreDatabase, mode: M, versions: VersionInformation[], options: {decimalPlaces: number} = {decimalPlaces: 2}) {
  let songData = new SongData(SONG_DATA);

  let getRefresh = function () {
    switch (mode) {
      case Mode.ONGEKI: 
        return new StuffForOngeki();
      case Mode.REFRESH:
        return new StuffForRefresh();
    }
  }();

  let versionChanges = versions.map(v => ({
    db: new HistoricalChartDb(songData, { version: v.version }), 
    timestamp: v.timestamp,
  }));

  let scores = scoredb.scores;
  // TODO: move sorting into scoredb code; make sure scores are always sorted ascending by timestamp
  scores.sort((a, b) => a.kamai.timeAchieved - b.kamai.timeAchieved);

  // Check for scores that don't exist in their given calculator; ignore them
  //  e.g. a bright memory act 3 score shows up when the current version is act 2 (this can happen when playing on data)
  //  - completely ignore the score
  //  - move the score to the very beginning of act 3 (but this breaks chronological ordering)
  let nextVersionIndex = 1;
  let nextVersion = versionChanges[nextVersionIndex];
  let scoresToSkip = new Map<number, number>();
  for (let [i,score] of scores.entries()) {
    let timestamp = score.kamai.timeAchieved;
    while (true) {
      if (nextVersion !== undefined && timestamp >= nextVersion!.timestamp) {
        nextVersionIndex++;
        nextVersion = versionChanges[nextVersionIndex];
      } else {
        break;
      }
    }

    let currVersion = versionChanges[nextVersionIndex-1]!;
    let db = currVersion.db;
    let chart = db.getChart(score.chartId);
    if (chart === null) {
      scoresToSkip.set(i, nextVersionIndex-1);
    }
  }

  if (scoresToSkip.size > 0) {
    let messageHeader = `Some scores were found for songs that did not exist at the time of playing. These scores were ignored.`;
    let messageBody = scoresToSkip.entries().map(([i,versionIndex]) => {
      let score = scores[i]!;
      let versionName = versions[versionIndex]!.name;
      return `${i} (${versionName}): ${score.chartId} at ${new Date(score.kamai.timeAchieved)}`;
    }).toArray().join('\n');
    let span = document.createElement("span");
    span.innerText = `${messageHeader}\n${messageBody}`;
    addWarning(span);
    scores = scores.filter((value, i) => !scoresToSkip.has(i));
  }

  let { scoresArray, history } = makeHistoryTempFunction(versionChanges, scores, getRefresh);

  let versionPointIds = history.versionPointIds;
  if (versionPointIds.length != versions.length - 1) {
    console.warn(versionPointIds);
    console.warn(versions);
    throw new Error("history.versionPointIds mismatched from versions (versionPointIds.length + 1 = versions.length)");
  }
  versions[0]!.pointId = 0;
  versionPointIds.map((value, index) => {
    versions[index+1]!.pointId = value;
  });

  // TODO: properly implement the db argument here...
  let bests = new PersonalBests(scoresArray, versionChanges.at(-1)?.db);
  
  let chartData: ChartDataType<M> = getRefresh.makeChartData();

  let maxRatings = versionChanges.map((x,i) => {
    return getRefresh.calculateMaxRating(x.db).overallRating;
  });

  let extendedScores = [];

  let allImproves: VersionImproveRenderData<M>[] = [];

  let tracker = getRefresh.makeImprovementTracker(history.calc);
  let currWhichCalc = history.whichCalc;
  let verImproves: VersionImproveRenderData<M> = {
    versionId: history.whichCalc,
    improves: [],
  };
  allImproves.push(verImproves);

  for (let i=0; i<history.length; i++) {
    if (history.whichCalc != currWhichCalc) {
      verImproves = {versionId: history.whichCalc, improves: []};
      allImproves.push(verImproves);
      tracker = getRefresh.makeImprovementTracker(history.calc);
      currWhichCalc = history.whichCalc;
    } else {
      let improve = tracker.refresh(history.calc);
      verImproves.improves.push({
        pointId: i,
        scoreId: history.whichScore,
        data: improve,
      });
    }

    getRefresh.addToChartData(chartData, history, maxRatings);
    if (chartData.timestamps.length >= 2 && chartData.timestamps.at(-1) < chartData.timestamps.at(-2)) {
      console.log(history.versionChangeTimestamps);
      throw new Error(`timestamp went backwards at index ${i} ${history.currentTimestamp}`);
    }

    let info = history.getCalcOutput(i);
    if (info !== null) {
      let attemptNumber = bests.howManyTimesHasThisChartBeenPlayed[history.whichScore]!;
      extendedScores[history.whichScore] = getRefresh.makeExtendedScore(scores[history.whichScore]!, info, attemptNumber);
    }

    if (i != history.length-1) {
      history.seek(1);
    }
  }

  return {
    history, 
    scores: extendedScores,
    bests,
    versions,
    improves: allImproves,
    chartData
  };
}

export function loadScoreData(): UserScoreDatabase {
  return MY_SCORE_DATA;
}