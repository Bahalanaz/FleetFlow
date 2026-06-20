from django.db import transaction

from orders.models import Order, Driver, DriverAssignment
from tracking.models import TrackingEvent
from notifications.models import Notification
from audit_logs.models import AuditLog

VALID_TRANSITIONS = {
    "assigned": "accepted",
    "accepted": "picked_up",
    "picked_up": "in_transit",
    "in_transit": "delivered",
}


def assign_driver(order_id, driver_id, admin_user):

    with transaction.atomic():

        order = Order.objects.select_for_update().get(id=order_id)
        driver = Driver.objects.select_for_update().get(id=driver_id)

        if order.status != "created":
            raise ValueError(f"Order is already in '{order.status}' state and cannot be assigned")

        if driver.status != "available":
            raise ValueError("Driver is not available")

        assignment = DriverAssignment.objects.create(
            order=order,
            driver=driver,
            status="assigned"
        )

        order.status = "assigned"
        order.save()

        driver.status = "busy"
        driver.save()

        TrackingEvent.objects.create(
            order=order,
            event_type="driver_assigned",
            metadata={"driver_id": driver.id, "driver_name": driver.name}
        )

        Notification.objects.create(
            user=order.customer,
            order=order,
            message=f"Driver {driver.name} has been assigned to your order",
            notification_type="driver_assigned"
        )

        AuditLog.objects.create(
            user=admin_user,
            action="driver_assigned",
            entity_type="Order",
            entity_id=order.id,
            details={"driver_id": driver.id, "order_id": order.id}
        )

    return assignment


def update_delivery_status(order_id, new_status, driver_user):

    with transaction.atomic():

        order = Order.objects.select_for_update().get(id=order_id)

        try:
            driver = Driver.objects.get(user=driver_user)
        except Driver.DoesNotExist:
            raise ValueError("No driver profile is linked to your account")

        active_assignment = order.assignments.filter(driver=driver).exclude(status="completed").first()
        if not active_assignment:
            raise ValueError("You are not assigned to this order")

        expected_next = VALID_TRANSITIONS.get(order.status)
        if expected_next != new_status:
            raise ValueError(
                f"Invalid transition: '{order.status}' → '{new_status}'. "
                f"Expected next status: '{expected_next}'"
            )

        old_status = order.status
        order.status = new_status
        order.save()

        if new_status == "delivered":
            active_assignment.status = "completed"
            active_assignment.save()
            driver.status = "available"
            driver.save()

        TrackingEvent.objects.create(
            order=order,
            event_type=new_status,
            metadata={"previous_status": old_status, "driver_id": driver.id}
        )

        Notification.objects.create(
            user=order.customer,
            order=order,
            message=f"Your order status has been updated to: {new_status}",
            notification_type=new_status
        )

        AuditLog.objects.create(
            user=driver_user,
            action="status_changed",
            entity_type="Order",
            entity_id=order.id,
            details={"from": old_status, "to": new_status, "driver_id": driver.id}
        )

    return order
