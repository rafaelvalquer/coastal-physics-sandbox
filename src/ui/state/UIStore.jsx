import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { initialUIState, uiReducer } from "./UIState.js";

const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [state, dispatch] = useReducer(uiReducer, initialUIState);

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
