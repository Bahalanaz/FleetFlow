from django.db import models
from django.contrib.auth.models import User


class AuditLog(models.Model):

    ACTION_TYPES = (
        ('order_created', 'Order Created'),
        ('order_updated', 'Order Updated'),
        ('driver_assigned', 'Driver Assigned'),
        ('status_changed', 'Status Changed'),
        ('order_cancelled', 'Order Cancelled'),
        ('system_event', 'System Event'),
    )

    user = models.ForeignKey(User,on_delete=models.SET_NULL,null=True,blank=True,related_name="audit_logs"
    )

    action = models.CharField(max_length=50, choices=ACTION_TYPES)

    entity_type = models.CharField(max_length=50)
    entity_id = models.IntegerField()

    details = models.JSONField(null=True, blank=True)

    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action} - {self.entity_type} {self.entity_id}"