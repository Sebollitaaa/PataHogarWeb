// Genera docs/09-atribuciones-imagenes-razas.md a partir de la tabla `breeds`.
// Uso (desde backend/):  npm run breeds:credits
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/db/knex');

const OUT = path.join(__dirname, '..', '..', 'docs', '09-atribuciones-imagenes-razas.md');

(async () => {
  const rows = await db('breeds')
    .join('species', 'species.id', 'breeds.species_id')
    .whereNotNull('breeds.image_source_url')
    .select('species.name as species', 'breeds.name', 'breeds.image_source_url as url')
    .orderBy(['species.name', 'breeds.name']);

  const total = await db('breeds').count({ n: '*' }).first();
  const lines = [
    '# 9. Atribuciones de las imágenes de razas',
    '',
    'Las miniaturas que acompañan las sugerencias de raza se obtienen de **Wikipedia** (artículo de cada raza) y de **Wikimedia Commons**,',
    'cuyas imágenes se publican bajo licencias libres (principalmente Creative Commons Atribución-CompartirIgual y dominio público).',
    'Cada autor y licencia pueden consultarse en la página de la imagen dentro del artículo indicado.',
    '',
    'Las miniaturas **no forman parte del repositorio**: el backend las descarga automáticamente la primera vez que se inicia',
    '(ver [configuración y operación](08-configuracion-y-operacion.md)) y se redimensionan a 96 × 96 px. Esta lista se regenera con `npm run breeds:credits`.',
    '',
    `Razas en el catálogo: ${total.n}. Razas con imagen: ${rows.length}.`,
    '',
    '| Especie | Raza | Artículo de origen |',
    '|---|---|---|',
    ...rows.map((r) => `| ${r.species} | ${r.name} | <${r.url}> |`),
    '',
  ];
  fs.writeFileSync(OUT, lines.join('\n'), 'utf8');
  console.log(`Escrito ${OUT} (${rows.length} imágenes).`);
  await db.destroy();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
