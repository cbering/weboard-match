# WeBoard Match

Advisory board matching tool for WeBoard volunteers.

## Stack

| Layer    | Tech                                          |
|----------|-----------------------------------------------|
| Frontend | React 18 + TypeScript · MUI 6 · AG Grid · Recharts · Vite |
| Backend  | FastAPI (Python 3.12) · SQLAlchemy 2 async · Alembic · JWT + bcrypt · SSE |
| Database | PostgreSQL 16 · asyncpg · JSONB for ratings and desired competencies |

## Quick start

```bash
cp .env.example .env          # adjust passwords
docker compose up --build     # starts db + backend + frontend
```

- Frontend: http://localhost:5173
- API docs: http://localhost:8000/docs
- Default admin: `admin@weboard.dk` / `changeme123` (set in `.env`)

## Seed demo data

```bash
docker compose exec backend python seed.py
```

Adds 8 members and 3 companies with competency ratings.

## Auth

| Role   | Access |
|--------|--------|
| admin  | Full CRUD — companies, members, board assignments |
| member | Own profile + competency ratings · companies they are on |

Create member users via the API (`POST /auth/…`) or directly in the database.

## Project layout

```
backend/
  app/
    main.py          FastAPI app + lifespan (auto-creates tables, seeds admin)
    models.py        SQLAlchemy models: User, Member, Company, BoardAssignment
    schemas.py       Pydantic I/O models
    auth.py          JWT + bcrypt helpers, get_current_user, require_admin
    matching.py      Scoring algorithm
    routers/
      auth.py        POST /auth/login, GET /auth/me
      members.py     CRUD /members
      companies.py   CRUD /companies + GET /companies/dashboard + GET /companies/{id}/match
      board.py       POST/DELETE /companies/{id}/board/{member_id}
      sse.py         GET /events  (Server-Sent Events)
  seed.py            Demo data seeder
frontend/
  src/
    pages/           Dashboard, Companies (AG Grid), Members (AG Grid), Matrix
    components/      Layout, MatchModal
    api/             Axios client + typed API calls
    store.ts         Zustand auth store
    types.ts         Shared TypeScript types + reference data
index.html           Original single-file prototype (kept as reference)
```
