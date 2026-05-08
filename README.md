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

| Método | Ruta                     | Descripción                              | Auth |
|--------|--------------------------|------------------------------------------|------|
| GET    | `/health`                | Healthcheck                              | -    |
| POST   | `/api/v1/auth/google`    | Login con id_token de Google → JWT propio | -    |
| GET    | `/api/v1/auth/me`        | Datos del usuario autenticado            | ✓    |

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

Todas las decisiones técnicas se han revisado y entendido antes de incorporarse al código.