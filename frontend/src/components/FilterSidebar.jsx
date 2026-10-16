import { useEffect, useState } from 'react';
import CityAutocomplete from './CityAutocomplete';
import BreedAutocomplete from './BreedAutocomplete';
import { ChevronDownIcon, FilterIcon, XIcon } from './icons/Icons';
import './filter-sidebar.css';

const SIZES = [
  { value: '', label: 'Cualquiera' },
  { value: 'pequeno', label: 'Pequeño' },
  { value: 'mediano', label: 'Mediano' },
  { value: 'grande', label: 'Grande' },
];

const DISTANCES = [25, 50, 100, 250, 500];

/** Grupo de filtros que se puede plegar, como en los buscadores de las tiendas. */
function FilterGroup({ title, activeCount = 0, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={open ? 'filter-group' : 'filter-group filter-group--closed'}>
      <button type="button" className="filter-group__toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span>{title}</span>
        {activeCount > 0 && <span className="filter-group__count">{activeCount}</span>}
        <ChevronDownIcon size={16} />
      </button>
      {open && <div className="filter-group__body">{children}</div>}
    </section>
  );
}

export default function FilterSidebar({ filters, onChange, onReset, onClose }) {
  const [breedDraft, setBreedDraft] = useState(filters.breed?.name || '');

  useEffect(() => {
    setBreedDraft(filters.breed?.name || '');
  }, [filters.breed]);

  function set(patch) {
    onChange({ ...filters, ...patch });
  }

  const healthCount = [filters.isVaccinated, filters.isNeutered, filters.isDewormed].filter(Boolean).length;

  return (
    <aside className="filters">
      <div className="filters__header">
        <FilterIcon size={18} />
        <span>Filtros</span>
        <button className="link-btn" onClick={onReset}>Limpiar</button>
        {onClose && (
          <button type="button" className="filters__close" onClick={onClose} aria-label="Ocultar filtros" title="Ocultar filtros">
            <XIcon size={16} />
          </button>
        )}
      </div>

      <FilterGroup title="Ubicación" activeCount={filters.city ? 1 : 0}>
        <div className="field">
          <CityAutocomplete
            value={filters.city}
            onChange={(city) => set({ city })}
            placeholder="Todo el país"
          />
        </div>
        {filters.city && (
          <div className="field">
            <label>Distancia máxima</label>
            <select className="input" value={filters.maxDistanceKm} onChange={(e) => set({ maxDistanceKm: e.target.value })}>
              {DISTANCES.map((d) => <option key={d} value={d}>{d} km</option>)}
            </select>
          </div>
        )}
      </FilterGroup>

      <FilterGroup title="Raza" activeCount={(filters.breed ? 1 : 0) + (filters.pureBreed ? 1 : 0)}>
        <div className="field">
          <BreedAutocomplete
            value={breedDraft}
            onChange={(text) => {
              setBreedDraft(text);
              if (filters.breed) set({ breed: null });
            }}
            onSelect={(breed) => set({ breed, speciesId: breed.species.id, q: '' })}
            speciesId={filters.speciesId ? Number(filters.speciesId) : undefined}
            includeGeneric={false}
            openOnFocusWithoutText={false}
            placeholder="Cualquiera"
          />
          <label className="checkbox-row" title="Oculta las cruzas y los mestizos">
            <input type="checkbox" checked={filters.pureBreed} onChange={(e) => set({ pureBreed: e.target.checked })} />
            Solo pura raza
          </label>
          <span className="field-hint">Al buscar una raza también aparecen las cruzas que la tengan.</span>
        </div>
      </FilterGroup>

      <FilterGroup title="Sexo" activeCount={filters.sex ? 1 : 0}>
        <div className="segmented">
          {[{ value: '', label: 'Cualquiera' }, { value: 'macho', label: 'Macho' }, { value: 'hembra', label: 'Hembra' }].map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={filters.sex === opt.value ? 'segmented__item segmented__item--active' : 'segmented__item'}
              onClick={() => set({ sex: opt.value })}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Tamaño" activeCount={filters.size ? 1 : 0}>
        <select className="input" value={filters.size} onChange={(e) => set({ size: e.target.value })}>
          {SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </FilterGroup>

      <FilterGroup title="Edad (años)" activeCount={filters.minAgeYears !== '' || filters.maxAgeYears !== '' ? 1 : 0}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="number" min="0" className="input" placeholder="Desde" value={filters.minAgeYears} onChange={(e) => set({ minAgeYears: e.target.value })} />
          <input type="number" min="0" className="input" placeholder="Hasta" value={filters.maxAgeYears} onChange={(e) => set({ maxAgeYears: e.target.value })} />
        </div>
      </FilterGroup>

      <FilterGroup title="Salud" activeCount={healthCount}>
        <label className="checkbox-row"><input type="checkbox" checked={filters.isVaccinated} onChange={(e) => set({ isVaccinated: e.target.checked })} /> Vacunado</label>
        <label className="checkbox-row"><input type="checkbox" checked={filters.isNeutered} onChange={(e) => set({ isNeutered: e.target.checked })} /> Castrado/esterilizado</label>
        <label className="checkbox-row"><input type="checkbox" checked={filters.isDewormed} onChange={(e) => set({ isDewormed: e.target.checked })} /> Desparasitado</label>
      </FilterGroup>
    </aside>
  );
}
