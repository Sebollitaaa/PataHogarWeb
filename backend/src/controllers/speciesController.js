const db = require('../db/knex');

async function list(req, res) {
  // Orden de carga: Perro y Gato primero, "Otro" al final.
  const species = await db('species').select('id', 'name', 'slug').orderBy('id');
  res.json({ species });
}

module.exports = { list };
