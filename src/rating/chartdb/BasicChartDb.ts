import type { ChartDb, ChartInfo } from "./ChartDb";

export type BasicChart = {
    id: string;
    level: number;
    maxPlatinumScore: number;
    bells: number;
    isLunatic: boolean;
    isNew: boolean;
};

export class BasicChartDb implements ChartDb<BasicChart> {
    getChart(chartId: string): ChartInfo | null {
        throw new Error("getChart not implemented for BasicChartDb");
    }

    getChartInfo(chart: BasicChart) {
        return {
            chartId: chart.id,
            internalLevel: chart.level,
            maxPlatinum: chart.maxPlatinumScore,
            maxBells: chart.bells,
            isLunatic: chart.isLunatic,
            isNew: chart.isNew,
        };
    }

    parseChartId(c: string): BasicChart {
        throw new Error("parseChartId not implemented for BasicChartDb");
    }
}