import { UserScoreDatabase } from "../UserScoreDatabase";
import { createScoreDatabase, SearchParameters, updateScoreDatabase } from "./kamai";
import eobnsknfsa from '../../public/kamai-ongeki-ids.json';
import { ConvertKamaiIdSchema } from "./convert-kamai-chart-id";

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

class TestDialog {
    div: HTMLElement; 
    message: HTMLElement;
    warning: HTMLElement; 

    constructor() {
        let html = `<div style="
        position: fixed; top: 80px; left: 50%; transform: translateX(-50%); 
        width: 300px; height: 100px; 
        background: yellowgreen; 
        border: 1px solid black; box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;
        display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <button
            style="
                position: absolute; top: 5px; right: 5px;
                background: transparent;
                border: none;
                font-weight: bold;
                cursor: pointer;
            ">✕</button>
            <span class="b-message" style="text-align: center"></span>
            <span class="b-warning" style="text-align: center"></span>
        </div>`;
        let template = document.createElement("template");
        template.innerHTML = html;
        this.div = template.content.firstChild! as HTMLElement;
        const button = this.div.getElementsByTagName('button')[0]!;
        this.message = this.div.getElementsByClassName("b-message")[0]!;
        this.warning = this.div.getElementsByClassName("b-warning")[0]!;
        button.addEventListener('click', () => {
            this.close();
        });
        document.body.appendChild(this.div);
    }

    async update(message: string) {
        console.log(message);
        this.message.innerText = message;
        await new Promise(resolve => window.requestAnimationFrame(resolve));
    }

    close() {
        this.div.remove();
    }

    async error() {
        this.div.style.background = "red";
        this.warning.innerText = "Something went wrong!";
        await new Promise(resolve => window.requestAnimationFrame(resolve));
    }
}

async function main() {
    let display = new TestDialog();

    await display.update("Opening file dialog");
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

    try {
        await display.update("Getting ID conversion table for Ongeki");
        let convertTable = await fetchConvertTable();
        let dbNeedsSaving = true;
        if (db === null) {
            await display.update("Creating new database");
            db = await createScoreDatabase(p, convertTable, display);
            filename = `scores-${db.user.name}-${p.game}-${p.playtype}.json`;
            dbNeedsSaving = true;
        } else {
            await display.update("Updating existing database");
            dbNeedsSaving = await updateScoreDatabase(db, convertTable, display);
        }
        if (dbNeedsSaving) {
            saveJsonToDisk(db, filename);
        }
    } catch (error) {
        display.error();
        throw error;
    }
    
}

main();