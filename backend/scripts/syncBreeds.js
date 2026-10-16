// Sincroniza el catálogo de razas y descarga las miniaturas que falten.
// Uso: npm run breeds:sync              (solo las pendientes)
//      npm run breeds:sync -- --force   (reintenta también las que no tenían foto)
require('dotenv').config();
const { syncCatalog } = require('../src/services/breedCatalogService');
const { syncMissingImages } = require('../src/services/breedImageService');
const db = require('../src/db/knex');

(async () => {
  const total = await syncCatalog();
  console.log(`Catálogo sincronizado: ${total} razas.`);
  const result = await syncMissingImages({ force: process.argv.includes('--force') });
  console.log(`Miniaturas: ${result.downloaded} descargadas de ${result.pending} pendientes.`);
  const missing = await db('breeds').whereNull('image_url').whereNotNull('wiki_title').select('name', 'wiki_title');
  if (missing.length) {
    console.log(`Razas sin miniatura (${missing.length}):`);
    for (const m of missing) console.log(` - ${m.name}  [wiki: ${m.wiki_title}]`);
  }
  await db.destroy();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
