import { For } from 'solid-js';
import { history } from './stores/historyStore';
import { OngekiCalculator } from '../rating/OngekiCalculator';
import { HistoricalChartDb } from '../rating/chartdb/HistoricalChartDb';
import { BestFrame, BestFrameSnapshot } from '../rating/frames/BestFrame';
import { BestFrameRenderer } from './BestFrameRenderer';
import { RecentFrameRenderer } from './RecentFrameRenderer';

export function OngekiRatingRenderer<Chart, Score>(props: { scoreIndex: number, calc: OngekiCalculator<Chart, Score> }) {
  return <div>
    <h2>{props.scoreIndex} - {props.calc.overallRating} ({props.calc.best.totalRating} - {props.calc.new.totalRating} - {props.calc.recent.totalRating})</h2>
    <div style="display: grid; grid-template-columns: 1fr 1fr;">
      <div style="display: flex; flex-direction: column">
        <BestFrameRenderer snapshot={props.calc.best.makeSnapshot()} />
      </div>
      <div style="display: flex; flex-direction: column">
        <BestFrameRenderer snapshot={props.calc.new.makeSnapshot()} />
        <RecentFrameRenderer snapshot={props.calc.recent.makeSnapshot()} />
      </div>
    </div>
  </div>
}