import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { KamaiSongData } from './KamaiSongData';
import { UserScoreDatabase } from './UserScores';
import { OngekiDifficulty } from '../rating/data-types';
import SONG_DB_DATA from "../../data/song-db.json";

// Maybe this should be a bookmarklet instead

// type SessionInfo<Game extends GameType> = {
//   "session": SessionDocument;
//   "songs": KamaiSongDocument<Game>[];
//   "charts": KamaiChartDocument<Game>[];
//   "scores": KamaiScoreDocument<Game>[];
//   "user": TachiUser;
//   "scoreInfo": object[];
// };

// type AnySessionInfo = {[K in GameType]: SessionInfo<K>}[GameType];

let TACHI_ENDPOINT = `https://kamai.tachi.ac/api/v1`;

// type TachiInfo = {
//     user: number,
//     game: string,
//     playtype: string,
// };

export type KamaiScore = {
  timeAchieved: number;
  scoreData: {
    score: number;
    platinumScore: number;
    judgements: {
      cbreak: number;
      break: number;
      hit: number;
      miss: number;
    };
    optional: {
      damage: number;
      bellCount: number;
    };
  };
  chartID: string;
};

type KamaiSong = { [key: string]: unknown };
type KamaiChart = { 
  chartID: string;
  songID: number;
  difficulty: string;
};

type ScoresResponse = {
  success: boolean;
  description: string;
  body: {
    scores: KamaiScore[];
    songs: KamaiSong[];
    charts: KamaiChart[];
  }
};

let kamaiToOngekiDifficulty: Record<string, OngekiDifficulty> = {
  "BASIC": OngekiDifficulty.BASIC,
  "ADVANCED": OngekiDifficulty.ADVANCED,
  "EXPERT": OngekiDifficulty.EXPERT,
  "MASTER": OngekiDifficulty.MASTER,
  "LUNATIC": OngekiDifficulty.LUNATIC,
};


async function getScoresAll(id: string): Promise<ScoresResponse> {
  let file = Bun.file("./kamai-cache.json");
  if (await file.exists()) {
    return await file.json();
  }
  
  console.log(`Fetching all scores for id ${id}`);
  let url = `${TACHI_ENDPOINT}/users/${id}/games/ongeki/Single/scores/all`;
  let resp = await fetch(url);
  let data = await resp.json();

  await Bun.write(file, JSON.stringify(data));

  return data;
}

function loadKamaiSongData(): KamaiSongData {
  // let file = Bun.file('data/song-db.json');
  // let data = JSON.parse(await file.text());
  return new KamaiSongData(SONG_DB_DATA);
}

function kamaiSongIdToTag(kamai: KamaiSongData, songId: number, difficulty: OngekiDifficulty): string | undefined {
  return kamai.toTag(songId, difficulty);
}

function convertKamai(resp: ScoresResponse): UserScoreDatabase {
  let chartIdToChart = new Map<string, KamaiChart>();
  for (let chart of resp.body.charts) {
    chartIdToChart.set(chart.chartID, chart);
  }

  let db: UserScoreDatabase = {scores: []};
  let kamai = loadKamaiSongData();
  for (let score of resp.body.scores) {
    let chart = chartIdToChart.get(score.chartID);
    if (chart === undefined) {
      throw new Error(`Missing chart data ${score.chartID}, ${JSON.stringify(score)}`);
    }

    let difficulty = kamaiToOngekiDifficulty[chart.difficulty];
    let tag = kamaiSongIdToTag(kamai, chart.songID, difficulty);
    if (tag === undefined) {
      throw new Error(`Unknown kamai song ID ${chart.songID}`);
    }

    if (difficulty === undefined) {
      throw new Error(`Unknown kamai difficulty ${chart.difficulty}`);
    }

    db.scores.push({
      tag: tag,
      difficulty: difficulty,
      kamai: score,
    });
  }

  return db;
}

// ------------------------------

const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 <user> [options]')
  .command('$0 <user>', 'Process an ID', (yargs) => {
    yargs.positional('id', {
      describe: 'Kamaitachi user id to load scores',
      type: 'string',
    });
  })
  .option('file', {
    alias: 'f',
    describe: 'Filepath to score database you want to create/update',
    type: 'string',
  })
  .help()
  .argv;

// Get values
const { user: id, file } = argv;

let bunFile;
let path;
if (file === undefined) {
  path = `./${id}.json`;
  bunFile = Bun.file(path);
  
  // Check if file already exists
  if (await bunFile.exists()) {
    throw new Error(`File already exists: ${path}`);
  }
} else {
  bunFile = Bun.file(file);
  path = file;
}

// to update scores later -- idk i'll have to think about what i want to do with session data

let response = await getScoresAll(id);
let db = convertKamai(response);

console.log("Writing to file", path);
await Bun.write(bunFile, JSON.stringify(db));