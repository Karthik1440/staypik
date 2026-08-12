from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django import forms
from .models import (
    User, OwnerProfile, Property, PropertyImage, Room, 
    VisitRequest, Tenant, Complaint, RentPayment,
    AnnouncementBanner, GlobalNotification, HeroBanner, SupportInquiry
)

class RoomAdminForm(forms.ModelForm):
    ROOM_TYPE_CHOICES = [
        ('Single Sharing', 'Single Sharing'),
        ('Double Sharing', 'Double Sharing'),
        ('Triple Sharing', 'Triple Sharing'),
        ('Four Sharing', 'Four Sharing'),
        ('Private Room', 'Private Room'),
        ('1 BHK', '1 BHK Flat'),
        ('2 BHK', '2 BHK Flat'),
        ('3 BHK', '3 BHK Flat'),
        ('1 RK', '1 RK Studio'),
        ('Studio Apartment', 'Studio Apartment'),
    ]
    FURNISHING_CHOICES = [
        ('', '-- Select Furnishing --'),
        ('Fully Furnished', 'Fully Furnished'),
        ('Semi-Furnished', 'Semi-Furnished'),
        ('Unfurnished', 'Unfurnished'),
    ]
    BATHROOM_CHOICES = [
        ('', '-- Select Washroom --'),
        ('Attached', 'Attached Washroom'),
        ('Common', 'Common Washroom'),
        ('1', '1 Washroom'),
        ('2', '2 Washrooms'),
        ('3', '3 Washrooms'),
    ]

    room_type = forms.ChoiceField(choices=ROOM_TYPE_CHOICES, initial='Single Sharing', help_text="Select room or flat configuration type")
    furnishing = forms.ChoiceField(choices=FURNISHING_CHOICES, required=False)
    bathroom = forms.ChoiceField(choices=BATHROOM_CHOICES, required=False)

    class Meta:
        model = Room
        fields = '__all__'

    def save(self, commit=True):
        instance = super().save(commit=False)
        if not instance.room_number:
            instance.room_number = instance.room_type or 'Option'
        if not instance.floor:
            instance.floor = 1
        if commit:
            instance.save()
        return instance

# Inline models for property images and rooms
class PropertyImageInline(admin.TabularInline):
    model = PropertyImage
    extra = 1

class RoomInline(admin.TabularInline):
    model = Room
    form = RoomAdminForm
    fields = ('room_type', 'total_beds', 'occupied_beds', 'monthly_rent', 'deposit', 'furnishing', 'bathroom', 'balcony')
    extra = 1

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'display_name', 'role', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_active')
    search_fields = ('username', 'email', 'display_name')
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Profile Info', {'fields': ('display_name', 'role', 'avatar')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Custom Profile Info', {'fields': ('display_name', 'role')}),
    )

@admin.register(OwnerProfile)
class OwnerProfileAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'user', 'mobile_number', 'city', 'is_approved', 'created_at')
    list_filter = ('is_approved', 'city')
    list_editable = ('is_approved',)
    search_fields = ('full_name', 'mobile_number', 'city', 'user__email', 'user__username')
    actions = ['approve_owners', 'disapprove_owners']

    @admin.action(description="Approve selected owner profiles")
    def approve_owners(self, request, queryset):
        queryset.update(is_approved=True)

    @admin.action(description="Reject / Revoke selected owner profiles")
    def disapprove_owners(self, request, queryset):
        queryset.update(is_approved=False)

@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'property_type', 'gender', 'city', 'base_rent', 'is_active', 'is_verified', 'is_featured', 'created_at')
    list_filter = ('property_type', 'gender', 'city', 'is_active', 'is_verified', 'is_featured')
    list_editable = ('is_active', 'is_verified', 'is_featured')
    search_fields = ('name', 'locality', 'city', 'address', 'owner__username', 'owner__email')
    inlines = [PropertyImageInline, RoomInline]
    actions = ['make_verified', 'make_featured', 'make_active', 'make_inactive']

    @admin.action(description="Mark selected properties as Verified")
    def make_verified(self, request, queryset):
        queryset.update(is_verified=True)

    @admin.action(description="Mark selected properties as Featured")
    def make_featured(self, request, queryset):
        queryset.update(is_featured=True)

    @admin.action(description="Mark selected properties as Active")
    def make_active(self, request, queryset):
        queryset.update(is_active=True)

    @admin.action(description="Deactivate selected properties")
    def make_inactive(self, request, queryset):
        queryset.update(is_active=False)

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    form = RoomAdminForm
    list_display = ('property', 'room_type', 'total_beds', 'occupied_beds', 'vacant_beds_count', 'monthly_rent', 'deposit', 'updated_at')
    list_filter = ('room_type', 'property__city', 'property')
    list_editable = ('total_beds', 'occupied_beds', 'monthly_rent', 'deposit')
    search_fields = ('room_type', 'property__name', 'property__locality', 'property__city')
    readonly_fields = ('vacant_beds_display', 'updated_at')

    fieldsets = (
        ('Property & Configuration', {
            'fields': ('property', 'room_type')
        }),
        ('Capacity & Live Vacancy', {
            'fields': ('total_beds', 'occupied_beds', 'vacant_beds_display')
        }),
        ('Pricing & Security Deposit', {
            'fields': ('monthly_rent', 'deposit')
        }),
        ('Specifications & Amenities', {
            'fields': ('furnishing', 'bathroom', 'balcony')
        }),
        ('Metadata', {
            'fields': ('updated_at',)
        }),
    )

    def vacant_beds_count(self, obj):
        return max(0, obj.total_beds - obj.occupied_beds)
    vacant_beds_count.short_description = "Live Vacant Count"

    def vacant_beds_display(self, obj):
        if not obj or obj.pk is None:
            return "Calculates live vacancy upon saving"
        count = max(0, obj.total_beds - obj.occupied_beds)
        return f"{count} vacant out of {obj.total_beds} total beds/units"
    vacant_beds_display.short_description = "Calculated Vacancy Summary"

@admin.register(VisitRequest)
class VisitRequestAdmin(admin.ModelAdmin):
    list_display = ('user', 'property', 'room', 'visit_date', 'visit_time', 'phone', 'status', 'created_at')
    list_filter = ('status', 'visit_date', 'property')
    list_editable = ('status',)
    search_fields = ('phone', 'notes', 'user__username', 'user__email', 'property__name')
    actions = ['make_approved', 'make_completed', 'make_cancelled']

    @admin.action(description="Mark selected visit requests as Approved")
    def make_approved(self, request, queryset):
        queryset.update(status='APPROVED')

    @admin.action(description="Mark selected visit requests as Completed")
    def make_completed(self, request, queryset):
        queryset.update(status='COMPLETED')

    @admin.action(description="Mark selected visit requests as Cancelled")
    def make_cancelled(self, request, queryset):
        queryset.update(status='CANCELLED')

@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ('tenant_name', 'property', 'room', 'phone', 'lease_start', 'lease_end', 'is_active')
    list_filter = ('is_active', 'property')
    list_editable = ('is_active',)
    search_fields = ('tenant_name', 'phone', 'property__name')

@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = ('title', 'tenant', 'property', 'status', 'created_at')
    list_filter = ('status', 'property')
    list_editable = ('status',)
    search_fields = ('title', 'description', 'tenant__tenant_name', 'property__name')

@admin.register(RentPayment)
class RentPaymentAdmin(admin.ModelAdmin):
    list_display = ('tenant', 'amount', 'due_date', 'payment_date', 'status')
    list_filter = ('status', 'due_date')
    list_editable = ('status',)
    search_fields = ('tenant__tenant_name',)

@admin.register(SupportInquiry)
class SupportInquiryAdmin(admin.ModelAdmin):
    list_display = ('subject', 'user', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('subject', 'message', 'user__email', 'user__username')

@admin.register(AnnouncementBanner)
class AnnouncementBannerAdmin(admin.ModelAdmin):
    list_display = ('text', 'is_active', 'updated_at')
    list_editable = ('is_active',)

@admin.register(GlobalNotification)
class GlobalNotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'notification_type', 'is_active', 'created_at')
    list_filter = ('notification_type', 'is_active')
    search_fields = ('title', 'message')

@admin.register(HeroBanner)
class HeroBannerAdmin(admin.ModelAdmin):
    list_display = ('title', 'order', 'is_active', 'created_at')
    list_editable = ('order', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('title', 'subtitle')
