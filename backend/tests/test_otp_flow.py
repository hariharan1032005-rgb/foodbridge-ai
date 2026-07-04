from datetime import datetime, timedelta

from app.services.user_service import generate_otp, verify_otp_code


def test_generate_otp_returns_six_digits():
    otp = generate_otp()

    assert len(otp) == 6
    assert otp.isdigit()


def test_verify_otp_code_checks_expiry_and_match():
    now = datetime.utcnow()

    assert verify_otp_code("123456", "123456", now, now + timedelta(minutes=5)) is True
    assert verify_otp_code("123456", "654321", now, now + timedelta(minutes=5)) is False
    assert verify_otp_code("123456", "123456", now + timedelta(minutes=20), now + timedelta(minutes=5)) is False
