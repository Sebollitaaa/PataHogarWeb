const db = require('../db/knex');

const PUBLIC_COLUMNS = [
  'id', 'first_name', 'last_name', 'email', 'phone', 'profile_photo_url',
  'city_id', 'role', 'status', 'is_verified_organization', 'created_at',
];

function findByEmail(email) {
  return db('users').where({ email: email.toLowerCase() }).first();
}

function findById(id) {
  return db('users').where({ id }).first();
}

function findPublicById(id) {
  return db('users')
    .select(...PUBLIC_COLUMNS.map((c) => `users.${c}`), 'cities.name as city_name', 'cities.province as city_province')
    .leftJoin('cities', 'cities.id', 'users.city_id')
    .where({ 'users.id': id })
    .first();
}

/** Perfil visible por cualquiera (sin email/teléfono): para que un adoptante pueda
 * revisar quién publica antes de contactarlo. */
function findPublicProfile(id) {
  return db('users')
    .select(
      'users.id', 'users.first_name', 'users.last_name', 'users.profile_photo_url',
      'users.is_verified_organization', 'users.created_at', 'cities.name as city_name', 'cities.province as city_province'
    )
    .leftJoin('cities', 'cities.id', 'users.city_id')
    .where({ 'users.id': id, 'users.status': 'active' })
    .first();
}

/** Nombres de usuarios/organizaciones verificadas, para la búsqueda de "Personas". */
function searchVerified(query, limit = 20) {
  return db('users')
    .select('id', 'first_name', 'last_name', 'profile_photo_url')
    .where({ is_verified_organization: true, status: 'active' })
    .andWhere((qb) => {
      qb.whereRaw('LOWER(first_name) LIKE ?', [`%${query.toLowerCase()}%`])
        .orWhereRaw('LOWER(last_name) LIKE ?', [`%${query.toLowerCase()}%`])
        .orWhereRaw("LOWER(CONCAT(first_name, ' ', last_name)) LIKE ?", [`%${query.toLowerCase()}%`]);
    })
    .orderBy('first_name')
    .limit(limit);
}

async function create(user) {
  const [id] = await db('users').insert({ ...user, email: user.email.toLowerCase() });
  return findById(id);
}

function update(id, changes) {
  return db('users').where({ id }).update(changes);
}

module.exports = { findByEmail, findById, findPublicById, findPublicProfile, searchVerified, create, update, PUBLIC_COLUMNS };
