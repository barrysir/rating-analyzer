import { createEffect, createMemo, createSignal, For, JSXElement, Match, mergeProps, Show, splitProps, Switch } from "solid-js";
import { makeChartId } from "../get-kamai/convert-kamai-chart-id";
import { ChartId } from "../rating/chartdb/ChartDb";
import { HistoricalChartDb } from "../rating/chartdb/HistoricalChartDb";
import { BellLamp, ClearLamp, GradeLamp, OngekiDifficulty } from "../rating/data-types";
import { HistoryHelpers, HistoryProvider } from "./stores/stateStore";
import { Mode } from "./types";
import { HistoryStore } from "./stores/historyStore";
import { OngekiLampDisplay } from "../rating/PersonalBests";
import { FloatingPanel } from "@ark-ui/solid";
import { Portal } from "solid-js/web";
import { ArrowDownLeft, Maximize2, Minus, XIcon } from "lucide-solid";
import "./BestsTab.css";
import { objectIsEmpty } from "../rating/utils";

type ChartInformation = {
    jacketUrl: string,
    title: string,
    chartId: ChartId,
};

function TextWithCircle(props: {children: JSXElement, color?: string}) {
    return <div style={{
        width: "15px",
        height: "15px",
        "border-radius": "50%",
        display: "inline-flex",
        "justify-content": "center",
        "align-items": "center",
        color: props.color ?? "white",
        "font-size": "8px",
    }}>
        {props.children}
    </div>
}

function ChartTileNumber(props: {constant: number}) {
    return <div style="width: 100px; height: 100px; border: 2px solid black; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 1.2em">
        {props.constant}
    </div>
}

function BellLampBadge(props: {lamp: BellLamp, color?: string}) {
    return <Show when={props.lamp == BellLamp.FB}>
        <TextWithCircle color={props.color}>FB</TextWithCircle>
    </Show>
}

function GradeLampBadge(props: {lamp: GradeLamp, color?: string}) {
    return <Switch>
        <Match when={props.lamp == GradeLamp.S}>
            <TextWithCircle color={props.color}>S</TextWithCircle>
        </Match>
        <Match when={props.lamp == GradeLamp.SS}>
            <TextWithCircle color={props.color}>SS</TextWithCircle>
        </Match>
        <Match when={props.lamp == GradeLamp.SSS}>
            <TextWithCircle color={props.color}>SSS</TextWithCircle>
        </Match>
        <Match when={props.lamp == GradeLamp.SSS_PLUS}>
            <TextWithCircle color={props.color}>SSS+</TextWithCircle>
        </Match>
    </Switch>
}

function ClearLampBadge(props: {lamp: ClearLamp, color?: string}) {
    return <Switch>
        <Match when={props.lamp == ClearLamp.FC}>
            <TextWithCircle color={props.color}>FC</TextWithCircle>
        </Match>
        <Match when={props.lamp == ClearLamp.AB}>
            <TextWithCircle color={props.color}>AB</TextWithCircle>
        </Match>
        <Match when={props.lamp == ClearLamp.ACB}>
            <TextWithCircle color={props.color}>AB+</TextWithCircle>
        </Match>
    </Switch>
}

function ChartTile(props_: {info: ChartInformation, score: {points: number, lamps: OngekiLampDisplay} | null}) {
    const [props, others] = splitProps(props_, ['info', 'score']);

    return <div style="width: 100px; height: 100px; border: 2px solid black; position: relative; background: black; cursor: pointer" {...others}>
        <img style="opacity: 0.5" src={props.info.jacketUrl} loading='lazy' />
        <Show when={props.score !== null}>
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;">
                <span style="font-weight: bold; font-size: 1.2em; color: white">{props.score!.points}</span>
            </div>
            <div style="position: absolute; top: 0; right: 0; display: flex; flex-direction: row; gap: 1px">
                <ClearLampBadge lamp={props.score!.lamps.clear} />
                <BellLampBadge lamp={props.score!.lamps.bell} />
            </div>
        </Show>
        <div style="position: absolute; bottom: 0; left: 0; background: #00000088; color: white; white-space: nowrap; overflow: hidden; width: 100%; font-size: 0.8em; text-align: center;">
            {props.info.title}
        </div>
    </div>
}

function PlayHistoryLamps(props: {helpers: HistoryHelpers<Mode.REFRESH>;  lamps: {id: number; changed: Partial<OngekiLampDisplay>; lamps: OngekiLampDisplay; }[]}) {
    let renderChanged = (changed: Partial<OngekiLampDisplay>) => {
        return <>
            <ClearLampBadge lamp={changed.clear} color="black" />
            <BellLampBadge lamp={changed.bell} color="black" />
            <GradeLampBadge lamp={changed.grade} color="black" />
        </>;
    };

    return <div style="display: flex; flex-direction: column">
        <For each={props.lamps}>{(lamp, i) => {
            console.log(lamp);
            let score = props.helpers.getScore(lamp.id)!;
            //
            let parts = [
                (i() == 0) ? <>First play</> : null,
                !objectIsEmpty(lamp.changed) ? <>{renderChanged(lamp.changed)} achieved</> : null,
            ].filter(x => x != null);
            if (parts.length == 2) {
                parts = [parts[0], ", ", parts[1]];
            }

            return <span>{lamp.id} | {parts} (play #{score.attemptNumber+1})</span>;
        }}</For>
    </div>
}

function PlayHistoryDialog(props: {info: DialogInfo}) {
    const [open, setOpen] = createSignal(false);

    createEffect(() => {
        if (props.info !== null) {
            setOpen(true);
        }
    });

    return <FloatingPanel.Root open={open()} onOpenChange={(e) => setOpen(e.open)}>
    {/* <FloatingPanel.Trigger>Toggle Panel</FloatingPanel.Trigger> */}
    <Portal>
        <Show when={open()}>
      <FloatingPanel.Positioner>
        <FloatingPanel.Content>
          <FloatingPanel.DragTrigger>
            <FloatingPanel.Header>
              <FloatingPanel.Title asChild={(props) => <h4 {...props()} />}>{props.info!.title}</FloatingPanel.Title>
              <FloatingPanel.Control>
                <FloatingPanel.StageTrigger stage="minimized">
                  <Minus class="my-icon" />
                </FloatingPanel.StageTrigger>
                <FloatingPanel.StageTrigger stage="maximized">
                  <Maximize2 class="my-icon" />
                </FloatingPanel.StageTrigger>
                <FloatingPanel.StageTrigger stage="default">
                  <ArrowDownLeft class="my-icon" />
                </FloatingPanel.StageTrigger>
                <FloatingPanel.CloseTrigger>
                  <XIcon class="my-icon" />
                </FloatingPanel.CloseTrigger>
              </FloatingPanel.Control>
            </FloatingPanel.Header>
          </FloatingPanel.DragTrigger>
          <FloatingPanel.Body>
            <Show when={props.info.bests !== null} fallback={"This song has not been played yet!"}>
                {/* <p>{JSON.stringify(props.info.bests.lamps)}</p> */}
                <HistoryProvider>{({helpers}) => (
                    <PlayHistoryLamps lamps={props.info!.bests.lamps} helpers={helpers} />  
                )}</HistoryProvider>
                
            </Show>
          </FloatingPanel.Body>

          <FloatingPanel.ResizeTrigger axis="n" />
          <FloatingPanel.ResizeTrigger axis="e" />
          <FloatingPanel.ResizeTrigger axis="w" />
          <FloatingPanel.ResizeTrigger axis="s" />
          <FloatingPanel.ResizeTrigger axis="ne" />
          <FloatingPanel.ResizeTrigger axis="se" />
          <FloatingPanel.ResizeTrigger axis="sw" />
          <FloatingPanel.ResizeTrigger axis="nw" />
        </FloatingPanel.Content>
      </FloatingPanel.Positioner></Show>
    </Portal>
  </FloatingPanel.Root>
}

type DialogInfo = null | {
    title: string,
    bests: any,
}

// TODO: figure out how to pass db in properly
export function BestsTab<M extends Mode>(props: { mode: M, db: HistoricalChartDb, best: HistoryStore<M>['bests'] }) {
    let songsByLevel = createMemo(() => {
        let db = props.db;
        let groupByLevel: Map<number, ChartInformation[]> = new Map();
        for (let [tag, song] of Object.entries(db.songs)) {
            for (let [diff, chart] of Object.entries(song.charts)) {
                let info: ChartInformation = {
                    jacketUrl: song.jacketPath,
                    title: song.title,
                    chartId: makeChartId(tag, diff as OngekiDifficulty),
                };
                let existing = groupByLevel.get(chart.level);
                if (existing === undefined) {
                    existing = [];
                    groupByLevel.set(chart.level, existing);
                }
                existing.push(info);
            }
        }

        for (let charts of groupByLevel.values()) {
            charts.sort((a,b) => a.title.localeCompare(b.title));
        }

        return groupByLevel;
    });

    let firstFewKeys = () => {
        let songs = songsByLevel();
        let chartConstants = [...songs.keys()];
        chartConstants.sort((a,b) => b - a);
        let cropped = chartConstants.slice(0, 10);
        return cropped.map(constant => ({constant, charts: songs.get(constant)!}));
    }

    let [dialogChartId, setDialogChartId] = createSignal<ChartId | null>(null);

    function handleChartTileClick(chartId: ChartId, e) {
        setDialogChartId(chartId);
    }

    let dialogInfo = createMemo((): DialogInfo => {
        let id = dialogChartId();
        if (id === null) {
            return null;
        }
        let db = props.db;
        console.log("Rerendering dialogInfo", id);
        return {
            title: db.getChart(id)!.song.title,
            bests: props.best.getAllScores(id),
        };
    });

    return <div style="display: flex; flex-direction: column; gap: 5px;">
        <PlayHistoryDialog info={dialogInfo()} />
        <For each={firstFewKeys()}>{({constant, charts}) => {
            return <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                <ChartTileNumber constant={constant} />
                <For each={charts}>{(info) => {
                    let score = props.best.getBest(info.chartId);
                    // console.log("updating", info.chartId);
                    let a = (score === null) ? null : {
                        points: score.score.points,
                        lamps: score.lamps,
                    }
                    return <ChartTile info={info} score={a} onClick={[handleChartTileClick, info.chartId]} />;
                }}</For>
            </div>
        }}</For>
    </div>
    
}