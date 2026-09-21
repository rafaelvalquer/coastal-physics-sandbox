import { useUI } from "../state/UIStore.jsx";

export function MiniMap({ engine, stats }) {
  const { state, dispatch } = useUI();
  if (!state.minimapVisible || !stats?.minimap || !stats?.camera) return null;

  const data = stats.minimap;
  const view = stats.camera.visibleWorldRect;
  const landPoints = [
    "0," + data.worldHeight,
    ...data.coastline.map((point) => point.x + "," + point.y),
    data.worldWidth + "," + data.worldHeight
  ].join(" ");

  const click = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width * data.worldWidth;
    const y = (event.clientY - rect.top) / rect.height * data.worldHeight;
    engine?.focusOnWorld?.(x, y, Math.max(1.1, stats.camera.zoom));
  };

  return (
    <div className="minimap-card">
      <div className="minimap-header">
        <span>Mapa</span>
        <button onClick={() => dispatch({ type: "TOGGLE_MINIMAP" })}>×</button>
      </div>
      <svg
        className="minimap"
        viewBox={"0 0 " + data.worldWidth + " " + data.worldHeight}
        onClick={click}
        role="img"
        aria-label="Mini mapa do cenário"
      >
        <rect width={data.worldWidth} height={data.worldHeight} fill="#0b5276" />
        <polygon points={landPoints} fill="#735d42" opacity="0.95" />
        {data.constructions.map((item) => (
          <rect key={item.id} x={item.x - 4} y={item.y - 4} width="8" height="8" fill="#7ed6cb" />
        ))}
        {data.buildings.map((item) => (
          <circle
            key={item.id}
            cx={item.x}
            cy={item.y}
            r={item.critical ? 7 : 3.5}
            fill={item.critical ? "#f5ce70" : "#d8e5e8"}
          />
        ))}
        <rect
          x={view.minX}
          y={view.minY}
          width={Math.max(1, view.maxX - view.minX)}
          height={Math.max(1, view.maxY - view.minY)}
          fill="none"
          stroke="#78e0ef"
          strokeWidth="4"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
