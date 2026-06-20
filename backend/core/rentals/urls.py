from django.urls import path
from .views import (
    FirebaseLoginView, DjangoLoginView, ProfileView, BecomeOwnerView,
    PropertyListView, PropertyDetailView, PropertyManagementView,
    RoomManagementView, BookVisitView, BookingsHistoryView, UpdateVisitStatusView,
    OwnerDashboardView, TenantRosterView, ComplaintListView, RentPaymentListView,
    DeletePropertyImageView, AnnouncementBannerView, GlobalNotificationView, HeroBannerListView, SupportInquiryView
)

urlpatterns = [
    # Auth Endpoints
    path('auth/firebase-login/', FirebaseLoginView.as_view(), name='firebase_login'),
    path('auth/django-login/', DjangoLoginView.as_view(), name='django_login'),
    
    # User / Tenant Profile & Become Owner
    path('rentals/profile/', ProfileView.as_view(), name='profile'),
    path('rentals/become-owner/', BecomeOwnerView.as_view(), name='become_owner'),
    
    # Guest Property Exploration
    path('rentals/properties/', PropertyListView.as_view(), name='property_list'),
    path('rentals/properties/<int:pk>/', PropertyDetailView.as_view(), name='property_detail'),
    
    # Owner Listing Management
    path('rentals/properties/manage/', PropertyManagementView.as_view(), name='property_add'),
    path('rentals/properties/manage/<int:pk>/', PropertyManagementView.as_view(), name='property_edit_delete'),
    path('rentals/properties/manage/images/<int:pk>/', DeletePropertyImageView.as_view(), name='delete_property_image'),
    path('rentals/properties/<int:property_id>/rooms/', RoomManagementView.as_view(), name='room_add'),
    path('rentals/properties/<int:property_id>/rooms/<int:pk>/', RoomManagementView.as_view(), name='room_edit_delete'),
    
    # Visit Bookings & History
    path('rentals/properties/<int:property_id>/visit/', BookVisitView.as_view(), name='book_visit'),
    path('rentals/bookings/', BookingsHistoryView.as_view(), name='bookings_history'),
    path('rentals/bookings/<int:pk>/', UpdateVisitStatusView.as_view(), name='update_visit_status'),
    
    # Owner Dashboard analytics
    path('rentals/owner/dashboard/', OwnerDashboardView.as_view(), name='owner_dashboard'),
    
    # Tenants
    path('rentals/owner/tenants/', TenantRosterView.as_view(), name='tenant_roster'),
    path('rentals/owner/tenants/<int:pk>/', TenantRosterView.as_view(), name='tenant_detail'),
    
    # Complaints (Guest submissions, Owner list & update)
    path('rentals/owner/complaints/', ComplaintListView.as_view(), name='complaints_list'),
    path('rentals/owner/complaints/<int:pk>/', ComplaintListView.as_view(), name='complaint_update'),
    
    # Rent Payments Tracking
    path('rentals/owner/payments/', RentPaymentListView.as_view(), name='payments_list'),

    # Admin Controlled Banner and Notifications
    path('rentals/banner/', AnnouncementBannerView.as_view(), name='active_banner'),
    path('rentals/notifications/', GlobalNotificationView.as_view(), name='active_notifications'),
    path('rentals/hero-banners/', HeroBannerListView.as_view(), name='hero_banners_list'),
    path('rentals/support/', SupportInquiryView.as_view(), name='support_inquiry'),
]
