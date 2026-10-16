const db = require('../db/knex');

function add(followerId, followedId) {
  return db('follows').insert({ follower_id: followerId, followed_id: followedId }).onConflict(['follower_id', 'followed_id']).ignore();
}

function remove(followerId, followedId) {
  return db('follows').where({ follower_id: followerId, followed_id: followedId }).del();
}

function findFollowedIds(followerId) {
  return db('follows').where({ follower_id: followerId }).pluck('followed_id');
}

function findFollowerIds(followedId) {
  return db('follows').where({ followed_id: followedId }).pluck('follower_id');
}

async function countFollowers(followedId) {
  const row = await db('follows').where({ followed_id: followedId }).count({ count: '*' }).first();
  return Number(row.count);
}

/** Perfiles que sigue un usuario, con la cantidad de publicaciones disponibles de cada uno. */
function findFollowedProfiles(followerId) {
  return db('follows')
    .join('users', 'users.id', 'follows.followed_id')
    .leftJoin('cities', 'cities.id', 'users.city_id')
    .where({ 'follows.follower_id': followerId, 'users.status': 'active' })
    .select(
      'users.id', 'users.first_name', 'users.last_name', 'users.profile_photo_url',
      'users.is_verified_organization', 'cities.name as city_name', 'cities.province as city_province',
      db.raw('(SELECT COUNT(*) FROM pets WHERE pets.owner_id = users.id AND pets.status = ?) as available_pets', ['disponible'])
    )
    .orderBy('follows.created_at', 'desc');
}

module.exports = { add, remove, findFollowedIds, findFollowerIds, countFollowers, findFollowedProfiles };
