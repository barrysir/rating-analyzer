import { UserScoreDatabase } from '../get-kamai/UserScores';
import { RatingHistory } from '../rating/RatingHistory';
import { OngekiCalculator } from '../rating/OngekiCalculator';
import { HistoricalChartDb } from '../rating/chartdb/HistoricalChartDb';
import SONG_DATA from '../rating/data/song-db.json';
import MY_SCORE_DATA from "../../1243.json";
import { SongData } from '../rating/data/SongData';

export function createHistory(scoredb: UserScoreDatabase, options: {decimalPlaces: number} = {decimalPlaces: 2}) {
  let db = new HistoricalChartDb(new SongData(SONG_DATA), { version: 'bright MEMORY Act.3' });
  let ongeki = new OngekiCalculator(db);

  // let generateRatingPoint = 

  // let historyScores = ;

  let scores = scoredb.scores;
  // TODO: move sorting into scoredb code; make sure scores are always sorted ascending by timestamp
  scores.sort((a, b) => a.kamai.timeAchieved - b.kamai.timeAchieved);

  let history = new RatingHistory(
    ongeki, 
    scores.map((score, i) => {
      return [
        {points: score.kamai.scoreData.score, id: i}, 
        {tag: score.tag, difficulty: score.difficulty},
      ]
    })
  );
  
  let chartData = {
    timestamps: [] as number[],
    overallRating: [] as number[],
    naiveRating: [] as number[],
  };
  
  for (let i=0; i<history.length; i++) {
    history.seek(1);
    let [score, chart] = history.scores[i]!;
    let kamai = scoredb.scores[score.id]!.kamai;
    chartData.timestamps.push(kamai.timeAchieved);
    chartData.overallRating.push(history.calc.overallRating);
    chartData.naiveRating.push(history.calc.overallNaiveRating);
  }

  return {
    history, 
    chartData
  };
}

export function loadScoreData(): UserScoreDatabase {
  return MY_SCORE_DATA;
}
