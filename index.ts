import { BasicChartDb } from "./chartdb/BasicChartDb";
import { HistoricalChartDb } from "./chartdb/HistoricalChartDb";
import { OngekiDifficulty } from "./data-types";
import { SongData } from "./data/SongData";
import { OngekiCalculator } from "./OngekiCalculator";

let file = Bun.file('data/song-db.json');
let data = JSON.parse(await file.text());
let loadedData = new SongData(data);

let seenSongs: Set<string> = new Set();

for (let version of loadedData.newVersions) {
    console.log(`New version: ${version}`);
    let songdb = new HistoricalChartDb(loadedData, {version: version, omnimix: true});
    let ongeki = new OngekiCalculator(songdb);

    let highestChartConstant = 0;

    // add all previous songs
    for (let tag of seenSongs) {
        let song = songdb.songs[tag]!;
        for (let [diff, chart] of Object.entries(song.charts)) {
            if (chart.level > highestChartConstant) {
                highestChartConstant = chart.level;
                ongeki.recent.temporaryRating((highestChartConstant + 2) * ongeki.recent.numTop);
            }
            ongeki.addScore(1010000, {tag, difficulty: diff});
        }
    }

    let song_order = Object.keys(songdb.songs);
    song_order.sort((ka, kb) => {
        let a = songdb.songs[ka]!;
        let b = songdb.songs[kb]!;
        return b.date_added.valueOf() - a.date_added.valueOf();
    });

    // let highestChartConstant = 0;
    // if (seenSongs.size > 0) {
    //     highestChartConstant = Math.max(...[...set].map(tag => {
    //         let song = songdb.songs[tag]!;
            
    //     });
    // }
    let highestRating = ongeki.overallRating;

    for (let tag of song_order) {
        seenSongs.add(tag);
        let song = songdb.songs[tag]!;
        for (let [diff, chart] of Object.entries(song.charts)) {
            if (chart.level > highestChartConstant) {
                highestChartConstant = chart.level;
                ongeki.recent.temporaryRating((highestChartConstant + 2) * ongeki.recent.numTop);
            }
            ongeki.addScore(1010000, {tag, difficulty: diff});

            if (ongeki.overallRating > highestRating) {
                highestRating = ongeki.overallRating;
                console.log(`New highest rating: ${highestRating} on ${song.title} (${diff} ${chart.level})`)
            }
        }
    }

    console.log(ongeki.best.frame);
    console.log(ongeki.new.frame);
    console.log(ongeki.best.totalRating, ongeki.new.totalRating, ongeki.recent.totalRating);
    prompt();

    // ongeki.addScore()
}

sdflksdjflskdjf;
for (let version of [
        "bright MEMORY Act.1",
    ]) {
let songdb = new HistoricalChartDb(loadedData, {version: version, omnimix: true});

let dataDump = {};
Object.values(songdb.songs).map(song => {
    let arr = dataDump[song.ids.kamai] ?? [0,0,0,0,0];
    let diffs = [OngekiDifficulty.BASIC,
        OngekiDifficulty.ADVANCED,
        OngekiDifficulty.EXPERT,
        OngekiDifficulty.MASTER,
        OngekiDifficulty.LUNATIC];

    for (let i=0; i<diffs.length; i++) {
        if (diffs[i]! in song.charts) {
            if (arr[i] !== 0) {
                throw new Error(`${song.ids.kamai} ${diffs[i]}`);
            }
            arr[i] = song.charts[diffs[i]!]!.level;
        }
    }
    dataDump[song.ids.kamai] = arr;
});

let output = Bun.file(`version-${version}.json`);
await output.write(JSON.stringify(dataDump));
    }

// ok, let's proceed on calculating the maximum rating for each version
// for each version I need
//    - create calculator for that version
//    - each chart, in order of date added (internal order doesn't matter)
//    - add chart to calculator (rironchi score) and see what rating is



// let i=0;
// for (let song of Object.values(songdb.songs)) {
//     console.log(song.title, song.artist);
//     i++;
//     if (i >= 100) break;
// }

// console.log(songdb.songs["Äventyr - Grand Thaw / Rigel Theatre"]);
sdflkjsdlfkjs;
// let songdb = new HistoricalChartDb(data, new Date("2023-10-04"));
// let songdb = new HistoricalChartDb(data, {version: "bright"});
// let songdb = new HistoricalChartDb(data, {version: "Bright MEMORY"});
// let songdb = new HistoricalChartDb(data, {version: "1.50-B"});

// let songdb = new BasicChartDb();
let ongeki = new OngekiCalculator(songdb);

// ongeki.addScore(1003333, {level: 14.9, isLunatic: false, isNew: false});
ongeki.addScore(1003333, {title: "MANIERA REMASTERED", difficulty: "MASTER"});

console.log(ongeki.overallRating);
console.log(ongeki.best.totalRating);
console.log(ongeki.new.totalRating);
console.log(ongeki.recent.totalRating);
