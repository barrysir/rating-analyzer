import { createMemo, For, Match, Show, Switch } from "solid-js";
import { makeChartId } from "../get-kamai/KamaiSongData";
import { ChartId } from "../rating/chartdb/ChartDb";
import { HistoricalChartDb } from "../rating/chartdb/HistoricalChartDb";
import { BellLamp, ClearLamp, OngekiDifficulty } from "../rating/data-types";
import { Mode } from "./stores/stateStore";
import { HistoryStore } from "./stores/historyStore";
import { OngekiLampDisplay } from "../rating/PersonalBests";

type ChartInformation = {
    jacketUrl: string,
    title: string,
    chartId: ChartId,
};

function TextWithCircle(props) {
    return <div style="width: 15px; height: 15px; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: white; font-size: 8px">
        {props.children}
    </div>
}

function ChartTileNumber(props: {constant: number}) {
    return <div style="width: 100px; height: 100px; border: 2px solid black; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 1.2em">
        {props.constant}
    </div>
}

function BellLampBadge(props: {lamp: BellLamp}) {
    return <Show when={props.lamp == BellLamp.FB}>
        <TextWithCircle>FB</TextWithCircle>
    </Show>
}

function ClearLampBadge(props: {lamp: ClearLamp}) {
    return <Switch>
        <Match when={props.lamp == ClearLamp.FC}>
            <TextWithCircle>FC</TextWithCircle>
        </Match>
        <Match when={props.lamp == ClearLamp.AB}>
            <TextWithCircle>AB</TextWithCircle>
        </Match>
        <Match when={props.lamp == ClearLamp.ACB}>
            <TextWithCircle>AB+</TextWithCircle>
        </Match>
    </Switch>
}

function ChartTile(props: {info: ChartInformation, score: {points: number, lamps: OngekiLampDisplay} | null}) {
    return <div style="width: 100px; height: 100px; border: 2px solid black; position: relative; background: black">
        <img style="opacity: 0.5" src={props.info.jacketUrl} loading='lazy' />
        <Show when={props.score !== null}>
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;">
                <span style="font-weight: bold; font-size: 1.2em; color: white">{props.score!.points}</span>
            </div>
            <div style="position: absolute; top: 0; right: 0; display: flex; flex-direction: row; gap: 1px">
                <ClearLampBadge lamp={props.score!.lamps.clear} />
                <BellLampBadge lamp={props.score!.lamps.bell} />
            </div>
        </Show>
        <div style="position: absolute; bottom: 0; left: 0; background: #00000088; color: white; white-space: nowrap; overflow: hidden; width: 100%; font-size: 0.8em; text-align: center;">
            {props.info.title}
        </div>
    </div>
}

// TODO: figure out how to pass db in properly
export function BestsTab<M extends Mode>(props: { mode: M, db: HistoricalChartDb, best: HistoryStore<M>['bests'] }) {
    let songsByLevel = createMemo(() => {
        let db = props.db;
        let groupByLevel: Map<number, ChartInformation[]> = new Map();
        for (let [tag, song] of Object.entries(db.songs)) {
            for (let [diff, chart] of Object.entries(song.charts)) {
                let info: ChartInformation = {
                    jacketUrl: song.jacketPath,
                    title: song.title,
                    chartId: makeChartId(tag, diff as OngekiDifficulty),
                };
                let existing = groupByLevel.get(chart.level);
                if (existing === undefined) {
                    existing = [];
                    groupByLevel.set(chart.level, existing);
                }
                existing.push(info);
            }
        }

        for (let charts of groupByLevel.values()) {
            charts.sort((a,b) => a.title.localeCompare(b.title));
        }

        return groupByLevel;
    });

    let firstFewKeys = () => {
        let songs = songsByLevel();
        let chartConstants = [...songs.keys()];
        chartConstants.sort((a,b) => b - a);
        let cropped = chartConstants.slice(0, 10);
        return cropped.map(constant => ({constant, charts: songs.get(constant)!}));
    }

    return <div style="display: flex; flex-direction: column; gap: 5px;">
        <For each={firstFewKeys()}>{({constant, charts}) => {
            return <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                <ChartTileNumber constant={constant} />
                <For each={charts}>{(info) => {
                    let score = props.best.getBest(info.chartId);
                    // console.log("updating", info.chartId);
                    let a = (score === null) ? null : {
                        points: score.score.points,
                        lamps: score.lamps,
                    }
                    return <ChartTile info={info} score={a} />;
                }}</For>
            </div>
        }}</For>
    </div>
    
}