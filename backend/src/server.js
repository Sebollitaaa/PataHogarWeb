const http = require('http');
const app = require('./app');
const initSockets = require('./sockets');
const env = require('./config/env');
const logger = require('./utils/logger');
const { startVerificationSync } = require('./services/verificationSyncService');
const { syncCatalog } = require('./services/breedCatalogService');
const { syncMissingImages } = require('./services/breedImageService');

const httpServer = http.createServer(app);
const io = initSockets(httpServer);
app.set('io', io);
startVerificationSync(io);

// Catálogo de razas: se sincroniza con el archivo de datos y se descargan las
// miniaturas que falten, en segundo plano (no demora el arranque).
syncCatalog()
  .then(() => syncMissingImages())
  .catch((err) => logger.error('No se pudo sincronizar el catálogo de razas:', err));

httpServer.listen(env.port, () => {
  logger.info(`PataHogar backend escuchando en el puerto ${env.port} (${env.nodeEnv})`);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});
