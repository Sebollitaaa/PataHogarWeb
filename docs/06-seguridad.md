# 6. Seguridad

## 6.1 Controles implementados

| Área | Control |
|---|---|
| Credenciales | Contraseñas con bcrypt (12 rondas); nunca se persisten ni se registran en claro. |
| Sesiones | *Access token* JWT de 15 minutos mantenido solo en memoria; *refresh token* aleatorio de 64 bytes, persistido como hash SHA-256 y entregado en cookie `httpOnly` (`secure` en producción, `sameSite=lax`, `path=/api/auth`). |
| Rotación | Cada renovación revoca el *refresh token* utilizado y emite uno nuevo. |
| Revocación | El cambio de contraseña y la suspensión revocan todas las sesiones del usuario. |
| Estado de cuenta | `requireAuth` consulta la base de datos en cada petición: una cuenta suspendida o eliminada pierde acceso de inmediato. |
| Autorización | Verificación de rol en servidor (`requireRole`) y de propiedad del recurso (`assertOwnerOrAdmin`). |
| Inyección SQL | Consultas parametrizadas mediante Knex; los fragmentos SQL crudos usan parámetros enlazados. |
| Validación | Toda entrada se valida con express-validator antes de llegar al controlador. |
| Cabeceras | Helmet (CSP, HSTS, `X-Content-Type-Options`, entre otras). |
| CORS | Restringido a los orígenes de `CLIENT_URL`, con credenciales. |
| Fuerza bruta y abuso | Límite general de 300 peticiones / 15 min y límite de 10 intentos fallidos de inicio de sesión / 15 min por IP. |
| Carga de archivos | Límite de tamaño y de cantidad, filtrado por tipo MIME, almacenamiento con nombres aleatorios (UUID). |
| Enumeración de cuentas | Los mensajes de error del inicio de sesión no distinguen entre correo inexistente y contraseña incorrecta. |
| Privacidad de perfiles | El perfil público no expone correo ni teléfono. |
| Auditoría | Las acciones de moderación quedan registradas en `admin_actions`. |
| Secretos | Las credenciales residen en variables de entorno (`.env`), excluidas del control de versiones. |

## 6.2 Consideraciones de despliegue

- Definir `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET` con valores aleatorios de al menos 48 bytes, distintos entre sí.
- Utilizar HTTPS y `NODE_ENV=production` para que la cookie de sesión se emita con el atributo `Secure`.
- Utilizar un usuario de base de datos con privilegios limitados a la base `patahogar`.
- Configurar `CLIENT_URL` únicamente con los orígenes legítimos.

## 6.3 Limitaciones conocidas y trabajo futuro

| Tema | Descripción | Mejora sugerida |
|---|---|---|
| Acceso a documentos de verificación | El directorio `uploads` se sirve como contenido estático, incluida la subcarpeta `verification-documents`. Los nombres de archivo no son predecibles (UUID), pero el acceso no requiere autenticación. | Excluir esa subcarpeta del servicio estático y exponerla, si fuera necesario, mediante un endpoint autenticado. El cliente de escritorio accede por ruta de sistema de archivos y no se ve afectado. |
| Datos huérfanos en disco | La eliminación de una cuenta no borra `uploads/users/<id>` ni `uploads/verification-documents/<id>`. | Incorporar la limpieza al flujo de eliminación. |
| Reconexión de WebSocket | El *access token* se envía solo al conectar; una reconexión con un token vencido es rechazada hasta recargar la aplicación. | Renovar el token antes de reconectar. |
| Recuperación de contraseña | No existe un mecanismo de restablecimiento de contraseña. | Implementar un flujo mediante enlace de un solo uso. |
| Pruebas automatizadas | No hay pruebas unitarias ni de integración. | Incorporar pruebas sobre servicios y endpoints críticos. |
| Protección CSRF | No se utiliza *token* CSRF dedicado; se mitiga con `sameSite=lax` y autenticación por cabecera `Authorization`. | Evaluar *tokens* CSRF si se amplían los endpoints basados en cookie. |
