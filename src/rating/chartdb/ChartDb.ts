import { Song } from "../data/SongData";

export type ChartInfo = {
    internalLevel: number;
    maxPlatinum: number;
    maxBells: number;
    isLunatic: boolean;
    isNew: boolean;
    chartId: string;
    // TODO: Not sure if this is a good place to put it, but I'm putting it here for now
    song: Song;
};

export interface ChartDb<Chart> {
    getChart(chartId: string): ChartInfo | null;
    getChartInfo(c: Chart): ChartInfo | null;
}