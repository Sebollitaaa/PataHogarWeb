const { syncCatalog, linkLegacyPets } = require('../../services/breedCatalogService');

exports.up = async function (knex) {
  await knex.schema.createTable('breeds', (table) => {
    table.increments('id').primary();
    table.integer('species_id').unsigned().notNullable().references('id').inTable('species').onDelete('CASCADE');
    table.string('name', 100).notNullable();
    table.string('slug', 120).notNullable();
    // Otros nombres con que la gente busca la raza ("Poodle" para Caniche), separados por coma.
    table.string('aliases', 500).notNullable().defaultTo('');
    // Opción "Mestizo / sin raza definida" de cada especie.
    table.boolean('is_generic').notNullable().defaultTo(false);
    // Título del artículo de Wikipedia del que se descarga la miniatura.
    table.string('wiki_title', 150).nullable();
    table.string('image_url', 255).nullable();
    table.string('image_source_url', 400).nullable();
    table.timestamp('image_checked_at').nullable();

    table.unique(['species_id', 'slug']);
    table.index(['name']);
  });

  await knex.schema.alterTable('pets', (table) => {
    table.string('breed', 255).nullable().alter();
    table.integer('breed_id').unsigned().nullable().references('id').inTable('breeds').onDelete('SET NULL');
    table.integer('cross_breed_id').unsigned().nullable().references('id').inTable('breeds').onDelete('SET NULL');
    // true solo si tiene una raza concreta de la lista y no es cruza ni mestizo.
    table.boolean('is_pure_breed').notNullable().defaultTo(false);
    table.index(['is_pure_breed']);
  });

  await syncCatalog(knex);
  await linkLegacyPets(knex);
};

exports.down = async function (knex) {
  await knex.schema.alterTable('pets', (table) => {
    table.dropForeign('breed_id');
    table.dropForeign('cross_breed_id');
    table.dropIndex('is_pure_breed');
    table.dropColumn('breed_id');
    table.dropColumn('cross_breed_id');
    table.dropColumn('is_pure_breed');
  });
  await knex.schema.dropTableIfExists('breeds');
};
