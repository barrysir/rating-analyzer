import { createSignal, Show } from "solid-js";
import { theme } from "./stores/themeStore";
import "./RatingTooltip.css";
import { RatingAlgo } from "../rating/OngekiCalculator";
import { RefreshTechScoreBreakdown } from "../rating/OngekiRefreshCalculator";

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

export function RefreshTechRatingTooltip(props: {algo: RefreshTechScoreBreakdown}) {
    if ('multiplier' in props.algo) {
        return <RatingTooltip algo={props.algo} />;
    }
    return <table class="rating-tooltip">
        <tbody style="font-size: 0.8em;">
            <tr>
                <td>Constant</td>
                <td></td>
                <td>{props.algo.level}</td>
            </tr>
            <tr>
                <td>Score Bonus</td>
                <td>{theme.formatChangeRating(props.algo.techBonus.change)}</td>
                <td>{theme.formatRatingText(props.algo.techBonus.total)}</td>
            </tr>
            <tr>
                <td>Grade Lamp</td>
                <td>{theme.formatChangeRating(props.algo.gradeLamp.change)} ({theme.formatGradeLamp(props.algo.gradeLamp.lamp)})</td>
                <td>{theme.formatRatingText(props.algo.gradeLamp.total)}</td>
            </tr>
            <tr>
                <td>Clear Lamp</td>
                <td>{theme.formatChangeRating(props.algo.clearLamp.change)} ({theme.formatClearLamp(props.algo.clearLamp.lamp)})</td>
                <td>{theme.formatRatingText(props.algo.clearLamp.total)}</td>
            </tr>
            <tr>
                <td>Bell Lamp</td>
                <td>{theme.formatChangeRating(props.algo.bellLamp.change)} ({theme.formatBellLamp(props.algo.bellLamp.lamp)})</td>
                <td>{theme.formatRatingText(props.algo.bellLamp.total)}</td>
            </tr>
        </tbody>
    </table>
}