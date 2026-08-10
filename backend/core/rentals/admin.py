from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    User, OwnerProfile, Property, PropertyImage, Room, 
    VisitRequest, AnnouncementBanner, GlobalNotification, HeroBanner, SupportInquiry
)

from django import forms

class RoomAdminForm(forms.ModelForm):
    ROOM_TYPE_CHOICES = [
        ('Single', 'Single'),
        ('Double Sharing', 'Double Sharing'),
        ('Triple Sharing', 'Triple Sharing'),
        ('Four Sharing', 'Four Sharing'),
        ('1 BHK', '1 BHK'),
        ('2 BHK', '2 BHK'),
        ('3 BHK', '3 BHK'),
        ('4 BHK', '4 BHK'),
        ('Studio', 'Studio'),
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

    room_type = forms.ChoiceField(choices=ROOM_TYPE_CHOICES, initial='Single', help_text="Select room or flat configuration type")
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
    form = RoomAdminForm
    list_display = ('property', 'room_type', 'total_beds', 'occupied_beds', 'vacant_beds', 'monthly_rent', 'deposit')
    list_filter = ('room_type', 'property__city', 'property')
    list_editable = ('total_beds', 'occupied_beds', 'monthly_rent', 'deposit')
    search_fields = ('room_type', 'property__name', 'property__locality', 'property__city')
    readonly_fields = ('vacant_beds_display',)

    fieldsets = (
        ('Property & Room Type', {
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
    )

    def vacant_beds(self, obj):
        return max(0, obj.total_beds - obj.occupied_beds)
    vacant_beds.short_description = "Vacant Beds / Units"

    def vacant_beds_display(self, obj):
        if not obj or obj.pk is None:
            return "Will calculate live vacancy upon saving"
        count = max(0, obj.total_beds - obj.occupied_beds)
        return f"{count} vacant out of {obj.total_beds} total"
    vacant_beds_display.short_description = "Live Vacant Count"

@admin.register(VisitRequest)
class VisitRequestAdmin(admin.ModelAdmin):
    list_display = ('user', 'property', 'visit_date', 'visit_time', 'phone', 'status')
    list_filter = ('status', 'visit_date')
    search_fields = ('phone', 'notes')

@admin.register(SupportInquiry)
class SupportInquiryAdmin(admin.ModelAdmin):
    list_display = ('user', 'subject', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('subject', 'message', 'user__email', 'user__username')

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
