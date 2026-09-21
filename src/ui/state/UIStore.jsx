import { createContext, useContext, useEffect, useMemo, useReducer } from "react";

const initialState = {
  activePanel: null,
  simulationLabOpen: false,
  overlayToolbarOpen: false,
  minimapVisible: true,
  mode: "GAME"
};

function reducer(state, action) {
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
    case "TOGGLE_LAB":
      return { ...state, simulationLabOpen: !state.simulationLabOpen };
    case "SET_LAB":
      return { ...state, simulationLabOpen: Boolean(action.open) };
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

const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.target?.matches?.("input, select, textarea")) return;
      if (event.key === "F12") {
        event.preventDefault();
        dispatch({ type: "TOGGLE_LAB" });
      }
      if (event.key === "Escape") {
        dispatch({ type: "CLOSE_PANEL" });
        dispatch({ type: "SET_LAB", open: false });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const value = useContext(UIContext);
  if (!value) throw new Error("useUI must be used inside UIProvider");
  return value;
}
