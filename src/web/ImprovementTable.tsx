import { Accordion, Collapsible, MenuItem } from "@ark-ui/solid";
import { VersionImproveRenderData } from "./Temp";
import { For, Index, Show } from "solid-js";
import { historyGetVersion, historyGetScore, historyGetSong, historyGetTimestamp } from "./stores/historyStore";
import './ImprovementTable.css';
import { Icon } from "@iconify-icon/solid";

function FrameImprovementRender(props: { rating: number, change?: number, color: string }) {
    return <div style={{ 'color': props.color, 'display': 'flex', 'flex-direction': 'column', 'align-items': 'center' }}>
        <span>{props.rating.toFixed(3)}</span>
        <Show when={props.change !== undefined}>
            <span style="font-size: 0.7em">{props.change.toFixed(3)}</span>
        </Show>
    </div>
}
function VersionImprovement(props: { data: VersionImproveRenderData }) {
    // (point index) Version {} (center aligned?)       (different colour to signify it's collapsible)
    // (point index) {song title} - {points}        {rating} {best} {new} {recent} (tiny text below showing the increase to rating)

    return <div class="improve-list">
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
}

function formatDate(date: Date): string {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
}

export function ImprovementTable(props: { improves: VersionImproveRenderData[] }) {
    return <Accordion.Root multiple collapsible class="improvement-accordion">
        <Index each={props.improves}>
            {(item, index) => {
                let version = historyGetVersion(item().versionId);
                if (version === undefined) {
                    throw new Error("");
                }
                let versionDate = formatDate(historyGetTimestamp(version.pointId)!);
                return <Accordion.Item value={index.toString()} class="accordion-item">
                    <Accordion.ItemTrigger class="accordion-trigger">
                        <span class="accordion-title">{versionDate} - {version.name}</span>
                        <Accordion.ItemIndicator class="accordion-indicator">
                            <Icon icon="lucide:chevron-down" />
                        </Accordion.ItemIndicator>
                    </Accordion.ItemTrigger>
                    <Accordion.ItemContent class="accordion-content">
                        <VersionImprovement data={item()} />
                    </Accordion.ItemContent>
                </Accordion.Item>;
            }}
        </Index>
    </Accordion.Root>
}