from django.urls import path
from .views import (
    AssignDriverAPIView,
    UpdateDeliveryStatusAPIView,
    AdminOrderListView,
    AdminDriverListView,
    AdminDeliveryHistoryView,
    AdminAuditLogView,
    DriverMyDeliveriesView,
)

urlpatterns = [
    path("assign/", AssignDriverAPIView.as_view()),
    path("update-status/", UpdateDeliveryStatusAPIView.as_view()),
    path("admin/orders/", AdminOrderListView.as_view()),
    path("admin/drivers/", AdminDriverListView.as_view()),
    path("admin/orders/<int:order_id>/history/", AdminDeliveryHistoryView.as_view()),
    path("admin/audit-logs/", AdminAuditLogView.as_view()),
    path("my-deliveries/", DriverMyDeliveriesView.as_view()),
]