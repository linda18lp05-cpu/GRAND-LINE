import Hero from "./Hero.jsx";
import { NODES } from "../data/stations.js";

export default function PathBoard({ index, walking, facing }) {
  const here = NODES[Math.min(index, NODES.length - 1)];
  const d = NODES.map((n, i) => `${i === 0 ? "M" : "L"} ${n.x} ${n.y}`).join(" ");

  return (
    <div className="trail">
      <svg className="trail-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d={d} className="trail-line dim" />
      </svg>
      {NODES.map((node, i) => (
        <div
          key={node.label}
          className={`node ${i < index ? "done" : ""} ${i === index ? "current" : ""} ${i === NODES.length - 1 ? "museum" : ""}`}
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
        >
          {i === NODES.length - 1 ? <span className="museum-mark">M</span> : <span>{i + 1}</span>}
          <em>{node.label}</em>
        </div>
      ))}
      <div className="walker" style={{ left: `${here.x}%`, top: `${here.y}%` }}>
        <Hero walking={walking} facing={facing} />
      </div>
    </div>
  );
}
