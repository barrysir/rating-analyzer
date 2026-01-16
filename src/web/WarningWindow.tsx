import { Component, Show, For } from "solid-js";
import { Icon } from "@iconify-icon/solid";
import { warningState, clearWarnings, setExpanded } from "./stores/warningStore";
import "./WarningWindow.css";
import { Minus, TriangleAlert, XIcon } from "lucide-solid";

const WarningWindow: Component = () => {
  const hasWarnings = () => warningState.warnings.length > 0;

  return (
    <Show when={hasWarnings()}>
      <Show
        when={warningState.isExpanded}
        fallback={
          // Collapsed state - Orange button
          <button
            onClick={() => setExpanded(true)}
            class="warning-button"
            aria-label="Show warnings"
          >
            <TriangleAlert size={24} />
          </button>
        }
      >
        {/* Expanded state - Panel */}
        <div class="warning-panel">
          {/* Header with controls */}
          <div class="warning-header">
            <div class="warning-title">Warnings</div>
            <div class="warning-header-controls">
              <button
                onClick={() => setExpanded(false)}
                class="warning-header-button"
                aria-label="Minimize"
              >
                <Minus size={18} />
              </button>
              <button
                onClick={() => clearWarnings()}
                class="warning-header-button"
                aria-label="Close"
              >
                <XIcon size={18} />
              </button>
            </div>
          </div>

          {/* Messages list */}
          <div class="warning-messages">
            <For each={warningState.warnings}>
              {(warning) => (
                <div class="warning-message">
                  {warning.content}
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>
    </Show>
  );
};

export default WarningWindow;
