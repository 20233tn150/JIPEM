from django.db import OperationalError, ProgrammingError
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from .models import AuditLog


def _should_skip_sender(sender):
    # Avoid auditing Django internal models (e.g. django_migrations) and AuditLog itself.
    sender_module = getattr(sender, "__module__", "")
    return sender == AuditLog or sender_module.startswith("django.")


def _safe_create_audit_log(**kwargs):
    try:
        AuditLog.objects.create(**kwargs)
    except (ProgrammingError, OperationalError) as e:
        # We only skip the error if the table doesn't exist (common during initial migrations)
        if 'does not exist' in str(e).lower():
            return
        # If it's a real database issue (e.g., connection lost), we re-raise the exception
        raise e

@receiver(post_save)
def audit_log_save(sender, instance, created, **kwargs):
    if _should_skip_sender(sender):
        return

    action = AuditLog.EVENT_INSERT if created else AuditLog.EVENT_UPDATE
    desc = f"Se {'creó' if created else 'actualizó'} un registro en {sender.__name__}: {str(instance)}"

    _safe_create_audit_log(
        event_type=action,
        table_name=sender.__name__,
        description=desc,
        mysql_user='system_trigger' 
    )

@receiver(post_delete)
def audit_log_delete(sender, instance, **kwargs):
    if _should_skip_sender(sender):
        return

    _safe_create_audit_log(
        event_type=AuditLog.EVENT_DELETE,
        table_name=sender.__name__,
        description=f"Se eliminó un registro de {sender.__name__}: {str(instance)}",
        mysql_user='system_trigger'
    )