import type { ChartDb } from "./ChartDb";

type BasicChart = {id: string; level: number; isLunatic: boolean; isNew: boolean};

export class BasicChartDb implements ChartDb<BasicChart> {
    getInternalLevel(chart: BasicChart): number {
        return chart.level;
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