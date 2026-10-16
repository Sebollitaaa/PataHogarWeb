const db = require('../db/knex');

const COLUMNS = [
  'breeds.id', 'breeds.name', 'breeds.is_generic', 'breeds.image_url',
  'breeds.species_id', 'species.name as species_name', 'species.slug as species_slug',
];

function escapeLike(text) {
  return text.replace(/[\\%_]/g, '\\$&');
}

/**
 * Busca razas por nombre o alias (sin distinguir tildes ni mayúsculas, por la
 * collation utf8mb4_unicode_ci). Primero las que empiezan con el texto.
 */
function search({ q, speciesId, includeGeneric = true, limit = 15 }) {
  let query = db('breeds').join('species', 'species.id', 'breeds.species_id').select(COLUMNS);
  if (speciesId) query = query.where('breeds.species_id', speciesId);
  if (!includeGeneric) query = query.where('breeds.is_generic', false);

  const text = (q || '').trim();
  if (text) {
    const like = `%${escapeLike(text)}%`;
    const prefix = `${escapeLike(text)}%`;
    query = query
      .where((b) => b.where('breeds.name', 'like', like).orWhere('breeds.aliases', 'like', like))
      .orderByRaw(
        'CASE WHEN breeds.name LIKE ? THEN 0 WHEN breeds.name LIKE ? THEN 1 WHEN breeds.aliases LIKE ? THEN 2 ELSE 3 END',
        [prefix, like, prefix]
      );
  } else {
    query = query.orderByRaw('breeds.is_generic DESC');
  }

  return query.orderBy('breeds.name').limit(limit);
}

module.exports = { search };
