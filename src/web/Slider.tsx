import { createSignal, createEffect } from "solid-js";
import { history, setPointId, historyNumPoints } from "./stores/historyStore";

function clamp(x: number, min: number, max: number) {
    return Math.min(max, Math.max(min, x));
}

export default function Slider() {
  const [stepInput, setStepInput] = createSignal<number>(1);
  const [sliderValue, setSliderValue] = createSignal<number>(history.pointId);

  createEffect(() => {
    setSliderValue(history.pointId);
  });

  function bound(scoreIndex: number) {
    return clamp(scoreIndex, 0, historyNumPoints()-1);
  }

  const handleChange = (multiplier: number) => {
    setPointId(bound(history.pointId + stepInput() * multiplier));
  };

  const value = (multiplier: number) => stepInput() * multiplier;

  function processStepInput(value: string) {
    let v = parseInt(value);
    if (isNaN(v)) { 
        return;
    }
    setStepInput(v);
  }

  function handleSliderChange(e: Event) {
    const target = e.target as HTMLInputElement;
    setSliderValue(parseInt(target.value));
    console.log("handleSliderChange");
  }

  function handleSliderRelease() {
    setPointId(sliderValue());
    console.log("handleSliderRelease");
  }

  function handleDirectInput(value: string) {
    let v = parseInt(value);
    if (isNaN(v)) {
      return;
    }
    v = bound(v);
    setSliderValue(v);
    setPointId(v);
  }

  return (
    <div style={{ display: "flex", "flex-direction": "column", gap: "12px" }}>
      <div style={{ display: "flex", gap: "8px", "align-items": "center" }}>
        <input
          type="range"
          min="0"
          max={historyNumPoints()}
          value={sliderValue()}
          onInput={handleSliderChange}
          onMouseUp={handleSliderRelease}
          onTouchEnd={handleSliderRelease}
          style={{ flex: "1" }}
        />
        <input
          type="text"
          value={sliderValue()}
          onChange={(e) => handleDirectInput(e.target.value)}
          style={{ width: "60px", "text-align": "center" }}
        />
      </div>
      <div style={{ display: "flex", gap: "8px", "justify-content": "center", "align-items": "center" }}>
        <button onClick={() => handleChange(-50)}>{value(-50)}</button>
        <button onClick={() => handleChange(-1)}>{value(-1)}</button>
        <input
          type="text"
          value={stepInput()}
          onChange={(e) => processStepInput(e.target.value)}
          style={{ width: "60px", "text-align": "center" }}
        />
        <button onClick={() => handleChange(1)}>{value(1)}</button>
        <button onClick={() => handleChange(50)}>{value(50)}</button>
      </div>
    </div>
  );
}