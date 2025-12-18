import { Accordion, Collapsible, MenuItem } from "@ark-ui/solid";
import { VersionImproveRenderData } from './stores/historyStore';
import { For, Index, Show, createEffect, createSignal } from "solid-js";
import './ImprovementTab.css';
import { Icon } from "@iconify-icon/solid";
import { settings } from "./stores/settingsStore";
import { findRegion, getRegion } from "../rating/utils";
import { HistoryProvider, Mode, unpackHistory } from "./stores/stateStore";

function FrameImprovementRender(props: { rating: number, change?: number, color: string }) {
    return <HistoryProvider<Mode.ONGEKI>>{({theme}) => (
        <div style={{ 'color': props.color, 'display': 'flex', 'flex-direction': 'column', 'align-items': 'center' }}>
            <span>{theme.formatRatingText(props.rating)}</span>
            <Show when={props.change !== undefined}>
                <span style="font-size: 0.7em">{theme.formatChangeRating(props.change!)}</span>
            </Show>
        </div>
    )}</HistoryProvider>;
}

function VersionImprovement(props: { improves: VersionImproveRenderData<Mode.ONGEKI>['improves'] }) {
    return <HistoryProvider<Mode.ONGEKI>>{({ history, helpers, theme }) => (
        <div class="improve-list">
            <For each={props.improves}>
                {(item, index) => {
                    let score = helpers.getScore(item.scoreId);
                    if (score === undefined) {
                        return;
                    }
                    let song = helpers.getSong(item.pointId, score.chartId);
                    if (song === undefined) {
                        console.warn("Couldn't find song info for", score.chartId, "at", item.pointId);
                        return;
                    }
                    let frame = item.data;
                    return <div class="improve-row" data-point-id={item.pointId.toString()}>
                        <span classList={{'text-blue-500': (history.pointId == item.pointId)}}>{item.pointId}</span>
                        <span>{song?.title} - {theme.formatPoints(score.points)} ({theme.formatRating(score.rating, item.scoreId)})</span>
                        <span></span>
                        <span></span>
                        <FrameImprovementRender rating={frame.total} change={frame.changes.total} color={theme.frameColors['total']} />
                        <FrameImprovementRender rating={frame.best} change={frame.changes.best} color={theme.frameColors['best']} />
                        <FrameImprovementRender rating={frame.new} change={frame.changes.new} color={theme.frameColors['new']} />
                        <FrameImprovementRender rating={frame.recent} change={frame.changes.recent} color={theme.frameColors['recent']} />
                    </div>
                }}
            </For>
        </div>
    )}</HistoryProvider>
}

export function ImprovementTab(props: { improves: VersionImproveRenderData<Mode.ONGEKI>[], scrollToPointId?: number }) {
    let rootElement: HTMLDivElement;
    let renderedImproves: Map<number, VersionImproveRenderData<Mode.ONGEKI>['improves']> = new Map();
    const [openItems, setOpenItems] = createSignal<string[]>([]);

    // Find which version contains the target pointId
    const findVersionIndexForPoint = (pointId: number): number | undefined => {
        return findRegion(props.improves, pointId, versionData => versionData.improves[0]!.pointId) ?? undefined;
    };

    createEffect(() => {
        const targetPointId = props.scrollToPointId;
        
        // only scroll if table is visible -- this also fixes bugs like how the table will try to scroll when first initializing
        if (!rootElement.checkVisibility()) {
            return;
        }

        console.log("Scrolling improvement table to", targetPointId);
        if (targetPointId !== undefined) {
            // Find which accordion contains this pointId
            const versionIndex = findVersionIndexForPoint(targetPointId);
            if (versionIndex !== undefined && versionIndex >= 0) {
                const versionIndexStr = versionIndex.toString();
                // Open the accordion if it's not already open
                setOpenItems(prev => {
                    if (!prev.includes(versionIndexStr)) {
                        return [...prev, versionIndexStr];
                    }
                    return prev;
                });

                // because there might not be a row for this point id (e.g. show only improvements is enabled)
                // find the closest point id that's being shown
                let improves = renderedImproves.get(versionIndex);
                if (improves === undefined) {
                    console.warn(renderedImproves, versionIndex);
                    throw new Error("improves is undefined");
                }
                const closestPointId = getRegion(improves, targetPointId, i => i.pointId)?.pointId;
                if (closestPointId === undefined) {
                    console.warn(improves, targetPointId);
                    throw new Error(`couldn't calculate closest point id? ${targetPointId}`);
                }
                console.log("Actually scrolling to", closestPointId);

                // Wait a bit for the accordion to open before scrolling
                setTimeout(() => {
                    const element = rootElement.querySelector(`[data-point-id='${closestPointId}'] span`);
                    if (element) {
                        element.scrollIntoView({ block: 'center' });  // behavior: 'smooth',
                    }
                }, 50);
            }
        }
    });

    return <HistoryProvider<Mode.ONGEKI>>{({ history, helpers, theme }) => (
        <Accordion.Root
            multiple
            collapsible
            class="improvement-accordion"
            value={openItems()}
            onValueChange={(details) => setOpenItems(details.value)}
            ref={(el) => rootElement = el}
        >
            <Index each={props.improves}>
                {(item, index) => {
                    let versionId = item().versionId;
                    let version = helpers.getVersion(versionId);
                    let versionDate = theme.formatDate(helpers.getTimestamp(version.pointId));            
                    let improves = () => {
                        let improves = item().improves;
                        if (settings.showOnlyImprovements) {
                            improves = improves.filter(item => item.data.isImprovement);
                        }
                        return improves;
                    };
                    renderedImproves.set(versionId, improves());
                    
                    return <Accordion.Item value={index.toString()} class="accordion-item">
                        <Accordion.ItemTrigger class="accordion-trigger">
                            <span class="accordion-title">{versionDate} - {version.name}</span>
                            <Accordion.ItemIndicator class="accordion-indicator">
                                <Icon icon="lucide:chevron-down" />
                            </Accordion.ItemIndicator>
                        </Accordion.ItemTrigger>
                        <Accordion.ItemContent class="accordion-content">
                            <VersionImprovement improves={improves()} />
                        </Accordion.ItemContent>
                    </Accordion.Item>;
                }}
            </Index>
        </Accordion.Root>
    )}</HistoryProvider>
}