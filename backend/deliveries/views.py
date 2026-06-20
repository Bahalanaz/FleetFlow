from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from users.permissions import IsAdmin, IsDriver
from orders.models import Order, Driver, DriverAssignment
from orders.serializers import OrderSerializer, DriverSerializer, DriverAssignmentSerializer
from audit_logs.models import AuditLog
from audit_logs.serializers import AuditLogSerializer
from .serializers import AssignDriverSerializer, DeliveryStatusSerializer
from .services.delivery_service import assign_driver, update_delivery_status


class AssignDriverAPIView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request):
        serializer = AssignDriverSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        try:
            assignment = assign_driver(
                order_id=data["order_id"],
                driver_id=data["driver_id"],
                admin_user=request.user
            )
            return Response({
                "message": "Driver assigned successfully",
                "assignment_id": assignment.id,
                "order_id": assignment.order.id,
                "driver": assignment.driver.name
            }, status=status.HTTP_201_CREATED)

        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UpdateDeliveryStatusAPIView(APIView):
    permission_classes = [IsDriver]

    def post(self, request):
        serializer = DeliveryStatusSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        try:
            order = update_delivery_status(
                order_id=data["order_id"],
                new_status=data["status"],
                driver_user=request.user
            )
            return Response({
                "message": "Delivery status updated",
                "order_id": order.id,
                "status": order.status
            }, status=status.HTTP_200_OK)

        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ── Admin Dashboard ────────────────────────────────────────────────────────────

class AdminOrderListView(APIView):
    """List all orders. Optional ?status= filter."""
    permission_classes = [IsAdmin]

    def get(self, request):
        orders = Order.objects.all().order_by('-created_at')
        status_filter = request.query_params.get('status')
        if status_filter:
            orders = orders.filter(status=status_filter)
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)


class AdminDriverListView(APIView):
    """List all drivers. Optional ?status= filter (available/busy/offline)."""
    permission_classes = [IsAdmin]

    def get(self, request):
        drivers = Driver.objects.all().order_by('name')
        status_filter = request.query_params.get('status')
        if status_filter:
            drivers = drivers.filter(status=status_filter)
        serializer = DriverSerializer(drivers, many=True)
        return Response(serializer.data)


class AdminDeliveryHistoryView(APIView):
    """Full assignment + status history for one order."""
    permission_classes = [IsAdmin]

    def get(self, request, order_id):
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

        assignments = order.assignments.order_by('assigned_at')
        tracking = order.tracking_events.order_by('timestamp')

        from tracking.serializers import TrackingEventSerializer
        return Response({
            "order_id": order.id,
            "current_status": order.status,
            "assignments": DriverAssignmentSerializer(assignments, many=True).data,
            "tracking_events": TrackingEventSerializer(tracking, many=True).data,
        })


class AdminAuditLogView(APIView):
    """Paginated audit log. Optional ?entity_type= and ?action= filters."""
    permission_classes = [IsAdmin]

    def get(self, request):
        logs = AuditLog.objects.all().order_by('-timestamp')
        entity_type = request.query_params.get('entity_type')
        action = request.query_params.get('action')
        if entity_type:
            logs = logs.filter(entity_type=entity_type)
        if action:
            logs = logs.filter(action=action)
        serializer = AuditLogSerializer(logs[:100], many=True)
        return Response(serializer.data)


# ── Driver Dashboard ───────────────────────────────────────────────────────────

class DriverMyDeliveriesView(APIView):
    """Driver views their own active and completed assignments."""
    permission_classes = [IsDriver]

    def get(self, request):
        try:
            driver = request.user.driver_profile
        except Exception:
            return Response({"error": "No driver profile linked to your account"}, status=status.HTTP_404_NOT_FOUND)

        assignments = DriverAssignment.objects.filter(driver=driver).order_by('-assigned_at')
        serializer = DriverAssignmentSerializer(assignments, many=True)
        return Response(serializer.data)
