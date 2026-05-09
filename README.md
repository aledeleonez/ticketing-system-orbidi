# Orbidi Ticketing System

Sistema de ticketing full-stack desarrollado como prueba técnica para Orbidi.

## Stack

- **Backend**: FastAPI + SQLAlchemy + PostgreSQL + Alembic
- **Frontend**: Next.js (App Router) + TypeScript + TanStack Query + Tailwind + shadcn/ui
- **Auth**: Google OAuth 2.0 (NextAuth en frontend, validación de id_token + JWT propio en backend)
- **Infra**: Docker Compose

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

## Cómo levantarlo

### Requisitos previos

- Docker y Docker Compose.
- Cuenta de Google con credenciales OAuth 2.0 creadas en [Google Cloud Console](https://console.cloud.google.com/) (tipo "Web application").

### Configuración

Crea un archivo `.env` en la raíz del proyecto con:

```bash
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
JWT_SECRET=cadena-aleatoria-larga
```

Para generar un `JWT_SECRET` seguro:

```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

### Arrancar

```bash
docker compose up --build
```

### Aplicar migraciones (primera vez)

```bash
docker compose exec backend alembic upgrade head
```

### Verificar

```bash
curl http://localhost:8000/health
# {"status":"ok"}
```

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

Documentación interactiva (Swagger UI): http://localhost:8000/docs

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

## Uso de IA durante el desarrollo

He utilizado Claude (Anthropic) como copiloto a lo largo del desarrollo, principalmente para:

- Discutir arquitectura y decisiones de stack al inicio.
- Scaffolding inicial de FastAPI y configuración de Alembic.
- Resolver errores de dependencias y compatibilidad (Pydantic v2, `email-validator`, transports de `google-auth`).
- Plantear el flujo OAuth en dos pasos (id_token → JWT propio).
- Revisar buenas prácticas (timestamps con zona, enums en BD, separación de capas).
- Discusión sobre la arquitectura del Kanban: detección de colisión, optimistic updates con TanStack Query y separación entre hooks de fetching y componentes.
- Resolución de incidencias propias del entorno (dockerización del frontend, variables `NEXT_PUBLIC_` vs server-side, compatibilidad con Next.js 16 y Tailwind v4).

Todas las decisiones técnicas se han revisado y entendido antes de incorporarse al código.