const db = require('../db/knex');

const PET_BASE_SELECT = [
  'pets.*',
  'species.name as species_name',
  'species.slug as species_slug',
  'users.first_name as owner_first_name',
  'users.last_name as owner_last_name',
  'users.is_verified_organization as owner_is_verified_organization',
  'b1.name as breed_name',
  'b1.image_url as breed_image_url',
  'b1.is_generic as breed_is_generic',
  'b2.name as cross_breed_name',
  'b2.image_url as cross_breed_image_url',
];

// Años cumplidos hoy: por la fecha de nacimiento, o (edad a mano) por la fecha de
// nacimiento estimada a partir de lo cargado y del día en que se cargó.
const CURRENT_AGE_YEARS_SQL = `TIMESTAMPDIFF(YEAR,
  COALESCE(pets.birth_date,
    DATE_SUB(DATE_SUB(DATE_SUB(COALESCE(pets.age_reference_date, DATE(pets.created_at)),
      INTERVAL pets.age_years YEAR), INTERVAL pets.age_months MONTH), INTERVAL pets.age_days DAY)),
  CURDATE())`;

function withJoins(query) {
  return query
    .join('species', 'species.id', 'pets.species_id')
    .join('users', 'users.id', 'pets.owner_id')
    .leftJoin('breeds as b1', 'b1.id', 'pets.breed_id')
    .leftJoin('breeds as b2', 'b2.id', 'pets.cross_breed_id');
}

function create(pet) {
  return db('pets').insert(pet).then(([id]) => id);
}

function findById(id) {
  return withJoins(db('pets').select(PET_BASE_SELECT)).where('pets.id', id).first();
}

async function findPhotos(petId) {
  return db('pet_photos').where({ pet_id: petId }).orderBy('sort_order');
}

async function findPhotosForPets(petIds) {
  if (petIds.length === 0) return [];
  return db('pet_photos').whereIn('pet_id', petIds).orderBy('sort_order');
}

function countPhotos(petId) {
  return db('pet_photos').where({ pet_id: petId }).count({ count: '*' }).first();
}

function addPhoto(photo) {
  return db('pet_photos').insert(photo);
}

function nextPhotoSortOrder(petId) {
  return db('pet_photos').where({ pet_id: petId }).max('sort_order as maxOrder').first();
}

function deletePhoto(photoId, petId) {
  return db('pet_photos').where({ id: photoId, pet_id: petId }).del();
}

function findPhotoById(photoId) {
  return db('pet_photos').where({ id: photoId }).first();
}

function update(id, changes) {
  return db('pets').where({ id }).update(changes);
}

function remove(id) {
  return db('pets').where({ id }).del();
}

function findMineByOwner(ownerId, status) {
  let query = withJoins(db('pets').select(PET_BASE_SELECT)).where('pets.owner_id', ownerId);
  if (status) query = query.where('pets.status', status);
  return query.orderBy('pets.created_at', 'desc');
}

async function search(filters) {
  const {
    speciesId, sex, size, minAgeYears, maxAgeYears,
    isVaccinated, isNeutered, isDewormed, status, q, breedId, pureBreed,
    lat, lng, maxDistanceKm, page = 1, pageSize = 20,
  } = filters;

  const offset = (page - 1) * pageSize;
  const hasLocation = lat !== undefined && lng !== undefined;

  let base = withJoins(db('pets')).where('pets.status', status || 'disponible');
  if (speciesId) base = base.where('pets.species_id', speciesId);
  if (sex) base = base.where('pets.sex', sex);
  if (size) base = base.where('pets.size', size);
  if (minAgeYears !== undefined) base = base.whereRaw(`${CURRENT_AGE_YEARS_SQL} >= ?`, [minAgeYears]);
  if (maxAgeYears !== undefined) base = base.whereRaw(`${CURRENT_AGE_YEARS_SQL} <= ?`, [maxAgeYears]);
  if (isVaccinated !== undefined) base = base.where('pets.is_vaccinated', isVaccinated === 'true');
  if (isNeutered !== undefined) base = base.where('pets.is_neutered', isNeutered === 'true');
  if (isDewormed !== undefined) base = base.where('pets.is_dewormed', isDewormed === 'true');
  if (breedId) {
    // Una cruza aparece al buscar cualquiera de sus dos razas.
    base = base.where((builder) => {
      builder.where('pets.breed_id', breedId).orWhere('pets.cross_breed_id', breedId);
    });
  }
  if (pureBreed === 'true') base = base.where('pets.is_pure_breed', true);
  if (q) {
    const like = `%${q.replace(/[\\%_]/g, '\\$&')}%`;
    const matchingBreeds = () => db('breeds').select('id').where('name', 'like', like).orWhere('aliases', 'like', like);
    base = base.where((builder) => {
      builder
        .where('pets.name', 'like', like)
        .orWhere('pets.breed', 'like', like)
        // También por alias: "poodle" encuentra a los Caniche.
        .orWhereIn('pets.breed_id', matchingBreeds())
        .orWhereIn('pets.cross_breed_id', matchingBreeds());
    });
  }

  const selectCols = [...PET_BASE_SELECT];
  if (hasLocation) {
    selectCols.push(db.raw(
      '(6371 * ACOS(LEAST(1, COS(RADIANS(?)) * COS(RADIANS(pets.latitude)) * COS(RADIANS(pets.longitude) - RADIANS(?)) + SIN(RADIANS(?)) * SIN(RADIANS(pets.latitude))))) as distance_km',
      [lat, lng, lat]
    ));
  }

  let listQuery = base.clone().select(selectCols);
  if (hasLocation && maxDistanceKm) {
    listQuery = listQuery.having('distance_km', '<=', maxDistanceKm);
  }

  const totalRow = await db.count('* as count').from(listQuery.clone().as('sub')).first();

  listQuery = hasLocation
    ? listQuery.orderBy('distance_km', 'asc')
    : listQuery.orderBy('pets.created_at', 'desc');
  listQuery = listQuery.limit(pageSize).offset(offset);

  const pets = await listQuery;
  return { pets, total: Number(totalRow.count) };
}

async function countByStatus() {
  const rows = await db('pets').select('status').count({ count: '*' }).groupBy('status');
  const counts = { disponible: 0, en_proceso: 0, adoptada: 0, desactualizada: 0 };
  for (const row of rows) counts[row.status] = Number(row.count);
  return counts;
}

module.exports = {
  create,
  findById,
  findPhotos,
  findPhotosForPets,
  countPhotos,
  addPhoto,
  nextPhotoSortOrder,
  deletePhoto,
  findPhotoById,
  update,
  remove,
  findMineByOwner,
  search,
  countByStatus,
  PET_BASE_SELECT,
  withJoins,
};
