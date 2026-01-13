import { createStore } from 'solid-js/store';
import { Mode, VersionEnum } from "../types";

interface SettingsStore {
  decimalPlaces: number;
  version: VersionEnum;
  mode: Mode;
  showOnlyImprovements: boolean;
}

const [settings, setSettings] = createStore<SettingsStore>({
  decimalPlaces: 2,
  mode: Mode.ONGEKI,
  version: 'MYT',
  showOnlyImprovements: false,
});

export { settings, setSettings };