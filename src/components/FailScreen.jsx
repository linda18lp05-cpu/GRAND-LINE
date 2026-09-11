export default function FailScreen({ station, hero, onRetry, onHome }) {
  return (
    <div className="page fail-page">
      <p className="eyebrow">Errore</p>
      <h1>Il percorso si chiude.</h1>
      <p className="lede">
        {hero}, un passo falso alla stazione «{station.title}». {station.fail} Si ricomincia da capo: il museo
        accetta solo chi arriva senza sbagli.
      </p>
      <div className="title-actions">
        <button type="button" className="btn primary" onClick={onRetry}>
          Ricomincia dal cancello
        </button>
        <button type="button" className="btn ghost" onClick={onHome}>
          Torna al titolo
        </button>
      </div>
    </div>
  );
}
