// if no date provided, will assume the song data

import { findRegion } from "../utils";
import { OngekiDifficulty } from "../data-types";
import type { ChartDb } from "./ChartDb";
import type { SongData } from "../data/SongData";

export type HistChart = {
    tag: string, difficulty: OngekiDifficulty
} | { title: string, difficulty: OngekiDifficulty };

export class HistoricalChartDb implements ChartDb<HistChart> {
    songs: {
        [tag: string]: SongData['songs'][0]
    };
    currentVersion: {
        name: string,
        start: Date,
        end: Date,
    };

    constructor(data: SongData, options: {date?: Date; version?: string; omnimix?: boolean} = {}) {
        this.songs = {};
        this.currentVersion = {};
        let date;
        if ('date' in options) {
            date = options.date!;
        } else if ('version' in options) {
            date = options.version!;
        } else {
            // BUG: Set this to accept all songs instead
            date = new Date();
        }
        let omnimix = options.omnimix ?? false;
        this.load(data, date, omnimix);
    }

    load(data: SongData, date: Date | string, omnimix: boolean) {
        if (typeof date === 'string') {
            if (!(date in data.versions)) {
                throw new Error(`version is not valid ${date}`);
            }
            let version = data.versions[date]!;
            date = version.end;
            date.setHours(date.getHours() - 1);
        }
        
        let index = findRegion(data.newVersions, date.valueOf(), (ver => data.versions[ver]!.start.valueOf()));
        if (index === null) {
            throw new Error("Couldn't find new version");
        }
        let versionName = data.newVersions[index]!;
        this.currentVersion = {
            name: versionName,
            ...data.versions[versionName]!
        };

        for (let rawSong of data.songs) {
            // Don't add songs which are too new
            if (rawSong.date_added > date) {
                continue;
            }
            let isRemoved = rawSong.date_removed !== undefined && rawSong.date_removed <= date;
            // Only add removed songs in omnimix mode
            if (!omnimix && isRemoved) {
                continue;
            }
            let song = structuredClone(rawSong);
            song.date_added = new Date(song.date_added);
            this.songs[song.tag] = song;
        }

        // find the correct difference for the given date
        let currentDifference;
        { 
            let index = findRegion(data.differences, date.valueOf(), (diff => diff.date.valueOf()));
            if (index === null) {
                throw new Error("Couldn't apply correct difference");
            }
            currentDifference = data.differences[index]!;
        }

        // apply differences
        for (let [tag, differenceData] of Object.entries(currentDifference.songs)) {
            for (let [difficulty, chartData] of Object.entries(differenceData.charts)) {
                // BUG? not sure if this will properly mutate the object within the data structure
                let chart = this.songs[tag]?.charts[difficulty as OngekiDifficulty]!;
                chart.level = chartData.level;
            }
        }
    }

    findChart(search: HistChart) {
        let song;
        if ('tag' in search) {
            song = this.songs[search.tag];
            if (song === undefined) {
                throw new Error(`Could not find song with tag ${search.tag}`);
            }
        } else {
            // TODO: make this search feature better
            let titleCandidates = [];
            for (let song of Object.values(this.songs)) {
                if (song.title == search.title) {
                    titleCandidates.push(song);
                }
            }

            if (titleCandidates.length > 1) {
                throw new Error(`Multiple songs with title ${search.title} found`);
            } else if (titleCandidates.length == 0) {
                throw new Error(`No song with title ${search.title} found`)
            }
            song = titleCandidates[0]!;
        }

        let chart = song.charts[search.difficulty];
        if (chart === undefined) {
            throw new Error(`Could not find ${search.difficulty} chart for song ${search}`);
        }
        return {song, chart, difficulty: search.difficulty};
    }

    getInternalLevel(search: HistChart): number {
        let {chart} = this.findChart(search);
        return chart.level;
    }

    getMaxPlatinum(search: HistChart): number {
        let {chart} = this.findChart(search);
        return chart.maxPlatinumScore;
    }

    getMaxBells(search: HistChart): number {
        let {chart} = this.findChart(search);
        return chart.bells;
    }

    isLunatic(search: HistChart): boolean {
        let {song, chart, difficulty} = this.findChart(search);
        return difficulty == OngekiDifficulty.LUNATIC;
    }

    isNew(search: HistChart): boolean {
        let {song, chart, difficulty} = this.findChart(search);
        return (song.date_added >= this.currentVersion.start);
    }

    getChartId(search: HistChart): string {
        let {song, chart, difficulty} = this.findChart(search);
        return `${song.tag} ${difficulty}`;
    }
}