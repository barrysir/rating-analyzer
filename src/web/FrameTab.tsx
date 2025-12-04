import { HistoricalChartDb } from '../rating/chartdb/HistoricalChartDb';
import { BestFrame } from '../rating/frames/BestFrame';
import { OngekiRecentFrame } from '../rating/frames/OngekiRecentFrame';
import { OngekiCalculator } from '../rating/OngekiCalculator';
import { DisplayFrame } from './FrameRenderers';
import { history, historyGetChart, historyGetScore, historyGetSong, historyGetTimestamp, historyGetVersion, historyPointToScoreId } from './stores/historyStore';
import { theme } from './stores/themeStore';

function bestEntries<ChartId extends string, Score extends {points: number, rating: number}>(db: HistoricalChartDb, frame: BestFrame<ChartId, Score>) {
  return frame.frame.map((item) => {
    let a = db.findChart(item.id);
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
      let a = db.findChart(item.id);
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

export function OngekiFrameTab<Chart, Score>(props: { pointId: number, calc: OngekiCalculator<Chart, Score> }) {
  let db = () => props.calc.db;
  let songTitle = () => {
    let pointInfo = historyPointToScoreId(props.pointId);
    if (pointInfo.type == 'version') {
      let version = historyGetVersion(pointInfo.versionId);
      return `Version change to ${version.name}`;
    } else {
      let score = historyGetScore(pointInfo.scoreId)!;
      let { chart, song } = historyGetChart(props.pointId, score.chartId) ?? {};
      return <>
        <span>{song?.title} ({chart?.difficulty} {chart?.internalLevel})</span>
        <span>{theme.formatRating(score.rating)} / {theme.formatPoints(score.points)}</span>
      </>
    }
  }

  return <div>
    <div style="display: flex; justify-content: space-between">
      <div>
        <h2>{props.pointId} - {theme.formatDateTime(new Date(historyGetTimestamp(props.pointId)))}</h2>
        <span>
          {theme.formatFrameRating(props.calc.overallRating, 'total')}
          &nbsp;/ {theme.formatFrameRating(props.calc.best.overallRating, 'best')} 
          &nbsp;/ {theme.formatFrameRating(props.calc.new.overallRating, 'new')} 
          &nbsp;/ {theme.formatFrameRating(props.calc.recent.overallRating, 'recent')}
        </span>
      </div>
      <div style="display: flex; flex-direction: column; font-size: 0.8em; align-items: end">
        {songTitle()}
      </div>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr;">
      <div style="display: flex; flex-direction: column">
        <DisplayFrame data={bestEntries(db(), props.calc.best)} title="Best" color={theme.frameColors['best']} rows={30} />
      </div>
      <div style="display: flex; flex-direction: column">
        <DisplayFrame data={bestEntries(db(), props.calc.new)} title="New" color={theme.frameColors['new']} rows={15} />
        <DisplayFrame data={recentEntries(db(), props.calc.recent)} title="Recent" color={theme.frameColors['recent']} rows={10} />
      </div>
    </div>
  </div>
}