console.log("Hello via Bun!");

// you can give a rating calculator a SongDb and it'll reference
// OngekiCalculator(
//      which rating algorithm to use (enum)
//      songdb
//      game version
//  )

// ongeki refresh
// ongeki refresh - naive
// ongeki
// ongeki - naive
// ongeki - no recent
// what about: just have a mega calculator that calculates all of them simultaneously
//      have to be careful about 2 decimals vs. 3 decimals
//      bestFrameRefresh
//      bestFrameMemory
//      ... yeah I think it's better to have two calculators


// you have to give a songdb; the songdb can be fake if you want to give
// for ongeki, the songdb needs to implement some functions
//      - getInternalLevel(song)
//      - isLunatic(song)
//   (getChartId(songId, difficulty))
let songdb = new OngekiSongDb(kamaitachi data);
let ongeki = new OngekiCalculator(songdb);

// song is anything the songdb will accept
ongeki.addScore({points: 1000000, song: {id: "MANIERA", difficulty: "MASTER"}})

ongeki.overallRating;
ongeki.overallNoRecentRating;
ongeki.overallNaiveRating;
ongeki.bestRating; ongeki.bestFrame;
ongeki.newRating; ongeki.newFrame;
ongeki.naiveRating; ongeki.naiveFrame;
ongeki.recentRating; ongeki.recentFrame;
ongeki.recentFrame.temporaryRating();
ongeki.recentFrame.popRating();

let ongeki = new OngekiRefreshCalculator(songdb);
ongeki.addScore({points: 1000000, song: {id: "MANIERA", difficulty: "MASTER"}})
ongeki.overallRating;
ongeki.overallNaiveRating;
ongeki.bestRating; ongeki.bestFrame;
ongeki.newRating; ongeki.newFrame;
ongeki.platRating; ongeki.platFrame;