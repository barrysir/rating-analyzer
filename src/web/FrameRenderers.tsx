import { For } from 'solid-js';
import "./FrameRenderers.css";
import { settings } from './stores/settingsStore';

export type FrameEntry = {
  rating: number;
  title: string;
  level: number;
  points: number;
}

export function DisplayFrame(props: { data: FrameEntry[], title: string, color?: string, rows: number }) {
  let totalRating = () => props.data.reduce((prev, t) => prev + t.rating, 0);
  let averageRating = () => totalRating() / props.data.length;

  const NULL_MARKER = "--";

  const displayData = () => {
    if (props.rows === undefined) {
      return props.data;
    }
    
    const result: (FrameEntry | null)[] = [];
    for (let i = 0; i < props.rows; i++) {
      result.push(props.data[i] ?? null);
    }

    if (props.data.length > props.rows) {
      console.error(`More entries sent to DisplayFrame than expected: num entries ${props.data.length}, expected ${props.rows}`, props.data);
    }
    return result;
  };

  return <div style="font-size: 0.8em; border: 1px solid black; border-radius: 4px; overflow: hidden;">
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
          <th>Points</th>
        </tr>
      </thead>
      <tbody>
        <For each={displayData()}>
          {(item, index) => {
            return <tr>
              <td>#{index()+1}</td>
              <td>{item ? item.rating.toFixed(2) : NULL_MARKER}</td>
              <td style="width: 100%;">{item ? item.title : NULL_MARKER}</td>
              <td>{item ? item.level : NULL_MARKER}</td>
              <td>{item ? item.points : NULL_MARKER}</td>
            </tr>
          }}
        </For>
      </tbody>
    </table>
  </div>
}
