const ApiError = require('../utils/ApiError');
const userRepository = require('../models/userRepository');
const followRepository = require('../models/followRepository');

async function follow(req, res) {
  const targetId = Number(req.params.userId);
  if (targetId === Number(req.user.id)) throw new ApiError(422, 'No podés seguir tu propio perfil.');

  const target = await userRepository.findPublicProfile(targetId);
  if (!target) throw new ApiError(404, 'Usuario no encontrado.');
  if (!target.is_verified_organization) {
    throw new ApiError(422, 'Solo se pueden seguir perfiles verificados.');
  }

  await followRepository.add(req.user.id, targetId);
  res.status(201).json({ message: 'Ahora seguís este perfil.', followersCount: await followRepository.countFollowers(targetId) });
}

async function unfollow(req, res) {
  const targetId = Number(req.params.userId);
  await followRepository.remove(req.user.id, targetId);
  res.json({ message: 'Dejaste de seguir este perfil.', followersCount: await followRepository.countFollowers(targetId) });
}

async function listIds(req, res) {
  res.json({ ids: await followRepository.findFollowedIds(req.user.id) });
}

async function listMine(req, res) {
  const rows = await followRepository.findFollowedProfiles(req.user.id);
  res.json({
    profiles: rows.map((u) => ({
      id: u.id,
      firstName: u.first_name,
      lastName: u.last_name,
      profilePhotoUrl: u.profile_photo_url,
      isVerifiedOrganization: Boolean(u.is_verified_organization),
      cityName: u.city_name,
      cityProvince: u.city_province,
      availablePets: Number(u.available_pets),
    })),
  });
}

module.exports = { follow, unfollow, listIds, listMine };
