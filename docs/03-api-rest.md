# 3. API REST y eventos WebSocket

## 3.1 Convenciones

| Aspecto | Especificación |
|---|---|
| URL base | `/api` (por ejemplo, `http://localhost:4000/api`) |
| Formato | JSON (`application/json`); `multipart/form-data` en endpoints con archivos |
| Autenticación | Cabecera `Authorization: Bearer <accessToken>` |
| Sesión | Cookie `refresh_token` (`httpOnly`, `sameSite=lax`, `path=/api/auth`) |
| Idioma de mensajes | Español |

**Leyenda de acceso:** 🔓 público · 🔐 requiere autenticación · 🛡️ requiere rol `admin`.

### Teléfonos

Todos los campos de teléfono (`phone` del registro, de `PATCH /users/me` y de la solicitud de verificación, y `contactWhatsapp` de las publicaciones) aceptan un número de Argentina escrito de cualquier forma habitual (`291 555-0103`, `0291 15 555-0103`, `+54 9 291 555 0103`…). El servidor quita el 0 de larga distancia, el 15 y los prefijos 54 / 9, exige 10 dígitos (código de área + número) y guarda siempre el mismo formato, apto para los enlaces de WhatsApp: `+54 9 291 555-0103` (o `+54 9 11 5555-0103`). Si no se puede interpretar, responde `422`.

### Formato de error

Todos los errores comparten el mismo formato:

```json
{
  "error": {
    "message": "Descripción legible del error.",
    "details": [ { "field": "description", "message": "Detalle por campo." } ]
  }
}
```

`details` solo se incluye en errores de validación.

### Códigos de estado

| Código | Significado |
|---|---|
| 200 / 201 | Operación exitosa / recurso creado. |
| 400 | Solicitud inválida por regla de negocio. |
| 401 | No autenticado, credenciales inválidas o sesión expirada. |
| 403 | Sin permisos o cuenta suspendida. |
| 404 | Recurso inexistente. |
| 409 | Conflicto (por ejemplo, correo ya registrado o solicitud pendiente existente). |
| 422 | Error de validación de datos. |
| 429 | Límite de tasa excedido. |
| 500 | Error interno. |

### Límite de tasa

| Alcance | Límite |
|---|---|
| Toda la API (`/api`) | 300 peticiones / 15 min por IP |
| `POST /auth/login` | 10 intentos fallidos / 15 min por IP (los exitosos no se contabilizan) |

### Paginación

Los endpoints paginados aceptan `page` (≥ 1) y `pageSize` y responden:

```json
{ "pagination": { "page": 1, "pageSize": 20, "total": 57, "totalPages": 3 } }
```

## 3.2 Representaciones

### Usuario (`user`)

```json
{
  "id": 1, "firstName": "Ana", "lastName": "Pérez", "email": "ana@ejemplo.com",
  "phone": "+54 9 11 1234-5678", "profilePhotoUrl": "/uploads/users/1/…-medium.jpg",
  "cityId": 4, "cityName": "Bahía Blanca", "cityProvince": "Buenos Aires",
  "role": "user", "isVerifiedOrganization": false, "createdAt": "2026-07-28T05:50:48.000Z"
}
```

### Mascota (`pet`)

```json
{
  "id": 12, "name": "Peter",
  "species": { "id": 2, "name": "Gato", "slug": "gato" },
  "breed": "Dálmata cruza con Golden Retriever",
  "breedId": 55, "crossBreedId": 69,
  "breedInfo": { "id": 55, "name": "Dálmata", "imageUrl": "/uploads/breeds/55.jpg", "isGeneric": false },
  "crossBreedInfo": { "id": 69, "name": "Golden Retriever", "imageUrl": "/uploads/breeds/69.jpg" },
  "isCrossBreed": true, "isPureBreed": false,
  "size": "pequeno", "sex": "macho",
  "ageMode": "manual", "birthDate": null, "ageYears": 0, "ageMonths": 1, "ageDays": 5,
  "ageIsApproximate": true, "ageEntered": { "years": 0, "months": 0, "days": 28, "referenceDate": "2026-10-01" },
  "isVaccinated": true, "isNeutered": false, "isDewormed": true,
  "description": "…", "status": "disponible",
  "latitude": -38.7183, "longitude": -62.2663,
  "contactWhatsapp": null, "contactEmail": null,
  "owner": { "id": 1, "firstName": "Ana", "lastName": "Pérez", "isVerifiedOrganization": false },
  "photos": [ { "id": 3, "thumbnail": "/uploads/…", "medium": "/uploads/…", "original": "/uploads/…" } ],
  "distanceKm": 12.4,
  "createdAt": "2026-09-01T12:00:00.000Z"
}
```

`breed` conserva el texto de siempre (las aplicaciones existentes no cambian); los campos `breedId`, `crossBreedId`, `breedInfo`, `crossBreedInfo`, `isCrossBreed` e `isPureBreed` son los nuevos. `distanceKm` solo se incluye en búsquedas con coordenadas. `ageYears/Months/Days` son la edad **de hoy**: con `birth_date` se calcula desde la fecha de nacimiento; con `manual`, desde lo cargado más el tiempo transcurrido desde `ageEntered.referenceDate` (y se congela al ser adoptada). `ageIsApproximate` es `true` para la edad cargada a mano (el cliente la muestra con "aprox."). `ageEntered` contiene los valores tal como se cargaron, para el formulario de edición (`null` con fecha de nacimiento).

## 3.3 Autenticación — `/auth`

### `POST /auth/register` 🔓
Crea una cuenta activa.

| Campo | Tipo | Reglas |
|---|---|---|
| `firstName`, `lastName` | string | 2–100 caracteres |
| `email` | string | correo válido (se normaliza) |
| `password` | string | 8–72 caracteres con al menos una mayúscula, una minúscula, un número y un símbolo |
| `phone` | string | Teléfono de Argentina (ver *Teléfonos*) |
| `cityGeorefId`, `cityName`, `cityProvince` | string | obligatorios |
| `cityLat`, `cityLng` | number | rangos geográficos válidos |
| `verifiedLat`, `verifiedLng` | number | opcionales |

Crea la cuenta **sin verificar** y envía un código de 6 dígitos al correo.

Respuestas: `201 { message, email, requiresVerification: true, emailSent }` · `409` correo ya registrado y verificado · `422` validación o discrepancia de ubicación mayor a `LOCATION_MISMATCH_BLOCK_KM`.

### `POST /auth/login` 🔓
Cuerpo: `{ email, password, rememberMe? }`.
Respuesta `200`: `{ accessToken, user }` y cookie `refresh_token`.
Errores: `401` credenciales inválidas · `403` cuenta suspendida, o correo sin verificar (`error.details[0].code = "email_not_verified"`) · `429` límite de intentos.

### `POST /auth/verify-email` 🔓
Cuerpo: `{ email, code, rememberMe? }` (`code`: 6 dígitos). Confirma el correo e **inicia la sesión** directamente: responde `200 { message, accessToken, user }` y emite la cookie de sesión (30 días con `rememberMe: true`, 1 día si no). Con el encabezado `X-Client: mobile` el *refresh token* viaja en el cuerpo, igual que en el login.
Errores: `400` código incorrecto, vencido o cuenta ya verificada · `429` más de 5 intentos sobre el mismo código.

### `POST /auth/resend-verification` 🔓
Cuerpo: `{ email }`. Genera y envía un código nuevo (invalida los anteriores; espera mínima de 60 s entre envíos). La respuesta es siempre genérica: no revela si el correo existe.

### `POST /auth/forgot-password` 🔓
Cuerpo: `{ email }`. Envía un código para restablecer la contraseña. Respuesta siempre genérica.

### `POST /auth/reset-password` 🔓
Cuerpo: `{ email, code, newPassword }` (la contraseña cumple la política de seguridad). Cambia la contraseña y revoca todas las sesiones. Errores: `400` código incorrecto o vencido · `422` contraseña no válida.

### `POST /auth/password-code` 🔐
Cambio de contraseña con la sesión iniciada, paso 1. Envía un código de 6 dígitos al correo de la cuenta (sin cuerpo). Respuesta: `{ message, email, emailSent }` con el correo enmascarado (`ca****@gmail.com`). `429` si se pidió otro código hace menos de `EMAIL_RESEND_COOLDOWN_SECONDS`.

### `POST /auth/change-password` 🔐
Paso 2. Cuerpo: `{ code, newPassword, confirmNewPassword }`. No requiere la contraseña actual: el código demuestra el control del correo. Cambia la contraseña, conserva la sesión actual y revoca las de los demás dispositivos. Errores: `400` código incorrecto o vencido · `422` contraseña no válida o confirmación distinta · `429` demasiados intentos.

### `POST /auth/refresh` 🔓 (requiere cookie)
Rota el *refresh token* y devuelve `{ accessToken, user }`. `401` si la cookie falta, está revocada o venció.

### `POST /auth/logout` 🔓
Revoca el *refresh token* actual y elimina la cookie. Respuesta `{ message }`.

### `GET /auth/me` 🔐
Respuesta: `{ user }`.

## 3.4 Catálogos

| Método | Ruta | Acceso | Respuesta |
|---|---|---|---|
| GET | `/cities` | 🔓 | `{ cities: [{ id, name, province, latitude, longitude }] }` |
| GET | `/cities/search?q=` | 🔓 | `{ cities: [{ georefId, name, province, latitude, longitude }] }` (mínimo 2 caracteres; consulta Georef) |
| GET | `/species` | 🔓 | `{ species: [{ id, name, slug }] }` |
| GET | `/breeds` | 🔓 | `{ breeds: [{ id, name, isGeneric, imageUrl, species: { id, name, slug } }] }` |

`GET /breeds` acepta `q` (nombre o alias, sin distinguir tildes ni mayúsculas; primero las que empiezan con el texto), `speciesId` (limita a una especie), `includeGeneric=false` (oculta "Mestizo / sin raza definida") y `limit` (1–60, por defecto 15). Sin `q` y con `speciesId` devuelve el listado alfabético de esa especie.

## 3.5 Mascotas — `/pets`

### `GET /pets` 🔓 — búsqueda

| Parámetro | Tipo | Descripción |
|---|---|---|
| `speciesId` | int | Filtra por especie. |
| `sex` | `macho` \| `hembra` | |
| `size` | `pequeno` \| `mediano` \| `grande` | |
| `minAgeYears`, `maxAgeYears` | int ≥ 0 | Rango de años cumplidos **hoy** (considera el tiempo transcurrido desde la carga). |
| `isVaccinated`, `isNeutered`, `isDewormed` | `true` \| `false` | |
| `status` | enum de estado | Por defecto `disponible`. |
| `q` | string (≤ 120) | Coincidencia parcial en nombre, raza o alias de raza ("poodle" encuentra Caniche). |
| `breedId` | int | Mascotas de esa raza, incluyendo las cruzas que la tengan como primera o segunda raza. |
| `pureBreed` | `true` | Solo pura raza: excluye cruzas, mestizos y razas escritas a mano. |
| `lat`, `lng` | number | Si se proveen, se calcula `distanceKm` y se ordena por cercanía. |
| `maxDistanceKm` | number (1–20000) | Filtra por distancia máxima (requiere `lat`/`lng`). |
| `page`, `pageSize` | int | `pageSize` máx. 60. |

Respuesta: `{ pets: [pet], pagination }`.

### `GET /pets/stats` 🔓
`{ available, adopted }`.

### `GET /pets/mine?status=` 🔐
`{ pets: [pet] }` — publicaciones del usuario autenticado.

### `POST /pets` 🔐 — `multipart/form-data`

| Campo | Reglas |
|---|---|
| `speciesId` | int ≥ 1 |
| `name` | 1–100 caracteres |
| `breedId` | opcional, int. Raza del catálogo; debe corresponder a `speciesId` (`422` si no). |
| `crossBreedId` | opcional, int. Segunda raza de una cruza; requiere `breedId`, debe ser distinta y de la misma especie, y ninguna de las dos puede ser "Mestizo". |
| `breed` | opcional, ≤ 100. Texto libre (raza fuera del catálogo); se ignora si se envía `breedId`. Si coincide con el catálogo se vincula solo. |
| `size` | `pequeno` \| `mediano` \| `grande` |
| `sex` | `macho` \| `hembra` |
| `ageMode` | `birth_date` \| `manual` |
| `birthDate` | ISO 8601, no futura (si `ageMode = birth_date`) |
| `ageYears` / `ageMonths` / `ageDays` | 0–40 / 0–11 / 0–364 (si `ageMode = manual`). Pueden quedar vacíos (cuentan como 0), pero no los tres ni todos en 0 (`422`). |
| `isVaccinated`, `isNeutered`, `isDewormed` | booleanos |
| `description` | 10–3000 caracteres |
| `contactWhatsapp`, `contactEmail` | opcionales, con formato válido |
| `photos` | 1–10 archivos de imagen, máx. 8 MB c/u |

Respuesta `201`: `{ pet }`.

### `GET /pets/:id` 🔓
`{ pet }` · `404` si no existe.

### `PATCH /pets/:id` 🔐 (propietario o admin)
Acepta los mismos campos que la creación (todos opcionales, excepto fotos). Si se envía alguno de `breed`, `breedId` o `crossBreedId` se recalcula la raza completa; si cambia `speciesId` sin indicar raza, la raza anterior se descarta. Respuesta `{ pet }`.

### `PATCH /pets/:id/status` 🔐
Cuerpo `{ status }`.
- Propietario o admin: `disponible`, `en_proceso`, `adoptada`.
- Solo admin: `desactualizada` (notifica al propietario y registra auditoría).
- Al pasar a `adoptada` se notifica a los usuarios que la marcaron como favorita.

### `DELETE /pets/:id` 🔐 (propietario o admin)
Elimina la publicación y sus imágenes. Si la ejecuta un admin sobre una publicación ajena, notifica al propietario y registra auditoría.

### `POST /pets/:id/photos` 🔐 (propietario o admin)
`multipart/form-data` con `photos`. El total no puede superar 10. Respuesta `201 { photos }`.

### `DELETE /pets/:id/photos/:photoId` 🔐 (propietario o admin)
`422` si es la única foto restante.

## 3.6 Favoritos — `/favorites` 🔐

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/favorites` | `{ pets: [pet] }` |
| POST | `/favorites/:petId` | `201 { message }` (idempotente) |
| DELETE | `/favorites/:petId` | `{ message }` |

### Seguimiento de perfiles verificados — `/follows` 🔐

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/follows` | `{ profiles: [{ id, firstName, lastName, profilePhotoUrl, isVerifiedOrganization, cityName, cityProvince, availablePets }] }` |
| GET | `/follows/ids` | `{ ids: [int] }` — identificadores de los perfiles seguidos |
| POST | `/follows/:userId` | `201 { message, followersCount }` (idempotente) · `422` si es el propio usuario o la cuenta no está verificada · `404` si no existe |
| DELETE | `/follows/:userId` | `{ message, followersCount }` |

Cuando un perfil verificado publica una mascota, sus seguidores reciben una notificación `followed_new_pet`.

## 3.7 Conversaciones — `/conversations` 🔐

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/conversations` | Conversaciones agrupadas por contraparte. |
| POST | `/conversations` | Inicia o recupera la conversación de una mascota y envía el primer mensaje. |
| GET | `/conversations/:id/messages?beforeId=` | Hasta 30 mensajes (orden cronológico); marca como leídos los recibidos y sus notificaciones. |
| POST | `/conversations/:id/messages` | Envía un mensaje de texto, con fotos, o ambos (ver abajo). |
| GET | `/conversations/attachments/:attachmentId/:variant` | Foto del chat (`variant`: `thumb` \| `medium`). Solo la ven quienes participan de la conversación. |
| POST | `/conversations/messages/:messageId/report` | Reporta un mensaje recibido. |
| PATCH | `/conversations/:id/archive` | Archiva o desarchiva para el usuario autenticado. |
| DELETE | `/conversations/:id` | Eliminación lógica para el usuario autenticado. |

**`POST /conversations`** — cuerpo `{ petId, content }` (contenido 1–2000). Respuesta `201 { conversationId, message }`. `400` si la mascota pertenece al solicitante; `404` si no existe.

**`GET /conversations`** — respuesta:

```json
{
  "conversations": [{
    "counterpart": { "id": 5, "firstName": "…", "lastName": "…", "profilePhotoUrl": null, "isVerifiedOrganization": false },
    "chats": [{
      "conversationId": 9, "petId": 12, "petName": "Peter", "petStatus": "disponible",
      "archived": false, "lastMessageAt": "…", "lastMessagePreview": "…", "unreadCount": 2
    }]
  }]
}
```

**`POST /conversations/:id/messages`** — acepta JSON `{ content }` o `multipart/form-data` con `content` (opcional, hasta 2000 caracteres) y hasta **5 fotos** en el campo `photos` (JPG, PNG, WebP o GIF, máx. 8 MB c/u). Debe llevar texto, fotos o ambos. Las imágenes se validan por su contenido real, se reencodean a JPEG (miniatura de 360 px y versión de 1280 px) y se les quitan los metadatos EXIF. Errores: `422` mensaje vacío, archivo que no es una imagen o más de 5 fotos · `413` imagen demasiado pesada · `403` no participa de la conversación.

**Mensaje:** `{ id, conversationId, senderId, content, attachments: [{ id, width, height }], removed, createdAt, readAt }`. Si `removed` es `true`, `content` es `null` y `attachments` está vacío.

**Fotos:** no tienen URL pública. Se piden a `GET /conversations/attachments/:attachmentId/:variant` con el token de sesión (el cliente las descarga y las muestra como *blob*). `404` si el solicitante no participa de la conversación o la foto fue retirada; un moderador solo accede a fotos de mensajes que tengan un reporte.

**`POST /conversations/messages/:messageId/report`** — cuerpo `{ reason: inapropiado | spam | acoso | otro, comment? (≤ 500) }`. `201` · `422` si es un mensaje propio o ya retirado · `404` si no participa de la conversación. Reportar dos veces el mismo mensaje no genera duplicados.

**`PATCH …/archive`** — cuerpo `{ archived: boolean }`.

## 3.8 Notificaciones — `/notifications` 🔐

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/notifications?page=&pageSize=` | `{ notifications: [{ id, type, payload, isRead, createdAt }], pagination }` |
| GET | `/notifications/unread-count` | `{ count }` |
| PATCH | `/notifications/read-all` | `{ message }` |
| PATCH | `/notifications/:id/read` | `{ message }` (`404` si no pertenece al usuario) |

## 3.9 Usuarios — `/users`

### `PATCH /users/me` 🔐 — `multipart/form-data`
Todos los campos son opcionales.

| Campo | Descripción |
|---|---|
| `phone` | Nuevo teléfono. |
| `cityGeorefId`, `cityName`, `cityProvince`, `cityLat`, `cityLng` | Nueva localidad (se valida contra `verifiedLat`/`verifiedLng` si se envían). |
| `profilePhoto` | Imagen de perfil. |

Respuesta: `{ user }`. La contraseña ya no se cambia por esta ruta: ver `POST /auth/password-code` y `POST /auth/change-password`.

### `GET /users/search?q=` 🔓
Devuelve únicamente usuarios activos con `is_verified_organization = 1` cuyo nombre, apellido o nombre completo contenga `q` (mínimo 2 caracteres; máximo 20 resultados; sin distinción de mayúsculas).

```json
{ "users": [{ "id": 3, "firstName": "…", "lastName": "…", "profilePhotoUrl": null, "isVerifiedOrganization": true }] }
```

### `GET /users/:id` 🔓
Perfil público (sin correo ni teléfono):

```json
{
  "user": { "id": 3, "firstName": "…", "lastName": "…", "profilePhotoUrl": null,
            "cityName": "…", "cityProvince": "…", "isVerifiedOrganization": true, "memberSince": "…", "followersCount": 12 },
  "pets": [ pet ]
}
```

`followersCount` solo se informa para perfiles verificados (`null` en el resto). `404` si el usuario no existe o está suspendido.

## 3.10 Administración — `/admin` 🛡️

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/admin/users?q=&page=&pageSize=` | Lista usuarios (filtra por correo, nombre o apellido). |
| PATCH | `/admin/users/:id/ban` | Suspende (cuerpo opcional `{ reason }`); revoca sesiones y registra auditoría. |
| PATCH | `/admin/users/:id/unban` | Reactiva. |
| DELETE | `/admin/users/:id` | Elimina la cuenta (registra auditoría antes de borrar; limpia imágenes). |
| GET | `/admin/actions` | Registro de auditoría. |

No es posible suspender ni eliminar la propia cuenta.

### Moderación de reportes

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/admin/reports?status=` | Reportes de mensajes (`pendiente` por defecto) con el texto, las fotos, el autor y quien reportó. |
| POST | `/admin/reports/:id/resolve` | Cuerpo `{ action: remove \| dismiss, note? }`. `remove` retira el mensaje (borra texto y fotos, avisa al autor y deja constancia en la auditoría); `dismiss` descarta el reporte. En ambos casos se cierran todos los reportes pendientes de ese mensaje. |

Para sancionar al autor se usa el endpoint de suspensión de usuarios existente.

## 3.11 Solicitudes de verificación — `/verification-requests`

### `POST /verification-requests` 🔐 — `multipart/form-data`

| Campo | Reglas |
|---|---|
| `organizationName` | 2–150 caracteres |
| `organizationType` | `refugio` \| `veterinaria` \| `asociacion` |
| `responsibleName` | 2–150 caracteres |
| `email` | correo válido |
| `phone` | `^[0-9+\s-]{6,30}$` |
| `address` | 5–255 caracteres |
| `city`, `province` | 2–120 caracteres |
| `yearsInOperation` | entero 0–200 |
| `animalsHoused` | entero 0–100000 |
| `website` | opcional, ≤ 255 |
| `description` | 20–3000 caracteres |
| `statute`, `responsibleId`, `municipalPermit`, `facilityPhotos` | 1–10 archivos cada uno (PDF, JPEG, PNG o WEBP; máx. 10 MB c/u). **Los cuatro campos son obligatorios.** |

Respuestas: `201 { message }` · `400` falta algún tipo de documento · `409` existe una solicitud `pendiente` del usuario · `422` validación.

## 3.12 Salud

`GET /health` 🔓 → `{ status: "ok", timestamp }`.

## 3.13 Eventos WebSocket (Socket.IO)

**Conexión:** `io(url, { auth: { token: "<accessToken>" } })`. Un token ausente o inválido rechaza la conexión. Cada socket autenticado se une a la sala `user:<id>`.

| Dirección | Evento | Carga útil | Descripción |
|---|---|---|---|
| Cliente → servidor | `message:send` | `{ conversationId, content }` + *ack* `{ ok, message?, error? }` | Envía un mensaje (equivalente a `POST /conversations/:id/messages`). |
| Servidor → cliente | `message:new` | `{ conversationId, message }` | Entregado al remitente y al destinatario. |
| Servidor → cliente | `notification:new` | `{ id, type, payload, isRead, createdAt }` | Nueva notificación del usuario. |
