import { Accordion, Collapsible, MenuItem } from "@ark-ui/solid";
import { FrameRating, VersionImproveRenderData } from './stores/historyStore';
import { For, Index, Match, Show, Switch, createEffect, createSignal } from "solid-js";
import './ImprovementTab.css';
import { Icon } from "@iconify-icon/solid";
import { settings } from "./stores/settingsStore";
import { indexRegion, getRegion } from "../rating/utils";
import { HistoryProvider, Theme, unpackHistory } from "./stores/stateStore";
import { Mode } from "./types";

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

function OngekiRender(props: { frame: FrameRating<Mode.ONGEKI>, theme: Theme<Mode.ONGEKI>}) {
    return <>
        <FrameImprovementRender rating={props.frame.total} change={props.frame.changes.total} color={props.theme.frameColors['total']} />
        <FrameImprovementRender rating={props.frame.best} change={props.frame.changes.best} color={props.theme.frameColors['best']} />
        <FrameImprovementRender rating={props.frame.new} change={props.frame.changes.new} color={props.theme.frameColors['new']} />
        <FrameImprovementRender rating={props.frame.recent} change={props.frame.changes.recent} color={props.theme.frameColors['recent']} />
    </>;
}

function RefreshRender(props: { frame: FrameRating<Mode.REFRESH>, theme: Theme<Mode.REFRESH>}) {
    return <>
        <FrameImprovementRender rating={props.frame.total} change={props.frame.changes.total} color={props.theme.frameColors['total']} />
        <FrameImprovementRender rating={props.frame.best} change={props.frame.changes.best} color={props.theme.frameColors['best']} />
        <FrameImprovementRender rating={props.frame.new} change={props.frame.changes.new} color={props.theme.frameColors['new']} />
        <FrameImprovementRender rating={props.frame.plat} change={props.frame.changes.plat} color={props.theme.frameColors['plat']} />
    </>;
}

function GeneralRender<M extends Mode>(props: { mode: M, frame: FrameRating<M>, theme: Theme<M>}) {
    return <Switch>
        <Match when={props.mode == Mode.ONGEKI}>
            <OngekiRender frame={props.frame as FrameRating<Mode.ONGEKI>} theme={props.theme as Theme<Mode.ONGEKI>} />
        </Match>
        <Match when={props.mode == Mode.REFRESH}>
            <RefreshRender frame={props.frame as FrameRating<Mode.REFRESH>} theme={props.theme as Theme<Mode.REFRESH>} />
        </Match>
    </Switch>
}

function VersionImprovement<M extends Mode>(props: { mode: M, improves: VersionImproveRenderData<M>['improves'] }) {
    console.log("I'm being rendered?", props.improves[0]);
    return <HistoryProvider<M>>{({ history, helpers, theme }) => (
        <div class="improve-list">
            <For each={props.improves}>
                {(item, index) => {
                    let score = helpers.getScore(item.scoreId);
                    if (score === undefined) {
                        return;
                    }
                    let info = helpers.getChart(item.pointId, score.chartId);
                    if (info === null) {
                        console.warn("Couldn't find song info for", score.chartId, "at", item.pointId);
                        return;
                    }
                    let {song, chart} = info;
                    let frame = item.data;

                    let completionPercentage = score.totalJudgements / chart.noteCount;
                    let survival;
                    if (completionPercentage == 1) {
                        survival = "";
                    } else {
                        survival = `(completed ${Math.floor(completionPercentage * 100)}%) `;
                    }
                    
                    return <div class="improve-row" data-point-id={item.pointId.toString()}>
                        <span classList={{'text-blue-500': (history.pointId == item.pointId)}}>{item.pointId}</span>
                        <span>{song?.title} #{score.attemptNumber + 1} {survival}- {theme.formatPoints(score.points, item.scoreId)} ({theme.formatRating(score.rating, item.scoreId)})</span>
                        <span></span>
                        <span></span>
                        <GeneralRender mode={props.mode} frame={frame} theme={theme} />
                    </div>
                }}
            </For>
        </div>
    )}</HistoryProvider>
}

export function ImprovementTab<M extends Mode>(props: { mode: M, improves: VersionImproveRenderData<M>[], scrollToPointId?: number }) {
    let rootElement: HTMLDivElement;
    let renderedImproves: Map<number, VersionImproveRenderData<M>['improves']> = new Map();
    const [openItems, setOpenItems] = createSignal<string[]>([]);

    // Find which version contains the target pointId
    const findVersionIndexForPoint = (pointId: number): number | undefined => {
        return indexRegion(props.improves, pointId, versionData => versionData.improves[0]!.pointId) ?? undefined;
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

                    const value = index.toString();
                    
                    return <Accordion.Item value={value} class="accordion-item">
                        <Accordion.ItemTrigger class="accordion-trigger">
                            <span class="accordion-title">{versionDate} - {version.name}</span>
                            <Accordion.ItemIndicator class="accordion-indicator">
                                <Icon icon="lucide:chevron-down" />
                            </Accordion.ItemIndicator>
                        </Accordion.ItemTrigger>
                        <Accordion.ItemContent class="accordion-content">
                            {/* TODO: currently it'll rerender everytime you open the accordion -- add caching so it only renders the first time? */}
                            <Show when={openItems().includes(value)}>
                                <VersionImprovement mode={props.mode} improves={improves()} />
                            </Show>
                        </Accordion.ItemContent>
                    </Accordion.Item>;
                }}
            </Index>
        </Accordion.Root>
    )}</HistoryProvider>
}