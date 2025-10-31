let file = Bun.file('song-db-process.json');
let data = JSON.parse(await file.text());

function reorder(obj: object, attrs: string[]) {
    let leftover = Object.keys(obj);

    for (let attr of attrs) {
        if (attr in obj) {
            let val = obj[attr];
            delete obj[attr];
            obj[attr] = val;

            let index = leftover.indexOf(attr);
            leftover.splice(index, 1);
        }
    }

    for (let key of leftover) {
        let val = obj[key];
        delete obj[key];
        obj[key] = val;
    }
}

let uniqueTitles = new Set();
let oldToNewSongTags = new Map();
for (let song of data.songs) {
    oldToNewSongTags.set(song.tag, song.uniqueTitle);
    delete song.tag;
    delete song.version;
    for (let chart of Object.values(song.charts)) {
        delete chart.difficulty;
        delete chart.date_removed;
    }
    song.tag = song.uniqueTitle;
    delete song.uniqueTitle;
    if (uniqueTitles.has(song.tag)) {
        throw new Error(`title is not unique: ${song.tag}`);
    }
    uniqueTitles.add(song.tag);

    reorder(song, ['tag', 'title', 'artist', 'category', 'date_added', 'date_removed', 'charts', 'ids', 'jacketPath']);
}

for (let diff of data.differences) {
    let newSongs = {};
    for (let [key,val] of Object.entries(diff.songs)) {
        newSongs[oldToNewSongTags.get(key)] = val;
    }
    diff.songs = newSongs;
}


let output = Bun.file('song-db.json');
await output.write(JSON.stringify(data, null, 4));