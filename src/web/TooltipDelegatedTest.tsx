import tippy, { followCursor, createSingleton, delegate } from "tippy.js";
import { onMount, onCleanup, children } from "solid-js";
import "tippy.js/dist/tippy.css";
import { historyGetScore } from "./stores/historyStore";
import { RatingTooltip, RatingTooltipTest, setRatingScoreId } from "./RatingTooltip";

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
      target: "[data-rating-tooltip]",   // any element with this attribute gets tooltip
      content: '',
    //   content: (ref) => {
    //     return tooltipRef;
    //   },
      onShow(instance) {
        let t = instance.reference.getAttribute("data-rating-tooltip");
        console.log("Setting", t);
        if (t != null) {
            setRatingScoreId(parseInt(t));
        }
        console.log(tooltipRef);
        let element = <RatingTooltip scoreId={parseInt(t)} />
        instance.setContent(element);
      },
      followCursor: true,
      trigger: "mouseenter focus",
      delay: 0,
      animation: false,
      plugins: [followCursor],
    });

    // setTimeout(() => {
    //     console.log("Setting content", tooltipRef);
    //     delegated.setContent(tooltipRef);
    // }, 1000);

    console.log(delegated);

    // Make them share 1 tooltip
    // const singleton = createSingleton([delegated], {
    //   moveTransition: "transform 0.15s ease",
    // //   delay: [0, 0],
    // //   animation: "shift-away",
    //   placement: "top",
    // });

    onCleanup(() => {
      delegated.destroy();
    //   singleton.destroy();
    });
  });

  const c = children(() => props.children);

  return (
    <div ref={container}>
      <RatingTooltipTest ref={(el) => {
        tooltipRef= el;
    console.log("in ref", el)}} />
      {c()}
    </div>
  );
}