# Orbidi Ticketing System

Sistema de ticketing colaborativo full-stack desarrollado como prueba técnica para Orbidi.

Permite crear, gestionar y dar seguimiento a incidencias o tareas con autenticación vía Google, vista lista y Kanban con drag & drop, comentarios, adjuntos y notificaciones in-app.

## Stack

- **Backend**: FastAPI + SQLAlchemy 2.0 + PostgreSQL 16 + Alembic
- **Frontend**: Next.js 16 (App Router) + TypeScript + TanStack Query + Tailwind v4 + shadcn/ui (Radix) + dnd-kit
- **Auth**: Google OAuth 2.0 (Auth.js v5 en frontend + JWT propio firmado por el backend)
- **Infra**: Docker Compose (Postgres + backend + frontend en una sola orquestación)
- **Tests**: pytest con SQLite en memoria


## Decisiones técnicas tomadas hasta ahora

- **FastAPI síncrono con SQLAlchemy 2.0**: usamos sesiones síncronas porque la prueba no requiere alto rendimiento y simplifica el código. La capa de acceso a datos está aislada para poder migrar a async sin tocar endpoints si fuera necesario.
- **Auth en dos pasos**: el frontend obtiene un `id_token` de Google y lo intercambia en el backend por un JWT propio. Esto permite que el resto de la API sea agnóstica al proveedor OAuth y simplifica el manejo de sesión.
- **`TIMESTAMPTZ` en Postgres**: todas las columnas de fecha guardan zona horaria explícita (`datetime.now(timezone.utc)`) para evitar ambigüedades con datetimes naive.
- **Enums nativos de Postgres** para `ticket_status`, `ticket_priority` y `notification_type`: integridad a nivel de BD sin depender solo de validación en Python.
- **Migraciones con Alembic desde el primer día**, una por entrega lógica. No se editan migraciones ya aplicadas.
- **Auth.js v5 (NextAuth) en el frontend**: gestiona el login con Google y la sesión. En el callback `jwt` se intercambia el `id_token` de Google por el JWT propio del backend, y se guarda en la sesión. Así el resto de la app llama a la API con un único token estable.
- **TanStack Query** para fetching y caché. Las mutaciones invalidan la query `["tickets"]` para que las dos vistas (lista, próximamente Kanban) compartan estado y se refresquen al instante.
- **Variables de entorno por contexto**: `NEXT_PUBLIC_API_URL` para el navegador (`http://localhost:8000`) e `INTERNAL_API_URL` para llamadas server-side desde dentro del contenedor (`http://backend:8000`). Sin esta separación el callback `jwt` no podía hablar con el backend.
- **shadcn/ui sobre Radix**: componentes accesibles, con estilos en CSS variables, sin acoplamiento a un sistema de diseño cerrado.
- **Lista y Kanban comparten estado**: ambas vistas consumen la misma query `["tickets", filters]` de TanStack Query. Cambiar el estado de un ticket desde cualquier vista (drag & drop en Kanban o select en el detalle) invalida la query y refresca todo automáticamente.
- **Drag & drop con `dnd-kit`**: elegido sobre `react-beautiful-dnd` porque este último está discontinuado. Se usa `pointerWithin` como detección de colisión y `activationConstraint: { distance: 5 }` para distinguir click (abrir detalle) de drag.
- **Optimistic update al cambiar columna**: el cambio de estado se aplica primero a la caché de TanStack Query y luego al backend; si la petición falla, se revierte y se notifica al usuario. Da una experiencia inmediata sin pagar el round-trip.
- **Detalle del ticket en dialog modal**: en lugar de una ruta `/tickets/[id]` propia, el detalle se muestra en un Dialog superpuesto. Permite mantener el contexto (lista o Kanban detrás) y simplifica navegación.
- **Hooks centralizados en `lib/hooks.ts`**: queries y mutaciones se exponen como hooks (`useTickets`, `useTicket`, `useUpdateTicket`, `useUsers`, `useComments`, `useCreateComment`). Evita repetir lógica de fetching y centraliza la invalidación de caché.

## Cómo levantar el proyecto

### Requisitos

- **Docker** y **Docker Compose** (probado en Docker Desktop 4.x).
- **Cuenta de Google** con credenciales OAuth 2.0 creadas en Google Cloud Console (tipo "Web application").

### 1. Clona el repositorio

```bash
git clone https://github.com/<tu-usuario>/<repo>.git
cd <repo>
```

### 2. Configura credenciales de Google OAuth

En [Google Cloud Console](https://console.cloud.google.com/):

1. Crea un proyecto nuevo.
2. Configura el "OAuth consent screen" (External, modo Testing). Añade tu cuenta de Google a la lista de "Test users".
3. Crea credenciales OAuth client ID, tipo "Web application":
   - **Authorized JavaScript origins**: `http://localhost:3000`
   - **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback/google`
4. Copia el `Client ID` y `Client secret`.

### 3. Configura las variables de entorno

```bash
cp .env.example .env
```

Edita `.env` y rellena:

- `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` con los valores de Google.
- `JWT_SECRET` con un valor aleatorio largo. Generar con:
```bash
  python3 -c "import secrets; print(secrets.token_urlsafe(64))"
```
- `NEXTAUTH_SECRET` con otro valor aleatorio:
```bash
  python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 4. Arranca todo

```bash
docker compose up --build
```

La primera vez tarda unos minutos (descarga imágenes, construye, instala dependencias).

Espera a ver:
- `backend-1 | INFO: Application startup complete.`
- `frontend-1 | ✓ Ready in ...`

### 5. Aplica las migraciones

En otra terminal, en la misma carpeta:

```bash
docker compose exec backend alembic upgrade head
```

### 6. Abre la app

[http://localhost:3000](http://localhost:3000)

Te redirigirá a `/login`. Click en "Continuar con Google" y logéate con la cuenta que añadiste como "Test user" en Google Cloud.

## URLs útiles

| URL | Descripción |
|---|---|
| http://localhost:3000 | Aplicación web |
| http://localhost:8000/health | Healthcheck del backend |
| http://localhost:8000/docs | Swagger UI con todos los endpoints |

## Probar el flujo de auth sin frontend

1. Obtén un `id_token` real desde el [OAuth Playground](https://developers.google.com/oauthplayground/) usando tus propias credenciales y los scopes `openid email profile`. (Recuerda añadir `https://developers.google.com/oauthplayground` como redirect URI autorizada en Google Cloud Console.)
2. Intercámbialo por un JWT propio:

```bash
   curl -X POST http://localhost:8000/api/v1/auth/google \
     -H "Content-Type: application/json" \
     -d '{"id_token": "eyJ..."}'
```

3. Usa el `access_token` devuelto para llamar al endpoint protegido:

```bash
   curl http://localhost:8000/api/v1/auth/me \
     -H "Authorization: Bearer <access_token>"
```

## Endpoints disponibles

| Método | Ruta                            | Descripción                              | Auth |
|--------|---------------------------------|------------------------------------------|------|
| GET    | `/health`                       | Healthcheck                              | -    |
| POST   | `/api/v1/auth/google`           | Login con id_token de Google → JWT propio | -   |
| GET    | `/api/v1/auth/me`               | Datos del usuario autenticado            | ✓    |
| GET    | `/api/v1/tickets`               | Lista con filtros, orden y paginación    | ✓    |
| POST   | `/api/v1/tickets`               | Crear ticket                             | ✓    |
| GET    | `/api/v1/tickets/{id}`          | Detalle de ticket                        | ✓    |
| PATCH  | `/api/v1/tickets/{id}`          | Actualizar ticket parcialmente           | ✓    |
| GET    | `/api/v1/tickets/{id}/comments` | Listar comentarios de un ticket          | ✓    |
| POST   | `/api/v1/tickets/{id}/comments` | Añadir comentario                        | ✓    |
| GET    | `/api/v1/users`                 | Lista de usuarios                        | ✓    |
| POST   | `/api/v1/chat`                  | Asistente IA conversacional              | ✓    |

Documentación interactiva (Swagger UI): http://localhost:8000/docs

## Tests

```bash
docker compose exec backend pytest -v
```

Los tests usan SQLite en memoria, así que no afectan a la BD de desarrollo.

## Variables de entorno

| Variable               | Descripción                                  | Por defecto                |
|------------------------|----------------------------------------------|----------------------------|
| `DATABASE_URL`         | Conexión a Postgres                          | configurada en compose     |
| `JWT_SECRET`           | Clave para firmar JWTs propios               | **obligatorio**            |
| `JWT_ALGORITHM`        | Algoritmo de firma                           | `HS256`                    |
| `JWT_EXPIRES_MINUTES`  | Duración del access token                    | `60`                       |
| `GOOGLE_CLIENT_ID`     | Client ID de Google OAuth                    | **obligatorio**            |
| `GOOGLE_CLIENT_SECRET` | Client secret (lo usará el frontend)         | **obligatorio**            |
| `CORS_ORIGINS`         | Orígenes permitidos, separados por coma      | `http://localhost:3000`    |
| `ATTACHMENTS_DIR`      | Ruta donde se guardan adjuntos               | `/app/storage/attachments` |
| `MAX_ATTACHMENT_MB`    | Tamaño máximo por fichero subido             | `10`                       |
| `ANTHROPIC_API_KEY`    |                                              |                            |

### Asistente IA (bonus)

- **Anthropic Claude con tool use**: el endpoint `POST /api/v1/chat` recibe el historial de mensajes y lo procesa con `claude-haiku-4-5`. Se exponen 7 tools (`list_tickets`, `get_ticket`, `create_ticket`, `update_ticket_status`, `reassign_ticket`, `add_comment`, `find_user`).
- **Reuso de la capa de servicios**: cada tool llama a los mismos servicios que los endpoints REST (`tickets_service.update_ticket(...)`, etc.), pasando el usuario actual como `actor`. Esto garantiza que los permisos, validaciones y side-effects (notificaciones) son idénticos a los de la UI.
- **Loop de tool use multi-turno**: el servicio implementa el patrón estándar de Anthropic, permitiendo encadenar varias tools (ej: buscar usuario por nombre → reasignar ticket). Limitado a 8 iteraciones para evitar loops infinitos.
- **Auditabilidad**: cada llamada devuelve la lista de operaciones ejecutadas con su resumen humano. La UI las muestra como chips bajo cada respuesta del asistente para que el usuario sepa exactamente qué cambios se han hecho en su nombre.
- **Manejo de errores**: las excepciones de los servicios se traducen a `{"error": "..."}` en el `tool_result` con `is_error: true`. Claude reacciona explicando el fallo en lenguaje natural sin reintentar a ciegas.

## Uso de IA durante el desarrollo

He utilizado **Claude (Anthropic)** como copiloto durante todo el desarrollo, principalmente para:

- Discusión inicial de arquitectura y stack.
- Scaffolding de FastAPI, Next.js y configuración de Alembic.
- Resolución de incidencias de dependencias y compatibilidad (Pydantic v2, Auth.js v5 con Next.js 16, Tailwind v4, transports de google-auth).
- Diseño del flujo OAuth en dos pasos (id_token → JWT propio).
- Patrón de optimistic updates con TanStack Query y dnd-kit.
- Decisiones de UX (validación de tamaño en frontend, progreso de subida, polling de notificaciones).
- Revisión de buenas prácticas (timestamps con zona, enums en BD, separación de capas).

Todas las decisiones técnicas se han revisado, comprendido y, cuando ha hecho falta, ajustado manualmente. La IA ha actuado como herramienta de aceleración y consulta, no como sustituto del criterio del desarrollador.