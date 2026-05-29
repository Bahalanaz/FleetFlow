from django.db import models
from orders.models import Order


class TrackingEvent(models.Model):

    EVENT_TYPES = (
        ('order_created', 'Order Created'),
        ('driver_assigned', 'Driver Assigned'),
        ('accepted', 'Accepted'),
        ('picked_up', 'Picked Up'),
        ('in_transit', 'In Transit'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    )

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="tracking_events")
    event_type = models.CharField(max_length=30, choices=EVENT_TYPES)
    timestamp = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"Order {self.order.id} - {self.event_type}"
