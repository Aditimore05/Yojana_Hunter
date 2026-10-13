import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@yojanahunter.gov.in")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

def is_email_service_configured() -> bool:
    """Check if valid SMTP configuration is present in environment."""
    return bool(SMTP_HOST and SMTP_USER and SMTP_PASSWORD)

def send_password_reset_email(to_email: str, reset_token: str, recipient_name: str = "Citizen") -> dict:
    """
    Sends a password reset email if SMTP is configured.
    If not configured, logs the reset token securely to application logs
    and returns a structured status indicating email was not dispatched.
    """
    reset_url = f"{FRONTEND_URL}/reset-password?token={reset_token}"

    if not is_email_service_configured():
        logger.info(
            f"[EMAIL NOTICE] SMTP not configured. Password reset token generated for {to_email}: "
            f"{reset_token} (Reset URL: {reset_url})"
        )
        return {
            "sent": False,
            "configured": False,
            "message": "Email delivery service is not configured. Please configure SMTP_HOST, SMTP_USER, and SMTP_PASSWORD.",
            "reset_url": reset_url
        }

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Password Reset Request — Yojana Hunter"
        msg["From"] = f"Yojana Hunter <{FROM_EMAIL}>"
        msg["To"] = to_email

        text_content = f"""
Hello {recipient_name},

We received a request to reset your password for your Yojana Hunter account.

Click the following link to reset your password:
{reset_url}

This link will expire in 1 hour. If you did not request this, please ignore this email.

Best regards,
Yojana Hunter Team
"""

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
  <style>
    body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F1F7FF; margin: 0; padding: 24px; }}
    .card {{ max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2EAF4; padding: 32px; box-shadow: 0 4px 12px rgba(16, 32, 68, 0.08); }}
    .logo {{ color: #102044; font-size: 22px; font-weight: 800; }}
    .logo span {{ color: #2563EB; }}
    h2 {{ color: #102044; font-size: 20px; margin-top: 16px; }}
    p {{ color: #475569; font-size: 14px; line-height: 1.6; }}
    .btn {{ display: inline-block; background-color: #2563EB; color: #ffffff !important; padding: 12px 24px; border-radius: 10px; font-weight: 700; text-decoration: none; margin: 20px 0; }}
    .note {{ font-size: 12px; color: #94A3B8; margin-top: 24px; border-top: 1px solid #E2EAF4; pt: 16px; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Yojana<span> Hunter</span></div>
    <h2>Reset Your Password</h2>
    <p>Hello {recipient_name},</p>
    <p>We received a request to reset your password for your Yojana Hunter account. Click the button below to choose a new password:</p>
    <a href="{reset_url}" class="btn">Reset Password</a>
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #2563EB; font-size: 12px;">{reset_url}</p>
    <p class="note">This single-use link is valid for 1 hour. If you did not make this request, you can safely ignore this email.</p>
  </div>
</body>
</html>
"""

        part1 = MIMEText(text_content, "plain")
        part2 = MIMEText(html_content, "html")
        msg.attach(part1)
        msg.attach(part2)

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(FROM_EMAIL, [to_email], msg.as_string())

        logger.info(f"[EMAIL SUCCESS] Password reset link sent to {to_email}")
        return {"sent": True, "configured": True, "message": "Password reset instructions sent."}

    except Exception as e:
        logger.error(f"[EMAIL ERROR] Failed to send password reset email to {to_email}: {e}")
        return {
            "sent": False,
            "configured": True,
            "error": "Failed to dispatch email",
            "message": str(e)
        }
