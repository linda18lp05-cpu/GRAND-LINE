import Hero from "./Hero.jsx";

export default function TitleScreen({ onStart }) {
  return (
    <div className="page title-page">
      <div className="title-walk" aria-hidden="true">
        <i className="path-glow" />
        <span className="title-hero walking">
          <Hero walking facing="right" compact />
        </span>
        <span className="title-museum">M</span>
      </div>
      <header className="title-mark">
        <p className="eyebrow">Un solo tentativo pulito</p>
        <h1>
          Percorso Perfetto
          <span>Verso il Museo del Design del Prodotto</span>
        </h1>
        <p className="lede">
          Un cammino di ostacoli, indizi, frasi e domande. Niente vite extra: un errore e si torna al cancello.
          L’arrivo è il museo.
        </p>
      </header>
      <StartForm onStart={onStart} />
    </div>
  );
}

function StartForm({ onStart }) {
  return (
    <form
      className="start-form"
      onSubmit={(e) => {
        e.preventDefault();
        const name = new FormData(e.currentTarget).get("hero");
        onStart(String(name || "").trim() || "Progettista");
      }}
    >
      <label className="field">
        <span>Il tuo nome sul pass</span>
        <input name="hero" placeholder="Progettista" maxLength={24} autoComplete="off" />
      </label>
      <button type="submit" className="btn primary pulse">
        Inizia il percorso
      </button>
    </form>
  );
}
