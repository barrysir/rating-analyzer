import { createSignal, Show } from "solid-js";
import { historyGetScore } from "./stores/historyStore";
import { theme } from "./stores/themeStore";
import "./RatingTooltip.css";

export function RatingTooltip(props: {scoreId: number}) {
    return <table class="rating-tooltip">
        {(() => {
        let scoreInfo = historyGetScore(props.scoreId)!;
        let algo = scoreInfo.algo;
        return (
            <tbody style="font-size: 0.8em;">
                <tr>
                    <td>Constant</td>
                    <td></td>
                    <td>{algo.level}</td>
                </tr>
                <tr>
                    <td>Score Bonus</td>
                    <td>{theme.formatChangeRating(algo.techBonus[0])}</td>
                    <td>{theme.formatRatingText(algo.techBonus[1])}</td>
                </tr>
                <Show when={algo.multiplier}>
                    <tr>
                        <td>Low Score Multiplier</td>
                        <td>x{algo.multiplier![0].toFixed(2)}</td>
                        <td>{theme.formatRatingText(algo.multiplier![1])}</td>
                    </tr>
                </Show>
            </tbody>
        );
        })()}
    </table>
}