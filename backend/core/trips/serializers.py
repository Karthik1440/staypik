from rest_framework import serializers
from .models import (
    AppUser, TourPackage, DayItinerary, ItineraryPlace, PricingBreakdown,
    PackageIncludeExclude, PackageAddon, PackageBooking, PackageReview, Notification,
    PackageImage, Category, HeroBanner
)

class ItineraryPlaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItineraryPlace
        fields = ['place_name', 'type']

class DayItinerarySerializer(serializers.ModelSerializer):
    places = ItineraryPlaceSerializer(many=True, read_only=True)
    class Meta:
        model = DayItinerary
        fields = ['day_number', 'title', 'description', 'travel_distance_km', 'travel_time', 'stay_type', 'places']

class PricingBreakdownSerializer(serializers.ModelSerializer):
    class Meta:
        model = PricingBreakdown
        fields = ['transport_cost_total', 'stay_cost_total', 'food_cost_per_person', 'activity_cost_per_person', 'fuel_cost', 'price_per_person_calculated']

class PackageIncludeExcludeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PackageIncludeExclude
        fields = ['type', 'text']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon']

class HeroBannerSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    class Meta:
        model = HeroBanner
        fields = ['id', 'title', 'subtitle', 'image_url', 'link_to']

    def get_image_url(self, obj):
        if obj.image:
            url = obj.image.url
            if url.startswith('http'):
                return url
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(url)
        return None

class PackageAddonSerializer(serializers.ModelSerializer):
    class Meta:
        model = PackageAddon
        fields = ['name', 'price', 'description']

class PackageImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    class Meta:
        model = PackageImage
        fields = ['url', 'alt_text']

    def get_url(self, obj):
        if obj.image:
            url = obj.image.url
            if url.startswith('http'):
                return url
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(url)
        return None

class PackageReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.email', read_only=True)
    class Meta:
        model = PackageReview
        fields = ['id', 'rating', 'title', 'review_text', 'user_name', 'created_at']

class PackageListSerializer(serializers.ModelSerializer):
    # Mapping for frontend compatibility
    to_location = serializers.CharField(source='destination', read_only=True)
    from_location = serializers.CharField(source='start_location', read_only=True)
    days = serializers.IntegerField(source='duration_days', read_only=True)
    nights = serializers.IntegerField(source='duration_nights', read_only=True)
    price_per_person = serializers.DecimalField(source='base_price_per_person', max_digits=10, decimal_places=2, read_only=True)
    banner_url = serializers.SerializerMethodField()
    category_name = serializers.SerializerMethodField()
    category_icon = serializers.SerializerMethodField()

    class Meta:
        model = TourPackage
        fields = [
            'id', 'title', 'description', 'to_location', 'from_location', 
            'days', 'nights', 'price_per_person', 'avg_rating', 
            'total_reviews', 'total_bookings', 'banner_url', 'is_active',
            'category_name', 'category_icon'
        ]

    def get_banner_url(self, obj):
        if obj.cover_image:
            url = obj.cover_image.url
            if url.startswith('http'):
                return url
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(url)
        return None

    def get_category_name(self, obj):
        return obj.category.name if obj.category else None

    def get_category_icon(self, obj):
        return obj.category.icon if obj.category else None

class PackageDetailSerializer(serializers.ModelSerializer):
    # Backward compatibility
    to_location = serializers.CharField(source='destination', read_only=True)
    from_location = serializers.CharField(source='start_location', read_only=True)
    days = serializers.IntegerField(source='duration_days', read_only=True)
    nights = serializers.IntegerField(source='duration_nights', read_only=True)
    price_per_person = serializers.DecimalField(source='base_price_per_person', max_digits=10, decimal_places=2, read_only=True)
    banner_url = serializers.SerializerMethodField()
    
    # New relationships
    itinerary = DayItinerarySerializer(source='itinerary_days', many=True, read_only=True)
    pricing = PricingBreakdownSerializer(read_only=True)
    includes_excludes = PackageIncludeExcludeSerializer(many=True, read_only=True)
    addons = PackageAddonSerializer(many=True, read_only=True)
    reviews = PackageReviewSerializer(many=True, read_only=True)
    gallery = PackageImageSerializer(source='gallery_images', many=True, read_only=True)
    category_info = CategorySerializer(source='category', read_only=True)

    class Meta:
        model = TourPackage
        fields = [
            'id', 'title', 'description', 'to_location', 'from_location',
            'days', 'nights', 'price_per_person', 'banner_url',
            'avg_rating', 'total_reviews', 'total_bookings',
            'itinerary', 'pricing', 'includes_excludes', 'addons', 'reviews', 'gallery',
            'category_info'
        ]

    def get_banner_url(self, obj):
        if obj.cover_image:
            url = obj.cover_image.url
            if url.startswith('http'):
                return url
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(url)
        return None

    def get_category_name(self, obj):
        return obj.category.name if obj.category else None

    def get_category_icon(self, obj):
        return obj.category.icon if obj.category else None

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class PackageBookingSerializer(serializers.ModelSerializer):
    package_title = serializers.CharField(source='package.title', read_only=True)
    destination = serializers.CharField(source='package.destination', read_only=True)
    days = serializers.IntegerField(source='package.duration_days', read_only=True)
    nights = serializers.IntegerField(source='package.duration_nights', read_only=True)
    package_banner = serializers.SerializerMethodField()

    class Meta:
        model = PackageBooking
        fields = '__all__'

    def get_package_banner(self, obj):
        if obj.package.cover_image:
            url = obj.package.cover_image.url
            if url.startswith('http'):
                return url
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(url)
        return None

class PackageReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PackageReview
        fields = [
            'rating', 'title', 'review_text',
            'accommodation_rating', 'guide_rating', 'experience_rating',
            'review_photo'
        ]