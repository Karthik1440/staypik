from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    User, OwnerProfile, Property, PropertyImage, Room, 
    VisitRequest, Tenant, Complaint, RentPayment, 
    AnnouncementBanner, GlobalNotification, HeroBanner, SupportInquiry
)

# Inline models for property images and rooms
class PropertyImageInline(admin.TabularInline):
    model = PropertyImage
    extra = 1

class RoomInline(admin.TabularInline):
    model = Room
    extra = 1

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'display_name', 'role', 'is_staff')
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('display_name', 'role')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {'fields': ('display_name', 'role')}),
    )

@admin.register(OwnerProfile)
class OwnerProfileAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'mobile_number', 'city', 'is_approved')
    list_filter = ('is_approved', 'city')
    list_editable = ('is_approved',)
    search_fields = ('full_name', 'mobile_number', 'city')

@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'property_type', 'gender', 'city', 'base_rent', 'is_active', 'is_verified', 'is_featured')
    list_filter = ('property_type', 'gender', 'city', 'is_active', 'is_verified', 'is_featured')
    list_editable = ('is_active', 'is_verified', 'is_featured')
    search_fields = ('name', 'locality', 'city', 'address')
    inlines = [PropertyImageInline, RoomInline]

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('room_number', 'property', 'room_type', 'total_beds', 'occupied_beds', 'monthly_rent')
    list_filter = ('room_type', 'property')

@admin.register(VisitRequest)
class VisitRequestAdmin(admin.ModelAdmin):
    list_display = ('user', 'property', 'visit_date', 'visit_time', 'phone', 'status')
    list_filter = ('status', 'visit_date')
    search_fields = ('phone', 'notes')

@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ('tenant_name', 'property', 'room', 'phone', 'lease_start', 'is_active')
    list_filter = ('is_active', 'property')
    search_fields = ('tenant_name', 'phone')

@admin.register(SupportInquiry)
class SupportInquiryAdmin(admin.ModelAdmin):
    list_display = ('user', 'subject', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('subject', 'message', 'user__email', 'user__username')

@admin.register(RentPayment)
class RentPaymentAdmin(admin.ModelAdmin):
    list_display = ('tenant', 'amount', 'due_date', 'payment_date', 'status')
    list_filter = ('status', 'due_date')

@admin.register(AnnouncementBanner)
class AnnouncementBannerAdmin(admin.ModelAdmin):
    list_display = ('text', 'is_active', 'updated_at')
    list_editable = ('is_active',)

@admin.register(GlobalNotification)
class GlobalNotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'notification_type', 'is_active', 'created_at')
    list_filter = ('notification_type', 'is_active')
    search_fields = ('title', 'message')


@admin.register(HeroBanner)
class HeroBannerAdmin(admin.ModelAdmin):
    list_display = ('title', 'order', 'is_active', 'created_at')
    list_editable = ('order', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('title', 'subtitle')
