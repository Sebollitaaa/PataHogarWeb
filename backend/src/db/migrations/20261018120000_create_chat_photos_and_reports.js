exports.up = async function (knex) {
  // Un mensaje puede ser solo fotos, sin texto.
  await knex.schema.alterTable('messages', (table) => {
    table.text('content').nullable().alter();
    // Moderación: el mensaje queda en el historial pero sin su contenido.
    table.timestamp('removed_at').nullable();
    table.string('removed_reason', 300).nullable();
  });

  await knex.schema.createTable('message_attachments', (table) => {
    table.increments('id').primary();
    table.integer('message_id').unsigned().notNullable().references('id').inTable('messages').onDelete('CASCADE');
    // Nombres de archivo dentro de storage/chat/<conversationId>/ (carpeta privada, no pública).
    table.string('thumb_file', 120).notNullable();
    table.string('medium_file', 120).notNullable();
    table.integer('width').unsigned().nullable();
    table.integer('height').unsigned().nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index(['message_id']);
  });

  await knex.schema.createTable('message_reports', (table) => {
    table.increments('id').primary();
    table.integer('message_id').unsigned().notNullable().references('id').inTable('messages').onDelete('CASCADE');
    table.integer('reporter_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.enu('reason', ['inapropiado', 'spam', 'acoso', 'otro']).notNullable();
    table.string('comment', 500).nullable();
    table.enu('status', ['pendiente', 'resuelto', 'descartado']).notNullable().defaultTo('pendiente');
    table.integer('resolved_by').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('resolved_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.unique(['message_id', 'reporter_id']);
    table.index(['status']);
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
      'message_removed_by_admin',
    ]).notNullable().alter();
  });

  await knex.schema.alterTable('admin_actions', (table) => {
    table.enu('action_type', ['delete_pet', 'ban_user', 'delete_user', 'flag_outdated_pet', 'remove_message']).notNullable().alter();
    table.enu('target_type', ['pet', 'user', 'message']).notNullable().alter();
  });
};

exports.down = async function (knex) {
  await knex('notifications').where({ type: 'message_removed_by_admin' }).del();
  await knex('admin_actions').where({ action_type: 'remove_message' }).del();

  await knex.schema.alterTable('admin_actions', (table) => {
    table.enu('action_type', ['delete_pet', 'ban_user', 'delete_user', 'flag_outdated_pet']).notNullable().alter();
    table.enu('target_type', ['pet', 'user']).notNullable().alter();
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

  await knex.schema.dropTableIfExists('message_reports');
  await knex.schema.dropTableIfExists('message_attachments');

  await knex('messages').whereNull('content').update({ content: '' });
  await knex.schema.alterTable('messages', (table) => {
    table.dropColumn('removed_at');
    table.dropColumn('removed_reason');
    table.text('content').notNullable().alter();
  });
};
