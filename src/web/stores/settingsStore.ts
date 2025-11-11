import { createStore } from 'solid-js/store';

interface SettingsStore {
  decimalPlaces: number;
  version: string;
}

const [settings, setSettings] = createStore<SettingsStore>({
  decimalPlaces: 2,
  version: 'latest',
});

export { settings, setSettings };