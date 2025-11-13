import type { Component } from 'solid-js';
import { UserScoreDatabase } from '../get-kamai/UserScores';
import { RatingHistory } from '../rating/RatingHistory';
import { OngekiCalculator } from '../rating/OngekiCalculator';
import { HistoricalChartDb } from '../rating/chartdb/HistoricalChartDb';
import SONG_DATA from '../rating/data/song-db.json';
import MY_SCORE_DATA from "../../1243.json";
import { OngekiDifficulty } from '../rating/data-types';
import { SongData } from '../rating/data/SongData';
import { RatingChart } from './RatingChart';

function createHistory(scoredb: UserScoreDatabase) {
  let db = new HistoricalChartDb(new SongData(SONG_DATA), { version: 'bright MEMORY Act.3' });
  let ongeki = new OngekiCalculator(db);

  // let generateRatingPoint = 

  // let historyScores = ;

  // maybe it's better to have it as lazy and generate undos and snapshots as asked (but it's more complicated to implement that way)

  let chartData = {
    timestamps: [] as number[],
    overallRating: [] as number[],
    naiveRating: [] as number[],
  };

  let scores = scoredb.scores;
  scores.sort((a, b) => a.kamai.timeAchieved - b.kamai.timeAchieved);

  let history = new RatingHistory(
    ongeki, 
    scores.map((score, i) => {
      return [
        {points: score.kamai.scoreData.score, score: i}, 
        {tag: score.tag, difficulty: score.difficulty},
      ]
    }), 
    {
      callback: (calc, score, chart) => {
        let kamai = scoredb.scores[score.score]!.kamai;
        chartData.timestamps.push(kamai.timeAchieved);
        chartData.overallRating.push(calc.overallRating);
        chartData.naiveRating.push(calc.overallNaiveRating);
      }
    }
  );
  return {
    history, 
    chartData
  };
}

function loadScoreData(): UserScoreDatabase {
  return MY_SCORE_DATA;
}

const App: Component = () => {
  let { history, chartData } = createHistory(loadScoreData());

  return <div style="width: 100vh; height: 100vh; display: grid; grid-template-columns: 7fr 3fr;">
    <RatingChart data={chartData} />
    <div>Hi!</div>
  </div>
};

export default App;
