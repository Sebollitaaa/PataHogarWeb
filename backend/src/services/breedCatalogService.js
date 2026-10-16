const ApiError = require('../utils/ApiError');
const { BREEDS, normalizeName } = require('../db/data/breeds');

// Se pide la conexión compartida recién cuando hace falta: así este archivo
// también se puede usar dentro de una migración, que trae su propia conexión.
function sharedDb() {
  return require('../db/knex');
}

const MIX_WORDS = new Set(['mestizo', 'mestiza', 'mestizos', 'mestizas', 'cruza', 'cruce', 'mezcla', 'mix']);
const SEPARATORS = / cruza con | cruce con | mezcla con | mezclado con | x | con | y |\/|,|\+/;

/**
 * Deja la tabla `breeds` igual al catálogo de src/db/data/breeds.js.
 * Es idempotente: se puede ejecutar en cada inicio del servidor.
 */
async function syncCatalog(knex = sharedDb()) {
  const species = await knex('species').select('id', 'slug');
  const speciesBySlug = Object.fromEntries(species.map((s) => [s.slug, s.id]));

  const rows = [];
  for (const b of BREEDS) {
    const speciesId = speciesBySlug[b.speciesSlug];
    if (!speciesId) continue;
    rows.push({
      species_id: speciesId,
      name: b.name,
      slug: b.slug,
      aliases: b.aliases,
      is_generic: b.isGeneric,
      wiki_title: b.wikiTitle,
    });
  }

  const CHUNK = 200;
  for (let i = 0; i < rows.length; i += CHUNK) {
    await knex('breeds')
      .insert(rows.slice(i, i + CHUNK))
      .onConflict(['species_id', 'slug'])
      .merge(['name', 'aliases', 'is_generic', 'wiki_title']);
  }
  return rows.length;
}

/** Nombre que se guarda en pets.breed y se muestra en tarjetas y detalle. */
function displayName(breed, cross) {
  if (!breed) return null;
  if (breed.is_generic) return 'Mestizo';
  if (!cross) return breed.name;
  if (cross.is_generic) return `${breed.name} mestizo`;
  return `${breed.name} cruza con ${cross.name}`;
}

function buildLookup(breeds) {
  const byName = new Map();
  const byAlias = new Map();
  for (const b of breeds) {
    byName.set(normalizeName(b.name), b);
    for (const alias of String(b.aliases || '').split(',')) {
      const key = normalizeName(alias);
      if (key && !byAlias.has(key)) byAlias.set(key, b);
    }
  }
  return (text) => byName.get(text) || byAlias.get(text) || null;
}

/**
 * Intenta reconocer un texto libre ("Dálmata", "Salchicha mestizo",
 * "Labrador x Golden") contra las razas de una especie.
 * Devuelve { breed, cross } o null si no coincide.
 */
function matchText(breeds, rawText, generic) {
  const lookup = buildLookup(breeds);
  const text = normalizeName(rawText || '');
  if (!text) return null;

  const direct = lookup(text);
  if (direct) return { breed: direct, cross: null };

  const stripped = text.split(' ').filter((w) => !MIX_WORDS.has(w)).join(' ');
  if (stripped !== text) {
    if (!stripped) return generic ? { breed: generic, cross: null } : null;
    const found = lookup(stripped);
    if (found && generic) return { breed: found, cross: found.is_generic ? null : generic };
  }

  const parts = text.split(SEPARATORS).map((p) => p.trim()).filter(Boolean);
  if (parts.length === 2) {
    const a = lookup(parts[0]);
    const b = lookup(parts[1]);
    if (a && b && a.id !== b.id && !a.is_generic && !b.is_generic) return { breed: a, cross: b };
  }
  return null;
}

/**
 * Calcula las columnas de raza de una mascota a partir de lo que mandó el cliente.
 * - breedId / crossBreedId: razas elegidas de la lista.
 * - breedText: texto libre (apps que todavía envían solo `breed`, o raza que no está en la lista).
 */
async function resolveBreedFields({ speciesId, breedId, crossBreedId, breedText }, knex = sharedDb()) {
  const empty = { breed_id: null, cross_breed_id: null, breed: null, is_pure_breed: false };
  const speciesBreeds = await knex('breeds').where({ species_id: speciesId });
  const byId = new Map(speciesBreeds.map((b) => [b.id, b]));
  const generic = speciesBreeds.find((b) => b.is_generic) || null;

  let breed = null;
  let cross = null;

  if (breedId) {
    breed = byId.get(Number(breedId));
    if (!breed) throw new ApiError(422, 'La raza elegida no corresponde a la especie seleccionada.');
  }

  if (crossBreedId) {
    if (!breed) throw new ApiError(422, 'Para indicar una cruza primero elegí la raza principal.');
    cross = byId.get(Number(crossBreedId));
    if (!cross) throw new ApiError(422, 'La segunda raza no corresponde a la especie seleccionada.');
    if (cross.id === breed.id) throw new ApiError(422, 'Las dos razas de la cruza tienen que ser distintas.');
    if (breed.is_generic || cross.is_generic) {
      throw new ApiError(422, 'Una cruza se arma con dos razas concretas. Si no se sabe, elegí "Mestizo".');
    }
  }

  if (!breed) {
    const text = (breedText || '').trim();
    if (!text) return empty;
    const found = matchText(speciesBreeds, text, generic);
    if (!found) return { ...empty, breed: text.slice(0, 255) };
    breed = found.breed;
    cross = found.cross;
  }

  return {
    breed_id: breed.id,
    cross_breed_id: cross ? cross.id : null,
    breed: displayName(breed, cross),
    is_pure_breed: !breed.is_generic && !cross,
  };
}

/** Vincula con el catálogo las razas escritas a mano antes de que existiera. */
async function linkLegacyPets(knex = sharedDb()) {
  const pets = await knex('pets').whereNotNull('breed').select('id', 'species_id', 'breed');
  const breedsBySpecies = new Map();
  let linked = 0;

  for (const pet of pets) {
    if (!breedsBySpecies.has(pet.species_id)) {
      breedsBySpecies.set(pet.species_id, await knex('breeds').where({ species_id: pet.species_id }));
    }
    const list = breedsBySpecies.get(pet.species_id);
    const generic = list.find((b) => b.is_generic) || null;
    const found = matchText(list, pet.breed, generic);
    if (!found) continue;
    await knex('pets').where({ id: pet.id }).update({
      breed_id: found.breed.id,
      cross_breed_id: found.cross ? found.cross.id : null,
      breed: displayName(found.breed, found.cross),
      is_pure_breed: !found.breed.is_generic && !found.cross,
    });
    linked += 1;
  }
  return linked;
}

module.exports = { syncCatalog, resolveBreedFields, linkLegacyPets, matchText, displayName };
