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
    getInternalLevel(chart: BasicChart): number {
        return chart.level;
    }

    getMaxPlatinum(chart: BasicChart): number {
        return chart.maxPlatinumScore;
    }

    getMaxBells(chart: BasicChart): number {
        return chart.bells;
    }

    isLunatic(chart: BasicChart): boolean {
        return chart.isLunatic;
    }

    isNew(chart: BasicChart): boolean {
        return chart.isNew;
    }

    getChartId(chart: BasicChart): string {
        return chart.id;
    }
}