export const initialUIState = {
  activePanel: null,
  simulationLabOpen: false,
  overlayToolbarOpen: false,
  minimapVisible: true,
  mode: "GAME"
};

export function uiReducer(state, action) {
  switch (action.type) {
    case "OPEN_PANEL":
      return { ...state, activePanel: action.panel };
    case "TOGGLE_PANEL":
      return {
        ...state,
        activePanel: state.activePanel === action.panel ? null : action.panel
      };
    case "CLOSE_PANEL":
      return { ...state, activePanel: null };
    case "TOGGLE_LAB": {
      const open = !state.simulationLabOpen;
      return { ...state, simulationLabOpen: open, mode: open ? "LAB" : "GAME" };
    }
    case "SET_LAB": {
      const open = Boolean(action.open);
      return { ...state, simulationLabOpen: open, mode: open ? "LAB" : "GAME" };
    }
    case "TOGGLE_OVERLAYS":
      return { ...state, overlayToolbarOpen: !state.overlayToolbarOpen };
    case "TOGGLE_MINIMAP":
      return { ...state, minimapVisible: !state.minimapVisible };
    case "SET_MODE":
      return { ...state, mode: action.mode };
    default:
      return state;
  }
}
