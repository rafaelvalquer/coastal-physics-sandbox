import { GameShell } from "./ui/GameShell/GameShell.jsx";
import { UIProvider } from "./ui/state/UIStore.jsx";
import "./styles.css";

export default function App() {
  return (
    <UIProvider>
      <GameShell />
    </UIProvider>
  );
}
