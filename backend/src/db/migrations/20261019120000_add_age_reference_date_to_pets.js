// Fecha en que se cargó la edad a mano: desde ahí la edad avanza sola.
exports.up = async function (knex) {
  await knex.schema.alterTable('pets', (table) => {
    table.date('age_reference_date').nullable();
  });
  await knex.raw("UPDATE pets SET age_reference_date = DATE(created_at) WHERE age_mode = 'manual'");
};

exports.down = async function (knex) {
  await knex.schema.alterTable('pets', (table) => {
    table.dropColumn('age_reference_date');
  });
};
