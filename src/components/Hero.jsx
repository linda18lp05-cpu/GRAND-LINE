export default function Hero({ walking, facing = "right", compact }) {
  return (
    <span className={`pawn ${walking ? "walking" : "idle"} face-${facing} ${compact ? "compact" : ""}`}>
      <span className="sprite" aria-hidden="true">
        <i className="cape" />
        <i className="head" />
        <i className="torso" />
        <i className="boot left" />
        <i className="boot right" />
        <i className="shadow" />
      </span>
    </span>
  );
}
