import { HistoricalChartDb } from '../rating/chartdb/HistoricalChartDb';
import { BestFrame } from '../rating/frames/BestFrame';
import { OngekiRecentFrame } from '../rating/frames/OngekiRecentFrame';
import { OngekiCalculator } from '../rating/OngekiCalculator';
import { DisplayFrame } from './FrameRenderers';
import { history } from './stores/historyStore';

function bestEntries<ChartId extends string, Score extends {points: number, rating: number}>(db: HistoricalChartDb, frame: BestFrame<ChartId, Score>) {
  return frame.frame.map((item) => {
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
}

function recentEntries<Score extends {points: number, rating: number}>(db: HistoricalChartDb, frame: OngekiRecentFrame<Score>) {
    return frame.getTop().map((item) => {
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
}

export function OngekiRatingRenderer<Chart, Score>(props: { scoreIndex: number, calc: OngekiCalculator<Chart, Score> }) {
  let db = () => history.history!.calc.db;

  return <div>
    <h2>{props.scoreIndex} - {props.calc.overallRating} ({props.calc.best.totalRating} - {props.calc.new.totalRating} - {props.calc.recent.totalRating})</h2>
    <div style="display: grid; grid-template-columns: 1fr 1fr;">
      <div style="display: flex; flex-direction: column">
        <DisplayFrame data={bestEntries(db(), props.calc.best)} title="Best" color="blue" rows={30} />
      </div>
      <div style="display: flex; flex-direction: column">
        <DisplayFrame data={bestEntries(db(), props.calc.new)} title="New" color="green" rows={15} />
        <DisplayFrame data={recentEntries(db(), props.calc.recent)} title="Recent" color="red" rows={10} />
      </div>
    </div>
  </div>
}