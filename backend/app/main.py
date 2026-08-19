from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from .database import engine, Base, AsyncSessionLocal
from .models import User
from .auth import hash_password
from .config import settings
from .routers import auth, members, companies, board, sse, lookups, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await _seed_admin()
    yield


async def _seed_admin():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == settings.first_admin_email))
        if not result.scalar_one_or_none():
            admin = User(
                email=settings.first_admin_email,
                password_hash=hash_password(settings.first_admin_password),
                role="admin",
            )
            db.add(admin)
            await db.commit()


app = FastAPI(title="WeBoard Match API", lifespan=lifespan)

_cors_origins = settings.cors_origins.split(",") if settings.cors_origins else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(members.router)
app.include_router(companies.router)
app.include_router(board.router)
app.include_router(sse.router)
app.include_router(lookups.router)
app.include_router(users.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
