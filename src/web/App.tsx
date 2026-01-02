import type { Component } from 'solid-js';
import { createEffect, createSignal, Match, on, onMount, Show, Switch } from 'solid-js';
import { RatingChart } from './RatingChart';
import { loadScoreData } from './Temp';
import { Icon } from '@iconify-icon/solid';
import { Popover, Tabs } from '@ark-ui/solid';
import { settings, setSettings } from './stores/settingsStore';
import { OngekiFrameTab, RefreshFrameTab } from './FrameTab';
import { ImprovementTab } from './ImprovementTab';
import Slider from './Slider';
import { TooltipDelegated } from './TooltipDelegatedTest';
import { HistoryProvider, initializeState, Mode } from './stores/stateStore';
import WarningWindow from './WarningWindow';
import { clearWarnings } from './stores/warningStore';
import { UserScoreDatabase } from '../get-kamai/UserScores';
import { BestsTab } from './BestsTab';

function FileLoadBar(props: { onFileLoad: (data: any) => void }) {
  let fileInputRef: HTMLInputElement | undefined;

  const handleFileSelect = async (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      props.onFileLoad(data);
    } catch (error) {
      console.error('Error loading file:', error);
      alert('Failed to load file. Please ensure it is a valid JSON file.');
    }
  };

  return (
    <div style="width: 100%; background: #f3f4f6; border-bottom: 1px solid #e5e7eb; padding: 12px 16px; display: flex; align-items: center; gap: 12px;">
      <label style="font-weight: 500; font-size: 14px;">Load Score Data:</label>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style="font-size: 14px;"
      />
      <label for="version">
        Version: 
      </label>
      <select
        id="version"
        value={settings.version}
        onChange={(e) => setSettings('version', e.currentTarget.value)}
      >
        <option value="latest">latest</option>
        <option value="beta">beta</option>
        <option value="mythos">Mythos</option>
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
        onClick={() => fileInputRef?.click()}
        style="padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;"
      >
        <Icon icon="lucide:upload" style="vertical-align: middle; margin-right: 4px;" />
        Go
      </button>
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
      <label for="version">
        Version
      </label>
      <select
        id="version"
        value={settings.version}
        onChange={(e) => setSettings('version', e.currentTarget.value)}
      >
        <option value="latest">latest</option>
        <option value="beta">beta</option>
        <option value="new">new</option>
      </select>
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
        <Icon icon="lucide:settings" />
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
            <Icon icon="lucide:x" />
          </Popover.CloseTrigger> */}
        </Popover.Content>
      </Popover.Positioner>
    </Popover.Root>;
}

function Actual(props: {scoreData: UserScoreDatabase}) {
  createEffect(on(() => [props.scoreData, settings.mode] as const, ([data, mode]) => {
      clearWarnings();
      initializeState(data, mode, { decimalPlaces: settings.decimalPlaces });
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

const App: Component = () => {
  const [scoreData, setScoreData] = createSignal<UserScoreDatabase>(loadScoreData());

  const handleFileLoad = (data: UserScoreDatabase) => {
    console.log(`Loading new score data - ${data.scores.length} scores`);
    setScoreData(data);
  };

  return <div style="width: 100vw; height: 100vh; display: flex; flex-direction: column;">
    <FileLoadBar onFileLoad={handleFileLoad} />
    <Actual scoreData={scoreData()} />
  </div>;
};

export default App;
