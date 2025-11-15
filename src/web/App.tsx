import type { Component } from 'solid-js';
import { createEffect, Show } from 'solid-js';
import { RatingChart } from './RatingChart';
import { loadScoreData } from './Temp';
import { Icon } from '@iconify-icon/solid';
import { Popover } from '@ark-ui/solid';
import { settings, setSettings } from './stores/settingsStore';
import { history, initializeHistory, setScoreIndex } from './stores/historyStore';
import { FrameRenderer } from './FrameRenderer';


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
    </div>
  );
}

function SettingsButton() {
  return <Popover.Root open={true}>
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

  createEffect(() => {
    initializeHistory(scoreData, { decimalPlaces: settings.decimalPlaces });
  });

  return <div style="width: 100vw; height: 100vh;">
    <SettingsButton />
    <div style="width: 100%; height: 100%; display: grid; grid-template-columns: 4fr 6fr; align-items: center;">
      <div style="height: 50vh">
        <RatingChart data={history.chartData} options={{decimalPlaces: settings.decimalPlaces}} onClick={(index) => setScoreIndex(index)} />
      </div>
      <div>
        <Show when={history.history !== null}>
          <FrameRenderer scoreIndex={history.scoreIndex} frame={history.history!.calc.best.frame} />
        </Show>
      </div>
    </div>
  </div>
};

export default App;
