from rest_framework import serializers
from .models import Order, Driver, DriverAssignment


class OrderCreateSerializer(serializers.Serializer):
    pickup_location = serializers.CharField(max_length=100)
    delivery_location = serializers.CharField(max_length=100)


class OrderSerializer(serializers.ModelSerializer):
    customer_username = serializers.CharField(source='customer.username', read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'customer_username', 'pickup_location', 'delivery_location', 'status', 'created_at']


class DriverSerializer(serializers.ModelSerializer):
    class Meta:
        model = Driver
        fields = ['id', 'name', 'phone_number', 'status', 'current_location', 'created_at']


class DriverAssignmentSerializer(serializers.ModelSerializer):
    driver_name = serializers.CharField(source='driver.name', read_only=True)
    order_status = serializers.CharField(source='order.status', read_only=True)

    class Meta:
        model = DriverAssignment
        fields = ['id', 'order', 'driver_name', 'order_status', 'status', 'assigned_at']
