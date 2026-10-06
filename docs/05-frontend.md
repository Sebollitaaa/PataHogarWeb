# 5. Frontend

## 5.1 Stack

| Elemento | Tecnología |
|---|---|
| Biblioteca de UI | React 19 |
| Enrutamiento | React Router 7 (`BrowserRouter`) |
| Compilación y servidor de desarrollo | Vite 8 |
| Tiempo real | socket.io-client 4 |
| Estilos | CSS propio con variables (sin framework de UI) |
| Análisis estático | Oxlint |

El frontend es una SPA sin gestor de estado externo: el estado global se implementa con tres contextos de React; el resto es estado local de componente.

## 5.2 Estructura

```
frontend/
├── index.html
├── vite.config.js
├── public/                      Favicons y logo
└── src/
    ├── main.jsx                 Montaje de la aplicación
    ├── App.jsx                  Rutas y proveedores
    ├── api/                     Capa de acceso a la API
    ├── context/                 Estado global
    ├── components/              Componentes reutilizables
    ├── pages/                   Páginas (una por ruta) y sus hojas de estilo
    ├── hooks/                   Hooks reutilizables
    ├── utils/                   Funciones auxiliares
    ├── styles/index.css         Variables de diseño y estilos base
    └── assets/                  Imágenes
```

## 5.3 Arranque y proveedores

```
main.jsx → <App>
  <BrowserRouter>
    <AuthProvider>
      <SocketProvider>
        <NotificationsProvider>
          <Routes> … <Layout> (Header + <Outlet/> + Footer)
```

El orden es significativo: `SocketProvider` depende de `AuthProvider`, y `NotificationsProvider` depende de ambos.

## 5.4 Enrutamiento

| Ruta | Página | Acceso |
|---|---|---|
| `/` | `HomePage` | Público |
| `/mascotas/:id` | `PetDetailPage` | Público |
| `/usuarios/:id` | `PublicProfilePage` | Público |
| `/ingresar` | `LoginPage` | Público |
| `/registro` | `RegisterPage` | Público |
| `/publicar` | `PublishPetPage` | Autenticado |
| `/solicitar-verificacion` | `RequestVerificationPage` | Autenticado |
| `/mascotas/:id/editar` | `EditPetPage` | Autenticado (propietario) |
| `/mis-publicaciones` | `MyListingsPage` | Autenticado |
| `/adoptadas` | `AdoptedPage` | Autenticado |
| `/favoritos` | `FavoritesPage` | Autenticado |
| `/mensajes`, `/mensajes/:conversationId` | `MessagesPage` | Autenticado |
| `/notificaciones` | `NotificationsPage` | Autenticado |
| `/perfil` | `ProfilePage` | Autenticado |
| `/admin` | `AdminPage` | Rol `admin` |
| `*` | `NotFoundPage` | Público |

`ProtectedRoute` muestra un indicador de carga mientras se restaura la sesión, redirige a `/ingresar` conservando la ubicación de origen (`state.from`) y, con `adminOnly`, redirige a `/` si el rol no es `admin`. La autorización efectiva se aplica siempre en el backend.

## 5.5 Estado global (contextos)

| Contexto | Estado expuesto | Comportamiento |
|---|---|---|
| `AuthContext` | `user`, `isAuthenticated`, `isBooting`, `login`, `logout`, `refreshUser`, `setUser` | Al montarse invoca `POST /auth/refresh` para restaurar la sesión mediante la cookie. Registra un manejador que limpia el usuario cuando la renovación falla. |
| `SocketContext` | `socket`, `connected` | Abre la conexión Socket.IO al autenticarse (con el *access token* en `auth.token`) y la cierra al cerrar sesión. |
| `NotificationsContext` | `unreadCount`, `recent` (6), `refresh`, `markRead`, `markAllRead` | Carga inicial por API; incrementa en vivo al recibir `notification:new`. |

## 5.6 Capa de red (`src/api`)

`client.js` encapsula `fetch`:

- URL base: `VITE_API_URL` o `/api`.
- El *access token* se mantiene en una variable de módulo (memoria) y se envía como `Authorization: Bearer`.
- `credentials: 'include'` para el envío de cookies.
- Ante `401` de una petición **que incluía token**, ejecuta una única renovación (`POST /auth/refresh`) y reintenta; si falla, invoca el manejador de sesión expirada. La renovación está memoizada para evitar renovaciones concurrentes. Un `401` sin token (por ejemplo, credenciales inválidas en el inicio de sesión) se propaga con el mensaje del servidor.
- Los errores se normalizan en `ApiError(status, message, details)`.
- `isForm: true` envía `FormData` sin fijar `Content-Type`.

Módulos por recurso: `auth`, `pets`, `catalog`, `favorites`, `conversations`, `notifications`, `users`, `admin`, `verificationRequests`. `origin.js` expone `API_ORIGIN` (prefijo de rutas de imágenes) y `SOCKET_URL`.

## 5.7 Páginas

| Página | Descripción |
|---|---|
| `HomePage` | Buscador con alternancia Mascotas/Personas, filtros, grilla paginada, estadísticas. Aplica por defecto la ciudad del usuario autenticado. Las búsquedas se ejecutan con *debounce* de 300 ms. |
| `PetDetailPage` | Galería, datos, contacto, favorito, gestión del propietario, moderación de administrador y formulario de mensaje inicial. |
| `PublishPetPage` / `EditPetPage` | Alta y edición de publicaciones, incluida la gestión de fotos. |
| `MyListingsPage`, `AdoptedPage`, `FavoritesPage` | Listados filtrados del usuario. |
| `MessagesPage` | Lista de conversaciones agrupadas por contraparte y hilo de mensajes con recepción en tiempo real. |
| `NotificationsPage` | Listado paginado de notificaciones. |
| `ProfilePage` | Edición de foto, teléfono, ciudad y contraseña. |
| `PublicProfilePage` | Perfil público con publicaciones e insignia de verificación. |
| `RequestVerificationPage` | Formulario de solicitud de verificación con carga múltiple de documentos. |
| `AdminPage` | Gestión de usuarios y auditoría. |
| `LoginPage`, `RegisterPage` | Autenticación. |
| `NotFoundPage` | Ruta no encontrada. |

## 5.8 Componentes

| Componente | Descripción |
|---|---|
| `layout/Layout`, `Header`, `Footer` | Estructura general; el encabezado incluye el menú de usuario y la campanita de notificaciones. |
| `PetCard` | Tarjeta de publicación. |
| `FilterSidebar` | Panel de filtros de búsqueda. |
| `CityAutocomplete` | Autocompletado de localidades (`GET /cities/search`, *debounce* de 300 ms). Valor: `{ georefId, name, province, latitude, longitude }`. |
| `PhotoPicker` | Selector de hasta 10 imágenes con vista previa. |
| `DocumentPicker` | Selector múltiple (hasta 10) con vista previa para imágenes e indicador de archivo para PDF. |
| `AgeInput` | Alterna entre fecha de nacimiento y edad manual. |
| `Avatar`, `VerifiedBadge` | Foto de perfil e insignia de verificación. |
| `ProtectedRoute` | Guardia de rutas. |
| `ui/Field`, `ui/FullPageSpinner` | Campo de formulario e indicador de carga. |
| `icons/Icons` | Íconos SVG propios. |

## 5.9 Utilidades

| Módulo | Contenido |
|---|---|
| `utils/format.js` | `formatAge`, `timeAgo`, `memberSince`, `formatDistance` y etiquetas de tamaño, sexo y estado. |
| `utils/notificationText.js` | Texto y destino de cada tipo de notificación. |
| `utils/geolocation.js` | Obtención de la ubicación del navegador; resuelve `null` ante denegación. |
| `utils/speciesIcons.jsx` | Asociación `slug` de especie → ícono. |
| `hooks/useOnClickOutside.js` | Cierre de menús al hacer clic fuera. |

## 5.10 Estilos

Los estilos base y las variables de diseño (`--color-*`, `--space-*`, `--radius-*`, `--shadow-*`) residen en `styles/index.css`; cada página y componente complejo posee su hoja de estilos propia. El diseño es responsivo mediante cuadrículas `auto-fill/minmax` y consultas de medios.

## 5.11 Variables de entorno

| Variable | Uso |
|---|---|
| `VITE_API_URL` | URL base de la API; si no se define, `/api`. |
| `VITE_SOCKET_URL` | Origen del backend para WebSocket y rutas de imágenes; si no se define, el origen de la página. |

Los valores se incorporan en tiempo de compilación.

## 5.12 Compilación

`npm run build` genera `frontend/dist`, que el backend puede servir directamente (modo integrado). Para ese modo no deben definirse las variables `VITE_*` con direcciones absolutas.
