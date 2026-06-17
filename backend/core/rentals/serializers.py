from rest_framework import serializers
from .models import User, OwnerProfile, Property, PropertyImage, Room, VisitRequest, Tenant, Complaint, RentPayment, AnnouncementBanner, GlobalNotification, HeroBanner, SupportInquiry

class UserSerializer(serializers.ModelSerializer):
    is_owner_approved = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'display_name', 'role', 'avatar', 'is_owner_approved']

    def get_is_owner_approved(self, obj):
        if obj.role == 'OWNER':
            profile = getattr(obj, 'owner_profile', None)
            return profile.is_approved if profile else False
        return False

class OwnerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = OwnerProfile
        fields = ['id', 'full_name', 'mobile_number', 'city', 'address', 'is_approved', 'created_at']

class PropertyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ['id', 'image', 'alt_text']

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['id', 'room_number', 'room_type', 'total_beds', 'occupied_beds', 'monthly_rent', 'deposit']

import math

def calculate_distance(lat1, lon1, lat2, lon2):
    # Haversine formula to calculate distance in km
    R = 6371.0
    
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) * math.sin(dlat / 2) + \
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
        math.sin(dlon / 2) * math.sin(dlon / 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

class PropertySerializer(serializers.ModelSerializer):
    images = PropertyImageSerializer(many=True, read_only=True)
    rooms = RoomSerializer(many=True, read_only=True)
    owner_name = serializers.ReadOnlyField(source='owner.display_name')
    owner_phone = serializers.SerializerMethodField()
    distance = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = [
            'id', 'owner', 'owner_name', 'owner_phone', 'name', 'property_type', 'gender',
            'address', 'locality', 'city', 'description', 'base_rent', 'deposit', 
            'amenities', 'is_active', 'is_verified', 'latitude', 'longitude', 'distance', 'images', 'rooms', 'created_at'
        ]

    def get_owner_phone(self, obj):
        profile = getattr(obj.owner, 'owner_profile', None)
        return profile.mobile_number if profile else ""

    def get_distance(self, obj):
        request = self.context.get('request')
        if not request:
            return None
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        if not lat or not lng:
            return None
        try:
            user_lat = float(lat)
            user_lng = float(lng)
            if obj.latitude is not None and obj.longitude is not None:
                return calculate_distance(user_lat, user_lng, float(obj.latitude), float(obj.longitude))
        except ValueError:
            pass
        return None

class VisitRequestSerializer(serializers.ModelSerializer):
    property_name = serializers.ReadOnlyField(source='property.name')
    property_locality = serializers.ReadOnlyField(source='property.locality')
    property_type = serializers.ReadOnlyField(source='property.property_type')
    user_email = serializers.ReadOnlyField(source='user.email')
    room_number = serializers.ReadOnlyField(source='room.room_number')
    room_type = serializers.ReadOnlyField(source='room.room_type')

    class Meta:
        model = VisitRequest
        fields = [
            'id', 'user', 'user_email', 'property', 'property_name', 
            'property_locality', 'property_type', 'room', 'room_number', 'room_type',
            'visit_date', 'visit_time', 'phone', 'notes', 'status', 'created_at'
        ]
        read_only_fields = ['user', 'status']

class TenantSerializer(serializers.ModelSerializer):
    property_name = serializers.ReadOnlyField(source='property.name')
    room_number = serializers.ReadOnlyField(source='room.room_number')

    class Meta:
        model = Tenant
        fields = [
            'id', 'user', 'property', 'property_name', 'room', 'room_number', 
            'tenant_name', 'phone', 'lease_start', 'lease_end', 'is_active'
        ]

class ComplaintSerializer(serializers.ModelSerializer):
    tenant_name = serializers.ReadOnlyField(source='tenant.tenant_name')
    property_name = serializers.ReadOnlyField(source='property.name')

    class Meta:
        model = Complaint
        fields = [
            'id', 'tenant', 'tenant_name', 'property', 'property_name', 
            'title', 'description', 'status', 'created_at'
        ]

class RentPaymentSerializer(serializers.ModelSerializer):
    tenant_name = serializers.ReadOnlyField(source='tenant.tenant_name')
    room_number = serializers.ReadOnlyField(source='tenant.room.room_number')
    tenant_phone = serializers.ReadOnlyField(source='tenant.phone')

    class Meta:
        model = RentPayment
        fields = [
            'id', 'tenant', 'tenant_name', 'room_number', 'tenant_phone', 'amount', 
            'due_date', 'payment_date', 'status'
        ]


class AnnouncementBannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnnouncementBanner
        fields = ['id', 'text', 'is_active', 'updated_at']


class GlobalNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = GlobalNotification
        fields = ['id', 'title', 'message', 'notification_type', 'is_active', 'created_at']


class HeroBannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = HeroBanner
        fields = ['id', 'title', 'subtitle', 'image', 'button_text', 'link_url', 'order', 'is_active', 'badge_text', 'feature_1', 'feature_2', 'feature_3', 'feature_4', 'localities', 'created_at']


class SupportInquirySerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    class Meta:
        model = SupportInquiry
        fields = ['id', 'user', 'user_email', 'subject', 'message', 'created_at']
        read_only_fields = ['user']

