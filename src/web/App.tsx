import type { Component } from 'solid-js';
import { UserScoreDatabase } from '../get-kamai/UserScores';
import { RatingHistory } from '../rating/RatingHistory';
import { OngekiCalculator } from '../rating/OngekiCalculator';
import { HistoricalChartDb } from '../rating/chartdb/HistoricalChartDb';
import SONG_DATA from '../rating/data/song-db.json';

function createHistory(scoredb: UserScoreDatabase) {
  let db = new HistoricalChartDb(SONG_DATA);
  let ongeki = new OngekiCalculator(db);
  let history = new RatingHistory(ongeki, scoredb.scores.map(score => {
    return [
      {points: score.kamai.scoreData.score}, 
      {tag: score.tag, difficulty: score.difficulty},
    ]
  }));
  return history;
}

const App: Component = () => {
  return (
    <p class="text-4xl text-green-700 text-center py-20">Hello tailwind!</p>
  );
};

export default App;
