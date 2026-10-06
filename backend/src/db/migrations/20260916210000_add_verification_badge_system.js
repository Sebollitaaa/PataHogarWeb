exports.up = async function (knex) {
  await knex.schema.alterTable('users', (table) => {
    table.boolean('is_verified_organization').notNullable().defaultTo(false);
  });

  await knex.schema.alterTable('verification_requests', (table) => {
    // Cuándo se le avisó al usuario (notificación in-app) que su solicitud fue
    // resuelta. El backend revisa periódicamente las solicitudes aprobadas/rechazadas
    // (que la desktop app actualiza directo en la base) y procesa las que todavía
    // no tengan este campo, para no notificar dos veces.
    table.timestamp('user_notified_at').nullable();
  });

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
};

exports.down = async function (knex) {
  await knex.schema.alterTable('notifications', (table) => {
    table.enu('type', [
      'pet_favorited_adopted',
      'post_deleted_by_admin',
      'new_message_on_your_pet',
      'reply_to_inquiry',
    ]).notNullable().alter();
  });

  await knex.schema.alterTable('verification_requests', (table) => {
    table.dropColumn('user_notified_at');
  });

  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('is_verified_organization');
  });
};
