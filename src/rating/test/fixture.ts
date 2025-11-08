import { BasicChartDb, type BasicChart } from "../chartdb/BasicChartDb";
import { OngekiCalculator } from "../OngekiCalculator";
import { OngekiRefreshCalculator } from "../OngekiRefreshCalculator";

function makeDb(): BasicChartDb {
    return new BasicChartDb();
}

export function makeChart(options: {
    id: string;
    level: number;
    maxPlatinumScore?: number;
    bells?: number;
    isLunatic?: boolean;
    isNew?: boolean;
}): BasicChart {
    let defaults = {maxPlatinumScore: 100, bells: 100, isLunatic: false, isNew: false};
    return {...defaults, ...options};
}

export function makeFixture() {
    let songdb = makeDb();
    let ongeki = new OngekiCalculator(songdb);
    return {songdb, ongeki};
}

export function makeFixtureWithExtra() {
    let songdb = makeDb();
    let ongeki = OngekiCalculator.create<string>()(songdb);
    return {songdb, ongeki};
}

export const barrageScores: [number, { id: string; level: number; isNew: boolean; }][] = [
    [991499, {"id": "20", "level": 12.8, "isNew": false}],
    [981717, {"id": "37", "level": 12.4, "isNew": true}],
    [984233, {"id": "26", "level": 14.0, "isNew": false}],
    [1005465, {"id": "18", "level": 12.4, "isNew": false}],
    [991794, {"id": "48", "level": 14.6, "isNew": true}],
    [1004171, {"id": "14", "level": 14.8, "isNew": false}],
    [920835, {"id": "28", "level": 14.4, "isNew": false}],
    [995137, {"id": "6", "level": 13.2, "isNew": false}],
    [990777, {"id": "33", "level": 12.2, "isNew": false}],
    [1003215, {"id": "22", "level": 13.2, "isNew": false}],
    [974052, {"id": "21", "level": 13.0, "isNew": false}],
    [1008497, {"id": "19", "level": 12.6, "isNew": false}],
    [990992, {"id": "15", "level": 15.0, "isNew": false}],
    [985108, {"id": "17", "level": 12.2, "isNew": false}],
    [906402, {"id": "40", "level": 13.0, "isNew": true}],
    [991806, {"id": "10", "level": 14.0, "isNew": false}],
    [997359, {"id": "11", "level": 14.2, "isNew": false}],
    [991477, {"id": "37", "level": 12.4, "isNew": true}],
    [1009202, {"id": "23", "level": 13.4, "isNew": false}],
    [915271, {"id": "39", "level": 12.8, "isNew": true}],
    [1000018, {"id": "42", "level": 13.4, "isNew": true}],
    [919322, {"id": "7", "level": 13.4, "isNew": false}],
    [1002352, {"id": "39", "level": 12.8, "isNew": true}],
    [998941, {"id": "34", "level": 12.4, "isNew": false}],
    [1007014, {"id": "35", "level": 12.0, "isNew": true}],
    [1009328, {"id": "19", "level": 12.6, "isNew": false}],
    [1006879, {"id": "41", "level": 13.2, "isNew": true}],
    [1009137, {"id": "33", "level": 12.2, "isNew": false}],
    [992935, {"id": "9", "level": 13.8, "isNew": false}],
    [985795, {"id": "25", "level": 13.8, "isNew": false}],
    [987632, {"id": "6", "level": 13.2, "isNew": false}],
    [994237, {"id": "38", "level": 12.6, "isNew": true}],
    [1003202, {"id": "47", "level": 14.4, "isNew": true}],
    [1004265, {"id": "47", "level": 14.4, "isNew": true}],
    [992891, {"id": "4", "level": 12.8, "isNew": false}],
    [973679, {"id": "1", "level": 12.2, "isNew": false}],
    [987712, {"id": "8", "level": 13.6, "isNew": false}],
    [1006338, {"id": "31", "level": 15.0, "isNew": false}],
    [1008791, {"id": "44", "level": 13.8, "isNew": true}],
    [960193, {"id": "2", "level": 12.4, "isNew": false}],
    [1007225, {"id": "48", "level": 14.6, "isNew": true}],
    [915681, {"id": "25", "level": 13.8, "isNew": false}],
    [1003652, {"id": "49", "level": 14.8, "isNew": true}],
    [1006475, {"id": "42", "level": 13.4, "isNew": true}],
    [1007556, {"id": "29", "level": 14.6, "isNew": false}],
    [1007781, {"id": "43", "level": 13.6, "isNew": true}],
    [998468, {"id": "45", "level": 14.0, "isNew": true}],
    [996782, {"id": "4", "level": 12.8, "isNew": false}],
    [997836, {"id": "30", "level": 14.8, "isNew": false}],
    [975494, {"id": "46", "level": 14.2, "isNew": true}],
    [1008853, {"id": "43", "level": 13.6, "isNew": true}],
    [982204, {"id": "24", "level": 13.6, "isNew": false}],
    [1001384, {"id": "16", "level": 12.0, "isNew": false}],
    [969696, {"id": "45", "level": 14.0, "isNew": true}],
    [989334, {"id": "27", "level": 14.2, "isNew": false}],
    [982146, {"id": "32", "level": 12.0, "isNew": false}],
    [999276, {"id": "35", "level": 12.0, "isNew": true}],
    [1009331, {"id": "26", "level": 14.0, "isNew": false}],
    [1007589, {"id": "28", "level": 14.4, "isNew": false}],
    [993164, {"id": "13", "level": 14.6, "isNew": false}],
    [1004077, {"id": "29", "level": 14.6, "isNew": false}],
    [936180, {"id": "46", "level": 14.2, "isNew": true}],
    [1006542, {"id": "41", "level": 13.2, "isNew": true}],
    [999963, {"id": "36", "level": 12.2, "isNew": true}],
    [1003880, {"id": "44", "level": 13.8, "isNew": true}],
    [1002332, {"id": "1", "level": 12.2, "isNew": false}],
    [1008189, {"id": "30", "level": 14.8, "isNew": false}],
    [989393, {"id": "32", "level": 12.0, "isNew": false}],
    [975136, {"id": "12", "level": 14.4, "isNew": false}],
    [997821, {"id": "3", "level": 12.6, "isNew": false}],
    [1008946, {"id": "2", "level": 12.4, "isNew": false}],
    [983309, {"id": "16", "level": 12.0, "isNew": false}],
    [1008351, {"id": "36", "level": 12.2, "isNew": true}],
    [1001512, {"id": "5", "level": 13.0, "isNew": false}],
    [1008175, {"id": "13", "level": 14.6, "isNew": false}],
    [925060, {"id": "0", "level": 12.0, "isNew": false}],
    [1006848, {"id": "27", "level": 14.2, "isNew": false}],
    [1009611, {"id": "38", "level": 12.6, "isNew": true}],
    [994539, {"id": "49", "level": 14.8, "isNew": true}],
    [946754, {"id": "40", "level": 13.0, "isNew": true}],
];