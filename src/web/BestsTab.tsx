import { createMemo, For, Show } from "solid-js";
import { makeChartId } from "../get-kamai/KamaiSongData";
import { ChartId } from "../rating/chartdb/ChartDb";
import { HistoricalChartDb } from "../rating/chartdb/HistoricalChartDb";
import { OngekiDifficulty } from "../rating/data-types";
import { Mode } from "./stores/stateStore";

type ChartInformation = {
    jacketUrl: string,
    title: string,
    chartId: ChartId,
};

// function mapEmplace(map: Map<K, V>, key: K, default: V) {
//     let val = map.get(key);
//     if (val === undefined) {
        
//     }
// }

function ChartTileNumber(props: {constant: number}) {
    return <div style="width: 100px; height: 100px; border: 2px solid black; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 1.2em">
        {props.constant}
    </div>
}

function ChartTile(props: {info: ChartInformation}) {
    return <div style="width: 100px; height: 100px; border: 2px solid black; position: relative">
        <img src={props.info.jacketUrl} loading='lazy' />
        <div style="position: absolute; bottom: 0; left: 0; background: #00000088; color: white; white-space: nowrap; overflow: hidden; width: 100%; font-size: 0.8em; text-align: center;">
            {props.info.title}
        </div>
    </div>
}

// TODO: figure out how to pass db in properly
export function BestsTab<M extends Mode>(props: { mode: M, db: HistoricalChartDb }) {
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
        console.log(chartConstants);
        return chartConstants.slice(0, 10);
    }

    return <div style="display: flex; flex-direction: column; gap: 5px;">
        <For each={firstFewKeys()}>{(chartConstant) => {
            let charts = songsByLevel().get(chartConstant)!;
            return <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                <ChartTileNumber constant={chartConstant} />
                <For each={charts}>{(info) => <ChartTile info={info} />}</For>
            </div>
        }}</For>
    </div>
    
}