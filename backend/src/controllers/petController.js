const ApiError = require('../utils/ApiError');
const petRepository = require('../models/petRepository');
const userRepository = require('../models/userRepository');
const favoriteRepository = require('../models/favoriteRepository');
const notificationService = require('../services/notificationService');
const adminActionRepository = require('../models/adminActionRepository');
const locationService = require('../services/locationService');
const imageService = require('../services/imageService');
const breedCatalogService = require('../services/breedCatalogService');
const followRepository = require('../models/followRepository');
const chatImageService = require('../services/chatImageService');
const db = require('../db/knex');
const { computeAgeFromBirthDate, computeManualAge } = require('../utils/age');

const MAX_PHOTOS = 10;

function toBool(v) {
  return v === true || v === 'true' || v === '1' || v === 1;
}

const toAgeNumber = (v) => (v === undefined || v === null || v === '' ? 0 : parseInt(v, 10) || 0);

/**
 * A partir de lo que mandó el formulario (fecha de nacimiento o edad a mano),
 * arma las columnas de edad a guardar. En modo "manual" se guarda tal cual lo
 * escribió el dueño (los campos vacíos cuentan como 0) junto con el día en que
 * lo cargó (`age_reference_date`): desde ese día la edad avanza sola (ver serializePet).
 * En modo "birth_date" se guarda la fecha y una foto de la edad actual.
 * `previous` es la publicación antes de editar: si la edad a mano no cambió,
 * se conserva su fecha de referencia para que la cuenta no se reinicie.
 */
function buildAgeFields(b, previous = null) {
  if (b.ageMode === 'birth_date') {
    const { years, months, days } = computeAgeFromBirthDate(b.birthDate);
    return {
      age_mode: 'birth_date',
      birth_date: b.birthDate,
      age_years: years,
      age_months: months,
      age_days: days,
      age_reference_date: null,
    };
  }

  const entered = { age_years: toAgeNumber(b.ageYears), age_months: toAgeNumber(b.ageMonths), age_days: toAgeNumber(b.ageDays) };
  const unchanged = previous
    && previous.age_mode === 'manual'
    && previous.age_years === entered.age_years
    && previous.age_months === entered.age_months
    && previous.age_days === entered.age_days;

  return {
    age_mode: 'manual',
    birth_date: null,
    ...entered,
    age_reference_date: unchanged && previous.age_reference_date ? previous.age_reference_date : new Date(),
  };
}

/** La edad se congela el día en que la mascota fue adoptada. */
function ageUntil(pet) {
  return pet.status === 'adoptada' && pet.status_changed_at ? new Date(pet.status_changed_at) : new Date();
}

function serializePhoto(p) {
  return {
    id: p.id,
    thumbnail: p.url_thumbnail,
    medium: p.url_medium,
    original: p.url_original,
    width: p.width || null,
    height: p.height || null,
  };
}

function serializePet(pet, photos = []) {
  // La edad se recalcula al mostrarla, para que sea la de hoy y no una foto vieja
  // de cuando se publicó (o la del día de la adopción, si ya fue adoptada).
  const until = ageUntil(pet);
  const entered = { years: pet.age_years, months: pet.age_months, days: pet.age_days };
  const age = pet.age_mode === 'birth_date' && pet.birth_date
    ? computeAgeFromBirthDate(pet.birth_date, until)
    : computeManualAge(entered, pet.age_reference_date || pet.created_at, until);

  return {
    id: pet.id,
    name: pet.name,
    species: { id: pet.species_id, name: pet.species_name, slug: pet.species_slug },
    breed: pet.breed,
    breedId: pet.breed_id || null,
    crossBreedId: pet.cross_breed_id || null,
    breedInfo: pet.breed_id
      ? { id: pet.breed_id, name: pet.breed_name, imageUrl: pet.breed_image_url || null, isGeneric: Boolean(pet.breed_is_generic) }
      : null,
    crossBreedInfo: pet.cross_breed_id
      ? { id: pet.cross_breed_id, name: pet.cross_breed_name, imageUrl: pet.cross_breed_image_url || null }
      : null,
    isCrossBreed: Boolean(pet.cross_breed_id),
    isPureBreed: Boolean(pet.is_pure_breed),
    size: pet.size,
    ageMode: pet.age_mode,
    birthDate: pet.birth_date,
    ageYears: age.years,
    ageMonths: age.months,
    ageDays: age.days,
    // La edad cargada a mano es una estimación: el cliente la muestra con "aprox.".
    ageIsApproximate: pet.age_mode !== 'birth_date',
    // Lo que escribió el dueño y cuándo, para precargar el formulario de edición.
    ageEntered: pet.age_mode === 'manual'
      ? { years: entered.years, months: entered.months, days: entered.days, referenceDate: pet.age_reference_date }
      : null,
    sex: pet.sex,
    isVaccinated: Boolean(pet.is_vaccinated),
    isNeutered: Boolean(pet.is_neutered),
    isDewormed: Boolean(pet.is_dewormed),
    description: pet.description,
    status: pet.status,
    latitude: Number(pet.latitude),
    longitude: Number(pet.longitude),
    contactWhatsapp: pet.contact_whatsapp,
    contactEmail: pet.contact_email,
    owner: {
      id: pet.owner_id, firstName: pet.owner_first_name, lastName: pet.owner_last_name,
      isVerifiedOrganization: Boolean(pet.owner_is_verified_organization),
    },
    photos: photos.map(serializePhoto),
    distanceKm: pet.distance_km !== undefined ? Number(pet.distance_km) : undefined,
    createdAt: pet.created_at,
  };
}

async function assertOwnerOrAdmin(pet, user) {
  if (pet.owner_id !== Number(user.id) && user.role !== 'admin') {
    throw new ApiError(403, 'No podés modificar una publicación que no es tuya.');
  }
}

/** Avisa a quienes siguen al perfil verificado que publicó una mascota nueva. */
async function notifyFollowers(io, pet) {
  if (!pet.owner_is_verified_organization) return;
  try {
    const followerIds = await followRepository.findFollowerIds(pet.owner_id);
    const ownerName = `${pet.owner_first_name} ${pet.owner_last_name}`.trim();
    for (const userId of followerIds) {
      await notificationService.create(io, {
        user_id: userId,
        type: 'followed_new_pet',
        payload: { petId: pet.id, petName: pet.name, ownerId: pet.owner_id, ownerName },
      });
    }
  } catch (err) {
    // Un fallo al avisar no debe impedir que la publicación se cree.
    console.error('No se pudo notificar a los seguidores:', err.message);
  }
}

async function create(req, res) {
  const files = req.files || [];
  if (files.length < 1) throw new ApiError(422, 'Subí al menos una foto de la mascota.');
  if (files.length > MAX_PHOTOS) throw new ApiError(422, `Podés subir hasta ${MAX_PHOTOS} fotos.`);

  const user = await userRepository.findById(req.user.id);
  const { lat, lng } = await locationService.getEffectiveUserLocation(user);

  const b = req.body;
  const breedFields = await breedCatalogService.resolveBreedFields({
    speciesId: Number(b.speciesId),
    breedId: b.breedId,
    crossBreedId: b.crossBreedId,
    breedText: b.breed,
  });
  const petId = await petRepository.create({
    owner_id: user.id,
    species_id: b.speciesId,
    name: b.name,
    ...breedFields,
    size: b.size,
    ...buildAgeFields(b),
    sex: b.sex,
    is_vaccinated: toBool(b.isVaccinated),
    is_neutered: toBool(b.isNeutered),
    is_dewormed: toBool(b.isDewormed),
    description: b.description,
    contact_whatsapp: b.contactWhatsapp || null,
    contact_email: b.contactEmail || null,
    latitude: lat,
    longitude: lng,
  });

  let sortOrder = 0;
  for (const file of files) {
    const urls = await imageService.processImage(file.buffer, 'pets', petId);
    await petRepository.addPhoto({
      pet_id: petId,
      url_original: urls.original,
      url_medium: urls.medium,
      url_thumbnail: urls.thumbnail,
      width: urls.width,
      height: urls.height,
      sort_order: sortOrder++,
    });
  }

  const pet = await petRepository.findById(petId);
  const photos = await petRepository.findPhotos(petId);

  await notifyFollowers(req.app.get('io'), pet);

  res.status(201).json({ pet: serializePet(pet, photos) });
}

async function getOne(req, res) {
  const pet = await petRepository.findById(req.params.id);
  if (!pet) throw new ApiError(404, 'Publicación no encontrada.');
  const photos = await petRepository.findPhotos(pet.id);
  res.json({ pet: serializePet(pet, photos) });
}

async function update(req, res) {
  const pet = await petRepository.findById(req.params.id);
  if (!pet) throw new ApiError(404, 'Publicación no encontrada.');
  await assertOwnerOrAdmin(pet, req.user);

  const b = req.body || {};
  const changes = {};
  const map = {
    speciesId: 'species_id', name: 'name', size: 'size',
    sex: 'sex', description: 'description',
    contactWhatsapp: 'contact_whatsapp', contactEmail: 'contact_email',
  };
  for (const [key, column] of Object.entries(map)) {
    if (b[key] !== undefined) changes[column] = b[key] === '' ? null : b[key];
  }
  for (const key of ['isVaccinated', 'isNeutered', 'isDewormed']) {
    if (b[key] !== undefined) changes[key.replace(/([A-Z])/g, '_$1').toLowerCase()] = toBool(b[key]);
  }
  if (b.ageMode !== undefined) {
    Object.assign(changes, buildAgeFields(b, pet));
  }

  const touchesBreed = ['breed', 'breedId', 'crossBreedId'].some((k) => b[k] !== undefined);
  const speciesChanged = b.speciesId !== undefined && Number(b.speciesId) !== pet.species_id;
  if (touchesBreed || speciesChanged) {
    // Si cambió la especie y no mandaron raza nueva, la raza anterior ya no aplica.
    Object.assign(changes, await breedCatalogService.resolveBreedFields({
      speciesId: Number(b.speciesId !== undefined ? b.speciesId : pet.species_id),
      breedId: touchesBreed ? b.breedId : null,
      crossBreedId: touchesBreed ? b.crossBreedId : null,
      breedText: touchesBreed ? b.breed : null,
    }));
  }

  if (Object.keys(changes).length > 0) {
    await petRepository.update(pet.id, changes);
  }

  const updated = await petRepository.findById(pet.id);
  const photos = await petRepository.findPhotos(pet.id);
  res.json({ pet: serializePet(updated, photos) });
}

async function updateStatus(req, res) {
  const pet = await petRepository.findById(req.params.id);
  if (!pet) throw new ApiError(404, 'Publicación no encontrada.');

  const { status } = req.body;
  const isAdmin = req.user.role === 'admin';
  const isOwner = pet.owner_id === Number(req.user.id);

  if (status === 'desactualizada') {
    if (!isAdmin) throw new ApiError(403, 'Solo un moderador puede marcar una publicación como desactualizada.');
  } else if (!isOwner && !isAdmin) {
    throw new ApiError(403, 'No podés modificar una publicación que no es tuya.');
  } else if (!['disponible', 'en_proceso', 'adoptada'].includes(status)) {
    throw new ApiError(422, 'Estado inválido.');
  }

  await petRepository.update(pet.id, { status, status_changed_at: new Date() });
  const io = req.app.get('io');

  if (status === 'desactualizada' && isAdmin) {
    await notificationService.create(io, {
      user_id: pet.owner_id,
      type: 'post_deleted_by_admin',
      payload: { petId: pet.id, petName: pet.name, reason: 'marked_outdated' },
    });
    await adminActionRepository.create({
      admin_id: req.user.id,
      action_type: 'flag_outdated_pet',
      target_type: 'pet',
      target_id: pet.id,
    });
  }

  if (status === 'adoptada') {
    const favoritedByUserIds = await favoriteRepository.findUserIdsByPet(pet.id);
    for (const userId of favoritedByUserIds) {
      await notificationService.create(io, {
        user_id: userId,
        type: 'pet_favorited_adopted',
        payload: { petId: pet.id, petName: pet.name },
      });
    }
  }

  const updated = await petRepository.findById(pet.id);
  res.json({ pet: serializePet(updated, await petRepository.findPhotos(pet.id)) });
}

async function addPhotos(req, res) {
  const pet = await petRepository.findById(req.params.id);
  if (!pet) throw new ApiError(404, 'Publicación no encontrada.');
  await assertOwnerOrAdmin(pet, req.user);

  const files = req.files || [];
  if (files.length === 0) throw new ApiError(422, 'No se recibió ninguna imagen.');

  const { count } = await petRepository.countPhotos(pet.id);
  if (Number(count) + files.length > MAX_PHOTOS) {
    throw new ApiError(422, `Esta publicación ya tiene ${count} fotos, el máximo es ${MAX_PHOTOS}.`);
  }

  const { maxOrder } = await petRepository.nextPhotoSortOrder(pet.id);
  let sortOrder = (maxOrder ?? -1) + 1;

  for (const file of files) {
    const urls = await imageService.processImage(file.buffer, 'pets', pet.id);
    await petRepository.addPhoto({
      pet_id: pet.id,
      url_original: urls.original,
      url_medium: urls.medium,
      url_thumbnail: urls.thumbnail,
      width: urls.width,
      height: urls.height,
      sort_order: sortOrder++,
    });
  }

  const photos = await petRepository.findPhotos(pet.id);
  res.status(201).json({ photos: photos.map(serializePhoto) });
}

async function deletePhoto(req, res) {
  const pet = await petRepository.findById(req.params.id);
  if (!pet) throw new ApiError(404, 'Publicación no encontrada.');
  await assertOwnerOrAdmin(pet, req.user);

  const photo = await petRepository.findPhotoById(req.params.photoId);
  if (!photo || photo.pet_id !== pet.id) throw new ApiError(404, 'Foto no encontrada.');

  const { count } = await petRepository.countPhotos(pet.id);
  if (Number(count) <= 1) throw new ApiError(422, 'La publicación tiene que tener al menos una foto.');

  await petRepository.deletePhoto(photo.id, pet.id);
  res.json({ message: 'Foto eliminada.' });
}

async function remove(req, res) {
  const pet = await petRepository.findById(req.params.id);
  if (!pet) throw new ApiError(404, 'Publicación no encontrada.');

  const isAdmin = req.user.role === 'admin';
  await assertOwnerOrAdmin(pet, req.user);

  if (isAdmin && pet.owner_id !== Number(req.user.id)) {
    await notificationService.create(req.app.get('io'), {
      user_id: pet.owner_id,
      type: 'post_deleted_by_admin',
      payload: { petName: pet.name },
    });
    await adminActionRepository.create({
      admin_id: req.user.id,
      action_type: 'delete_pet',
      target_type: 'pet',
      target_id: pet.id,
    });
  }

  const convoIds = await db('conversations').where({ pet_id: pet.id }).pluck('id');
  await petRepository.remove(pet.id);
  await imageService.deleteEntityImages('pets', pet.id);
  for (const convoId of convoIds) await chatImageService.deleteConversation(convoId);
  res.json({ message: 'Publicación eliminada.' });
}

async function stats(req, res) {
  const counts = await petRepository.countByStatus();
  res.json({
    available: counts.disponible,
    adopted: counts.adoptada,
  });
}

async function search(req, res) {
  const q = req.query;
  const page = q.page ? parseInt(q.page, 10) : 1;
  const pageSize = q.pageSize ? parseInt(q.pageSize, 10) : 20;

  const { pets, total } = await petRepository.search({
    speciesId: q.speciesId,
    sex: q.sex,
    size: q.size,
    minAgeYears: q.minAgeYears !== undefined ? parseInt(q.minAgeYears, 10) : undefined,
    maxAgeYears: q.maxAgeYears !== undefined ? parseInt(q.maxAgeYears, 10) : undefined,
    isVaccinated: q.isVaccinated,
    isNeutered: q.isNeutered,
    isDewormed: q.isDewormed,
    status: q.status,
    q: q.q,
    breedId: q.breedId ? parseInt(q.breedId, 10) : undefined,
    pureBreed: q.pureBreed,
    lat: q.lat !== undefined ? parseFloat(q.lat) : undefined,
    lng: q.lng !== undefined ? parseFloat(q.lng) : undefined,
    maxDistanceKm: q.maxDistanceKm !== undefined ? parseFloat(q.maxDistanceKm) : undefined,
    page,
    pageSize,
  });

  const photos = await petRepository.findPhotosForPets(pets.map((p) => p.id));
  const photosByPet = groupPhotosByPet(photos);

  res.json({
    pets: pets.map((p) => serializePet(p, photosByPet[p.id] || [])),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}

async function listMine(req, res) {
  const status = req.query.status;
  const pets = await petRepository.findMineByOwner(req.user.id, status);
  const photos = await petRepository.findPhotosForPets(pets.map((p) => p.id));
  const photosByPet = groupPhotosByPet(photos);
  res.json({ pets: pets.map((p) => serializePet(p, photosByPet[p.id] || [])) });
}

function groupPhotosByPet(photos) {
  const map = {};
  for (const photo of photos) {
    if (!map[photo.pet_id]) map[photo.pet_id] = [];
    map[photo.pet_id].push(photo);
  }
  return map;
}

module.exports = { create, getOne, update, updateStatus, addPhotos, deletePhoto, remove, listMine, search, stats, serializePet, groupPhotosByPet };
