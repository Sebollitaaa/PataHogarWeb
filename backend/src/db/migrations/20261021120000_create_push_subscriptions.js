// Dispositivos que aceptaron recibir notificaciones push (un usuario puede tener varios:
// el celular, la computadora, etc.). Cada suscripción es un "buzón" del navegador/sistema.
exports.up = function (knex) {
  return knex.schema.createTable('push_subscriptions', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('endpoint').notNullable();
    // Huella del endpoint: permite exigir que sea único sin indexar un texto largo.
    table.string('endpoint_hash', 64).notNullable().unique();
    table.string('p256dh', 255).notNullable();
    table.string('auth', 255).notNullable();
    table.string('user_agent', 255).nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index(['user_id']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('push_subscriptions');
};
