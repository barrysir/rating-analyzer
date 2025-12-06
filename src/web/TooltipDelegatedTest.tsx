import tippy, { followCursor, createSingleton, delegate } from "tippy.js";
import { onMount, onCleanup, children } from "solid-js";
import "tippy.js/dist/tippy.css";
import { historyGetScore } from "./stores/historyStore";
import { RatingTooltip, RatingTooltipTest, setRatingScoreId } from "./RatingTooltip";
import 'tippy.js/themes/light.css';

/*
function RatingTooltip(props: {scoreId: number}) {
    let scoreInfo = () => {
        console.log(props.scoreId);
        let scoreinfo = historyGetScore(parseInt(props.scoreId));
        return scoreinfo;
    }
    return (props.scoreId == null) ? props.scoreId : <div style="display:flex">
        <span>{scoreInfo().rating}</span>
        <span>{scoreInfo().points}</span>
        <span>{scoreInfo().chartId}</span>
    </div>
}
*/

export function TooltipDelegated(props) {
  let container: HTMLDivElement;
  let tooltipRef;

  onMount(() => {
    // Create delegated tippy instances
    console.log("Setting mount", tooltipRef, container);
    const delegated = delegate(container, {
      target: "[data-rating-tooltip]",
      theme: 'light',
      onShow(instance) {
        let t = instance.reference.getAttribute("data-rating-tooltip");
        if (t === null) {
            console.warn("Tried to show rating tooltip but element doesn't have the proper data attribute set", instance.reference);
            return;
        }
        let scoreId = parseInt(t);
        if (isNaN(scoreId)) {
            console.warn("Tried to show rating tooltip but element data attribute couldn't be parsed as number", instance.reference);
            return;
        }
        let element = <RatingTooltip scoreId={/*@once*/ scoreId} />
        instance.setContent(element);
      },
      followCursor: true,
      trigger: "mouseenter focus",
      delay: 0,
      animation: false,
      plugins: [followCursor],
    });

    onCleanup(() => {
      delegated.destroy();
    });
  });

  const c = children(() => props.children);

  return (
    <div ref={container}>
      {c()}
    </div>
  );
}