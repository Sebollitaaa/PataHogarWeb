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
  "breed": null, "size": "pequeno", "sex": "macho",
  "ageMode": "manual", "birthDate": null, "ageYears": 0, "ageMonths": 1, "ageDays": 5,
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

`distanceKm` solo se incluye en búsquedas con coordenadas. Con `ageMode = birth_date`, `ageYears/Months/Days` se recalculan en cada respuesta.

## 3.3 Autenticación — `/auth`

### `POST /auth/register` 🔓
Crea una cuenta activa.

| Campo | Tipo | Reglas |
|---|---|---|
| `firstName`, `lastName` | string | 2–100 caracteres |
| `email` | string | correo válido (se normaliza) |
| `password` | string | mínimo 8 caracteres |
| `phone` | string | `^[0-9+\s-]{6,30}$` |
| `cityGeorefId`, `cityName`, `cityProvince` | string | obligatorios |
| `cityLat`, `cityLng` | number | rangos geográficos válidos |
| `verifiedLat`, `verifiedLng` | number | opcionales |

Respuestas: `201 { message, email }` · `409` correo existente · `422` validación o discrepancia de ubicación mayor a `LOCATION_MISMATCH_BLOCK_KM`.

### `POST /auth/login` 🔓
Cuerpo: `{ email, password, rememberMe? }`.
Respuesta `200`: `{ accessToken, user }` y cookie `refresh_token`.
Errores: `401` credenciales inválidas · `403` cuenta suspendida · `429` límite de intentos.

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

## 3.5 Mascotas — `/pets`

### `GET /pets` 🔓 — búsqueda

| Parámetro | Tipo | Descripción |
|---|---|---|
| `speciesId` | int | Filtra por especie. |
| `sex` | `macho` \| `hembra` | |
| `size` | `pequeno` \| `mediano` \| `grande` | |
| `minAgeYears`, `maxAgeYears` | int ≥ 0 | Rango sobre `age_years`. |
| `isVaccinated`, `isNeutered`, `isDewormed` | `true` \| `false` | |
| `status` | enum de estado | Por defecto `disponible`. |
| `q` | string (≤ 120) | Coincidencia parcial en nombre o raza. |
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
| `breed` | opcional, ≤ 100 |
| `size` | `pequeno` \| `mediano` \| `grande` |
| `sex` | `macho` \| `hembra` |
| `ageMode` | `birth_date` \| `manual` |
| `birthDate` | ISO 8601, no futura (si `ageMode = birth_date`) |
| `ageYears` / `ageMonths` / `ageDays` | 0–40 / 0–11 / 0–364 (si `ageMode = manual`) |
| `isVaccinated`, `isNeutered`, `isDewormed` | booleanos |
| `description` | 10–3000 caracteres |
| `contactWhatsapp`, `contactEmail` | opcionales, con formato válido |
| `photos` | 1–10 archivos de imagen, máx. 8 MB c/u |

Respuesta `201`: `{ pet }`.

### `GET /pets/:id` 🔓
`{ pet }` · `404` si no existe.

### `PATCH /pets/:id` 🔐 (propietario o admin)
Acepta los mismos campos que la creación (todos opcionales, excepto fotos). Respuesta `{ pet }`.

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

## 3.7 Conversaciones — `/conversations` 🔐

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/conversations` | Conversaciones agrupadas por contraparte. |
| POST | `/conversations` | Inicia o recupera la conversación de una mascota y envía el primer mensaje. |
| GET | `/conversations/:id/messages?beforeId=` | Hasta 30 mensajes (orden cronológico); marca como leídos los recibidos y sus notificaciones. |
| POST | `/conversations/:id/messages` | Envía un mensaje. |
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

**Mensaje:** `{ id, conversationId, senderId, content, createdAt, readAt }`.

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
| `currentPassword`, `newPassword`, `confirmNewPassword` | Cambio de contraseña (mínimo 8). Revoca todas las sesiones. |
| `profilePhoto` | Imagen de perfil. |

Respuesta: `{ user, passwordChanged }`.

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
            "cityName": "…", "cityProvince": "…", "isVerifiedOrganization": true, "memberSince": "…" },
  "pets": [ pet ]
}
```

`404` si el usuario no existe o está suspendido.

## 3.10 Administración — `/admin` 🛡️

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/admin/users?q=&page=&pageSize=` | Lista usuarios (filtra por correo, nombre o apellido). |
| PATCH | `/admin/users/:id/ban` | Suspende (cuerpo opcional `{ reason }`); revoca sesiones y registra auditoría. |
| PATCH | `/admin/users/:id/unban` | Reactiva. |
| DELETE | `/admin/users/:id` | Elimina la cuenta (registra auditoría antes de borrar; limpia imágenes). |
| GET | `/admin/actions` | Registro de auditoría. |

No es posible suspender ni eliminar la propia cuenta.

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
