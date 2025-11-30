import { Collapsible, MenuItem } from "@ark-ui/solid";
import { VersionImproveRenderData } from "./Temp";
import { For } from "solid-js";
import { historyGetScore } from "./stores/historyStore";
import { FrameImprovement } from "./ImprovementTracker";

function FrameImprovementRender(props: {improve: FrameImprovement, color: string}) {
    return <span style={{'color': props.color}}></span>
}
function VersionImprovement(data: VersionImproveRenderData) {
    // (point index) Version {} (center aligned?)       (different colour to signify it's collapsible)
    // (point index) {song title} - {points}        {rating} {best} {new} {recent} (tiny text below showing the increase to rating)
    
    return <Collapsible.Root>
        <Collapsible.Trigger>
            Show More
            {/* <Collapsible.Indicator>
        <ChevronRightIcon />
      </Collapsible.Indicator> */}
        </Collapsible.Trigger>
        <Collapsible.Content>
        <For each={data.improves}>
            {(item, index) => {
                let score = historyGetScore(item.scoreId)!;
                let song = historyGetDb(item.pointId);
                return <div>
                    <span>{item.pointId}</span>
                    <span>{song.title}</span>
                    <span>{score.points}</span>
                    <span>{score.rating}</span>
                    <span>{item.data.}</span>
                </div>
            }}
        </For>
        </Collapsible.Content>
    </Collapsible.Root>
}

export function ImprovementTable(props: { improves: any }) {
    return <Collapsible.Root>
        <Collapsible.Trigger>
            Show More
            <Collapsible.Indicator>
                <ChevronRightIcon />
            </Collapsible.Indicator>
        </Collapsible.Trigger>
        <Collapsible.Content>
            <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
                magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
                consequat.
            </p>
            <p>
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur
                sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
            <p>
                Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem
                aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
            </p>
        </Collapsible.Content>
    </Collapsible.Root>
}