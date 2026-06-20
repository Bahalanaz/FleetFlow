from django.db import transaction
from orders.models import Order
from tracking.models import TrackingEvent
from notifications.models import Notification
from audit_logs.models import AuditLog


def create_order(customer, pickup_location, delivery_location):

    with transaction.atomic():

        order = Order.objects.create(
            customer=customer,
            pickup_location=pickup_location,
            delivery_location=delivery_location,
            status="created"
        )

        TrackingEvent.objects.create(
            order=order,
            event_type="order_created"
        )

        Notification.objects.create(
            user=customer,
            order=order,
            message="Your order has been created successfully",
            notification_type="order_created"
        )

        AuditLog.objects.create(
            user=customer,
            action="order_created",
            entity_type="Order",
            entity_id=order.id,
            details={
                "pickup": pickup_location,
                "delivery": delivery_location
            }
        )

    return order