import type { Component } from 'solid-js';
import { createEffect, createSignal, Match, onMount, Show, Switch } from 'solid-js';
import { RatingChart } from './RatingChart';
import { loadScoreData } from './Temp';
import { Icon } from '@iconify-icon/solid';
import { Popover, Tabs } from '@ark-ui/solid';
import { settings, setSettings } from './stores/settingsStore';
import { history, initializeHistory, setPointId } from './stores/historyStore';
import { OngekiFrameTab, RefreshFrameTab } from './FrameTab';
import { ImprovementTab } from './ImprovementTab';
import Slider from './Slider';
import { TooltipDelegated } from './TooltipDelegatedTest';
import { HistoryProvider, initializeState, Mode } from './stores/stateStore';
import WarningWindow from './WarningWindow';
import { clearWarnings } from './stores/warningStore';

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
        onChange={handleFileSelect}
        style="font-size: 14px;"
      />
      <button
        onClick={() => fileInputRef?.click()}
        style="padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;"
      >
        <Icon icon="lucide:upload" style="vertical-align: middle; margin-right: 4px;" />
        Choose File
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

const App: Component = () => {
  const [scoreData, setScoreData] = createSignal(loadScoreData());

  const handleFileLoad = (data: any) => {
    setScoreData(data);
    clearWarnings();
    initializeState(data, Mode.REFRESH, { decimalPlaces: settings.decimalPlaces });
  };

  onMount(() => {
    let mode = Mode.REFRESH;
    let a = 4;
    clearWarnings();
    initializeState(scoreData(), mode, { decimalPlaces: settings.decimalPlaces });
  });

  return <HistoryProvider>{({ mode, history, helpers, theme }) => (
  <div style="width: 100vw; height: 100vh; display: flex; flex-direction: column;">
    <FileLoadBar onFileLoad={handleFileLoad} />
    <WarningWindow />
    <SettingsButton />
    <div style="width: 100%; flex: 1; display: grid; grid-template-columns: 4fr 6fr; align-items: center;">
      <div style="height: 50%; display: flex; flex-direction: column; align-items: center;">
        <RatingChart data={history.chartData} options={{decimalPlaces: settings.decimalPlaces}} onClick={(index) => setPointId(index)} />
        <div style="width: 90%">
          <Show when={history.history !== null}>
            <Slider />
          </Show>
        </div>
      </div>
      <div style="height: 100%; padding-top: 50px;">
         <TooltipDelegated>
  
        <Show when={history.history !== null}>
          <Tabs.Root defaultValue="frame">
            <div style="height: 90vh; display: grid; grid-template-rows: auto 1fr;">
              <div>
              <Tabs.List>
                <Tabs.Trigger value="frame">Frame</Tabs.Trigger>
                <Tabs.Trigger value="image">Reiwa</Tabs.Trigger>
                <Tabs.Trigger value="improve">Improvements</Tabs.Trigger>
              </Tabs.List>
              </div>
              <div style="overflow: auto; border: 1px solid #ddd; border-radius: 4px 4px 0 0; padding: 0px 4px; width: 100%; height: 100%;">
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
              </div>
            </div>
          </Tabs.Root>
        </Show></TooltipDelegated>
      </div>
    </div>
  </div>
  )}</HistoryProvider>
};

export default App;
