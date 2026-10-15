exports.up = async function (knex) {
  await knex.schema.alterTable('users', (table) => {
    // Nulo = el correo todavía no fue confirmado con el código.
    table.timestamp('email_verified_at').nullable();
  });

  // Las cuentas que ya existían antes de esta funcionalidad se consideran verificadas.
  await knex('users').whereNull('email_verified_at').update({ email_verified_at: knex.fn.now() });

  await knex.schema.createTable('email_codes', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.enu('purpose', ['verify_email', 'reset_password']).notNullable();
    table.string('code_hash', 64).notNullable();
    table.timestamp('expires_at').notNullable();
    table.timestamp('used_at').nullable();
    table.integer('attempts').unsigned().notNullable().defaultTo(0);
    table.timestamps(true, true);

    table.index(['user_id', 'purpose']);
    table.index(['expires_at']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('email_codes');
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('email_verified_at');
  });
};
