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

    toTag(id: number, difficulty: OngekiDifficulty): string | undefined {
        return this.#idToTag.get(id)?.get(difficulty);
    }
}