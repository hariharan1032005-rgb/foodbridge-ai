from app.services.email_service import send_welcome_email


def test_send_welcome_email_skips_when_smtp_not_configured(monkeypatch):
    monkeypatch.setattr("app.utils.email_utils.settings.EMAIL_ENABLED", False, raising=False)
    monkeypatch.setattr("app.utils.email_utils.settings.SMTP_HOST", "", raising=False)
    monkeypatch.setattr("app.utils.email_utils.settings.SMTP_FROM_EMAIL", "", raising=False)

    result = send_welcome_email("user@example.com", "Jane Doe", "donor")

    assert result is False
