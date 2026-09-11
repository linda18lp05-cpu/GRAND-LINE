export default function Museum({ hero, onHome }) {
  return (
    <div className="page museum-page">
      <p className="eyebrow">Arrivo</p>
      <h1>Museo del Design del Prodotto</h1>
      <p className="lede">
        {hero}, hai camminato senza un errore. Il cortile è tuo. Qui gli oggetti non si contemplano soltanto:
        si capiscono.
      </p>
      <div className="exhibits">
        <article>
          <b>Sala delle sedie</b>
          <p>Thonet n. 14. Una curva, un popolo seduto.</p>
        </article>
        <article>
          <b>Sala della funzione</b>
          <p>Form follows function. Sullivan, e poi tutto il secolo.</p>
        </article>
        <article>
          <b>Sala del contrasto</b>
          <p>Il colore che si vede non è il più gentile: è il più chiaro.</p>
        </article>
        <article>
          <b>Cortile di Mies</b>
          <p>Less is more. Hai scelto meno, e sei entrato.</p>
        </article>
      </div>
      <button type="button" className="btn primary" onClick={onHome}>
        Esci dal cortile
      </button>
    </div>
  );
}
