let file = Bun.file('song-db-raw.json');
let data = JSON.parse(await file.text());

data.songs = Object.values(data.songs);
data.versions = data.versions.map(v => {
    return {
        name: v.name,
        date: v.versions[0].date,
    }
});

let output = Bun.file('song-db.json');
await output.write(JSON.stringify(data));