import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

def send_password_reset_email(email: str, reset_url: str) -> None:
    """Send password reset email with SMTP"""
    if not settings.SMTP_ENABLED:
        logger.debug(f"SMTP disabled. Reset URL for {email}: {reset_url}")
        return

    try:
        # Create message container
        msg = MIMEMultipart('alternative')
        msg['Subject'] = "Password Reset Request"
        msg['From'] = settings.SMTP_FROM_EMAIL
        msg['To'] = email

        # Create email body
        text = f"Please reset your password by visiting: {reset_url}"
        html = f"""
        <html>
          <body>
            <p>You requested a password reset. Click the link below:</p>
            <p><a href="{reset_url}">Reset Password</a></p>
            <p>If you didn't request this, please ignore this email.</p>
          </body>
        </html>
        """

        # Attach parts
        part1 = MIMEText(text, 'plain')
        part2 = MIMEText(html, 'html')
        msg.attach(part1)
        msg.attach(part2)

        # Send email
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.ehlo()
            if settings.SMTP_USE_TLS:
                server.starttls()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, [email], msg.as_string())
        
        logger.info(f"Password reset email sent to {email}")

    except Exception as e:
        logger.error(f"Failed to send email to {email}: {str(e)}")
        raise