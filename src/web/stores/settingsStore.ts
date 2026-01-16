import { createStore } from 'solid-js/store';
import { Game, Mode } from "../types";
import { VersionEnum } from "../versions";

interface SettingsStore {
  decimalPlaces: number;
  version: VersionEnum;
  game: Game;
  mode: Mode;
  showOnlyImprovements: boolean;
}

const [settings, setSettings] = createStore<SettingsStore>({
  decimalPlaces: 2,
  game: Game.ONGEKI,
  mode: Mode.ONGEKI,
  version: 'MYT',
  showOnlyImprovements: false,
});

export { settings, setSettings };