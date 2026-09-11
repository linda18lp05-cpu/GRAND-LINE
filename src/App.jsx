import { useEffect, useState } from "react";
import Challenge from "./components/Challenge.jsx";
import FailScreen from "./components/FailScreen.jsx";
import Museum from "./components/Museum.jsx";
import PathBoard from "./components/PathBoard.jsx";
import TitleScreen from "./components/TitleScreen.jsx";
import { NODES, STATIONS } from "./data/stations.js";

export default function App() {
  const [view, setView] = useState("title");
  const [hero, setHero] = useState("Progettista");
  const [index, setIndex] = useState(0);
  const [pos, setPos] = useState(0);
  const [walking, setWalking] = useState(false);
  const [facing, setFacing] = useState("right");
  const [locked, setLocked] = useState(false);
  const [failedAt, setFailedAt] = useState(null);

  const station = STATIONS[index];

  useEffect(() => {
    if (view !== "play") return undefined;
    function onKey(e) {
      if (locked) return;
      if (e.target instanceof HTMLInputElement) return;
      const n = Number(e.key);
      if (station?.type === "quiz" && n >= 1 && n <= (station.options?.length || 0)) {
        const opt = station.options[n - 1];
        resolve(Boolean(opt.correct));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, locked, station, index]);

  function start(name) {
    setHero(name);
    setIndex(0);
    setPos(0);
    setFailedAt(null);
    setLocked(false);
    setWalking(false);
    setFacing("right");
    setView("play");
  }

  function resolve(ok) {
    if (locked) return;
    setLocked(true);
    if (!ok) {
      window.setTimeout(() => {
        setFailedAt(station);
        setView("fail");
        setLocked(false);
      }, 280);
      return;
    }
    const next = index + 1;
    const dest = Math.min(next, NODES.length - 1);
    const from = NODES[pos];
    const to = NODES[dest];
    setFacing(to.x >= from.x ? "right" : "left");
    setWalking(true);
    setPos(dest);
    window.setTimeout(() => {
      setWalking(false);
      if (next >= STATIONS.length) {
        setView("museum");
      } else {
        setIndex(next);
        setLocked(false);
      }
    }, 720);
  }

  if (view === "fail" && failedAt) {
    return <FailScreen station={failedAt} hero={hero} onRetry={() => start(hero)} onHome={() => setView("title")} />;
  }

  if (view === "museum") {
    return <Museum hero={hero} onHome={() => setView("title")} />;
  }

  if (view !== "play") {
    return <TitleScreen onStart={start} />;
  }

  return (
    <div className="page play-page">
      <header className="hud">
        <div className="hud-id">
          <p className="eyebrow">Percorso</p>
          <h1>{hero}</h1>
        </div>
        <p className="rule">Errori concessi: 0</p>
        <p className="hud-meta">
          Stazione {index + 1} / {STATIONS.length}
          <b>{station.title}</b>
        </p>
      </header>
      <PathBoard index={pos} walking={walking} facing={facing} />
      <Challenge key={station.id} station={station} locked={locked} onSolve={resolve} />
    </div>
  );
}
