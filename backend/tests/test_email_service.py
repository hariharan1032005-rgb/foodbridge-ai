from app.services.email_service import send_welcome_email


def test_send_welcome_email_skips_when_smtp_not_configured(monkeypatch):
    monkeypatch.setattr("app.services.email_service.settings.SMTP_HOST", "")
    monkeypatch.setattr("app.services.email_service.settings.SMTP_FROM_EMAIL", "")

    result = send_welcome_email("user@example.com", "Jane Doe", "donor")

    assert result is False
