export interface ChartDb<Chart> {
    getInternalLevel(song: Chart): number;
    isLunatic(song: Chart): boolean;
    isNew(song: Chart): boolean;
}