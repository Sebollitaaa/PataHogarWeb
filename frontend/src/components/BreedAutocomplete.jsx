import { useEffect, useRef, useState } from 'react';
import { catalogApi } from '../api/catalog';
import { API_ORIGIN } from '../api/origin';
import { useOnClickOutside } from '../hooks/useOnClickOutside';
import { PawIcon } from './icons/Icons';
import './breed-autocomplete.css';

/**
 * Campo de texto con sugerencias de razas (nombre + miniatura).
 * - `speciesId`: si hay una especie elegida, solo se sugieren razas de esa especie.
 * - `value` / `onChange`: texto del campo (lo controla quien lo usa).
 * - `onSelect(breed)`: se llama al elegir una sugerencia.
 * - `onFreeText(text)`: si se pasa, aparece la opción "Usar «texto»" para razas fuera de la lista.
 */
export default function BreedAutocomplete({
  value,
  onChange,
  onSelect,
  onFreeText,
  speciesId,
  includeGeneric = true,
  placeholder = 'Escribí la raza…',
  id,
  inputClassName = 'input',
  openOnFocusWithoutText = true,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef(null);
  const requestId = useRef(0);

  useOnClickOutside(wrapRef, () => setOpen(false));

  const text = value.trim();
  const canSearch = text.length >= 1 || (openOnFocusWithoutText && Boolean(speciesId));

  useEffect(() => {
    if (!open || !canSearch) return undefined;
    const current = ++requestId.current;
    setLoading(true);
    const timeout = setTimeout(() => {
      catalogApi.breeds({ q: text, speciesId, includeGeneric, limit: text ? 12 : 30 })
        .then((d) => {
          if (current === requestId.current) {
            setSuggestions(d.breeds);
            setActive(-1);
          }
        })
        .catch(() => {
          if (current === requestId.current) setSuggestions([]);
        })
        .finally(() => {
          if (current === requestId.current) setLoading(false);
        });
    }, 180);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, speciesId, includeGeneric, open]);

  function pick(breed) {
    onSelect(breed);
    setSuggestions([]);
    setOpen(false);
  }

  const exactMatch = suggestions.some((b) => b.name.toLowerCase() === text.toLowerCase());
  const showFreeText = Boolean(onFreeText) && text.length > 0 && !exactMatch && !loading;
  const optionsCount = suggestions.length + (showFreeText ? 1 : 0);

  function handleKeyDown(e) {
    if (!open || optionsCount === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % optionsCount);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i <= 0 ? optionsCount - 1 : i - 1));
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      if (active < suggestions.length) pick(suggestions[active]);
      else {
        onFreeText(text);
        setOpen(false);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="breed-autocomplete" ref={wrapRef}>
      <input
        id={id}
        className={inputClassName}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
      />

      {open && canSearch && (
        <ul className="breed-autocomplete__list" role="listbox">
          {loading && suggestions.length === 0 && <li className="breed-autocomplete__hint">Buscando…</li>}
          {!loading && suggestions.length === 0 && !showFreeText && (
            <li className="breed-autocomplete__hint">No encontramos esa raza.</li>
          )}
          {suggestions.map((b, i) => (
            <li key={b.id}>
              <button
                type="button"
                role="option"
                aria-selected={active === i}
                className={active === i ? 'is-active' : ''}
                onClick={() => pick(b)}
              >
                <span className="breed-autocomplete__thumb">
                  {b.imageUrl ? <img src={`${API_ORIGIN}${b.imageUrl}`} alt="" loading="lazy" /> : <PawIcon size={16} />}
                </span>
                <span className="breed-autocomplete__name">{b.name}</span>
                {!speciesId && <span className="breed-autocomplete__species">{b.species.name}</span>}
              </button>
            </li>
          ))}
          {showFreeText && (
            <li>
              <button
                type="button"
                className={active === suggestions.length ? 'is-active breed-autocomplete__free' : 'breed-autocomplete__free'}
                onClick={() => {
                  onFreeText(text);
                  setOpen(false);
                }}
              >
                <span className="breed-autocomplete__thumb"><PawIcon size={16} /></span>
                <span className="breed-autocomplete__name">Usar «{text}» (no está en la lista)</span>
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
