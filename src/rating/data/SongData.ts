import type { OngekiDifficulty } from "../data-types";

type SongDataVersions = {
    name: string,
    date?: string,
    versions?: SongDataVersions[],
};

export type SongDataSchema<Parsed extends boolean> = {
    songs: {
        tag: string,
        title: string,
        artist: string,
        date_added: Parsed extends true ? Date : string,
        date_removed?: Parsed extends true ? Date : string,
        charts: Partial<Record<OngekiDifficulty, {
            level: number,
            maxPlatinumScore: number,
            bells: number,
        }>>,
        jacketPath: string,
    }[],
    differences: {
        date: Parsed extends true ? Date : string,
        songs: {
            [tag: string]: {
                charts: Partial<Record<OngekiDifficulty, {
                    level: number
                }>>
            },
        },
    }[],
    versions: SongDataVersions[],
    versionAliases?: {
        name: string,
        version: string,
    }[],
    newVersions: string[],
};

export type Song = SongDataSchema<true>['songs'][number];

function parseVersions(map, versions: SongDataVersions[], end: Date) {
    function getDate(curr: SongDataVersions): Date {
        if ('date' in curr) {
            return new Date(curr.date!);
        } else {
            // Get the date from the first item in the 'versions' list
            if ('versions' in curr) {
                if (curr.versions!.length > 0) {
                    return getDate(curr.versions![0]!);
                }
            }
            throw new Error(`not valid ${JSON.stringify(curr)}`);
        }
    }
    for (let i=0; i<versions.length; i++) {
        let curr = versions[i]!;
        let currStartDate = getDate(curr);        
        let currEndDate = (i+1 < versions.length ? getDate(versions[i+1]!) : end);
        map[curr.name] = {
            start: currStartDate,
            end: currEndDate,
        };

        if ('versions' in curr) {
            parseVersions(map, curr.versions!, currEndDate);
        }
    }
}

export class SongData {
    songs: SongDataSchema<true>['songs'];
    differences: SongDataSchema<true>['differences'];
    versions: {[name: string]: { start: Date; end: Date }};
    newVersions: string[];
    
    // get all games, acts, versions
    // get all (acts/versions) within a game
    // determine whether a version is a game/act/version


    constructor(data: SongDataSchema<false>) {
        // parse songs
        this.songs = data.songs.map(song => ({
            ...song,
            date_added: new Date(song.date_added),
            date_removed: (song.date_removed !== undefined) ? new Date(song.date_removed) : undefined,
        }));

        // parse differences
        let allDiffs = data.differences.map(diff => ({
            ...diff,
            date: new Date(diff.date),
        }));
        allDiffs.sort((a,b) => a.date.valueOf() - b.date.valueOf());
        this.differences = allDiffs;
        
        // parse versions
        this.versions = {};
        parseVersions(this.versions, data.versions, new Date());

        // parse new versions
        this.newVersions = data.newVersions.map(v => {
            if (!(v in this.versions)) {
                throw new Error(`Invalid new version group: ${v} is not a listed version`);
            }
            return v;
        });

        // parse version aliases
        if ('versionAliases' in data) {
            for (let alias of data.versionAliases!) {
                if (!(alias.version in this.versions)) {
                    throw new Error(`Error parsing versionAliases: ${alias.version} is not a listed version (${JSON.stringify(alias)})`);
                }
                this.versions[alias.name] = this.versions[alias.version]!;
            }
        }
    }
}