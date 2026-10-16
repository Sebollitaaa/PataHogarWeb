const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');
const db = require('../db/knex');
const logger = require('../utils/logger');

const BREEDS_DIR = path.join(__dirname, '..', '..', 'uploads', 'breeds');
const WIKI_API = 'https://en.wikipedia.org/w/api.php';
const USER_AGENT = 'PataHogar/1.0 (proyecto escolar EACP; miniaturas de razas)';
const RETRY_AFTER_DAYS = 7;
const BATCH_SIZE = 40; // la API acepta hasta 50 títulos por consulta
const DOWNLOAD_CONCURRENCY = 3;
const SIZE = 96;

let running = false;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function request(url, asBuffer = false, attempt = 0) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(20000) });
  if (res.status === 429 && attempt < 4) {
    // Wikimedia pide bajar el ritmo: se espera lo que indique y se reintenta.
    const wait = Math.min(60, Number(res.headers.get('retry-after')) || 10 * (attempt + 1));
    await sleep(wait * 1000);
    return request(url, asBuffer, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return asBuffer ? Buffer.from(await res.arrayBuffer()) : res.json();
}

/**
 * Consulta a Wikipedia las miniaturas de varios artículos en una sola llamada.
 * Devuelve un Map: título pedido -> { thumbnail, pageUrl } (sin entrada si no hay foto).
 */
async function lookupThumbnails(titles) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    prop: 'pageimages|info',
    inprop: 'url',
    piprop: 'thumbnail',
    pithumbsize: '240',
    redirects: '1',
    titles: titles.join('|'),
  });
  const data = await request(`${WIKI_API}?${params}`);
  const query = data.query || {};

  const alias = new Map();
  for (const n of query.normalized || []) alias.set(n.from, n.to);
  const redirect = new Map();
  for (const r of query.redirects || []) redirect.set(r.from, r.to);
  const pagesByTitle = new Map(Object.values(query.pages || {}).map((p) => [p.title, p]));

  const result = new Map();
  for (const title of titles) {
    let t = alias.get(title) || title;
    // Puede haber redirecciones encadenadas.
    for (let i = 0; i < 3 && redirect.has(t); i += 1) t = redirect.get(t);
    const page = pagesByTitle.get(t);
    if (page && !('missing' in page) && page.thumbnail) {
      result.set(title, { thumbnail: page.thumbnail.source, pageUrl: page.canonicalurl || page.fullurl || null });
    }
  }
  return result;
}

async function saveThumbnail(breedId, sourceUrl) {
  const raw = await request(sourceUrl, true);
  const fileName = `${breedId}.jpg`;
  await sharp(raw)
    .rotate()
    .resize(SIZE, SIZE, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 72 })
    .toFile(path.join(BREEDS_DIR, fileName));
  return `/uploads/breeds/${fileName}`;
}

async function runPool(items, worker) {
  let index = 0;
  const workers = Array.from({ length: DOWNLOAD_CONCURRENCY }, async () => {
    while (index < items.length) {
      const item = items[index];
      index += 1;
      await worker(item);
    }
  });
  await Promise.all(workers);
}

/**
 * Descarga las miniaturas que falten. Se ejecuta en segundo plano al iniciar el
 * servidor, así funciona igual en cualquier PC o servidor sin subir imágenes a Git.
 * Si no hay internet, el sistema sigue andando y muestra un ícono genérico.
 */
async function syncMissingImages({ force = false } = {}) {
  if (running) return { downloaded: 0, pending: 0 };
  running = true;
  try {
    await fs.mkdir(BREEDS_DIR, { recursive: true });

    // Si alguien borró la carpeta uploads, las miniaturas se vuelven a bajar.
    const withImage = await db('breeds').whereNotNull('image_url').select('id');
    for (const row of withImage) {
      try {
        await fs.access(path.join(BREEDS_DIR, `${row.id}.jpg`));
      } catch {
        await db('breeds').where({ id: row.id }).update({ image_url: null, image_checked_at: null });
      }
    }

    const threshold = new Date(Date.now() - RETRY_AFTER_DAYS * 24 * 3600 * 1000);
    let query = db('breeds').whereNull('image_url').whereNotNull('wiki_title').select('id', 'name', 'wiki_title');
    if (!force) {
      query = query.where((b) => b.whereNull('image_checked_at').orWhere('image_checked_at', '<', threshold));
    }
    const pending = await query;
    if (pending.length === 0) return { downloaded: 0, pending: 0 };

    logger.info(`Descargando miniaturas de razas (${pending.length} pendientes)…`);
    let downloaded = 0;

    for (let i = 0; i < pending.length; i += BATCH_SIZE) {
      const batch = pending.slice(i, i + BATCH_SIZE);
      let found;
      try {
        found = await lookupThumbnails([...new Set(batch.map((b) => b.wiki_title))]);
      } catch (err) {
        // Sin internet o límite de Wikipedia: se reintenta en el próximo inicio.
        logger.warn(`No se pudieron consultar las miniaturas de razas: ${err.message}`);
        continue;
      }

      await runPool(batch, async (breed) => {
        const hit = found.get(breed.wiki_title);
        if (!hit) {
          await db('breeds').where({ id: breed.id }).update({ image_checked_at: new Date() });
          return;
        }
        try {
          const imageUrl = await saveThumbnail(breed.id, hit.thumbnail);
          await db('breeds').where({ id: breed.id }).update({
            image_url: imageUrl,
            image_source_url: hit.pageUrl,
            image_checked_at: new Date(),
          });
          downloaded += 1;
        } catch (err) {
          logger.warn(`No se pudo descargar la miniatura de "${breed.name}": ${err.message}`);
        }
      });
      await sleep(300);
    }

    logger.info(`Miniaturas de razas listas: ${downloaded} descargadas de ${pending.length}.`);
    return { downloaded, pending: pending.length };
  } finally {
    running = false;
  }
}

module.exports = { syncMissingImages };
