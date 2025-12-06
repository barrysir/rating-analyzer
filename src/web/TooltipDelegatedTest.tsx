import { followCursor, delegate } from "tippy.js";
import { onMount, onCleanup, children, createRoot } from "solid-js";
import "tippy.js/dist/tippy.css";
import { RatingTooltip } from "./RatingTooltip";
import 'tippy.js/themes/light.css';
import { render } from "solid-js/web";

export function TooltipDelegated(props) {
  const tooltipMaker = createRoot((dispose) => {
    return {
      create: (scoreId: number) => {
        const tooltipEl = document.createElement("div");
        render(() => <RatingTooltip scoreId={scoreId} />, tooltipEl)
        return tooltipEl;
      },
      dispose,
    };
  });

  let container: HTMLDivElement;

  onMount(() => {
    // Create delegated tippy instances
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
        let element = tooltipMaker.create(scoreId); // <RatingTooltip scoreId={/*@once*/ scoreId} />
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