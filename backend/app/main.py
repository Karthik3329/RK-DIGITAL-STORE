from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import (
    connect_to_database,
    close_database_connection
)

from app.routes.auth import router as auth_router
from app.routes.admin import router as admin_router
from app.routes.products import router as products_router
from app.routes.order import router as orders_router
from app.routes.user import router as user_router
from app.routes.payments import router as payments_router
from app.routes.coupons import router as coupons_router
from app.routes.downloads import router as downloads_router
from app.routes.analytics import router as analytics_router
from app.routes.ai import router as ai_router

@asynccontextmanager
async def lifespan(app: FastAPI):

    print("Starting Digital Product Store API...")

    connect_to_database()

    yield

    close_database_connection()


app = FastAPI(
    title="Digital Product Store API",
    description="Backend API for a digital product marketplace",
    version="1.0.0",
    lifespan=lifespan
)


# =========================
# CORS CONFIGURATION
# =========================

allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://rk-digital-store.vercel.app",
]

# Add FRONTEND_URL from environment if it is different
if settings.FRONTEND_URL and settings.FRONTEND_URL not in allowed_origins:
    allowed_origins.append(settings.FRONTEND_URL)


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# ROUTES
# =========================

app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(products_router)
app.include_router(orders_router)
app.include_router(user_router)
app.include_router(coupons_router)
app.include_router(payments_router)
app.include_router(downloads_router)
app.include_router(analytics_router)
app.include_router(ai_router)

# =========================
# ROOT
# =========================

@app.get("/")
def root():
    return {
        "message": "Digital Product Store API is running!"
    }


# =========================
# HEALTH CHECK
# =========================

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected"
    }