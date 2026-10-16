const ApiError = require('../utils/ApiError');
const userRepository = require('../models/userRepository');
const cityRepository = require('../models/cityRepository');
const petRepository = require('../models/petRepository');
const locationService = require('../services/locationService');
const imageService = require('../services/imageService');
const { toPublicUser } = require('./authController');
const { serializePet, groupPhotosByPet } = require('./petController');

async function updateMe(req, res) {
  const b = req.body || {};
  const user = await userRepository.findById(req.user.id);
  const changes = {};

  if (b.phone) changes.phone = b.phone;

  if (b.cityGeorefId) {
    const city = await cityRepository.findOrCreateByGeoref({
      georefId: b.cityGeorefId,
      name: b.cityName,
      province: b.cityProvince,
      latitude: b.cityLat,
      longitude: b.cityLng,
    });
    const location = locationService.resolveUserLocation(city, b.verifiedLat, b.verifiedLng);
    changes.city_id = city.id;
    changes.verified_lat = location.verifiedLat;
    changes.verified_lng = location.verifiedLng;
    changes.location_source = location.locationSource;
  }

  if (req.file) {
    const urls = await imageService.processImage(req.file.buffer, 'users', user.id);
    changes.profile_photo_url = urls.medium;
  }

  if (Object.keys(changes).length > 0) {
    await userRepository.update(user.id, changes);
  }

  const updated = await userRepository.findPublicById(user.id);
  res.json({ user: toPublicUser(updated) });
}

async function getPublicProfile(req, res) {
  const profile = await userRepository.findPublicProfile(req.params.id);
  if (!profile) throw new ApiError(404, 'Usuario no encontrado.');

  const pets = await petRepository.findMineByOwner(profile.id);
  const photos = await petRepository.findPhotosForPets(pets.map((p) => p.id));
  const photosByPet = groupPhotosByPet(photos);

  res.json({
    user: {
      id: profile.id,
      firstName: profile.first_name,
      lastName: profile.last_name,
      profilePhotoUrl: profile.profile_photo_url,
      cityName: profile.city_name,
      cityProvince: profile.city_province,
      isVerifiedOrganization: Boolean(profile.is_verified_organization),
      memberSince: profile.created_at,
    },
    pets: pets.map((p) => serializePet(p, photosByPet[p.id] || [])),
  });
}

async function searchVerified(req, res) {
  const q = (req.query.q || '').trim();
  if (q.length < 2) return res.json({ users: [] });

  const rows = await userRepository.searchVerified(q);
  res.json({
    users: rows.map((u) => ({
      id: u.id,
      firstName: u.first_name,
      lastName: u.last_name,
      profilePhotoUrl: u.profile_photo_url,
      isVerifiedOrganization: true,
    })),
  });
}

module.exports = { updateMe, getPublicProfile, searchVerified };
