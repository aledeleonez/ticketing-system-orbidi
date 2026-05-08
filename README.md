# Orbidi Ticketing System

Sistema de ticketing full-stack desarrollado como prueba técnica para Orbidi.

## Stack

- **Backend**: FastAPI + SQLAlchemy + PostgreSQL + Alembic
- **Frontend**: Next.js (App Router) + TypeScript + TanStack Query + Tailwind + shadcn/ui
- **Auth**: Google OAuth 2.0 (NextAuth en frontend, validación de id_token + JWT propio en backend)
- **Infra**: Docker Compose

## Estado del desarrollo

🚧 En progreso — Día 1: scaffolding e infraestructura.

## Cómo levantarlo

```bash
docker compose up --build
```

(Instrucciones completas al final del desarrollo.)