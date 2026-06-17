from django.contrib import admin
from django.utils.html import format_html
from .models import (
    AppUser, TourPackage, DayItinerary, ItineraryPlace, PricingBreakdown,
    PackageIncludeExclude, PackageAddon, PackageBooking, PackageReview, Notification,
    PackageImage, Category, HeroBanner
)

@admin.register(AppUser)
class AppUserAdmin(admin.ModelAdmin):
    list_display = ['email', 'display_name', 'created_at']

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'icon', 'is_active']
    prepopulated_fields = {'slug': ('name',)}

@admin.register(HeroBanner)
class HeroBannerAdmin(admin.ModelAdmin):
    list_display = ['title', 'order', 'is_active', 'image_preview']
    list_editable = ['order', 'is_active']
    
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="height: 50px; border-radius: 4px;" />', obj.image.url)
        return "-"


class PricingBreakdownInline(admin.StackedInline):
    model = PricingBreakdown
    extra = 1
    max_num = 1

class PackageIncludeExcludeInline(admin.TabularInline):
    model = PackageIncludeExclude
    extra = 1

class PackageAddonInline(admin.TabularInline):
    model = PackageAddon
    extra = 1

class DayItineraryInline(admin.StackedInline):
    model = DayItinerary
    extra = 1

class PackageImageInline(admin.TabularInline):
    model = PackageImage
    extra = 4
    fields = ['image', 'image_preview', 'alt_text']
    readonly_fields = ['image_preview']

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="height: 50px; border-radius: 4px;" />', obj.image.url)
        return "-"


@admin.register(TourPackage)
class TourPackageAdmin(admin.ModelAdmin):
    list_display = ['title', 'destination', 'category', 'duration', 'base_price_per_person', 'is_active']
    list_filter = ['is_active', 'destination', 'category']
    search_fields = ['title', 'destination', 'start_location']
    
    inlines = [
        PricingBreakdownInline,
        PackageImageInline,  # Added gallery
        DayItineraryInline,
        PackageIncludeExcludeInline,
        PackageAddonInline
    ]

    @admin.display(description='Duration')
    def duration(self, obj):
        return f"{obj.duration_days}D/{obj.duration_nights}N"


class ItineraryPlaceInline(admin.TabularInline):
    model = ItineraryPlace
    extra = 1

@admin.register(DayItinerary)
class DayItineraryAdmin(admin.ModelAdmin):
    list_display = ['package', 'day_number', 'title']
    list_filter = ['package']
    inlines = [ItineraryPlaceInline]


@admin.register(PackageBooking)
class PackageBookingAdmin(admin.ModelAdmin):
    list_display = ['id', 'user_email', 'package_title', 'status', 'status_badge', 'total_cost_display', 'created_at']
    list_filter = ['status', 'package', 'created_at']
    search_fields = ['user__email', 'package__title', 'id']
    list_editable = ['status']
    readonly_fields = ['created_at', 'updated_at']
    
    actions = ['mark_as_confirmed', 'mark_as_completed', 'mark_as_cancelled']

    @admin.display(description='User')
    def user_email(self, obj):
        return obj.user.email

    @admin.display(description='Package')
    def package_title(self, obj):
        return obj.package.title

    @admin.display(description='Cost')
    def total_cost_display(self, obj):
        return f"₹{int(obj.total_cost):,}"

    @admin.display(description='Status')
    def status_badge(self, obj):
        colors = {
            'inquiry': '#f59e0b',   # Amber
            'confirmed': '#10b981', # Emerald
            'completed': '#3b82f6', # Blue
            'cancelled': '#ef4444'  # Red
        }
        color = colors.get(obj.status, '#6b7280')
        return format_html(
            '<span style="background: {}; color: white; padding: 4px 10px; border-radius: 8px; font-weight: bold; font-size: 11px;">{}</span>',
            color, obj.status.upper()
        )

    # Quick Actions
    @admin.action(description="✅ Mark selected as Confirmed")
    def mark_as_confirmed(self, request, queryset):
        queryset.update(status='confirmed')

    @admin.action(description="🎉 Mark selected as Completed")
    def mark_as_completed(self, request, queryset):
        queryset.update(status='completed')

    @admin.action(description="❌ Mark selected as Cancelled")
    def mark_as_cancelled(self, request, queryset):
        queryset.update(status='cancelled')


@admin.register(PackageReview)
class PackageReviewAdmin(admin.ModelAdmin):
    list_display = ['user', 'package', 'rating', 'created_at']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'notification_type', 'is_active']