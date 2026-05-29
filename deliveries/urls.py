from django.db import path
from .views import AssignDriverAPIView

urlpattern = [
    path("assign/",AssignDriverAPIView.as_view()),
    path("update-status/", UpdateDeliveryStatusAPIView.as_view()),
]