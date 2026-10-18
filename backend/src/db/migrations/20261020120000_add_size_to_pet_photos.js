// Medidas de cada foto de mascota: el cliente decide si la foto llena el recuadro
// o se muestra entera con fondo desenfocado. Las fotos que ya estaban subidas
// se completan leyendo el archivo (si falta el archivo, quedan sin medidas).
exports.up = async function (knex) {
  await knex.schema.alterTable('pet_photos', (table) => {
    table.integer('width').unsigned().nullable();
    table.integer('height').unsigned().nullable();
  });

  const { readSize } = require('../../services/imageService');
  const photos = await knex('pet_photos').select('id', 'url_original');
  for (const photo of photos) {
    try {
      const { width, height } = await readSize(photo.url_original);
      await knex('pet_photos').where({ id: photo.id }).update({ width, height });
    } catch {
      // archivo inexistente en esta instalación: se deja sin medidas
    }
  }
};

exports.down = async function (knex) {
  await knex.schema.alterTable('pet_photos', (table) => {
    table.dropColumn('width');
    table.dropColumn('height');
  });
};
