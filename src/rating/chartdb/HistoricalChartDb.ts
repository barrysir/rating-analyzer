// if no date provided, will assume the song data

import { indexRegion } from "../utils";
import { OngekiDifficulty } from "../data-types";
import type { ChartDb, ChartId } from "./ChartDb";
import type { SongData } from "../data/SongData";
import { parseChartId } from "../../get-kamai/KamaiSongData";

export type HistChart = 
    ChartId
    | { tag: string, difficulty: OngekiDifficulty }
    | { title: string, difficulty: OngekiDifficulty };

export class HistoricalChartDb implements ChartDb {
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
        let omnimix = options.omnimix ?? true;
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
        
        let index = indexRegion(data.newVersions, date.valueOf(), (ver => data.versions[ver]!.start.valueOf()));
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
                // console.log("Skipping", rawSong);
                continue;
            }
            let isRemoved = rawSong.date_removed !== undefined && rawSong.date_removed <= date;
            // Only add removed songs in omnimix mode
            if (!omnimix && isRemoved) {
                // console.log("Skipping", rawSong);
                continue;
            }
            let song = structuredClone(rawSong);
            song.date_added = new Date(song.date_added);
            this.songs[song.tag] = song;
        }

        // find the correct difference for the given date
        let currentDifference;
        { 
            let index = indexRegion(data.differences, date.valueOf(), (diff => diff.date.valueOf()));
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

    getChart(chartId: ChartId) {
        return this.getChartInfo(parseChartId(chartId));
    }

    findChartId(search: HistChart) {
        let data = this.findChart(search);
        if (data === null) {
            return null;
        }

        let {song, chart, difficulty} = data;
        return `${song.tag} ${difficulty}` as ChartId;
    }

    findChart(search: HistChart) {
        if (typeof search === 'string') {
            search = parseChartId(search);
        }

        let song;
        if ('tag' in search) {
            song = this.songs[search.tag];
            if (song === undefined) {
                // console.log(`Couldn't find song with tag ${search.tag}`);
                return null;
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
                console.log(`Multiple songs with title ${search.title} found`);
                return null;
            } else if (titleCandidates.length == 0) {
                console.log(`No song with title ${search.title} found`);
                return null;
            }
            song = titleCandidates[0]!;
        }

        let chart = song.charts[search.difficulty];
        if (chart === undefined) {
            console.log(`Could not find ${search.difficulty} chart for song ${JSON.stringify(search)}`);
            return null;
        }
        return {song, chart, difficulty: search.difficulty};
    }

    getChartInfo(search: HistChart) {
        let data = this.findChart(search);
        if (data === null) {
            return null;
        }

        let {song, chart, difficulty} = data;
        return {
            internalLevel: chart.level,
            maxPlatinum: chart.maxPlatinumScore,
            noteCount: Math.floor(chart.maxPlatinumScore / 2),
            maxBells: chart.bells,
            isLunatic: (difficulty == OngekiDifficulty.LUNATIC),
            isNew: (song.date_added >= this.currentVersion.start),
            chartId: `${song.tag} ${difficulty}` as ChartId,
            difficulty: difficulty,
            song: song,
        };
    }
}