export type ChartInfo = {
    internalLevel: number;
    maxPlatinum: number;
    maxBells: number;
    isLunatic: boolean;
    isNew: boolean;
    chartId: string;
};

export interface ChartDb<Chart> {
    getChart(chartId: string): ChartInfo | null;
    getChartInfo(c: Chart): ChartInfo | null;
    parseChartId(c: string): Chart;
}