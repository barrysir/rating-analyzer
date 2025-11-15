import { For } from 'solid-js';
import { history } from './stores/historyStore';
import { OngekiCalculator } from '../rating/OngekiCalculator';
import { HistoricalChartDb } from '../rating/chartdb/HistoricalChartDb';

export function FrameRenderer<Chart, Score>(props: {scoreIndex: number, frame: any, calc: OngekiCalculator<Chart, Score>}) {
  return <div style="display: flex; flex-direction: column; font-size: 0.8em;">
    <h2>{props.scoreIndex}</h2>
    <For each={props.frame}>
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