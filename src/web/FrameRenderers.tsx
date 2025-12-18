import { For, Match, Switch } from 'solid-js';
import "./FrameRenderers.css";
import { settings } from './stores/settingsStore';
import { HistoryProvider } from './stores/stateStore';

export type FrameEntry = {
  rating: number;
  title: string;
  level: number;
  points: number;
}

export type PlatinumEntry = {
  rating: number;
  title: string;
  level: number;
  platinum: number;
  maxPlatinum: number;
}

export function DisplayFrame(props: { data: FrameEntry[] | PlatinumEntry[], title: string, color?: string, rows: number, platinum?: boolean }) {
  let totalRating = () => props.data.reduce((prev, t) => prev + t.rating, 0);
  let averageRating = () => totalRating() / props.data.length;

  const NULL_MARKER = "--";

  const displayData = () => {
    if (props.rows === undefined) {
      return props.data;
    }
    
    const result: ((typeof props.data)[number] | null)[] = [];
    for (let i = 0; i < props.rows; i++) {
      result.push(props.data[i] ?? null);
    }

    if (props.data.length > props.rows) {
      console.error(`More entries sent to DisplayFrame than expected: num entries ${props.data.length}, expected ${props.rows}`, props.data);
    }
    return result;
  };

  return <HistoryProvider>{({ history, helpers, theme }) => (
  <div style="font-size: 0.8em; border: 1px solid black; border-radius: 4px; overflow: hidden;">
    <div style={{'text-align': 'center', 'border-bottom': '1px solid black'}}>
      <h2 style={{ 'color': props.color ?? 'black', }}>{props.title}</h2>
      <span style="font-size: 0.9em">average {averageRating().toFixed(settings.decimalPlaces)} / total {totalRating().toFixed(settings.decimalPlaces)}</span>
    </div>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr>
          <th></th>
          <th>Rating</th>
          <th>Title</th>
          <th>Level</th>
          <th>{props.platinum ? "Platinum" : "Points"}</th>
        </tr>
      </thead>
      <tbody>
        <For each={displayData()}>
          {(item, index) => {
            return <tr>
              <td>#{index()+1}</td>
              <Switch>
                <Match when={props.platinum}>
                  <td>{item ? theme.formatPlatinumRating(item.rating, item.scoreId) : NULL_MARKER}</td>
                </Match>
                <Match when={!props.platinum}>  
                  <td>{item ? theme.formatRating(item.rating, item.scoreId) : NULL_MARKER}</td>
                </Match>
              </Switch>
              <td style="width: 100%;">{item ? item.title : NULL_MARKER}</td>
              <td>{item ? item.level : NULL_MARKER}</td>
              <Switch>
                <Match when={props.platinum}>
                  <td>{item ? theme.formatPlatinum(item.platinum, item.maxPlatinum) : NULL_MARKER}</td>
                </Match>
                <Match when={!props.platinum}>  
                  <td>{item ? theme.formatPoints(item.points, item.scoreId) : NULL_MARKER}</td>
                </Match>
              </Switch>
            </tr>
          }}
        </For>
      </tbody>
    </table>
  </div>
  )}</HistoryProvider>
}
