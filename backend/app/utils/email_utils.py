import logging
import smtplib
from email.message import EmailMessage
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_welcome_email(to_email: str, full_name: str, role: str = "donor", otp: Optional[str] = None) -> bool:
    """Send a welcome email to a newly registered user if SMTP is configured."""
    if not getattr(settings, "EMAIL_ENABLED", False):
        logger.info("Email sending is disabled; skipping welcome email")
        return False

    if not settings.SMTP_HOST or not settings.SMTP_FROM_EMAIL:
        logger.info("SMTP is not configured; skipping welcome email")
        return False

    try:
        role_label = role.capitalize() if role else "member"
        message = EmailMessage()
        message["Subject"] = f"Welcome to {settings.APP_NAME}"
        message["From"] = settings.SMTP_FROM_EMAIL
        message["To"] = to_email
        body = (
            f"Hi {full_name or 'there'},\n\n"
            f"Thanks for joining {settings.APP_NAME} as a {role_label}.\n"
            "Use the OTP below to verify your email and activate your account.\n\n"
        )
        if otp:
            body += f"Your OTP is: {otp}\n\n"
        body += (
            "Best regards,\n"
            f"The {settings.APP_NAME} Team"
        )
        message.set_content(body)

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT or 587, timeout=10) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, [to_email], message.as_string())

        return True
    except Exception as exc:
        logger.warning("Failed to send welcome email to %s: %s", to_email, exc)
        return False


def send_login_email(to_email: str, full_name: str) -> bool:
    """Send a notification email whenever a user logs in."""
    if not getattr(settings, "EMAIL_ENABLED", False):
        logger.info("Email sending is disabled; skipping login email")
        return False

    if not settings.SMTP_HOST or not settings.SMTP_FROM_EMAIL:
        logger.info("SMTP is not configured; skipping login email")
        return False

    try:
        message = EmailMessage()
        message["Subject"] = f"New login to {settings.APP_NAME}"
        message["From"] = settings.SMTP_FROM_EMAIL
        message["To"] = to_email
        body = (
            f"Hi {full_name or 'there'},\n\n"
            f"We noticed a new login to your {settings.APP_NAME} account.\n"
            "If this was you, no action is needed.\n\n"
            "Best regards,\n"
            f"The {settings.APP_NAME} Team"
        )
        message.set_content(body)

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT or 587, timeout=10) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, [to_email], message.as_string())

        return True
    except Exception as exc:
        logger.warning("Failed to send login email to %s: %s", to_email, exc)
        return False
