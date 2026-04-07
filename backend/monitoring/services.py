import logging
from monitoring.models import SecurityEvent

logger = logging.getLogger(__name__)

def log_security_event(description: str, severity: str = 'Low') -> SecurityEvent:
    """
    Clean Architecture Service: Records explicitly identified security events.
    Isolates DB logic from views.
    """
    event = SecurityEvent.objects.create(
        description=description,
        severity=severity
    )
    logger.info(f"Security Event Logged: [{severity}] {description}")
    return event
