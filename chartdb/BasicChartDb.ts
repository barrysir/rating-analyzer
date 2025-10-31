type BasicChart = {level: number; isLunatic: boolean; isNew: boolean};

export class BasicChartDb implements ChartDb<BasicChart> {
    getInternalLevel(song: BasicChart): number {
        return song.level;
    }

    isLunatic(song: BasicChart): boolean {
        return song.isLunatic;
    }

    isNew(song: BasicChart): boolean {
        return song.isNew;
    }
}