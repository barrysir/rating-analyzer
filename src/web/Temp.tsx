import { UserScoreDatabase } from '../get-kamai/UserScores';
import { RatingHistory } from '../rating/RatingHistory';
import { OngekiCalculator } from '../rating/OngekiCalculator';
import { HistoricalChartDb } from '../rating/chartdb/HistoricalChartDb';
import SONG_DATA from '../rating/data/song-db.json';
import MY_SCORE_DATA from "../../1243.json";
import { SongData } from '../rating/data/SongData';
import { MultiRatingHistory } from '../rating/MultiRatingHistory';
import { findRegion } from '../rating/utils';

function dateToUnix(date: Date): number {
  return Math.floor(date.getTime());
}

export function createHistory(scoredb: UserScoreDatabase, options: {decimalPlaces: number} = {decimalPlaces: 2}) {
  let songData = new SongData(SONG_DATA);

  let calculators = {
    bright: OngekiCalculator.create<{id: number, timestamp: number}>()(new HistoricalChartDb(songData, { version: 'bright' })),
    act2: OngekiCalculator.create<{id: number, timestamp: number}>()(new HistoricalChartDb(songData, { version: 'bright MEMORY Act.2' })),
    act3: OngekiCalculator.create<{id: number, timestamp: number}>()(new HistoricalChartDb(songData, { version: 'bright MEMORY Act.3' })),
  };

  // let generateRatingPoint = 

  // let historyScores = ;


  let scores = scoredb.scores;
  // TODO: move sorting into scoredb code; make sure scores are always sorted ascending by timestamp
  scores.sort((a, b) => a.kamai.timeAchieved - b.kamai.timeAchieved);

  let versionChangeTimestamps = [
    0,
    dateToUnix(new Date("2023-10-31")),
    dateToUnix(new Date("2025-04-27")),
  ];

  let multi = new MultiRatingHistory(
    [calculators.bright, calculators.act2, calculators.act3],
    scores.map((score, i) => {
      return [
        {points: score.kamai.scoreData.score, score: {id: i, timestamp: score.kamai.timeAchieved}}, 
        {tag: score.tag, difficulty: score.difficulty},
      ]
    }),
    (score) => {
      return findRegion(versionChangeTimestamps, score.score.timestamp, x => x)!;
    }
  );

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
  };
  
  for (let i=0; i<history.length; i++) {
    history.seek(1);
    let [score, chart] = history.scores[i]!;
    let kamai = scoredb.scores[score.score.id]!.kamai;
    chartData.timestamps.push(kamai.timeAchieved);
    chartData.overallRating.push(history.calc.overallRating);
    chartData.naiveRating.push(history.calc.overallNaiveRating);
    chartData.version.push(history.selectedCalc);
  }

  return {
    history, 
    chartData
  };
}

export function loadScoreData(): UserScoreDatabase {
  return MY_SCORE_DATA;
}
