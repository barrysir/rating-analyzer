import type { ChartDb } from "./ChartDb";

export type BasicChart = {
    id: string;
    level: number;
    maxPlatinumScore: number;
    bells: number;
    isLunatic: boolean;
    isNew: boolean;
};

export class BasicChartDb implements ChartDb<BasicChart> {
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