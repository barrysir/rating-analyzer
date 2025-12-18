import { followCursor, delegate } from "tippy.js";
import { onMount, onCleanup, children, createRoot, JSXElement } from "solid-js";
import "tippy.js/dist/tippy.css";
import { OngekiRatingTooltip, RefreshPlatRatingTooltip, RefreshTechRatingTooltip } from "./RatingTooltip";
import 'tippy.js/themes/light.css';
import { render } from "solid-js/web";
import { Mode, unpackHistory } from "./stores/stateStore";

export function TooltipDelegated(props: {children: JSXElement}) {

  const tooltipMaker = createRoot((dispose) => {
    return {
      createOngeki: (scoreId: number) => {
        const {helpers} = unpackHistory<Mode.ONGEKI>();
        let scoreInfo = helpers.getScore(scoreId)!;
        let algo = scoreInfo.algo;
        const tooltipEl = document.createElement("div");
        render(() => <OngekiRatingTooltip algo={algo} />, tooltipEl)
        return tooltipEl;
      },
      createRefresh: (scoreId: number) => {
        const {helpers} = unpackHistory<Mode.REFRESH>();
        let scoreInfo = helpers.getScore(scoreId)!;
        let algo = scoreInfo.techAlgo;
        const tooltipEl = document.createElement("div");
        render(() => <RefreshTechRatingTooltip algo={algo} />, tooltipEl)
        return tooltipEl;
      },
      createPlatinum: (scoreId: number) => {
        const {helpers} = unpackHistory<Mode.REFRESH>();
        let scoreInfo = helpers.getScore(scoreId)!;
        let algo = scoreInfo.platAlgo;
        console.log(scoreId, scoreInfo, algo);
        const tooltipEl = document.createElement("div");
        render(() => <RefreshPlatRatingTooltip algo={algo} />, tooltipEl)
        return tooltipEl;
      },
      dispose,
    };
  });

  let container!: HTMLDivElement;

  function makeTooltip(dataAttributeName: string, makeElement: (scoreId: number) => Element) {
    return delegate(container, {
      target: `[${dataAttributeName}]`,
      theme: 'light',
      onShow(instance) {
        let t = instance.reference.getAttribute(dataAttributeName);
        if (t === null) {
          console.warn("Tried to show rating tooltip but element doesn't have the proper data attribute set", instance.reference);
          return;
        }
        let scoreId = parseInt(t);
        if (isNaN(scoreId)) {
          console.warn("Tried to show rating tooltip but element data attribute couldn't be parsed as number", instance.reference);
          return;
        }
        let element = makeElement(scoreId);
        instance.setContent(element);
      },
      followCursor: true,
      trigger: "mouseenter focus",
      delay: 0,
      animation: false,
      plugins: [followCursor],
    });
  }

  onMount(() => {
    // Create delegated tippy instances
    const ratingTooltips = makeTooltip("data-rating-tooltip", (scoreId) => {
      const {mode} = unpackHistory();
      switch (mode) {
        case Mode.ONGEKI: return tooltipMaker.createOngeki(scoreId);
        case Mode.REFRESH: return tooltipMaker.createRefresh(scoreId);
      }
    });
    const platTooltips = makeTooltip("data-platinum-tooltip", (scoreId) => tooltipMaker.createPlatinum(scoreId));

    onCleanup(() => {
      ratingTooltips.destroy();
      platTooltips.destroy();
      tooltipMaker.dispose();
    });
  });

  const c = children(() => props.children);

  return (
    <div ref={container}>
      {c()}
    </div>
  );
}