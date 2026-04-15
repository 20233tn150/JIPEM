from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from .models import AuditLog

@receiver(post_save)
def audit_log_save(sender, instance, created, **kwargs):
    if sender == AuditLog or sender.__module__.startswith('django.contrib'):
        return

    action = AuditLog.EVENT_INSERT if created else AuditLog.EVENT_UPDATE
    desc = f"Se {'creó' if created else 'actualizó'} un registro en {sender.__name__}: {str(instance)}"

    AuditLog.objects.create(
        event_type=action,
        table_name=sender.__name__,
        description=desc,
        mysql_user='system_trigger' 
    )

@receiver(post_delete)
def audit_log_delete(sender, instance, **kwargs):
    if sender == AuditLog:
        return

    AuditLog.objects.create(
        event_type=AuditLog.EVENT_DELETE,
        table_name=sender.__name__,
        description=f"Se eliminó un registro de {sender.__name__}: {str(instance)}",
        mysql_user='system_trigger'
    )