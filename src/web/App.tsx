import type { Component } from 'solid-js';
import { createEffect, createResource, createSignal, Match, on, onMount, Show, Suspense, Switch } from 'solid-js';
import { RatingChart } from './RatingChart';
import { Icon } from '@iconify-icon/solid';
import { Popover, Tabs } from '@ark-ui/solid';
import { settings, setSettings } from './stores/settingsStore';
import { OngekiFrameTab, RefreshFrameTab } from './FrameTab';
import { ImprovementTab } from './ImprovementTab';
import Slider from './Slider';
import { TooltipDelegated } from './TooltipDelegatedTest';
import { HistoryProvider, initializeState } from './stores/stateStore';
import { Game, Mode } from "./types";
import { AVAILABLE_ONGEKI_VERSIONS, getVersionsArray } from "./versions";
import WarningWindow from './WarningWindow';
import { clearWarnings } from './stores/warningStore';
import { UserScoreDatabase } from '../UserScoreDatabase';
import { BestsTab } from './BestsTab';
import { SongData } from '../rating/data/SongData';
import { addErrorToast, addToast, addWarningToast, MyToaster } from './components/Toaster';
import { ExternalLink, Settings, Upload } from 'lucide-solid';

function FileLoadBar(props: { onFileLoad: (data: any) => void }) {
  let fileInputRef: HTMLInputElement | undefined;

  let [fileData, setFileData] = createSignal<null | any>(null);

  const handleFileSelect = async (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (!file) return;

    try {
      console.log("Loading file");
      const text = await file.text();
      const data = JSON.parse(text);
      setFileData(data);
    } catch (e) {
      console.error('Error loading file:', e);
      addErrorToast({title: `Error loading file: ${file.name}`, description: `${e}`});
      target.value = '';
    }
  };

  const goButtonClicked = (ev) => {
    const target = ev.currentTarget;
    const data = fileData();
    if (data == null) {
      addWarningToast({description: "Please load a file!"});
    } else {
      // change the Go button to indicate processing before starting
      // requestAnimationFrame to make sure the visual change renders before
      let prev = {
        'bg': target.style['background'],
        'pe': target.style['pointer-events'],
      }
      requestAnimationFrame(() => {
        target.style['background'] = "var(--color-blue-200)";
        target.style['pointer-events'] = "none";
        setTimeout(() => {          
          try {
            props.onFileLoad(data);
          } finally {
            target.style['background'] = prev.bg;
            target.style['pointer-events'] = prev.pe;
          }
        });
      });
    }
  };

  return (
    <div style="width: 100%; background: #f3f4f6; border-bottom: 1px solid #e5e7eb; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 12px">
      <label style="font-weight: 500; font-size: 14px;">Load Score Data:</label>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style="font-size: 14px;"
        onchange={handleFileSelect}
      />
      <label for="version">
        Version: 
      </label>
      <select
        id="version"
        value={settings.version}
        onChange={(e) => setSettings('version', e.currentTarget.value)}
      >
        {AVAILABLE_ONGEKI_VERSIONS.map(([k,v]) => <option value={k}>{k}</option>)}
      </select>
      <label for="mode">
        Mode: 
      </label>
      <select
        id="mode"
        value={settings.mode}
        onChange={(e) => setSettings('mode', e.currentTarget.value)}
      >
        <option value={Mode.ONGEKI}>Ongeki</option>
        <option value={Mode.REFRESH}>Refresh</option>
      </select>
      <button
        onClick={goButtonClicked}
        style="padding: 6px 12px; background: var(--color-blue-500); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;"
      >
        <Upload size={14} style="vertical-align: middle; margin-right: 4px;" />
        Go
      </button>
      </div>
      <div>
        <a class="flex justify-between items-center gap-1" target="_blank" href="https://github.com/barrysir/rating-analyzer">Help <ExternalLink class="my-icon" /></a>
      </div>
    </div>
  );
}

function SettingsWindow() {
  return (
    <div style="display: grid; grid-template-columns: auto auto; column-gap: 12px; align-items: center;">
      <label for="decimal-places">
        Decimal Places
      </label>
      <input
        id="decimal-places"
        type="number"
        min="0"
        max="10"
        value={settings.decimalPlaces}
        onInput={(e) => setSettings('decimalPlaces', parseInt(e.currentTarget.value) || 0)}
      />
      <label for="show-only-improvements">
        Show Only Improvements
      </label>
      <input
        id="show-only-improvements"
        type="checkbox"
        checked={settings.showOnlyImprovements}
        onChange={(e) => setSettings('showOnlyImprovements', e.currentTarget.checked)}
      />
    </div>
  );
}

function SettingsButton() {
  return <Popover.Root>
      <Popover.Trigger
        style="position: absolute; top: 16px; right: 16px; padding: 8px;"
        aria-label="Settings"
      >
        <Settings size={14} />
      </Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content
          style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); z-index: 50;"
        >
          {/* <Popover.Title style="font-weight: 600; margin-bottom: 8px;">Settings</Popover.Title> */}
          <Popover.Description style="font-size: 12px;">
            <SettingsWindow />
          </Popover.Description>
          {/* <Popover.CloseTrigger
            style="position: absolute; top: 8px; right: 8px; padding: 4px;"
            aria-label="Close"
          >
            <XIcon />
          </Popover.CloseTrigger> */}
        </Popover.Content>
      </Popover.Positioner>
    </Popover.Root>;
}

function Actual(props: {scoreData: UserScoreDatabase, songDb: SongData}) {
  createEffect(on(() => [props.scoreData, props.songDb, settings.mode, settings.version] as const, ([data, db, mode, version]) => {
    clearWarnings();
    let versions = getVersionsArray(version);
    initializeState(data, db, mode, versions, { decimalPlaces: settings.decimalPlaces });
  }));

  return <HistoryProvider>{({ mode, history, helpers, theme, setPointId }) => (
    <div style="position: relative; flex: 1; overflow: hidden; display: grid; grid-template-columns: 4fr 6fr; align-items: center;">
      <WarningWindow />
      <SettingsButton />
      <div style="height: 50%; display: flex; flex-direction: column; align-items: center;">
        <RatingChart data={history.chartData} options={{decimalPlaces: settings.decimalPlaces}} onClick={(index) => setPointId(index)} />
        <div style="width: 90%">
          <Show when={history.history !== null}>
            <Slider />
          </Show>
        </div>
      </div>
      <TooltipDelegated style="height: 100%; padding-top: 50px; display: flex; flex-direction: column; overflow: hidden;">  
        <Show when={history.history !== null}>
          <Tabs.Root defaultValue="frame" style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
            <div>
              <Tabs.List>
                <Tabs.Trigger value="frame">Frame</Tabs.Trigger>
                <Tabs.Trigger value="image">Reiwa</Tabs.Trigger>
                <Tabs.Trigger value="improve">Improvements</Tabs.Trigger>
                <Tabs.Trigger value="best">Bests</Tabs.Trigger>
              </Tabs.List>
            </div>
            <div style="border: 1px solid #ddd; border-radius: 4px 4px 0 0; padding: 0px 4px; flex: 1; overflow: auto;">
              <Tabs.Content value="frame">
                <Switch>
                  <Match when={mode == Mode.REFRESH}>
                    <RefreshFrameTab pointId={history.pointId} calc={history.history!.calc} />
                  </Match>
                  <Match when={mode == Mode.ONGEKI}>
                    <OngekiFrameTab pointId={history.pointId} calc={history.history!.calc} />
                  </Match>
                </Switch>
              </Tabs.Content>
              <Tabs.Content value="image">
                WIP
              </Tabs.Content>
              <Tabs.Content value="improve">
                <ImprovementTab mode={mode} improves={history.improves} scrollToPointId={history.pointId} />
              </Tabs.Content>
              <Tabs.Content value="best">
                <BestsTab mode={mode} db={history.history.calc.db} best={history.bests} />
              </Tabs.Content>
            </div>
          </Tabs.Root>
        </Show>
      </TooltipDelegated>
    </div>
  )}</HistoryProvider>
}

function LoadingSongDbBox() {
  return <div style="margin: 20px; border: 2px solid var(--color-gray-400); background-color: var(--color-gray-300); padding: 20px; width: fit-content; height: fit-content;">
    <span>Loading song db...</span>
  </div>
}

const App: Component = () => {
  const [scoreData, setScoreData] = createSignal<UserScoreDatabase | null>(null);

  const handleFileLoad = (data: UserScoreDatabase) => {
    try {
      console.log(`Loading new score data - ${data.scores.length} scores`);
      setScoreData(data);
    } catch (e) {
      console.error(e);
      addErrorToast({title: `Error loading file`, description: `${e}`}); 
    }
  };

  const fetchSongDb = async (game: Game) => {
    console.log("Fetching game db", game);
    const res = await fetch("dbs/ongeki.json");
    return new SongData(await res.json());
  };

  const [songdb] = createResource(settings.game, fetchSongDb);

  return <div style="width: 100vw; height: 100vh; display: flex; flex-direction: column;">
    <FileLoadBar onFileLoad={handleFileLoad} />
    <Suspense fallback={<LoadingSongDbBox />}>
      <Show when={scoreData() !== null}>
        <Actual scoreData={scoreData()!} songDb={songdb()} />
      </Show>
    </Suspense>
    <MyToaster />
  </div>;
};

export default App;
