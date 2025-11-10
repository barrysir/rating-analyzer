export type ChartInfo = {
    internalLevel: number;
    maxPlatinum: number;
    maxBells: number;
    isLunatic: boolean;
    isNew: boolean;
    chartId: string;
};

export interface ChartDb<Chart> {
    getChartInfo(c: Chart): ChartInfo;
}