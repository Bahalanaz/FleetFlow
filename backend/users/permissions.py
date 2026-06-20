from rest_framework.permissions import BasePermission


class IsCustomer(BasePermission):
    message = "Only customers can perform this action."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        profile = getattr(request.user, 'userprofile', None)
        return profile is not None and profile.role == 'customer'


class IsDriver(BasePermission):
    message = "Only drivers can perform this action."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        profile = getattr(request.user, 'userprofile', None)
        return profile is not None and profile.role == 'driver'


class IsAdmin(BasePermission):
    message = "Only admins can perform this action."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        profile = getattr(request.user, 'userprofile', None)
        return profile is not None and profile.role == 'admin'
