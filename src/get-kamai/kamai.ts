import { UserScoreDatabase } from "../UserScoreDatabase";
import { Game } from "../web/types";
import { constructScoreFromKamai, ConvertKamaiIdSchema, processIdTable, processChartTable } from "./convert-kamai-chart-id";
import { KamaiChart, KamaiSong, KamaiScore } from "./kamai-types";

let TACHI_ENDPOINT = `https://kamai.tachi.ac/api/v1`;

// type TachiScoreInfo = {
//     scoreID: string;
//     isNewScore: boolean;
//     deltas: {
//         score: number;
//         noteLamp: number;
//         bellLamp: number;
//         platinumScore: number;
//         grade: number;
//         platinumStars: number;
//     }
// };

/**
 * https://docs.tachi.ac/api/routes/users/#retrieve-user-with-id
 * 
 * The :userID param has some special functionality, and any time you see it in these docs, that functionality is supported.
 * 
 * You may pass the integer userID for this user - 1.
 * You may also pass the username - zkldihis is also case-insensitive, so you could pass zklzkldi
 * You may also pass the special string - `me` - which
 * will select whatever user you are authenticated as.
 **/ 
type KamaiUserIdParam = number | string | "me";

type KamaiSession = {
    userID: string;
    name: string;
    sessionID: string;
    desc: null | string;
    game: string;
    playtype: string;
    highlight: boolean;
    scoreIDs: string[];
    timeInserted: number;
    timeStarted: number;
    timeEnded: number;
    // calculatedData: { naiveRating: null | number; naiveScoreRating: null | number; starRating: null | number; };
}

type KamaiCalendarSession = {
    name: string;
    sessionID: string;
    desc: null | string;
    game: string;
    playtype: string;
    highlight: boolean;
    timeStarted: number;
    timeEnded: number;
};

type KamaiResponse<T> = {
    success: boolean;
    description: string;
    body: T;
}

type ScoresResponse = KamaiResponse<{
    scores: KamaiScore[];
    songs: KamaiSong[];
    charts: KamaiChart[];
}>;

type GetSessionResponse = {
    session: KamaiSession;
    scores: KamaiScore[];
    songs: KamaiSong[];
    charts: KamaiChart[];
    // user: KamaiUser;
    // scoreInfo: 
}

export type SearchParameters = {
    id: KamaiUserIdParam;
    game: string; // "ongeki";
    playtype: string; // "Single";
}

// async function kamaiApiRequest(url: string): Promise<KamaiResponse<any>> {
//   let resp = await fetch(url);
//   let data = await resp.json() as KamaiResponse<any>;
//   return data;
// }

function checkKamaiResponse(res: KamaiResponse<any>) {
    if (!res.success) {
        throw new Error(`${res}`);
    }
    return res;
}

async function getScoresAll(p: SearchParameters): Promise<ScoresResponse> {
  let url = `${TACHI_ENDPOINT}/users/${p.id}/games/${p.game}/${p.playtype}/scores/all`;
  let resp = await fetch(url);
  let data = await resp.json();
  return data;
}

async function getLastSessions(p: SearchParameters): Promise<KamaiResponse<KamaiSession[]>> {
    // Gets the last 100 session ids in reverse chronological order
    let url = `${TACHI_ENDPOINT}/users/${p.id}/games/${p.game}/${p.playtype}/sessions/recent`;
    let resp = await fetch(url);
    let data = await resp.json();
    return checkKamaiResponse(data);
}

async function getSessionsCalendar(p: SearchParameters): Promise<KamaiResponse<KamaiCalendarSession[]>> {
    // Gets all session ids in ascending chronological order
    let url = `${TACHI_ENDPOINT}/users/${p.id}/games/${p.game}/${p.playtype}/sessions/calendar`;
    let resp = await fetch(url);
    let data = await resp.json();
    return checkKamaiResponse(data);
}

async function getSession(sessionID: string): Promise<KamaiResponse<GetSessionResponse>> {
    // Get session details
    let url = `${TACHI_ENDPOINT}/sessions/${sessionID}`;
    let resp = await fetch(url);
    let data = await resp.json();
    return checkKamaiResponse(data);
}

type GetUserInfoResponse = {
    id: number;
    username: string;
    usernameLowercase: string;
    about: string;
    socialMedia: {} | unknown;
    status: null | unknown;
    customBannerLocation: string;   // hash value
    customPfpLocation: string;  // hash value
    joinDate: number;
    lastSeen: number;
    authLevel: number;
    badges: unknown[];
}

async function getUserInfo(id: KamaiUserIdParam): Promise<KamaiResponse<GetUserInfoResponse>> {
    let url = `${TACHI_ENDPOINT}/users/${id}`;
    let resp = await fetch(url);
    let data = await resp.json();
    return checkKamaiResponse(data);
}

function asdfasdfasdfCurrentUser(p: Omit<SearchParameters, 'id'>): SearchParameters {
    return {
        ...p,
        id: "me",
    };
}

export async function createScoreDatabase(p: SearchParameters, kamaiOngekiIdTable: ConvertKamaiIdSchema, display: DisplayToUser): Promise<UserScoreDatabase> {
    await display.update("Fetching full user info...");
    let user = (await getUserInfo(p.id)).body;
    await display.update("Fetching entire score history...");
    let scoresResp = (await getScoresAll(p)).body;

    await display.update("Processing scores...");
    let convertTable = processIdTable(kamaiOngekiIdTable);
    let chartTable = processChartTable(scoresResp.charts);
    return {
        game: Game.ONGEKI,
        kamaiSearchParams: {
            game: p.game,
            playtype: p.playtype,
        },
        user: {
            id: user.id,
            name: user.username,
        },
        scores: scoresResp.scores.map(s => constructScoreFromKamai(s, convertTable, chartTable)),
    }
}

export async function updateScoreDatabase(db: UserScoreDatabase, kamaiOngekiIdTable: ConvertKamaiIdSchema, display: DisplayToUser) {
    let lastScoreTimestamp = Math.max(...db.scores.map(s => s.kamai.timeAchieved));
    let p: SearchParameters = {
        ...db.kamaiSearchParams,
        id: db.user.id,
    };

    let convertTable = processIdTable(kamaiOngekiIdTable);

    let dbScoresById = new Map(db.scores.map(s => [s.kamai.scoreID, s]));

    await display.update("Fetching list of recent sessions...");
    let newSessions = (await getLastSessions(p)).body.filter(s => s.timeEnded > lastScoreTimestamp);

    for (const [i, stub] of newSessions.entries()) {
        await display.update(`${i+1}/${newSessions.length}: ${stub.name} (${new Date(stub.timeStarted).toLocaleDateString()})`);
        let session = (await getSession(stub.sessionID)).body;
        let newSessionScores = session.scores.filter(s => !dbScoresById.has(s.scoreID));
        
        let chartTable = processChartTable(session.charts);
        let scoresToInsert = newSessionScores.map(s => constructScoreFromKamai(s, convertTable, chartTable));
        db.scores.push(...scoresToInsert);
    }

    if (newSessions.length == 0) {
        await display.update("No new sessions detected, no changes to save.");
        return false;
    } else {
        db.scores.sort((a,b) => a.kamai.timeAchieved - b.kamai.timeAchieved);
        return true;
    }
}

interface DisplayToUser {
    update(message: string): Promise<void>;
}