import { ChartId } from "../rating/chartdb/ChartDb";
import { OngekiDifficulty } from "../rating/data-types";
import { UserScoreDatabase } from "../UserScoreDatabase";
import { KamaiChart, KamaiScore } from "./kamai-types";

export type ConvertKamaiIdSchema = [
    string,             // tag
    OngekiDifficulty[], // chart difficulties
    number,             // kamai id
][];

let kamaiToOngekiDifficulty: Record<string, OngekiDifficulty> = {
  "BASIC": OngekiDifficulty.BASIC,
  "ADVANCED": OngekiDifficulty.ADVANCED,
  "EXPERT": OngekiDifficulty.EXPERT,
  "MASTER": OngekiDifficulty.MASTER,
  "LUNATIC": OngekiDifficulty.LUNATIC,
};

export function processIdTable(data: ConvertKamaiIdSchema) {        
    let songToTag = new Map();
    for (let entry of data) {
        let [tag, diffs, kamaiId] = entry;

        if (!songToTag.has(kamaiId)) {
            songToTag.set(kamaiId, new Map());
        }
        let chartTags = songToTag.get(kamaiId)!;

        for (let d of diffs) {
            if (chartTags.has(d)) {
                console.warn(`Duplicate entry for difficulty ${d} at song ${tag}`);
            }
            chartTags.set(d, tag);
        }
    }
    return songToTag;
}

export function processChartTable(charts: KamaiChart[]) {
    let chartsById = new Map<string, KamaiChart>();
    for (let c of charts) {
        chartsById.set(c.chartID, c);
    }
    return chartsById;
}

export type IdTable = ReturnType<typeof processIdTable>;
export type ChartTable = ReturnType<typeof processChartTable>;

export function constructScoreFromKamai(s: KamaiScore, songToTag: IdTable, chartsById: ChartTable): UserScoreDatabase['scores'][number] {
    let chart = chartsById.get(s.chartID);
    if (chart === undefined) {
        throw new Error(`Score has chart id ${s.chartID} which was not found in the chart information`);
    }

    let difficulty = kamaiToOngekiDifficulty[chart.difficulty];
    if (difficulty === undefined) {
        throw new Error(`Unknown kamai difficulty ${chart.difficulty}`);
    }

    let tag = songToTag.get(chart.songID)?.get(difficulty);
    if (tag === undefined) {
        throw new Error();
    }

    let chartId = makeChartId(tag, difficulty);

    return {
        chartId,
        kamai: s,
    };
}

// TODO: Temporary place for these functions, find a good location later
export function makeChartId(tag: string, difficulty: OngekiDifficulty): ChartId {
    return `${tag} ${difficulty}` as ChartId;
}

export function parseChartId(chartId: ChartId) {
    const index = chartId.lastIndexOf(" ");
    if (index === -1) {
        throw new Error(`Could not parse chartId ${chartId}`);
    }
    let tag = chartId.substring(0, index);
    let difficulty = chartId.substring(index+1) as OngekiDifficulty;
    return {tag, difficulty};
}