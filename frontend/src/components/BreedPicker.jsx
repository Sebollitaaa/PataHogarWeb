import { useState } from 'react';
import BreedAutocomplete from './BreedAutocomplete';
import Field from './ui/Field';
import { XIcon } from './icons/Icons';

/**
 * Selector de raza para publicar y editar.
 * `value` = { breed, breedText, isCross, crossBreed }:
 *   - breed: raza elegida de la lista ({ id, name, imageUrl, isGeneric }) o null.
 *   - breedText: raza escrita a mano cuando no está en la lista.
 *   - isCross / crossBreed: segunda raza de una cruza.
 */
export default function BreedPicker({ speciesId, value, onChange }) {
  const [query, setQuery] = useState(value.breed?.name || value.breedText || '');
  const [crossQuery, setCrossQuery] = useState(value.crossBreed?.name || '');

  const disabled = !speciesId;
  const hasConcreteBreed = Boolean(value.breed && !value.breed.isGeneric);

  function selectBreed(breed) {
    setQuery(breed.name);
    onChange({
      ...value,
      breed,
      breedText: '',
      isCross: breed.isGeneric ? false : value.isCross,
      crossBreed: breed.isGeneric ? null : value.crossBreed,
    });
    if (breed.isGeneric) setCrossQuery('');
  }

  function useFreeText(text) {
    setQuery(text);
    onChange({ ...value, breed: null, breedText: text, isCross: false, crossBreed: null });
    setCrossQuery('');
  }

  function handleText(text) {
    setQuery(text);
    // Mientras escribe, la raza deja de estar "elegida" hasta que toque una sugerencia.
    onChange({ ...value, breed: null, breedText: text, isCross: false, crossBreed: null });
    if (value.crossBreed || value.isCross) setCrossQuery('');
  }

  function toggleCross(checked) {
    onChange({ ...value, isCross: checked, crossBreed: checked ? value.crossBreed : null });
    if (!checked) setCrossQuery('');
  }

  function selectCross(breed) {
    setCrossQuery(breed.name);
    onChange({ ...value, crossBreed: breed });
  }

  return (
    <>
      <Field
        label="Raza (opcional)"
        htmlFor="breed"
        hint={disabled ? 'Primero elegí la especie.' : 'Elegí una de la lista o escribí otra. "Mestizo" si no tiene raza definida.'}
      >
        <BreedAutocomplete
          id="breed"
          value={query}
          onChange={handleText}
          onSelect={selectBreed}
          onFreeText={useFreeText}
          speciesId={speciesId ? Number(speciesId) : undefined}
          placeholder={disabled ? 'Elegí la especie primero' : 'Ej.: Dálmata'}
        />
      </Field>

      {hasConcreteBreed && (
        <div className="breed-cross">
          <label className="checkbox-row">
            <input type="checkbox" checked={value.isCross} onChange={(e) => toggleCross(e.target.checked)} />
            Es una cruza con otra raza
          </label>

          {value.isCross && (
            <Field label={`Cruza con (${value.breed.name} y…)`} htmlFor="crossBreed">
              <BreedAutocomplete
                id="crossBreed"
                value={crossQuery}
                onChange={(t) => {
                  setCrossQuery(t);
                  if (value.crossBreed) onChange({ ...value, crossBreed: null });
                }}
                onSelect={selectCross}
                speciesId={Number(speciesId)}
                includeGeneric={false}
                placeholder="Elegí la segunda raza"
              />
              {value.crossBreed && (
                <p className="breed-cross__summary">
                  {value.breed.name} cruza con {value.crossBreed.name}
                  <button type="button" onClick={() => toggleCross(false)} aria-label="Quitar cruza"><XIcon size={12} /></button>
                </p>
              )}
            </Field>
          )}
        </div>
      )}
    </>
  );
}

/** Datos iniciales del selector a partir de una publicación existente. */
export function breedValueFromPet(pet) {
  return {
    breed: pet.breedInfo || null,
    breedText: pet.breedInfo ? '' : pet.breed || '',
    isCross: Boolean(pet.crossBreedInfo),
    crossBreed: pet.crossBreedInfo || null,
  };
}

export const EMPTY_BREED_VALUE = { breed: null, breedText: '', isCross: false, crossBreed: null };

/** Campos que se envían a la API según lo elegido en el selector. */
export function breedPayload(value) {
  return {
    breedId: value.breed ? value.breed.id : '',
    crossBreedId: value.isCross && value.crossBreed ? value.crossBreed.id : '',
    breed: value.breed ? '' : value.breedText || '',
  };
}
