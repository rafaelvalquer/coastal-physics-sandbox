import test from "node:test";
import assert from "node:assert/strict";
import { initialUIState, uiReducer } from "../../src/ui/state/UIState.js";

test("apenas um painel contextual grande permanece ativo", () => {
  let state = { ...initialUIState };
  state = uiReducer(state, { type: "OPEN_PANEL", panel: "CITY" });
  assert.equal(state.activePanel, "CITY");

  state = uiReducer(state, { type: "OPEN_PANEL", panel: "WEATHER" });
  assert.equal(state.activePanel, "WEATHER");

  state = uiReducer(state, { type: "TOGGLE_PANEL", panel: "WEATHER" });
  assert.equal(state.activePanel, null);
});

test("laboratório e overlays são drawers independentes do viewport", () => {
  let state = { ...initialUIState };
  state = uiReducer(state, { type: "TOGGLE_LAB" });
  state = uiReducer(state, { type: "TOGGLE_OVERLAYS" });

  assert.equal(state.simulationLabOpen, true);
  assert.equal(state.overlayToolbarOpen, true);
  assert.equal(state.activePanel, null);
});
