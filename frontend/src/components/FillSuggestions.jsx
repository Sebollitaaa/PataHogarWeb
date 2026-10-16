import './fill-suggestions.css';

/**
 * Sugerencias para completar un campo con datos que la persona ya cargó
 * (los de su cuenta, o los de su última publicación). No completa nada solo:
 * se elige con un toque y después se puede editar.
 * `options`: [{ value, source }] — `source` explica de dónde sale el dato.
 */
export default function FillSuggestions({ options, current, onPick }) {
  const seen = new Set();
  const visible = options.filter((o) => {
    const value = (o.value || '').trim();
    if (!value || value === (current || '').trim() || seen.has(value)) return false;
    seen.add(value);
    return true;
  });

  if (visible.length === 0) return null;

  return (
    <div className="fill-suggestions">
      {visible.map((o) => (
        <button key={`${o.source}-${o.value}`} type="button" className="fill-suggestions__chip" onClick={() => onPick(o.value)}>
          Usar <strong>{o.label || o.value}</strong>
          <span className="fill-suggestions__source">{o.source}</span>
        </button>
      ))}
    </div>
  );
}
