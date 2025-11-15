import { UserScoreDatabase } from '../get-kamai/UserScores';
import { RatingHistory } from '../rating/RatingHistory';
import { OngekiCalculator } from '../rating/OngekiCalculator';
import { HistoricalChartDb } from '../rating/chartdb/HistoricalChartDb';
import SONG_DATA from '../../data/song-db.json';
import MY_SCORE_DATA from '../../data/score-data.json';
import { SongData } from '../rating/data/SongData';
import { MultiRatingHistory } from '../rating/MultiRatingHistory';
import { findRegion } from '../rating/utils';
import { OngekiDifficulty } from '../rating/data-types';
import { VersionChangeHistory } from '../rating/VersionChangeHistory';

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

  let multi = new VersionChangeHistory(
    versionChanges.map(entry => (
      {
        calculator: OngekiCalculator.create<{id: number, timestamp: number}>()(entry.db),
        timestamp: entry.timestamp,
      }
    )),
    scores.map((score, i) => {
      return [
        {points: score.kamai.scoreData.score, score: {id: i, timestamp: score.kamai.timeAchieved}}, 
        {tag: score.tag, difficulty: score.difficulty},
      ]
    }),
    (s) => s.score.timestamp
  );

  // let multi = new MultiRatingHistory(
  //   calculators,
    // scores.map((score, i) => {
    //   return [
    //     {points: score.kamai.scoreData.score, score: {id: i, timestamp: score.kamai.timeAchieved}}, 
    //     {tag: score.tag, difficulty: score.difficulty},
    //   ]
    // }),
  //   (score) => {
  //     return findRegion(versionChanges, score.score.timestamp, x => x.timestamp)!;
  //   }
  // );

  let history = multi;

  // let history = new RatingHistory(
  //   ongeki, 
  //   scores.map((score, i) => {
  //     return [
  //       {points: score.kamai.scoreData.score, id: i}, 
  //       {tag: score.tag, difficulty: score.difficulty},
  //     ]
  //   })
  // );
  
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
  
  for (let i=0; i<history.length; i++) {
    history.seek(1);
    chartData.timestamps.push(history.currentTimestamp);
    if (chartData.timestamps.length >= 2 && chartData.timestamps.at(-1) < chartData.timestamps.at(-2)) {
      console.log(history.versionChangeTimestamps);
      throw new Error(`timestamp went backwards at index ${i} ${history.currentTimestamp}`);
    }
    chartData.overallRating.push(history.calc.overallRating);
    chartData.naiveRating.push(history.calc.overallNaiveRating);
    chartData.version.push(history.whichCalc);
    chartData.maxRating.push(maxRatings[history.whichCalc]);
  }

  return {
    history, 
    chartData
  };
}

export function loadScoreData(): UserScoreDatabase {
  return MY_SCORE_DATA;
}
