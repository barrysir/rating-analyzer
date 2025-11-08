export type KamaiIdSchema = {
    songs: {
        tag: string,
        ids: {
            kamai: number,
        };
    }[],
}

export class KamaiSongData {
    #idToTag: Map<number, string>;

    constructor(data: KamaiIdSchema) {
        this.#idToTag = new Map();
        for (let song of data.songs) {
            this.#idToTag.set(song.ids.kamai, song.tag);
        }
    }

    toTag(id: number): string | undefined {
        return this.#idToTag.get(id);
    }
}