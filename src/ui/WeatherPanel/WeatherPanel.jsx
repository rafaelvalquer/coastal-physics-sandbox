import { useEffect } from "react";

function interval(value, suffix = "") {
  if (!value) return "—";
  return value.map((item) => Math.round(item * 10) / 10 + suffix).join(" – ");
}

export function WeatherPanel({ snapshot, engine }) {
  const forecast = snapshot?.forecast;
  const weather = snapshot?.weather;

  useEffect(() => {
    engine?.game?.commandBus?.execute("ui:forecast-opened");
  }, [engine]);

  return (
    <div className="game-card weather-card">
      <div className="game-panel-title">PREVISÃO</div>
      {forecast ? (
        <div className="game-data-list">
          <span>Fase</span><b>{snapshot.stormPhase}</b>
          <span>Vento</span><b>{interval(forecast.wind, " km/h")}</b>
          <span>Ondas</span><b>{interval(forecast.waves, " m")}</b>
          <span>Maré de tempestade</span><b>{interval(forecast.tide, " m")}</b>
          <span>Chuva</span><b>{interval(forecast.rain, " mm/h")}</b>
          <span>Confiança</span><b>{forecast.confidence}</b>
        </div>
      ) : (
        <div className="game-data-list">
          <span>Condição</span><b>Sem alerta</b>
          <span>Vento atual</span><b>{Math.round(weather?.windSpeed || 0)} km/h</b>
          <span>Chuva</span><b>{Math.round(weather?.rainfall || 0)} mm/h</b>
          <span>Pressão</span><b>{Math.round(weather?.pressure || 1013)} hPa</b>
        </div>
      )}
    </div>
  );
}
