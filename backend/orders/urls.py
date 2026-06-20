from django.urls import path
from .views import CreateOrderAPIView, CustomerOrderListView, CustomerOrderTrackingView

urlpatterns = [
    path("create/", CreateOrderAPIView.as_view()),
    path("", CustomerOrderListView.as_view()),
    path("<int:order_id>/tracking/", CustomerOrderTrackingView.as_view()),
]
