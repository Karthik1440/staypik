# trips/urls.py — COMPLETE

from django.urls import path
from .views import (
    PackageListView, PackageDetailView, BookPackageView,
    UserBookingsView, DeleteBookingView, ReviewPackageView, PackageReviewsView,
    AllBookingsAdminView, UpdateBookingStatusView, NotificationsView,
    CategoryListView, HeroBannerListView
)

urlpatterns = [
    # ── Travel Packages ──────────────────────────────────
    path('packages/', PackageListView.as_view(), name='package-list'),
    path('packages/<int:package_id>/', PackageDetailView.as_view(), name='package-detail'),
    path('packages/<int:package_id>/reviews/', PackageReviewsView.as_view(), name='package-reviews'),
    path('notifications/', NotificationsView.as_view(), name='notifications'),
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('banners/', HeroBannerListView.as_view(), name='hero-banners'),


    # ── Bookings ─────────────────────────────────────────
    path('packages/<int:package_id>/book/', BookPackageView.as_view(), name='book-package'),
    path('bookings/', UserBookingsView.as_view(), name='user-bookings'),
    path('bookings/<int:booking_id>/', DeleteBookingView.as_view(), name='delete-booking'),
    path('bookings/<int:booking_id>/review/', ReviewPackageView.as_view(), name='review-package'),

    # ── Admin ─────────────────────────────────────────────
    path('admin/bookings/', AllBookingsAdminView.as_view(), name='admin-all-bookings'),
    path('bookings/<int:booking_id>/status/', UpdateBookingStatusView.as_view(), name='update-booking-status'),
]