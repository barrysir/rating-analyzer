import { ChartId } from "../rating/chartdb/ChartDb";
import { OngekiDifficulty } from "../rating/data-types";

export type KamaiIdSchema = {
    songs: {
        tag: string,
        ids: {
            kamai: number,
        },
        charts: Partial<Record<OngekiDifficulty, unknown>>,
    }[],
}

export class KamaiSongData {
    #idToTag: Map<number, Map<OngekiDifficulty, string>>;

    constructor(data: KamaiIdSchema) {
        this.#idToTag = new Map();
        for (let song of data.songs) {
            let kamaiId = song.ids.kamai;
            if (kamaiId === undefined) {
                console.log(`Song tag ${song.tag} has no kamai id information. Skipping any scores relating to this song`);
                continue;
            }
            if (!this.#idToTag.has(kamaiId)) {
                this.#idToTag.set(kamaiId, new Map());
            }
            let chartMap = this.#idToTag.get(kamaiId)!;
            for (let _difficulty of Object.keys(song.charts)) {
                let difficulty = _difficulty as OngekiDifficulty;
                if (chartMap.has(difficulty)) {
                    throw new Error(`Multiple charts for song ${song.ids.kamai} at difficulty ${difficulty} (tag: ${song.tag})`);
                }
                chartMap.set(difficulty, song.tag);
            }
        }
    }

    toChartId(id: number, difficulty: OngekiDifficulty): ChartId | undefined {
        let tag = this.#idToTag.get(id)?.get(difficulty);
        if (tag === undefined) {
            return undefined;
        }
        return makeChartId(tag, difficulty);
    }
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