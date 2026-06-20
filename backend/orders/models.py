from django.db import models
from django.contrib.auth.models import User

class Order(models.Model):

    ORDER_STATUS = (
        ('created', 'Created'),
        ('assigned', 'Assigned'),
        ('accepted', 'Accepted'),
        ('picked_up', 'Picked Up'),
        ('in_transit', 'In Transit'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    )

    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="orders")

    pickup_location = models.CharField(max_length=100)
    delivery_location = models.CharField(max_length=100)

    status = models.CharField(
        max_length=20,
        choices=ORDER_STATUS,
        default='created'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order {self.id} - {self.status}"

class Driver(models.Model):

    DRIVER_STATUS = (
        ('available', 'Available'),
        ('busy', 'Busy'),
        ('offline', 'Offline'),
    )

    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="driver_profile")
    name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20, unique=True)

    status = models.CharField(
        max_length=20,
        choices=DRIVER_STATUS,
        default='available'
    )

    current_location = models.CharField(max_length=150, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class DriverAssignment(models.Model):

    ASSIGNMENT_STATUS = (
        ('assigned', 'Assigned'),
        ('picked_up', 'Picked Up'),
        ('completed', 'Completed'),
        ('reassigned', 'Reassigned'),
    )

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="assignments")
    driver = models.ForeignKey(Driver, on_delete=models.CASCADE, related_name="assignments")

    status = models.CharField(
        max_length=20,
        choices=ASSIGNMENT_STATUS,
        default='assigned'
    )

    assigned_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order {self.order.id} -> Driver {self.driver.name}"

