from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from users.permissions import IsCustomer
from tracking.serializers import TrackingEventSerializer
from .models import Order
from .serializers import OrderCreateSerializer, OrderSerializer
from .services.order_service import create_order


class CreateOrderAPIView(APIView):
    permission_classes = [IsCustomer]

    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        order = create_order(
            customer=request.user,
            pickup_location=data["pickup_location"],
            delivery_location=data["delivery_location"]
        )

        return Response({
            "message": "Order created successfully",
            "order_id": order.id,
            "status": order.status
        }, status=status.HTTP_201_CREATED)


class CustomerOrderListView(APIView):
    permission_classes = [IsCustomer]

    def get(self, request):
        orders = Order.objects.filter(customer=request.user).order_by('-created_at')
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)


class CustomerOrderTrackingView(APIView):
    permission_classes = [IsCustomer]

    def get(self, request, order_id):
        try:
            order = Order.objects.get(id=order_id, customer=request.user)
        except Order.DoesNotExist:
            return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

        events = order.tracking_events.order_by('timestamp')
        serializer = TrackingEventSerializer(events, many=True)
        return Response({
            "order_id": order.id,
            "current_status": order.status,
            "tracking": serializer.data
        })
