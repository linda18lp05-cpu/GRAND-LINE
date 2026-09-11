import { useState } from "react";

export default function Challenge({ station, locked, onSolve }) {
  if (station.type === "quiz") {
    return (
      <Panel station={station}>
        {station.clue ? <blockquote className="clue">{station.clue}</blockquote> : null}
        <div className="options">
          {station.options.map((opt) => (
            <button key={opt.id} type="button" className="choice" disabled={locked} onClick={() => onSolve(Boolean(opt.correct))}>
              {opt.label}
            </button>
          ))}
        </div>
      </Panel>
    );
  }

  if (station.type === "pick") {
    return (
      <Panel station={station}>
        <div className="picks">
          {station.options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className="pick"
              disabled={locked}
              onClick={() => onSolve(Boolean(opt.correct))}
            >
              <Visual kind={opt.visual} />
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </Panel>
    );
  }

  if (station.type === "phrase") {
    return <Phrase station={station} locked={locked} onSolve={onSolve} />;
  }

  if (station.type === "order") {
    return <Order station={station} locked={locked} onSolve={onSolve} />;
  }

  if (station.type === "color") {
    return (
      <Panel station={station}>
        <div className="color-row">
          <div className="swatch sample" style={{ background: station.sample }}>
            campione
          </div>
          {station.options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className="swatch"
              style={{ background: opt.hex }}
              disabled={locked}
              onClick={() => onSolve(Boolean(opt.correct))}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Panel>
    );
  }

  if (station.type === "trap") {
    return (
      <Panel station={station}>
        <div className="kiosk">
          <p className="kiosk-title">Biglietto · Museo del Design del Prodotto</p>
          <div className="kiosk-actions">
            {station.options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`trap trap-${opt.kind}`}
                disabled={locked}
                onClick={() => onSolve(Boolean(opt.correct))}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </Panel>
    );
  }

  if (station.type === "hotspot") {
    return (
      <Panel station={station}>
        <div className="poster" role="group" aria-label="Manifesto">
          <button type="button" className="hot logo" disabled={locked} onClick={() => onSolve(false)}>
            MDP
          </button>
          <button type="button" className="hot headline" disabled={locked} onClick={() => onSolve(true)}>
            MOSTRA PERMANENTE
          </button>
          <button type="button" className="hot body" disabled={locked} onClick={() => onSolve(false)}>
            Oggetti d’uso, 1850–oggi. Ingresso dal cortile.
          </button>
          <button type="button" className="hot date" disabled={locked} onClick={() => onSolve(false)}>
            10.09
          </button>
        </div>
      </Panel>
    );
  }

  return null;
}

function Panel({ station, children }) {
  return (
    <section className="challenge">
      <p className="tag">{station.tag}</p>
      <h2>{station.title}</h2>
      <p className="lead">{station.lead}</p>
      <p className="prompt">{station.prompt}</p>
      {children}
    </section>
  );
}

function Phrase({ station, locked, onSolve }) {
  const [value, setValue] = useState("");
  function submit(e) {
    e.preventDefault();
    if (locked) return;
    const v = value.trim().toLowerCase();
    onSolve(station.answers.includes(v));
  }
  return (
    <Panel station={station}>
      <form className="phrase" onSubmit={submit}>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={station.placeholder}
          disabled={locked}
          autoComplete="off"
          maxLength={24}
        />
        <button type="submit" className="btn primary" disabled={locked || !value.trim()}>
          Conferma
        </button>
      </form>
      <p className="hint">{station.hint}</p>
    </Panel>
  );
}

function Order({ station, locked, onSolve }) {
  const [picked, setPicked] = useState([]);
  function tap(id) {
    if (locked || picked.includes(id)) return;
    const next = [...picked, id];
    const expected = station.solution[next.length - 1];
    if (id !== expected) {
      onSolve(false);
      return;
    }
    setPicked(next);
    if (next.length === station.solution.length) onSolve(true);
  }
  return (
    <Panel station={station}>
      <div className="order">
        {station.items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`order-item ${picked.includes(item.id) ? "on" : ""}`}
            disabled={locked || picked.includes(item.id)}
            onClick={() => tap(item.id)}
          >
            {picked.includes(item.id) ? `${picked.indexOf(item.id) + 1}. ` : ""}
            {item.label}
          </button>
        ))}
      </div>
    </Panel>
  );
}

function Visual({ kind }) {
  if (kind === "paint") {
    return (
      <span className="viz paint" aria-hidden="true">
        <i />
      </span>
    );
  }
  if (kind === "statue") {
    return (
      <span className="viz statue" aria-hidden="true">
        <i />
      </span>
    );
  }
  return (
    <span className="viz chair" aria-hidden="true">
      <i />
    </span>
  );
}
