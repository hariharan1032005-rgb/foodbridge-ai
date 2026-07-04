from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings
from typing import List
import json

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env", override=False)


class Settings(BaseSettings):
    APP_NAME: str = "FoodBridge AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # JWT
    SECRET_KEY: str = "change-me-in-production-super-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/foodbridge_db"
    SYNC_DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/foodbridge_db"

    # AI
    GEMINI_API_KEY: str = "your-gemini-api-key"

    # File Storage
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 10485760  # 10MB

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Email
    EMAIL_ENABLED: bool = False
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_USE_TLS: bool = True

    class Config:
        env_file = str(BASE_DIR / ".env")
        case_sensitive = True


settings = Settings()