import { dateToUnix } from "../rating/utils";
import { VersionInformation } from "./stores/historyStore";

const COLORS = {
  red: "oklch(0.753 0.1642 27.58)",
  yellow: "oklch(0.833 0.1642 83.42)",
  blue: "oklch(0.833 0.1642 256.77)",
  ice: "oklch(0.933 0.1642 256.77)",
  pink: "oklch(0.880 0.1642 6.19)",
  green: "oklch(0.833 0.1642 133.82)",
};
const VERSION_MYT = [
  {
    name: 'bright',
    version: 'bright',
    timestamp: 0,
    plotBackgroundColor: COLORS.red,
  },
  {
    name: 'bright MEMORY Act.2',
    version: 'bright MEMORY Act.2',
    timestamp: dateToUnix(new Date("2023-10-31")),
    plotBackgroundColor: COLORS.yellow,
  },
  {
    name: 'bright MEMORY Act.3',
    version: 'bright MEMORY Act.3',
    timestamp: dateToUnix(new Date("2025-04-27")),
    plotBackgroundColor: COLORS.blue,
  },
] as VersionInformation[];
function makeVersion(name: string, color: string): VersionInformation[] {
  return [
    {
      name: name,
      version: name,
      timestamp: 0,
      plotBackgroundColor: color,
    } as VersionInformation
  ];
}
// need an ordering too
// so i need an enum which 1) is ordered 2) has an internal value, display value, and a makeVersion() associated


export const AVAILABLE_ONGEKI_VERSIONS = [
  ["MYT", VERSION_MYT],
  ["ONGEKI", makeVersion("ONGEKI", COLORS.pink)],
  ["ONGEKI PLUS", makeVersion("ONGEKI PLUS", COLORS.pink)],
  ["SUMMER", makeVersion("SUMMER", COLORS.yellow)],
  ["SUMMER PLUS", makeVersion("SUMMER PLUS", COLORS.yellow)],
  ["R.E.D.", makeVersion("R.E.D.", COLORS.red)],
  ["R.E.D. PLUS", makeVersion("R.E.D. PLUS", COLORS.red)],
  ["bright", makeVersion("bright", COLORS.blue)],
  ["bright MEMORY Act.1", makeVersion("bright MEMORY Act.1", COLORS.ice)],
  ["bright MEMORY Act.2", makeVersion("bright MEMORY Act.2", COLORS.ice)],
  ["bright MEMORY Act.3", makeVersion("bright MEMORY Act.3", COLORS.ice)],
  ["Re:Fresh", makeVersion("Re:Fresh", COLORS.green)],
] as const;
const LOOKUP = Object.fromEntries(AVAILABLE_ONGEKI_VERSIONS);

export type VersionEnum = (typeof AVAILABLE_ONGEKI_VERSIONS)[number][0];

export function getVersionsArray(v: VersionEnum): VersionInformation[] {
  return LOOKUP[v]!;
}
