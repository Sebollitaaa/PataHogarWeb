# 4. Backend

## 4.1 Estructura de módulos

```
backend/
├── knexfile.js                  Reexporta src/config/knexfile.js (CLI de Knex)
├── ecosystem.config.js          Configuración opcional de PM2
└── src/
    ├── server.js                Punto de entrada
    ├── app.js                   Aplicación Express
    ├── config/
    │   ├── env.js               Carga y validación de variables de entorno
    │   └── knexfile.js          Configuración de Knex
    ├── db/
    │   ├── knex.js              Instancia única de Knex
    │   ├── migrations/          Esquema versionado
    │   └── seeds/               Datos iniciales
    ├── routes/                  Definición de rutas
    ├── validators/              Reglas de validación
    ├── controllers/             Casos de uso
    ├── models/                  Repositorios
    ├── services/                Lógica transversal
    ├── middleware/              Cadena de middlewares
    ├── sockets/                 Servidor WebSocket
    └── utils/                   Utilidades
```

## 4.2 Arranque

`server.js` realiza, en orden:

1. Crea el servidor HTTP a partir de la aplicación Express.
2. Inicializa Socket.IO sobre el mismo servidor y registra la instancia (`app.set('io', io)`) para que los controladores puedan emitir eventos.
3. Inicia la tarea periódica de sincronización de verificaciones.
4. Escucha en `PORT`.
5. Registra manejadores de `unhandledRejection` y `uncaughtException` (este último finaliza el proceso).

`config/env.js` carga `.env` con `dotenv` y lanza un error al inicio si falta una variable obligatoria (`DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`).

## 4.3 Aplicación Express (`app.js`)

Orden de middlewares:

1. `trust proxy` = 1.
2. `helmet()`.
3. `cors({ origin: CLIENT_URL, credentials: true })`.
4. `compression()`.
5. Parsers `express.json` y `express.urlencoded` (límite 2 MB).
6. `cookie-parser`.
7. `morgan` (`dev` o `combined` según el entorno).
8. `/uploads`: archivos estáticos, con `Cross-Origin-Resource-Policy: cross-origin`.
9. `/api`: límite de tasa general y enrutador principal.
10. Archivos estáticos de `frontend/dist`.
11. `notFoundHandler` para `/api`.
12. *Fallback* a `frontend/dist/index.html` para peticiones `GET` restantes (rutas del cliente).
13. `errorHandler` global.

## 4.4 Autenticación y autorización

### Tokens

| Token | Formato | Vigencia | Almacenamiento |
|---|---|---|---|
| *Access token* | JWT (`{ sub, role }`, HS256) | `JWT_ACCESS_EXPIRES_IN` (15 min) | Memoria del cliente |
| *Refresh token* | 64 bytes aleatorios (hex) | 30 días (*remember*) o 1 día | Cookie `httpOnly`; hash SHA-256 en `refresh_tokens` |

La cookie se emite con `httpOnly`, `sameSite=lax`, `path=/api/auth` y `secure` cuando `NODE_ENV=production`.

### Flujo

1. `POST /auth/login`: verifica el hash bcrypt, rechaza cuentas suspendidas, emite ambos tokens y registra el hash del *refresh token* junto con `user_agent` e IP.
2. `POST /auth/refresh`: localiza el hash entre los tokens activos (no revocados ni vencidos), lo **revoca**, y emite un nuevo par (rotación). La modalidad *remember* se infiere de la diferencia entre `expires_at` y `created_at` (> 2 días).
3. `POST /auth/logout`: revoca el token vigente.
4. Cambio de contraseña o suspensión: revoca todos los *refresh tokens* del usuario.

### Middleware

- `requireAuth`: valida el JWT y **consulta el usuario en base de datos** en cada petición; rechaza (`401`) si no existe o está suspendido. Inyecta `req.user = { id, role }`.
- `requireRole(...roles)`: `403` si el rol no está permitido.

## 4.5 Servicios

| Servicio | Responsabilidad |
|---|---|
| `tokenService` | Firma y verificación de JWT; generación y *hashing* de *refresh tokens*. |
| `chatService` | `sendMessage` y `startConversation`. Punto único de envío de mensajes (REST y WebSocket). |
| `notificationService` | Persiste una notificación y la emite como `notification:new` a la sala del destinatario. |
| `imageService` | Procesamiento de imágenes con Sharp y eliminación de directorios de entidad. |
| `documentService` | Almacenamiento sin transformación de documentos de verificación. |
| `locationService` | Resolución de la ubicación de un usuario y validación de coherencia con la ciudad. |
| `georefService` | Cliente de la API Georef con tiempo de espera de 5 s; ante error devuelve lista vacía. |
| `verificationSyncService` | Tarea periódica de sincronización de solicitudes de verificación. |

### `chatService.sendMessage`

1. Valida el contenido (1–2000 caracteres tras `trim`).
2. Verifica que la conversación exista y que el remitente sea participante.
3. Persiste el mensaje y actualiza `last_message_at`.
4. "Revive" la conversación para el destinatario (restablece `archived_by_*` y `deleted_by_*`).
5. Crea la notificación: `new_message_on_your_pet` si el destinatario es el propietario de la mascota; en caso contrario, `reply_to_inquiry`.
6. Emite `message:new` a las salas del destinatario y del remitente.

### `chatService.startConversation`

Rechaza (`400`) conversaciones sobre publicaciones propias, ubica o crea la conversación normalizando el par de usuarios, la reactiva para el iniciador y, si hay contenido, delega en `sendMessage`.

## 4.6 Procesamiento de imágenes

`imageService.processImage(buffer, namespace, entityId)` genera tres variantes JPEG, aplicando corrección de orientación EXIF:

| Variante | Dimensiones | Calidad | Ajuste |
|---|---|---|---|
| `thumbnail` | 320 × 320 | 75 | `cover` |
| `medium` | ancho 800 | 80 | `inside`, sin ampliar |
| `original` | ancho 1600 | 85 | `inside`, sin ampliar |

Los archivos se nombran `<uuid>-<variante>.jpg` y se almacenan en `uploads/<namespace>/<entityId>/`. Se devuelven rutas relativas servidas bajo `/uploads`.

Límites de carga (Multer, almacenamiento en memoria):

| Middleware | Tipos | Tamaño | Cantidad |
|---|---|---|---|
| `upload` | `image/*` | 8 MB | 10 |
| `uploadDocuments` | PDF, JPEG, PNG, WEBP | 10 MB | 40 (hasta 10 por campo) |

## 4.7 Almacenamiento de archivos

| Directorio | Contenido |
|---|---|
| `uploads/pets/<petId>/` | Variantes de las fotos de la publicación. |
| `uploads/users/<userId>/` | Foto de perfil (se utiliza la variante `medium`). |
| `uploads/verification-documents/<requestId>/` | Documentos de verificación, nombrados `<tipo>-<uuid>.<ext>`. |

La eliminación de una publicación borra su directorio; la eliminación de un usuario borra los directorios de sus publicaciones. La limpieza de `uploads/users/<id>` y `uploads/verification-documents/<id>` no está automatizada.

## 4.8 Búsqueda de mascotas

`petRepository.search` construye una consulta sobre `pets` (con `JOIN` a `species` y `users`) aplicando los filtros recibidos. Si se proveen `lat` y `lng`, añade la columna calculada:

```sql
6371 * ACOS(LEAST(1,
  COS(RADIANS(:lat)) * COS(RADIANS(pets.latitude)) *
  COS(RADIANS(pets.longitude) - RADIANS(:lng)) +
  SIN(RADIANS(:lat)) * SIN(RADIANS(pets.latitude))
)) AS distance_km
```

filtra con `HAVING distance_km <= :maxDistanceKm` y ordena por `distance_km ASC`; sin coordenadas, ordena por `created_at DESC`. El total se obtiene con una subconsulta `COUNT`.

## 4.9 Ubicación del usuario

`locationService.resolveUserLocation(city, verifiedLat, verifiedLng)`:

- Sin coordenadas: `location_source = city_only`; se usa el centroide de la ciudad.
- Con coordenadas: calcula la distancia de Haversine entre ambas; si supera `LOCATION_MISMATCH_BLOCK_KM`, responde `422`; en caso contrario `location_source = geolocation`.

`getEffectiveUserLocation(user)` devuelve las coordenadas verificadas si existen y, en su defecto, las de la ciudad. Es la ubicación que se copia a `pets.latitude/longitude` al publicar.

## 4.10 Edad

`utils/age.computeAgeFromBirthDate` calcula años, meses y días calendario completos entre la fecha de nacimiento y la fecha actual. Para publicaciones con `age_mode = birth_date`, `serializePet` recalcula la edad en cada respuesta.

## 4.11 Notificaciones

Los tipos y su disparador:

| Tipo | Disparador |
|---|---|
| `new_message_on_your_pet`, `reply_to_inquiry` | Envío de un mensaje. |
| `pet_favorited_adopted` | Cambio de estado a `adoptada` (a cada usuario que la marcó como favorita). |
| `post_deleted_by_admin` | Eliminación o marcado como `desactualizada` por un administrador. |
| `verification_approved`, `verification_rejected` | Procesamiento de una solicitud resuelta (ver 4.12). |

`notificationRepository.markReadByConversation` marca como leídas las notificaciones de una conversación consultando `payload.conversationId` mediante `JSON_EXTRACT`.

## 4.12 Sincronización de verificaciones

`verificationSyncService.startVerificationSync(io)` ejecuta `processResolvedRequests` inmediatamente y luego cada 15 s:

1. Selecciona `verification_requests` con `status IN ('aprobada','rechazada')` y `user_notified_at IS NULL`.
2. Si `aprobada`: establece `users.is_verified_organization = 1` y crea la notificación `verification_approved`.
3. Si `rechazada`: crea la notificación `verification_rejected` con el motivo.
4. Establece `user_notified_at` para evitar reprocesamiento.

Los errores se registran y no interrumpen el ciclo siguiente.

## 4.13 Manejo de errores y registro

- `ApiError(statusCode, message, details?)` modela errores de dominio.
- `validate` convierte los errores de express-validator en `ApiError(422, 'Datos inválidos.', details)`.
- `errorHandler` serializa todo error con el formato uniforme. Los errores no controlados (`500`) se registran; en producción el mensaje devuelto es genérico.
- `utils/logger` escribe en consola con marca de tiempo (`INFO`, `WARN`, `ERROR`).

## 4.14 Proceso persistente (opcional)

`ecosystem.config.js` define un proceso PM2 (`patahogar-backend`): modo `fork`, una instancia, reinicio automático (máx. 10, con 2 s de espera), límite de memoria de 400 MB y salida de registros en `backend/logs`.
