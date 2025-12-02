import { UserScoreDatabase } from '../get-kamai/UserScores';
import { RatingHistory } from '../rating/RatingHistory';
import { OngekiCalculator } from '../rating/OngekiCalculator';
import { HistoricalChartDb } from '../rating/chartdb/HistoricalChartDb';
import SONG_DATA from '../../data/song-db.json';
import MY_SCORE_DATA from '../../data/score-data.json';
import { SongData } from '../rating/data/SongData';
import { OngekiDifficulty } from '../rating/data-types';
import { VersionChangeHistory } from '../rating/VersionChangeHistory';
import { PersonalBests } from '../rating/PersonalBests';
import { FrameRating, ImprovementTracker } from './ImprovementTracker';
import { KamaiScore } from '../get-kamai/kamai';

function dateToUnix(date: Date): number {
  return Math.floor(date.getTime());
}

function calculateMaxRating(db: HistoricalChartDb) {
  // Returns a calculator
  let ongeki = new OngekiCalculator(db);

  // For now, doing it "inefficiently" which is adding a score for each chart,
  // I can make it more efficient by iterating every chart, sorting by level,
  // and only adding the hardest best 30 + new 15
  let maximumLevelChart = {
    key: null as null | {tag: string, difficulty: OngekiDifficulty},
    level: 0,
  };
  for (let song of Object.values(db.songs)) {
    for (let [diff,chart] of Object.entries(song.charts)) {
      let key = {tag: song.tag, difficulty: diff as OngekiDifficulty};
      ongeki.addScore({points: 1010000}, key);
      if (maximumLevelChart.level < chart.level) {
        maximumLevelChart.key = key;
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

type ExtendedScore = {
  chartId: string;
  rating: number;
  points: number;
  timeAchieved: number;
  kamai: KamaiScore;
};

export function createHistory(scoredb: UserScoreDatabase, options: {decimalPlaces: number} = {decimalPlaces: 2}) {
  let songData = new SongData(SONG_DATA);

  let versionChanges = [
    {db: new HistoricalChartDb(songData, { version: 'bright' }), timestamp: 0},
    {db: new HistoricalChartDb(songData, { version: 'bright MEMORY Act.2' }), timestamp: dateToUnix(new Date("2023-10-31"))},
    {db: new HistoricalChartDb(songData, { version: 'bright MEMORY Act.3' }), timestamp: dateToUnix(new Date("2025-04-27"))},
  ];

  let scores = scoredb.scores;
  // TODO: move sorting into scoredb code; make sure scores are always sorted ascending by timestamp
  scores.sort((a, b) => a.kamai.timeAchieved - b.kamai.timeAchieved);

  let extendedScores = scores.map((score) => {
    let a: Omit<ExtendedScore, 'rating'> = {
      chartId: score.chartId,
      points: score.kamai.scoreData.score,
      timeAchieved: score.kamai.timeAchieved,
      kamai: score.kamai,
    };
    return a as ExtendedScore;
  });

  let scoresArray = scores.map((score, i) => {
    return [
      {points: score.kamai.scoreData.score, score: {id: i, timestamp: score.kamai.timeAchieved}}, 
      score.chartId,
    ] as [{points: number, score: {id: number, timestamp: number}}, string]
  });

  let history = new VersionChangeHistory(
    versionChanges.map(entry => (
      {
        calculator: OngekiCalculator.create<{id: number, timestamp: number}>()(entry.db),
        timestamp: entry.timestamp,
      }
    )),
    scoresArray,
    (s) => s.score.timestamp
  );

  let bests = new RatingHistory(new PersonalBests(new HistoricalChartDb(songData)), scoresArray);
  
  let chartData = {
    timestamps: [] as number[],
    overallRating: [] as number[],
    naiveRating: [] as number[],
    version: [] as number[],
    maxRating: [] as number[],
  };

  let maxRatings = versionChanges.map((x,i) => {
    return calculateMaxRating(x.db).overallRating;
  });

  let allImproves: VersionImproveRenderData[] = [];

  let tracker = new ImprovementTracker(history.calc);
  let currWhichCalc = history.whichCalc;
  let verImproves: VersionImproveRenderData = {
    pointId: 0,
    improves: [],
  };
  allImproves.push(verImproves);

  for (let i=0; i<history.length; i++) {
    if (history.whichCalc != currWhichCalc) {
      verImproves = {pointId: i, improves: []};
      allImproves.push(verImproves);
      tracker = new ImprovementTracker(history.calc);
      currWhichCalc = history.whichCalc;
    } else {
      let improve = tracker.refresh(history.calc);
      if (improve.isImprovement) {
        verImproves.improves.push({
          pointId: i,
          scoreId: history.whichScore,
          data: improve,
        });
      }
    }

    chartData.timestamps.push(history.currentTimestamp);
    if (chartData.timestamps.length >= 2 && chartData.timestamps.at(-1) < chartData.timestamps.at(-2)) {
      console.log(history.versionChangeTimestamps);
      throw new Error(`timestamp went backwards at index ${i} ${history.currentTimestamp}`);
    }
    chartData.overallRating.push(history.calc.overallRating);
    chartData.naiveRating.push(history.calc.overallNaiveRating);
    chartData.version.push(history.whichCalc);
    chartData.maxRating.push(maxRatings[history.whichCalc]);

    let info = history.getCalcOutput(i);
    if (info !== null) {
      if (info.rating !== undefined) {
        extendedScores[history.whichScore]!.rating = info.rating;
      }
    }

    if (i != history.length-1) {
      history.seek(1);
    }
  }
  // bests.seek(history.currentIndex);

  return {
    history, 
    scores: extendedScores,
    bests,
    improves: allImproves,
    chartData
  };
}

export type VersionImproveRenderData = {
  pointId: number,
  improves: {
    pointId: number,
    scoreId: number,
    data: FrameRating,
  }[],
};

export function loadScoreData(): UserScoreDatabase {
  return MY_SCORE_DATA;
}
