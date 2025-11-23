import { For } from 'solid-js';
import { history } from './stores/historyStore';
import { AgeFrameSnapshot } from '../rating/frames/AgeFrame';
import { HistoricalChartDb } from '../rating/chartdb/HistoricalChartDb';
import { OngekiRecentFrame } from '../rating/frames/OngekiRecentFrame';

export function RecentFrameRenderer<Score extends {points: number, rating: number}>(props: {snapshot: OngekiRecentFrame<Score>}) {
  return <div style="display: flex; flex-direction: column; font-size: 0.8em; border: 1px solid black; border-radius: 4px;">
    <For each={props.snapshot.frame.byRating}>
      {(item, index) => {
        let db: HistoricalChartDb = history.history!.calc.db;
        let key = db.parseChartId(item.id);
        let a = db.findChart(key);
        if (a === null) {
          return null;
        }
        let {song, chart, difficulty} = a;

        return <span>{item.score.rating} {item.score.points} {song.artist} - {song.title} ({difficulty} {chart.level})</span>
      }}
    </For>  
  </div>
}