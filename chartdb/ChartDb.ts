export interface ChartDb<Chart> {
    // TODO: maybe I can return all this information at once rather than repeating the lookup multiple times
    getInternalLevel(c: Chart): number;
    getMaxPlatinum(c: Chart): number;
    getMaxBells(c: Chart): number;
    isLunatic(c: Chart): boolean;
    isNew(c: Chart): boolean;

    getChartId(c: Chart): string;
}