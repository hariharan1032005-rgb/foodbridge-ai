from typing import Optional

from app.utils.email_utils import send_welcome_email, send_login_email


def send_registration_email(to_email: str, full_name: str, role: str = "donor", otp: Optional[str] = None) -> bool:
    return send_welcome_email(to_email, full_name, role, otp)


def send_login_notification_email(to_email: str, full_name: str) -> bool:
    return send_login_email(to_email, full_name)