const db = require('../db/knex');

function findPendingByUserId(userId) {
  return db('verification_requests').where({ user_id: userId, status: 'pendiente' }).first();
}

function create(request) {
  return db('verification_requests').insert(request).then(([id]) => id);
}

function addDocument(document) {
  return db('verification_documents').insert(document);
}

module.exports = { findPendingByUserId, create, addDocument };
