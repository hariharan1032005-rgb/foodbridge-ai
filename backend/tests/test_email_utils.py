from unittest.mock import MagicMock, patch

from app.utils.email_utils import send_welcome_email


def test_send_welcome_email_sends_message(monkeypatch):
    monkeypatch.setattr("app.utils.email_utils.settings.EMAIL_ENABLED", True, raising=False)
    monkeypatch.setattr("app.utils.email_utils.settings.SMTP_HOST", "smtp.example.com", raising=False)
    monkeypatch.setattr("app.utils.email_utils.settings.SMTP_PORT", 587, raising=False)
    monkeypatch.setattr("app.utils.email_utils.settings.SMTP_USERNAME", "user", raising=False)
    monkeypatch.setattr("app.utils.email_utils.settings.SMTP_PASSWORD", "pass", raising=False)
    monkeypatch.setattr("app.utils.email_utils.settings.SMTP_FROM_EMAIL", "noreply@example.com", raising=False)
    monkeypatch.setattr("app.utils.email_utils.settings.SMTP_USE_TLS", True, raising=False)

    mock_smtp = MagicMock()
    with patch("app.utils.email_utils.smtplib.SMTP", return_value=mock_smtp) as smtp_cls:
        send_welcome_email("user@example.com", "Jane Doe")

    assert smtp_cls.called
    mock_smtp.sendmail.assert_called_once()
