import { OngekiDifficulty } from "../data-types";
import { Song } from "../data/SongData";
import { UniqueType } from "../utils";

export type ChartId = UniqueType<string, "chart">;

export type ChartInfo = {
    internalLevel: number;
    maxPlatinum: number;
    noteCount: number;
    maxBells: number;
    isLunatic: boolean;
    isNew: boolean;
    chartId: ChartId;
    difficulty: OngekiDifficulty;
    // TODO: Not sure if this is a good place to put it, but I'm putting it here for now
    song: Song;
};

export interface ChartDb {
    getChart(chartId: ChartId): ChartInfo | null;
}