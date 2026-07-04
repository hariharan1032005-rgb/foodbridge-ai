from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from app.core.config import settings
from app.db.database import init_db
from app.api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # Create uploads directory
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    # Initialize database tables
    await init_db()
    print("✅ FoodBridge AI Backend Started!")
    print(f"📊 API Docs: http://localhost:8000/docs")
    yield
    print("🔴 FoodBridge AI Backend Shutting Down...")


app = FastAPI(
    title="FoodBridge AI API",
    description="""
    ## 🍱 FoodBridge AI – Multi-Agent Food Waste Redistribution Platform
    
    A production-ready AI platform connecting food donors with NGOs to reduce food waste.
    
    ### Features:
    - 🤖 **8 AI Agents** powered by Google Gemini
    - 🗓️ **Smart NGO Matching** with explainable AI
    - 📊 **Demand Forecasting** with ML models
    - 🗺️ **Route Optimization** using OpenStreetMap
    - 📈 **Real-time Analytics** and Impact Reports
    
    ### Roles:
    - **Admin** – Full platform access
    - **Donor** – Post food donations
    - **NGO** – Accept donations and view AI recommendations
    - **Volunteer** – Manage pickups and deliveries
    """,
    version=settings.APP_VERSION,
    contact={"name": "FoodBridge AI Team", "email": "support@foodbridge.ai"},
    license_info={"name": "MIT"},
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploads
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include all routers
app.include_router(api_router)


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "🍱 FoodBridge AI – Multi-Agent Food Waste Redistribution Platform",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "status": "operational"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "service": "FoodBridge AI"}
