# Documentación técnica de PataHogar

Esta carpeta contiene la especificación técnica del sistema. Está dirigida a desarrolladores, evaluadores y cualquier persona que necesite comprender el diseño, el funcionamiento interno o los contratos de integración de la plataforma.

## Contenido

| N.º | Documento | Descripción |
|:---:|---|---|
| 1 | [Arquitectura](01-arquitectura.md) | Visión general, componentes, capas, modos de ejecución y decisiones de diseño. |
| 2 | [Base de datos](02-base-de-datos.md) | Modelo de datos, definición de tablas, relaciones, integridad y migraciones. |
| 3 | [API REST y eventos](03-api-rest.md) | Convenciones, catálogo de endpoints, contratos y eventos WebSocket. |
| 4 | [Backend](04-backend.md) | Estructura de módulos, servicios, autenticación y procesos internos. |
| 5 | [Frontend](05-frontend.md) | Estructura, enrutamiento, gestión de estado, capa de red y componentes. |
| 6 | [Seguridad](06-seguridad.md) | Controles implementados y limitaciones conocidas. |
| 7 | [Integración con el cliente de escritorio](07-integracion-cliente-escritorio.md) | Contrato de datos para la gestión de solicitudes de verificación. |
| 8 | [Configuración y operación](08-configuracion-y-operacion.md) | Variables de entorno, modos de ejecución, mantenimiento y resolución de problemas. |

## Convenciones

- Los identificadores de código (tablas, columnas, variables, rutas) se presentan en `monoespaciado` y se mantienen en su idioma original.
- Los valores de enumeración persistidos en base de datos (`pendiente`, `aprobada`, `disponible`, etc.) se documentan tal como se almacenan.
- Las fechas y horas se almacenan en UTC.
