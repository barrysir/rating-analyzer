import { followCursor, delegate } from "tippy.js";
import { onMount, onCleanup, children, createRoot, JSXElement, splitProps } from "solid-js";
import "tippy.js/dist/tippy.css";
import { OngekiJudgementTooltip, OngekiRatingTooltip, RefreshPlatRatingTooltip, RefreshTechRatingTooltip } from "./RatingTooltip";
import 'tippy.js/themes/light.css';
import { render } from "solid-js/web";
import { unpackHistory } from "./stores/stateStore";
import { Mode } from "./types";
import { decodeRefId, RefId } from "./themes/ongeki";

export function TooltipDelegated(props: {children: JSXElement}) {

  const tooltipMaker = createRoot((dispose) => {
    return {
      createOngeki: (refId: RefId) => {
        const {helpers} = unpackHistory<Mode.ONGEKI>();
        let scoreInfo = helpers.getUndo(refId.scoreId, refId.calcId)!;
        let algo = scoreInfo.algo;
        const tooltipEl = document.createElement("div");
        render(() => <OngekiRatingTooltip algo={algo} />, tooltipEl)
        return tooltipEl;
      },
      createRefresh: (refId: RefId) => {
        const {helpers} = unpackHistory<Mode.REFRESH>();
        let scoreInfo = helpers.getUndo(refId.scoreId, refId.calcId)!;
        let algo = scoreInfo.algo;
        const tooltipEl = document.createElement("div");
        render(() => <RefreshTechRatingTooltip algo={algo} />, tooltipEl)
        return tooltipEl;
      },
      createPlatinum: (refId: RefId) => {
        const {helpers} = unpackHistory<Mode.REFRESH>();
        let scoreInfo = helpers.getUndo(refId.scoreId, refId.calcId)!;
        let algo = scoreInfo.platAlgo;
        const tooltipEl = document.createElement("div");
        render(() => <RefreshPlatRatingTooltip algo={algo} />, tooltipEl)
        return tooltipEl;
      },
      createJudgements: (refId: RefId) => {
        let scoreId = refId.scoreId;
        const {helpers} = unpackHistory();
        let scoreInfo = helpers.getScore(scoreId)!;
        let judges = scoreInfo.judgements;
        const {chart} = helpers.getChart(scoreId, scoreInfo.chartId)!;
        const tooltipEl = document.createElement("div");
        render(() => <OngekiJudgementTooltip judges={judges} totalBells={chart.maxBells} />, tooltipEl)
        return tooltipEl;
      },
      dispose,
    };
  });

  let container!: HTMLDivElement;

  function makeTooltip(dataAttributeName: string, makeElement: (refId: RefId) => Element) {
    return delegate(container, {
      target: `[${dataAttributeName}]`,
      theme: 'light',
      onShow(instance) {
        let t = instance.reference.getAttribute(dataAttributeName);
        if (t === null) {
          console.warn("Tried to show rating tooltip but element doesn't have the proper data attribute set", instance.reference);
          return;
        }
        let refId = decodeRefId(t);
        if (refId === undefined) {
          console.warn("Tried to show rating tooltip but element data attribute couldn't be parsed as number", instance.reference);
          return;
        }
        let element = makeElement(refId);
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
    const ratingTooltips = makeTooltip("data-rating-tooltip", (refId) => {
      const {mode} = unpackHistory();
      switch (mode) {
        case Mode.ONGEKI: return tooltipMaker.createOngeki(refId);
        case Mode.REFRESH: return tooltipMaker.createRefresh(refId);
      }
    });
    const platTooltips = makeTooltip("data-platinum-tooltip", (refId) => tooltipMaker.createPlatinum(refId));
    const judgeTooltips = makeTooltip("data-judge-tooltip", (refId) => tooltipMaker.createJudgements(refId));

    onCleanup(() => {
      ratingTooltips.destroy();
      platTooltips.destroy();
      judgeTooltips.destroy();
      tooltipMaker.dispose();
    });
  });

  const [local, others] = splitProps(props, ['children']);
  const c = children(() => local.children);

  return (
    <div ref={container} {...others}>
      {c()}
    </div>
  );
}