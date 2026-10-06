# 8. Configuración y operación

## 8.1 Requisitos

| Software | Versión mínima |
|---|---|
| Node.js | 22.12 |
| npm | 10 |
| MySQL | 8.0 (validado con 8.4) |

La versión de Node.js requerida se declara en `engines` de los `package.json` y en `.nvmrc`.

## 8.2 Variables de entorno

### Backend (`backend/.env`)

| Variable | Obligatoria | Valor por defecto | Descripción |
|---|:---:|---|---|
| `NODE_ENV` | No | `development` | Entorno. En `production`: registro `combined`, cookie `Secure` y mensajes genéricos en errores 500. |
| `PORT` | No | `4000` | Puerto HTTP. |
| `CLIENT_URL` | No | `http://localhost:5173` | Orígenes permitidos por CORS y Socket.IO, separados por coma. |
| `DB_HOST` | Sí | — | Host de MySQL. |
| `DB_PORT` | No | `3306` | Puerto de MySQL. |
| `DB_NAME` | Sí | — | Nombre de la base. |
| `DB_USER` | Sí | — | Usuario. |
| `DB_PASSWORD` | Sí | — | Contraseña. |
| `JWT_ACCESS_SECRET` | Sí | — | Secreto de firma del *access token*. |
| `JWT_REFRESH_SECRET` | Sí | — | Secreto reservado para el *refresh token*. |
| `JWT_ACCESS_EXPIRES_IN` | No | `15m` | Vigencia del *access token*. |
| `JWT_REFRESH_EXPIRES_IN_DAYS_REMEMBER` | No | `30` | Días de vigencia con "Recordarme". |
| `JWT_REFRESH_EXPIRES_IN_DAYS_SESSION` | No | `1` | Días de vigencia sin "Recordarme". |
| `LOCATION_MISMATCH_BLOCK_KM` | No | `100` | Distancia máxima tolerada entre la ciudad declarada y la geolocalización. |

El servidor no inicia si falta una variable obligatoria (`Falta la variable de entorno obligatoria: <NOMBRE>`).

### Frontend (`frontend/.env`)

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base de la API. Si no se define, `/api`. |
| `VITE_SOCKET_URL` | Origen del backend para WebSocket y archivos. Si no se define, el origen de la página. |

## 8.3 Preparación de la base de datos

```sql
CREATE DATABASE patahogar CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'patahogar_app'@'localhost' IDENTIFIED BY '<contraseña>';
CREATE USER 'patahogar_app'@'127.0.0.1' IDENTIFIED BY '<contraseña>';
GRANT ALL PRIVILEGES ON patahogar.* TO 'patahogar_app'@'localhost';
GRANT ALL PRIVILEGES ON patahogar.* TO 'patahogar_app'@'127.0.0.1';
FLUSH PRIVILEGES;
```

Luego, desde `backend/`:

```bash
npm run migrate    # crea el esquema
npm run seed       # carga especies y ciudades (solo en bases nuevas)
```

## 8.4 Modos de ejecución

| Modo | Comandos | Resultado |
|---|---|---|
| Desarrollo | `npm run dev` en `backend/` y `npm run dev` en `frontend/` | API en `:4000`, interfaz en `:5173`. |
| Integrado | `npm run build` y `npm start` en la raíz | API e interfaz en `:4000`. |
| Acceso desde la red local | `npm run dev -- --host 0.0.0.0` en `frontend/` | Interfaz accesible por IP; actualizar `CLIENT_URL`, `VITE_API_URL` y `VITE_SOCKET_URL` con la IP de la máquina. |

> En modo integrado con `NODE_ENV=production` la cookie de sesión se emite con el atributo `Secure`; sobre HTTP sin cifrar algunos navegadores no la almacenan. Para pruebas locales utilizar `NODE_ENV=development`.

## 8.5 Administración de migraciones

| Comando | Efecto |
|---|---|
| `npm run migrate` | Aplica las migraciones pendientes. |
| `npm run migrate:status` | Lista las migraciones aplicadas y pendientes. |
| `npm run migrate:rollback` | Revierte el último lote. |

Knex valida que los archivos de las migraciones ya aplicadas existan en `src/db/migrations`; no deben renombrarse ni eliminarse migraciones aplicadas.

## 8.6 Alta del primer administrador

Los administradores se designan actualizando el rol en base de datos:

```sql
UPDATE users SET role = 'admin' WHERE email = 'usuario@ejemplo.com';
```

## 8.7 Archivos subidos

El directorio `backend/uploads` se crea en tiempo de ejecución y no forma parte del control de versiones. Debe conservarse junto con la base de datos en cualquier copia de seguridad, ya que las tablas `pet_photos`, `users.profile_photo_url` y `verification_documents` referencian archivos allí almacenados.

## 8.8 Resolución de problemas

| Síntoma | Causa probable | Acción |
|---|---|---|
| `Falta la variable de entorno obligatoria: …` | Variable ausente en `backend/.env`. | Completar el archivo según `.env.example`. |
| `ECONNREFUSED` / `Can't connect to MySQL` | MySQL detenido o puerto incorrecto. | Iniciar MySQL y verificar `DB_HOST`/`DB_PORT`. |
| `Access denied for user` | Credenciales o privilegios incorrectos. | Revisar el usuario y los `GRANT`; recordar crear la cuenta para `localhost` y `127.0.0.1`. |
| La interfaz no carga datos / errores de CORS | `CLIENT_URL` no incluye el origen del navegador. | Agregar el origen (esquema, host y puerto exactos). |
| Las imágenes no se muestran | `VITE_SOCKET_URL` ausente o incorrecta en desarrollo. | Apuntar al origen del backend. |
| No se reciben mensajes ni notificaciones en vivo | WebSocket sin autenticar o `VITE_SOCKET_URL` incorrecta. | Verificar sesión iniciada y la URL del backend. |
| Las ciudades no sugieren resultados | La API Georef no responde (sin conexión). | Verificar conectividad; el sistema continúa operando sin sugerencias. |
| Las aprobaciones del cliente de escritorio no se reflejan | Backend detenido o bases de datos distintas. | Iniciar el backend y confirmar que ambos apuntan a la misma base. |
| `The migration directory is corrupt` | Falta el archivo de una migración registrada. | Restaurar el archivo de la migración correspondiente. |
