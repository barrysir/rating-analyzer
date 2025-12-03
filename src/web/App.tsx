import type { Component } from 'solid-js';
import { createEffect, onMount, Show } from 'solid-js';
import { RatingChart } from './RatingChart';
import { loadScoreData } from './Temp';
import { Icon } from '@iconify-icon/solid';
import { Popover, Tabs } from '@ark-ui/solid';
import { settings, setSettings } from './stores/settingsStore';
import { history, initializeHistory, setScoreIndex } from './stores/historyStore';
import { OngekiRatingRenderer } from './OngekiRatingRenderer';
import { ImprovementTable } from './ImprovementTable';


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
  const scoreData = loadScoreData();

  onMount(() => {
    initializeHistory(scoreData, { decimalPlaces: settings.decimalPlaces });
  });

  return <div style="width: 100vw; height: 100vh;">
    <SettingsButton />
    <div style="width: 100%; height: 100%; display: grid; grid-template-columns: 4fr 6fr; align-items: center;">
      <div style="height: 50%">
        <RatingChart data={history.chartData} options={{decimalPlaces: settings.decimalPlaces}} onClick={(index) => setScoreIndex(index)} />
      </div>
      <div style="height: 100%; padding-top: 50px;">
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
                  <OngekiRatingRenderer scoreIndex={history.scoreIndex} calc={history.history!.calc} />
                </Tabs.Content>
                <Tabs.Content value="image">
                  WIP
                </Tabs.Content>
                <Tabs.Content value="improve">
                  <ImprovementTable improves={history.improves} scrollToPointId={history.scoreIndex} />
                </Tabs.Content>
              </div>
            </div>
          </Tabs.Root>
        </Show>
      </div>
    </div>
  </div>
};

export default App;
