const crypto = require('crypto');
const db = require('../db/knex');

const hashEndpoint = (endpoint) => crypto.createHash('sha256').update(endpoint).digest('hex');

/** Guarda (o actualiza) la suscripción de un dispositivo. Si el endpoint ya existía, pasa a este usuario. */
function upsert(userId, { endpoint, keys }, userAgent) {
  return db('push_subscriptions')
    .insert({
      user_id: userId,
      endpoint,
      endpoint_hash: hashEndpoint(endpoint),
      p256dh: keys.p256dh,
      auth: keys.auth,
      user_agent: userAgent ? userAgent.slice(0, 255) : null,
    })
    .onConflict('endpoint_hash')
    .merge(['user_id', 'p256dh', 'auth', 'user_agent']);
}

function removeByEndpoint(userId, endpoint) {
  return db('push_subscriptions').where({ user_id: userId, endpoint_hash: hashEndpoint(endpoint) }).del();
}

function removeById(id) {
  return db('push_subscriptions').where({ id }).del();
}

function findByUser(userId) {
  return db('push_subscriptions').where({ user_id: userId });
}

function countByUser(userId) {
  return db('push_subscriptions').where({ user_id: userId }).count({ count: '*' }).first().then((r) => Number(r.count));
}

module.exports = { upsert, removeByEndpoint, removeById, findByUser, countByUser };
