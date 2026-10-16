exports.up = async function (knex) {
  await knex.schema.createTable('follows', (table) => {
    table.increments('id').primary();
    table.integer('follower_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('followed_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.unique(['follower_id', 'followed_id']);
    table.index(['followed_id']);
  });

  await knex.schema.alterTable('notifications', (table) => {
    table.enu('type', [
      'pet_favorited_adopted',
      'post_deleted_by_admin',
      'new_message_on_your_pet',
      'reply_to_inquiry',
      'verification_approved',
      'verification_rejected',
      'followed_new_pet',
    ]).notNullable().alter();
  });
};

exports.down = async function (knex) {
  await knex('notifications').where({ type: 'followed_new_pet' }).del();

  await knex.schema.alterTable('notifications', (table) => {
    table.enu('type', [
      'pet_favorited_adopted',
      'post_deleted_by_admin',
      'new_message_on_your_pet',
      'reply_to_inquiry',
      'verification_approved',
      'verification_rejected',
    ]).notNullable().alter();
  });

  await knex.schema.dropTableIfExists('follows');
};
