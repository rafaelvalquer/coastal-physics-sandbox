import { useUI } from "../state/UIStore.jsx";

export function NotificationCenter({ engine, messages = [] }) {
  const { dispatch } = useUI();
  const recent = messages.slice(-4).reverse();
  if (!recent.length) return null;

  const locate = (message) => {
    if (message.entityId && engine?.focusOnEntity?.(message.entityId)) {
      dispatch({ type: "OPEN_PANEL", panel: "INSPECTOR" });
      return;
    }
    if (Number.isFinite(message.x) && Number.isFinite(message.y)) {
      engine?.focusOnWorld?.(message.x, message.y, 1.6);
    }
  };

  return (
    <div className="notification-center">
      {recent.map((message, index) => (
        <div className={"notification-item " + (message.type || "info")} key={message.at + ":" + index}>
          <div>
            <small>{message.type === "danger" ? "CRÍTICO" : message.type === "warning" ? "ALERTA" : "EVENTO"}</small>
            <span>{message.message}</span>
          </div>
          {(message.entityId || Number.isFinite(message.x)) && (
            <button onClick={() => locate(message)}>Localizar</button>
          )}
        </div>
      ))}
    </div>
  );
}
