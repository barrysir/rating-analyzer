import { createStore } from "solid-js/store";
import { JSXElement } from "solid-js";

export interface Warning {
  id: string;
  content: string | JSXElement;
  timestamp: Date;
}

interface WarningState {
  warnings: Warning[];
  isExpanded: boolean;
}

const [warningState, setWarningState] = createStore<WarningState>({
  warnings: [],
  isExpanded: false,
});

export { warningState };

export function addWarning(content: string | JSXElement): void {
  const warning: Warning = {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 9),
    content,
    timestamp: new Date(),
  };
  setWarningState("warnings", (prev) => [...prev, warning]);
}

export function clearWarnings(): void {
  setWarningState({
    warnings: [],
    isExpanded: false,
  });
}

export function setExpanded(expanded: boolean): void {
  setWarningState("isExpanded", expanded);
}

export function removeWarning(id: string): void {
  setWarningState("warnings", (prev) => prev.filter((w) => w.id !== id));
}

// Public API for easy access from anywhere in the codebase
export function showWarning(content: string | JSXElement): void {
  addWarning(content);
}
