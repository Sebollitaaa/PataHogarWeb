exports.up = function (knex) {
  return knex.schema
    .createTable('verification_requests', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');

      table.string('organization_name', 150).notNullable();
      table.enu('organization_type', ['refugio', 'veterinaria', 'asociacion']).notNullable();
      table.string('responsible_name', 150).notNullable();
      table.string('email', 190).notNullable();
      table.string('phone', 30).notNullable();
      table.string('address', 255).notNullable();
      table.string('city', 120).notNullable();
      table.string('province', 120).notNullable();
      table.integer('years_in_operation').unsigned().notNullable();
      table.integer('animals_housed').unsigned().notNullable();
      table.string('website', 255).nullable();
      table.text('description').notNullable();

      // Los valores en español coinciden a propósito con el enum EstadoSolicitud de la
      // desktop app (SistemaAdministracionPataHogar), que hoy usa datos de ejemplo pero
      // más adelante va a leer y actualizar esta misma tabla.
      table.enu('status', ['pendiente', 'aprobada', 'rechazada']).notNullable().defaultTo('pendiente');
      table.text('rejection_reason').nullable();
      table.timestamp('resolved_at').nullable();
      table.integer('resolved_by').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL');

      table.timestamps(true, true);

      table.index(['user_id']);
      table.index(['status']);
    })
    .createTable('verification_documents', (table) => {
      table.increments('id').primary();
      table.integer('request_id').unsigned().notNullable().references('id').inTable('verification_requests').onDelete('CASCADE');
      table.enu('document_type', ['estatuto', 'dni_responsable', 'habilitacion_municipal', 'fotos_instalaciones']).notNullable();
      table.string('original_filename', 255).notNullable();
      // Ruta absoluta en disco: el backend y la desktop app corren en la misma PC,
      // así que la desktop app puede abrir el archivo directo con esa ruta (como ya
      // hace hoy con los documentos de ejemplo, vía Process.Start).
      table.string('file_path', 500).notNullable();
      table.timestamps(true, true);

      table.index(['request_id']);
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('verification_documents')
    .dropTableIfExists('verification_requests');
};
