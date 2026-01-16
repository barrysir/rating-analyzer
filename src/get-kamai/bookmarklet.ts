import { UserScoreDatabase } from "../UserScoreDatabase";
import { createScoreDatabase, SearchParameters, updateScoreDatabase } from "./kamai";
import eobnsknfsa from '../../public/kamai-ongeki-ids.json';
import { ConvertKamaiIdSchema } from "./convert-kamai-chart-id";

function selectFile(accept = null) {
    return new Promise<File | null>(async resolve => {
        const fileInputElement = document.createElement('input');
        fileInputElement.type = 'file';
        if (accept) fileInputElement.accept = accept;
        fileInputElement.addEventListener('change', () => {
            const file = fileInputElement.files[0];
            resolve(file);
        });
        fileInputElement.addEventListener('cancel', () => {
            console.log('No file selected.');
            resolve(null);
        });
        fileInputElement.click();
    });
}

function saveJsonToDisk(data, filename) {
    const json = typeof data === 'string'
        ? data
        : JSON.stringify(data, null, 2);

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}


async function loadDb(): Promise<{db: UserScoreDatabase, filename: string} | {db: null, filename: null}> {
    return new Promise(async resolve => {
        const fileInputElement = document.createElement('input');
        fileInputElement.type = 'file';
        fileInputElement.accept = '.json';

        fileInputElement.addEventListener('change', async () => {
            const file = fileInputElement.files![0]!;
            let text = await file.text();
            let data = JSON.parse(text);
            resolve({db: data, filename: file.name});
        });
        fileInputElement.addEventListener('cancel', () => {
            resolve({db: null, filename: null});
        });
        fileInputElement.click();
    });
}

function parseWindowUrlForChosenGame(): SearchParameters | null {
  const url = new URL(window.location.href);

  const parts = url.pathname.split("/").filter(Boolean);

  if (parts.length < 5 || parts[0] !== "u" || parts[2] !== "games" ) {
    alert("To create a new database, please choose a game by running this bookmarklet on the page for the game you want to download, e.g. https://kamai.tachi.ac/u/me/games/ongeki/Single/");
    return null;
  }

  return {
    id: parts[1]!,
    game: parts[3]!,
    playtype: parts[4]!,
  };
}

async function fetchConvertTable(): Promise<ConvertKamaiIdSchema> {
    return eobnsknfsa;
}

async function main() {
    let {db, filename} = await loadDb();
    let p: SearchParameters;
    if (db === null) {
        let answer = confirm("Create a new database?");
        if (answer == false) {
            return;
        }
        p = parseWindowUrlForChosenGame();
        if (p === null) {
            return;
        }
    } else {
        p = {
            ...db.kamaiSearchParams,
            id: db.user.id,
        };
    }

    let convertTable = await fetchConvertTable();

    if (db === null) {
        db = await createScoreDatabase(p, convertTable);
        filename = `scores-${db.user.name}-${p.game}-${p.playtype}.json`;
    } else {
        await updateScoreDatabase(db, convertTable);
    }
    saveJsonToDisk(db, filename);
}

main();