import { Collapsible, MenuItem } from "@ark-ui/solid";
import { VersionImproveRenderData } from "./Temp";
import { For, Show } from "solid-js";
import { historyGetDb, historyGetScore, historyGetSong } from "./stores/historyStore";
import './ImprovementTable.css';

function FrameImprovementRender(props: {rating: number, change?: number, color: string}) {
    return <div style={{'color': props.color, 'display': 'flex', 'flex-direction': 'column', 'align-items': 'center'}}>
        <span>{props.rating.toFixed(3)}</span>
        <Show when={props.change !== undefined}>
            <span style="font-size: 0.7em">{props.change.toFixed(3)}</span>
        </Show>
    </div>
}
function VersionImprovement(props: {data: VersionImproveRenderData}) {
    // (point index) Version {} (center aligned?)       (different colour to signify it's collapsible)
    // (point index) {song title} - {points}        {rating} {best} {new} {recent} (tiny text below showing the increase to rating)
    
    return <Collapsible.Root>
        <Collapsible.Trigger>
            {props.data.pointId}
            {/* <Collapsible.Indicator>
        <ChevronRightIcon />
      </Collapsible.Indicator> */}
        </Collapsible.Trigger>
        <Collapsible.Content>
            <div class="improve-list">
                <For each={props.data.improves}>
                    {(item, index) => {
                        let score = historyGetScore(item.scoreId)!;
                        let song = historyGetSong(item.pointId, score.chartId); // Db(item.pointId).getChart(score.chartId).song;
                        if (song === undefined) {
                            console.warn("Couldn't find song info for", score.chartId, "at", item.pointId)
                        }
                        let frame = item.data;
                        return <div class="improve-row">
                            <span>{item.pointId}</span>
                            <span>{song?.title}</span>
                            <span>{score.points}</span>
                            <span>{score.rating?.toFixed(2)}</span>
                            <FrameImprovementRender rating={frame.total} change={frame.changes.total} color="black" />
                            <FrameImprovementRender rating={frame.best} change={frame.changes.best} color="blue" />
                            <FrameImprovementRender rating={frame.new} change={frame.changes.new} color="green" />
                            <FrameImprovementRender rating={frame.recent} change={frame.changes.recent} color="red" />
                        </div>
                    }}
                </For>
            </div>
        </Collapsible.Content>
    </Collapsible.Root>
}

export function ImprovementTable(props: { improves: any }) {
    return <For each={props.improves}>
        {(item, index) => <VersionImprovement data={item}/>}
    </For>
}