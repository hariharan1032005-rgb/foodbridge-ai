from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.user_schema import UserCreate, UserResponse, TokenResponse, LoginRequest, VerifyOtpRequest
from app.services.user_service import (
    create_user,
    authenticate_user,
    get_user_by_email,
    generate_otp,
    verify_otp_code,
)
from app.core.security import create_access_token, get_current_user
from app.services.email_service import send_registration_email, send_login_notification_email

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user (donor, NGO, volunteer, or admin)."""
    existing = await get_user_by_email(db, user_data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    user = await create_user(db, user_data)
    otp = generate_otp()
    user.otp_code = otp
    user.otp_sent_at = datetime.utcnow()
    await db.commit()
    send_registration_email(user.email, user.full_name, user.role.value, otp)
    return user


@router.post("/verify-otp")
async def verify_otp(payload: VerifyOtpRequest, db: AsyncSession = Depends(get_db)):
    user = await get_user_by_email(db, payload.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.otp_code or not user.otp_sent_at:
        raise HTTPException(status_code=400, detail="OTP not requested")
    if not verify_otp_code(payload.otp, user.otp_code, user.otp_sent_at, datetime.utcnow()):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    user.is_verified = True
    user.otp_code = None
    user.otp_sent_at = None
    await db.commit()
    return {"message": "Email verified successfully"}


@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: LoginRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate and return JWT token."""
    user = await authenticate_user(db, credentials.email, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Please verify your email with the OTP sent to your inbox")

    token = create_access_token({"sub": str(user.id), "role": user.role})
    background_tasks.add_task(send_login_notification_email, user.email, user.full_name)
    return TokenResponse(access_token=token, user=user)


@router.post("/login/form", response_model=TokenResponse)
async def login_form(
    background_tasks: BackgroundTasks,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """OAuth2 form-compatible login endpoint."""
    user = await authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id), "role": user.role})
    background_tasks.add_task(send_login_notification_email, user.email, user.full_name)
    return TokenResponse(access_token=token, user=user)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user=Depends(get_current_user)):
    """Get currently authenticated user profile."""
    return current_user