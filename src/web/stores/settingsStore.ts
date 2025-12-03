import { createStore } from 'solid-js/store';

interface SettingsStore {
  decimalPlaces: number;
  version: string;
  showOnlyImprovements: boolean;
}

const [settings, setSettings] = createStore<SettingsStore>({
  decimalPlaces: 2,
  version: 'latest',
  showOnlyImprovements: false,
});

export { settings, setSettings };