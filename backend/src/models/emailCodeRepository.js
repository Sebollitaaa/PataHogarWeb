const db = require('../db/knex');

function create(entry) {
  return db('email_codes').insert(entry).then(([id]) => id);
}

/** Código más reciente, usado o no, para aplicar el tiempo de espera entre envíos. */
function findLatest(userId, purpose) {
  return db('email_codes').where({ user_id: userId, purpose }).orderBy('id', 'desc').first();
}

/** Código vigente: sin usar y sin vencer. */
function findActive(userId, purpose) {
  return db('email_codes')
    .where({ user_id: userId, purpose })
    .whereNull('used_at')
    .where('expires_at', '>', db.fn.now())
    .orderBy('id', 'desc')
    .first();
}

function invalidateActive(userId, purpose) {
  return db('email_codes')
    .where({ user_id: userId, purpose })
    .whereNull('used_at')
    .update({ used_at: db.fn.now() });
}

function incrementAttempts(id) {
  return db('email_codes').where({ id }).increment('attempts', 1);
}

function markUsed(id) {
  return db('email_codes').where({ id }).update({ used_at: db.fn.now() });
}

/** Segundos transcurridos desde el último código emitido (null si nunca se emitió). */
async function secondsSinceLatest(userId, purpose) {
  const row = await db('email_codes')
    .where({ user_id: userId, purpose })
    .orderBy('id', 'desc')
    .select(db.raw('TIMESTAMPDIFF(SECOND, created_at, NOW()) AS seconds'))
    .first();
  return row ? Number(row.seconds) : null;
}

module.exports = { create, findLatest, findActive, invalidateActive, incrementAttempts, markUsed, secondsSinceLatest };
