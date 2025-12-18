import { HistoricalChartDb } from '../rating/chartdb/HistoricalChartDb';
import { BestFrame } from '../rating/frames/BestFrame';
import { OngekiRecentFrame } from '../rating/frames/OngekiRecentFrame';
import { OngekiCalculator } from '../rating/OngekiCalculator';
import { getPlatinumInformation, OngekiRefreshCalculator } from '../rating/OngekiRefreshCalculator';
import { DisplayFrame, FrameEntry, PlatinumEntry } from './FrameRenderers';
import { HistoryProvider, Mode, State } from './stores/stateStore';

function bestEntries<ChartId extends string, Score extends {points: number, rating: number}>(db: HistoricalChartDb, frame: BestFrame<ChartId, Score>): FrameEntry[] {
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
      scoreId: item.score.extra.id,
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
        scoreId: item.score.extra.id,
      };
    }).filter(x => x !== null);
}

function platinumEntries<ChartId extends string, Score extends {platinum: number, rating: number}>(db: HistoricalChartDb, frame: BestFrame<ChartId, Score>): PlatinumEntry[] {
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
      platinum: item.score.platinum,
      scoreId: item.score.extra.id,
      maxPlatinum: chart.maxPlatinumScore,
    };
  }).filter(x => x !== null);
}

export function OngekiFrameTab<Chart, Score>(props: { pointId: number, calc: OngekiCalculator<Chart, Score> }) {
  let db = () => props.calc.db;
  let songTitle = (helpers, theme) => {
    let pointInfo = helpers.pointToScoreId(props.pointId);
    if (pointInfo.type == 'version') {
      let version = helpers.getVersion(pointInfo.versionId);
      return `Version change to ${version.name}`;
    } else {
      let score = helpers.getScore(pointInfo.scoreId)!;
      let { chart, song } = helpers.getChart(props.pointId, score.chartId) ?? {};
      return <>
        <span>{song?.title} ({chart?.difficulty} {chart?.internalLevel})</span>
        <span>{theme.formatRating(score.rating, pointInfo.scoreId)} / {theme.formatPoints(score.points)}</span>
      </>
    }
  }

  return <HistoryProvider<Mode.ONGEKI>>{({ helpers, theme }) => (<div>
    <div style="display: flex; justify-content: space-between">
      <div>
        <h2>{props.pointId} - {theme.formatDateTime(new Date(helpers.getTimestamp(props.pointId)))}</h2>
        <span>
          {theme.formatFrameRating(props.calc.overallRating, 'total')}
          &nbsp;/ {theme.formatFrameRating(props.calc.best.overallRating, 'best')} 
          &nbsp;/ {theme.formatFrameRating(props.calc.new.overallRating, 'new')} 
          &nbsp;/ {theme.formatFrameRating(props.calc.recent.overallRating, 'recent')}
        </span>
      </div>
      <div style="display: flex; flex-direction: column; font-size: 0.8em; align-items: end">
        {songTitle(helpers, theme)}
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
  )}</HistoryProvider>
}

export function RefreshFrameTab<Chart, Score>(props: { pointId: number, calc: OngekiRefreshCalculator<Chart, Score> }) {
  let db = () => props.calc.db;
  let songTitle = (helpers: State<Mode.REFRESH>['helpers'], theme: State<Mode.REFRESH>['theme']) => {
    let pointInfo = helpers.pointToScoreId(props.pointId);
    if (pointInfo.type == 'version') {
      let version = helpers.getVersion(pointInfo.versionId);
      return `Version change to ${version.name}`;
    } else {
      let score = helpers.getScore(pointInfo.scoreId)!;
      let { chart, song } = helpers.getChart(props.pointId, score.chartId) ?? {};
      let plat = score.platScore;
      let maxPlat = chart?.maxPlatinum;
      let {percentage, stars} = getPlatinumInformation(plat, maxPlat);
      return <>
        <span>{song?.title} ({chart?.difficulty} {chart?.internalLevel})</span>
        <span>{theme.formatRating(score.rating, pointInfo.scoreId)} / {theme.formatPoints(score.points)}</span>
        <span>{theme.formatPlatinumRating(score.platRating, pointInfo.scoreId)} / {theme.formatPlatinumStarsWithBorders(stars, plat, maxPlat)} / {theme.formatPlatinumPercentage(percentage)}</span>
      </>
    }
  }

  return <HistoryProvider<Mode.REFRESH>>{({ helpers, theme }) => (<div>
    <div style="display: flex; justify-content: space-between">
      <div>
        <h2>{props.pointId} - {theme.formatDateTime(new Date(helpers.getTimestamp(props.pointId)))}</h2>
        <span>
          {theme.formatFrameRating(props.calc.overallRating, 'total')}
          &nbsp;/ {theme.formatFrameRating(props.calc.best.overallRating, 'best')} 
          &nbsp;/ {theme.formatFrameRating(props.calc.new.overallRating, 'new')} 
          &nbsp;/ {theme.formatFrameRating(props.calc.plat.overallRating, 'plat')}
        </span>
      </div>
      <div style="display: flex; flex-direction: column; font-size: 0.8em; align-items: end">
        {songTitle(helpers, theme)}
      </div>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr;">
      <div style="display: flex; flex-direction: column">
        <DisplayFrame data={bestEntries(db(), props.calc.best)} title="Best" color={theme.frameColors['best']} rows={50} />
      </div>
      <div style="display: flex; flex-direction: column">
        <DisplayFrame data={bestEntries(db(), props.calc.new)} title="New" color={theme.frameColors['new']} rows={10} />
        <DisplayFrame platinum={true} data={platinumEntries(db(), props.calc.plat)} title="Platinum" color={theme.frameColors['plat']} rows={50} />
      </div>
    </div>
  </div>
  )}</HistoryProvider>
}