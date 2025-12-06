import { createSignal } from "solid-js";
import { historyGetScore } from "./stores/historyStore";

let [ratingScoreId, setRatingScoreId] = createSignal(0);

export function RatingTooltip(props: {scoreId: number}) {
    let scoreInfo = () => {
        console.log(props.scoreId);
        let scoreinfo = historyGetScore(parseInt(props.scoreId));
        return scoreinfo;
    }
    return (props.scoreId == null) ? props.scoreId : <div style="display:flex; flex-direction: column">
        <span>{scoreInfo().rating}</span>
        <span>{scoreInfo().points}</span>
        <span>{scoreInfo().chartId}</span>
    </div>
}

export function RatingTooltipTest(props) {
    let scoreInfo = () => {
        console.log(props.scoreId);
        let scoreinfo = historyGetScore(ratingScoreId());
        return scoreinfo;
    }
    // (props.scoreId == null) ? props.scoreId : 
    return <div ref={props.ref} style="display:flex; flex-direction: column">
        <span>{scoreInfo()?.rating}</span>
        <span>{scoreInfo()?.points}</span>
        <span>{scoreInfo()?.chartId}</span>
    </div>

    // return (props.scoreId == null) ? props.scoreId : <div style="display:flex">
    //     <span>{scoreInfo().rating}</span>
    //     <span>{scoreInfo().points}</span>
    //     <span>{scoreInfo().chartId}</span>
    // </div>
    // <span ref={props.ref}>{ratingScoreId()}</span>;
}

export { setRatingScoreId };