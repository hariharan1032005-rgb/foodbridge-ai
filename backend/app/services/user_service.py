import logging
import random
from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.models import User
from app.core.security import get_password_hash, verify_password
from app.schemas.user_schema import UserCreate
from app.services.email_service import send_registration_email
from typing import Optional

logger = logging.getLogger(__name__)


def generate_otp() -> str:
    return f"{random.randint(100000, 999999)}"


def verify_otp_code(input_code: str, stored_code: str, sent_at: datetime, now: datetime) -> bool:
    if not stored_code or not input_code:
        return False
    if input_code != stored_code:
        return False
    if now > sent_at + timedelta(minutes=10):
        return False
    return True


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, user_data: UserCreate) -> User:
    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        phone=user_data.phone,
        role=user_data.role,
        is_active=True,
        is_verified=False,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> Optional[User]:
    user = await get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user
