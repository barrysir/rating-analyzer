import { createSignal, Show } from "solid-js";
import { theme } from "./stores/themeStore";
import "./RatingTooltip.css";
import { RatingAlgo } from "../rating/OngekiCalculator";

export function RatingTooltip(props: {algo: RatingAlgo}) {
    return <table class="rating-tooltip">
        <tbody style="font-size: 0.8em;">
            <tr>
                <td>Constant</td>
                <td></td>
                <td>{props.algo.level}</td>
            </tr>
            <tr>
                <td>Score Bonus</td>
                <td>{theme.formatChangeRating(props.algo.techBonus[0])}</td>
                <td>{theme.formatRatingText(props.algo.techBonus[1])}</td>
            </tr>
            <Show when={props.algo.multiplier}>
                <tr>
                    <td>Low Score Multiplier</td>
                    <td>x{props.algo.multiplier![0].toFixed(2)}</td>
                    <td>{theme.formatRatingText(props.algo.multiplier![1])}</td>
                </tr>
            </Show>
        </tbody>
    </table>
}