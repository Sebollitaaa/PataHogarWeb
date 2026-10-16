const breedRepository = require('../models/breedRepository');

function serializeBreed(row) {
  return {
    id: row.id,
    name: row.name,
    isGeneric: Boolean(row.is_generic),
    imageUrl: row.image_url || null,
    species: { id: row.species_id, name: row.species_name, slug: row.species_slug },
  };
}

async function list(req, res) {
  const q = req.query;
  const rows = await breedRepository.search({
    q: q.q,
    speciesId: q.speciesId ? parseInt(q.speciesId, 10) : undefined,
    includeGeneric: q.includeGeneric !== 'false',
    limit: q.limit ? parseInt(q.limit, 10) : 15,
  });
  res.json({ breeds: rows.map(serializeBreed) });
}

module.exports = { list };
