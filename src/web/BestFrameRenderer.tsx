import { For } from 'solid-js';
import { history } from './stores/historyStore';
import { OngekiCalculator } from '../rating/OngekiCalculator';
import { HistoricalChartDb } from '../rating/chartdb/HistoricalChartDb';
import { BestFrame, BestFrameSnapshot } from '../rating/frames/BestFrame';
import "./BestFrameRenderer.css";

type FrameEntry = {
  rating: number;
  title: string;
  level: number;
  points: number;
}

function DisplayFrame(props: {data: FrameEntry[]}) {
    return <div style="font-size: 0.8em; border: 1px solid black; border-radius: 4px; overflow: hidden;">
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr>
          <th>Rating</th>
          <th>Title</th>
          <th>Level</th>
          <th>Points</th>
        </tr>
      </thead>
      <tbody>
        <For each={props.data}>
          {(item, index) => {
            return <tr>
              <td>{item.rating.toFixed(2)}</td>
              <td style="width: 100%;">{item.title}</td>
              <td>{item.level}</td>
              <td>{item.points}</td>
            </tr>
          }}
        </For>
      </tbody>
    </table>
  </div>
}

export function BestFrameRenderer<ChartId extends string, Score extends {points: number, rating: number}>(props: {snapshot: BestFrame<ChartId, Score>}) {
  let entries = () => {
    let db: HistoricalChartDb = history.history!.calc.db;
    return props.snapshot.frame.map((item) => {
      let key = db.parseChartId(item.id);
      let a = db.findChart(key);
      if (a === null) {
        return null;
      }
      let {song, chart} = a;

      return {
        rating: item.score.rating,
        title: song.title,
        level: chart.level,
        points: item.score.points,
      };
    }).filter(x => x !== null);
  };

  return <DisplayFrame data={entries()} />
}
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