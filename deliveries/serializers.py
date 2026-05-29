from rest_framework import serializers


class AssignDriverSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    driver_id = serializers.IntegerField()


class DeliveryStatusSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    status = serializers.ChoiceField(choices=[
        "accepted",
        "picked_up",
        "in_transit",
        "delivered",
    ])