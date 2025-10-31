export interface ChartDb<Chart> {
    getInternalLevel(c: Chart): number;
    isLunatic(c: Chart): boolean;
    isNew(c: Chart): boolean;

    getChartId(c: Chart): string;
}