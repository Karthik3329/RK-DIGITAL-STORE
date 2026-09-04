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
from app.routes.downloads import router as downloads_router

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


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(products_router)
app.include_router(orders_router)
app.include_router(user_router)
app.include_router(payments_router)
app.include_router(downloads_router)

@app.get("/")
def root():

    return {
        "message": "Digital Product Store API is running!"
    }


@app.get("/api/health")
def health_check():

    return {
        "status": "healthy",
        "database": "connected"
    }