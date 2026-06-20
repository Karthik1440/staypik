import json
import os
from django.conf import settings
from django.db.models import Sum, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

import firebase_admin
from firebase_admin import credentials, auth as firebase_auth

from .models import (
    User, OwnerProfile, Property, PropertyImage, Room, VisitRequest, 
    Tenant, Complaint, RentPayment, AnnouncementBanner, GlobalNotification, HeroBanner, SupportInquiry
)
from .serializers import (
    UserSerializer, OwnerProfileSerializer, PropertySerializer, 
    PropertyImageSerializer, RoomSerializer, VisitRequestSerializer, 
    TenantSerializer, ComplaintSerializer, RentPaymentSerializer,
    AnnouncementBannerSerializer, GlobalNotificationSerializer, HeroBannerSerializer, SupportInquirySerializer
)

# ──────────────────────────────────────────────────────────
# ── FIREBASE INITIALIZER ──
# ──────────────────────────────────────────────────────────

def get_firebase_app():
    if not firebase_admin._apps:
        firebase_creds_str = os.getenv("FIREBASE_CREDENTIALS")
        if firebase_creds_str:
            try:
                firebase_creds = json.loads(firebase_creds_str)
                cred = credentials.Certificate(firebase_creds)
                print("Using Firebase from ENV credentials")
            except Exception as e:
                raise Exception(f"Invalid FIREBASE_CREDENTIALS: {str(e)}")
        else:
            cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
            if not cred_path:
                # Fallback to current settings config or search
                cred_path = getattr(settings, 'FIREBASE_CREDENTIALS_PATH', None)
            
            if cred_path and os.path.exists(cred_path):
                print("Using Firebase credential path:", cred_path)
                cred = credentials.Certificate(cred_path)
            else:
                # Try core subdirectory fallback
                fallback_path = os.path.join(settings.BASE_DIR, 'core', 'firebase-key.json')
                if os.path.exists(fallback_path):
                    print("Using fallback Firebase credential path:", fallback_path)
                    cred = credentials.Certificate(fallback_path)
                else:
                    raise Exception("Firebase credentials not configured or key not found")

        firebase_admin.initialize_app(cred)

# Helper to generate JWT tokens programmatically
def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

class IsApprovedOwner(BasePermission):
    """
    Allows access only to approved owners.
    If REQUIRE_OWNER_APPROVAL settings option is False, any OWNER is allowed.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role != 'OWNER':
            return False
        if getattr(settings, 'REQUIRE_OWNER_APPROVAL', True):
            profile = getattr(request.user, 'owner_profile', None)
            return profile is not None and profile.is_approved
        return True

# ──────────────────────────────────────────────────────────
# ── AUTHENTICATION VIEWS ──
# ──────────────────────────────────────────────────────────

class FirebaseLoginView(APIView):
    """
    POST: Accepts idToken from client (Firebase login).
    Verifies it, logs in/creates User in Django, and issues SimpleJWT.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        id_token = request.data.get('idToken')
        if not id_token:
            return Response({'detail': 'idToken is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            get_firebase_app()
            decoded_token = firebase_auth.verify_id_token(id_token)
        except Exception as e:
            # Offline local development fallback: decode JWT payload without verification
            if not settings.DEBUG:
                return Response({
                    'detail': f'Token verification failed: {str(e)}'
                }, status=status.HTTP_401_UNAUTHORIZED)
            try:
                import base64
                import json
                parts = id_token.split('.')
                if len(parts) == 3:
                    payload_b64 = parts[1]
                    payload_b64 += '=' * (4 - len(payload_b64) % 4)
                    payload_json = base64.urlsafe_b64decode(payload_b64).decode('utf-8')
                    decoded_token = json.loads(payload_json)
                else:
                    raise Exception("Invalid JWT token format")
            except Exception as decode_err:
                return Response({
                    'detail': f'Token verification and fallback decoding failed: {str(e)} | {str(decode_err)}'
                }, status=status.HTTP_401_UNAUTHORIZED)

        uid = decoded_token.get('uid') or decoded_token.get('user_id') or decoded_token.get('sub')
        if not uid:
            return Response({'detail': 'UID could not be extracted from token'}, status=status.HTTP_400_BAD_REQUEST)

        display_name = request.data.get('displayName')
        email = decoded_token.get('email', '')
        name = display_name or decoded_token.get('name') or email.split('@')[0] if email else 'Guest'

        user, created = User.objects.get_or_create(
            username=uid,
            defaults={'email': email, 'display_name': name, 'role': 'USER'}
        )
        if not created and display_name:
            user.display_name = display_name
            user.save()

        jwt_tokens = get_tokens_for_user(user)
        user_serializer = UserSerializer(user, context={'request': request})

        return Response({
            'tokens': jwt_tokens,
            'user': user_serializer.data
        }, status=status.HTTP_200_OK)

from django.contrib.auth import authenticate
class DjangoLoginView(APIView):
    """
    POST: Direct Django database login using username/email and password.
    Bypasses Firebase Auth for easy local dashboard testing.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username') or request.data.get('email')
        password = request.data.get('password')

        if not username or not password:
            return Response({'detail': 'Email/Username and password are required'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=username, password=password)
        if not user:
            try:
                user_obj = User.objects.get(email=username)
                user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                pass

        if not user:
            return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        jwt_tokens = get_tokens_for_user(user)
        user_serializer = UserSerializer(user, context={'request': request})

        return Response({
            'tokens': jwt_tokens,
            'user': user_serializer.data
        }, status=status.HTTP_200_OK)

class ProfileView(APIView):
    """GET/PATCH user profile details"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_serializer = UserSerializer(request.user, context={'request': request})
        res_data = {'user': user_serializer.data}
        if request.user.role == 'OWNER':
            profile = getattr(request.user, 'owner_profile', None)
            if profile:
                res_data['owner_profile'] = OwnerProfileSerializer(profile).data
        return Response(res_data)

    def patch(self, request):
        user = request.user
        display_name = request.data.get('display_name')
        if display_name:
            user.display_name = display_name
        
        avatar = request.FILES.get('avatar') or request.data.get('avatar')
        if avatar and not isinstance(avatar, str):
            user.avatar = avatar
            
        user.save()
        
        # If Owner profile is present, also allow updating it
        if user.role == 'OWNER' and hasattr(user, 'owner_profile'):
            profile = user.owner_profile
            serializer = OwnerProfileSerializer(profile, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()

        user_serializer = UserSerializer(user, context={'request': request})
        res_data = {'user': user_serializer.data}
        if user.role == 'OWNER' and hasattr(user, 'owner_profile'):
            res_data['owner_profile'] = OwnerProfileSerializer(user.owner_profile).data

        return Response(res_data)

class BecomeOwnerView(APIView):
    """
    POST: Converts a normal USER into an OWNER.
    Creates OwnerProfile and registers the first Property listing.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        full_name = request.data.get('full_name')
        mobile_number = request.data.get('mobile_number')
        property_name = request.data.get('property_name')
        property_type = request.data.get('property_type')
        city = request.data.get('city')
        address = request.data.get('address')

        if not all([full_name, mobile_number, property_name, property_type, city, address]):
            return Response({'detail': 'All fields are required'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if already owner profile
        if hasattr(user, 'owner_profile'):
            return Response({'detail': 'Already an Owner'}, status=status.HTTP_400_BAD_REQUEST)

        # Update role
        user.role = 'OWNER'
        user.save()

        # Create Profile
        profile = OwnerProfile.objects.create(
            user=user,
            full_name=full_name,
            mobile_number=mobile_number,
            city=city,
            address=address
        )

        # Create first property listing (with rent = 0 placeholder)
        prop = Property.objects.create(
            owner=user,
            name=property_name,
            property_type=property_type,
            city=city,
            address=address,
            locality=city, # default locality to city for now
            description=f"Welcome to {property_name}. High quality renting PG/hostel.",
            base_rent=0,
            deposit=0
        )

        return Response({
            'user': UserSerializer(user).data,
            'owner_profile': OwnerProfileSerializer(profile).data,
            'property_id': prop.id
        }, status=status.HTTP_200_OK)

# ──────────────────────────────────────────────────────────
# ── PROPERTIES & ROOMS VIEWS ──
# ──────────────────────────────────────────────────────────

class PropertyListView(APIView):
    """GET: Search and browse rental listings with filters"""
    permission_classes = [AllowAny]

    def get(self, request):
        city = request.query_params.get('city')
        locality = request.query_params.get('locality')
        prop_type = request.query_params.get('type')
        gender = request.query_params.get('gender')
        max_rent = request.query_params.get('max_rent')
        search_query = request.query_params.get('search')
        owner_only = request.query_params.get('owner') == 'true'

        if owner_only and request.user.is_authenticated:
            properties = Property.objects.filter(owner=request.user).prefetch_related('images', 'rooms')
        else:
            properties = Property.objects.filter(is_active=True).prefetch_related('images', 'rooms')

        if city:
            properties = properties.filter(city__icontains=city)
        if locality:
            properties = properties.filter(locality__icontains=locality)
        if prop_type:
            properties = properties.filter(property_type=prop_type)
        if gender:
            properties = properties.filter(gender=gender)
        if max_rent:
            properties = properties.filter(base_rent__lte=max_rent)
        if search_query:
            properties = properties.filter(
                Q(name__icontains=search_query) | 
                Q(locality__icontains=search_query) | 
                Q(description__icontains=search_query)
            )

        serializer = PropertySerializer(properties, many=True, context={'request': request})
        data = serializer.data

        # Sort by distance if coordinates are provided
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        if lat and lng:
            data.sort(key=lambda x: x.get('distance') if x.get('distance') is not None else float('inf'))

        return Response(data)

class PropertyDetailView(APIView):
    """GET: Retrieve details and room tables for a single listing"""
    permission_classes = [AllowAny]

    def get(self, request, pk):
        prop = get_object_or_404(Property.objects.prefetch_related('images', 'rooms'), id=pk)
        
        # Restrict deactivated listings to the owner and staff
        if not prop.is_active:
            if not request.user.is_authenticated or (request.user != prop.owner and not request.user.is_staff):
                return Response(
                    {'detail': 'This listing has been deactivated.'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        
        serializer = PropertySerializer(prop, context={'request': request})
        return Response(serializer.data)

class PropertyManagementView(APIView):
    """
    POST: Add property (Owner only).
    PUT/DELETE: Update or delete owner's properties.
    """
    permission_classes = [IsApprovedOwner]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def post(self, request):
        if request.user.role != 'OWNER':
            return Response({'detail': 'Only owners can list properties'}, status=status.HTTP_403_FORBIDDEN)

        name = request.data.get('name')
        property_type = request.data.get('property_type')
        gender = request.data.get('gender', 'Unisex')
        address = request.data.get('address')
        locality = request.data.get('locality')
        city = request.data.get('city')
        description = request.data.get('description', '')
        base_rent = request.data.get('base_rent', 0)
        deposit = request.data.get('deposit', 0)
        amenities_raw = request.data.get('amenities', '[]')
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')

        try:
            amenities = json.loads(amenities_raw) if isinstance(amenities_raw, str) else amenities_raw
        except Exception:
            amenities = []

        if not all([name, property_type, address, locality, city]):
            return Response({'detail': 'Missing mandatory property details'}, status=status.HTTP_400_BAD_REQUEST)

        lat_val = None
        if latitude and str(latitude).strip():
            try:
                lat_val = float(latitude)
            except ValueError:
                pass
        
        lng_val = None
        if longitude and str(longitude).strip():
            try:
                lng_val = float(longitude)
            except ValueError:
                pass

        prop = Property.objects.create(
            owner=request.user,
            name=name,
            property_type=property_type,
            gender=gender,
            address=address,
            locality=locality,
            city=city,
            description=description,
            base_rent=base_rent,
            deposit=deposit,
            amenities=amenities,
            latitude=lat_val,
            longitude=lng_val
        )

        # Handle file uploads if present
        images = request.FILES.getlist('images')
        for img in images:
            PropertyImage.objects.create(property=prop, image=img)

        return Response(PropertySerializer(prop).data, status=status.HTTP_201_CREATED)

    def put(self, request, pk):
        prop = get_object_or_404(Property, id=pk, owner=request.user)
        
        name = request.data.get('name')
        if name: prop.name = name
        
        prop_type = request.data.get('property_type')
        if prop_type: prop.property_type = prop_type

        gender = request.data.get('gender')
        if gender: prop.gender = gender
        
        address = request.data.get('address')
        if address: prop.address = address
        
        locality = request.data.get('locality')
        if locality: prop.locality = locality
        
        city = request.data.get('city')
        if city: prop.city = city
        
        description = request.data.get('description')
        if description: prop.description = description
        
        base_rent = request.data.get('base_rent')
        if base_rent: prop.base_rent = base_rent

        deposit = request.data.get('deposit')
        if deposit is not None: prop.deposit = deposit
        
        amenities_raw = request.data.get('amenities')
        if amenities_raw:
            try:
                prop.amenities = json.loads(amenities_raw) if isinstance(amenities_raw, str) else amenities_raw
            except Exception:
                pass

        latitude = request.data.get('latitude')
        if latitude is not None:
            if str(latitude).strip() == '':
                prop.latitude = None
            else:
                try:
                    prop.latitude = float(latitude)
                except ValueError:
                    pass

        longitude = request.data.get('longitude')
        if longitude is not None:
            if str(longitude).strip() == '':
                prop.longitude = None
            else:
                try:
                    prop.longitude = float(longitude)
                except ValueError:
                    pass

        prop.save()

        # Handle image uploads
        images = request.FILES.getlist('images')
        for img in images:
            PropertyImage.objects.create(property=prop, image=img)

        return Response(PropertySerializer(prop).data)

    def delete(self, request, pk):
        prop = get_object_or_404(Property, id=pk, owner=request.user)
        prop.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class DeletePropertyImageView(APIView):
    """DELETE: Owner deletes a property image"""
    permission_classes = [IsApprovedOwner]

    def delete(self, request, pk):
        image = get_object_or_404(PropertyImage, id=pk)
        if image.property.owner != request.user:
            return Response({'detail': 'You do not have permission to delete this image.'}, status=status.HTTP_403_FORBIDDEN)
        image.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class RoomManagementView(APIView):
    """POST: Owner adds room table metrics directly to property. PUT/DELETE: Edit or delete rooms."""
    permission_classes = [IsApprovedOwner]

    def post(self, request, property_id):
        prop = get_object_or_404(Property, id=property_id, owner=request.user)
        
        room_number = request.data.get('room_number')
        room_type = request.data.get('room_type')
        total_beds = int(request.data.get('total_beds', 1))
        occupied_beds = int(request.data.get('occupied_beds', 0))
        monthly_rent = request.data.get('monthly_rent')
        deposit = request.data.get('deposit', 0)
        furnishing = request.data.get('furnishing', '')
        bathroom = request.data.get('bathroom', '')
        balcony = request.data.get('balcony', '')

        if not all([room_number, room_type, monthly_rent]):
            return Response({'detail': 'room_number, room_type, and monthly_rent are required'}, status=status.HTTP_400_BAD_REQUEST)

        room = Room.objects.create(
            property=prop,
            room_number=room_number,
            room_type=room_type,
            total_beds=total_beds,
            occupied_beds=occupied_beds,
            monthly_rent=monthly_rent,
            deposit=deposit,
            furnishing=furnishing,
            bathroom=bathroom,
            balcony=balcony
        )

        # Automatically adjust base_rent on property if it is 0
        if prop.base_rent == 0:
            prop.base_rent = monthly_rent
            prop.save()

        return Response(RoomSerializer(room).data, status=status.HTTP_201_CREATED)

    def put(self, request, property_id, pk):
        prop = get_object_or_404(Property, id=property_id, owner=request.user)
        room = get_object_or_404(Room, id=pk, property=prop)
        
        room_number = request.data.get('room_number')
        if room_number is not None: room.room_number = room_number
        
        room_type = request.data.get('room_type')
        if room_type is not None: room.room_type = room_type
        
        total_beds = request.data.get('total_beds')
        if total_beds is not None: room.total_beds = int(total_beds)
        
        occupied_beds = request.data.get('occupied_beds')
        if occupied_beds is not None: room.occupied_beds = int(occupied_beds)
        
        monthly_rent = request.data.get('monthly_rent')
        if monthly_rent is not None: room.monthly_rent = monthly_rent
        
        deposit = request.data.get('deposit')
        if deposit is not None: room.deposit = deposit
        
        furnishing = request.data.get('furnishing')
        if furnishing is not None: room.furnishing = furnishing
        
        bathroom = request.data.get('bathroom')
        if bathroom is not None: room.bathroom = bathroom
        
        balcony = request.data.get('balcony')
        if balcony is not None: room.balcony = balcony
        
        room.save()
        return Response(RoomSerializer(room).data)

    def delete(self, request, property_id, pk):
        prop = get_object_or_404(Property, id=property_id, owner=request.user)
        room = get_object_or_404(Room, id=pk, property=prop)
        room.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# ──────────────────────────────────────────────────────────
# ── VISIT BOOKINGS VIEWS ──
# ──────────────────────────────────────────────────────────

class BookVisitView(APIView):
    """POST: Guest schedules a visit to a property"""
    permission_classes = [IsAuthenticated]

    def post(self, request, property_id):
        prop = get_object_or_404(Property, id=property_id, is_active=True)
        visit_date = request.data.get('visit_date')
        visit_time = request.data.get('visit_time')
        phone = request.data.get('phone')
        notes = request.data.get('notes', '')
        room_id = request.data.get('room_id')

        if not all([visit_date, phone]):
            return Response({'detail': 'visit_date and phone are required'}, status=status.HTTP_400_BAD_REQUEST)

        room = None
        if room_id:
            try:
                room = Room.objects.get(id=room_id, property=prop)
            except Room.DoesNotExist:
                return Response({'detail': 'Selected room is invalid for this property.'}, status=status.HTTP_400_BAD_REQUEST)

        # Parse visit_time to a datetime.time object
        parsed_time = None
        if visit_time:
            from datetime import datetime
            time_str = str(visit_time).strip().upper()
            for fmt in ("%I:%M %p", "%I:%M%p", "%I %p", "%I%p", "%H:%M:%S", "%H:%M"):
                try:
                    parsed_time = datetime.strptime(time_str, fmt).time()
                    break
                except ValueError:
                    continue
            if not parsed_time:
                return Response(
                    {'detail': f'Invalid visit_time format: {visit_time}. Expected format like "11:00 AM" or "11:00".'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        visit = VisitRequest.objects.create(
            user=request.user,
            property=prop,
            room=room,
            visit_date=visit_date,
            visit_time=parsed_time,
            phone=phone,
            notes=notes
        )

        # Create user notification targeted to the property owner
        GlobalNotification.objects.create(
            user=prop.owner,
            title=f"New Visit Request: {prop.name}",
            message=f"Guest ({request.user.email}) requested a visit to {prop.name} on {visit_date} at {visit_time or 'specified time'}. Contact: {phone}.",
            notification_type='info'
        )

        return Response(VisitRequestSerializer(visit).data, status=status.HTTP_201_CREATED)

class BookingsHistoryView(APIView):
    """GET: User's visit history, or Owner's received requests list"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role == 'OWNER':
            visits = VisitRequest.objects.filter(property__owner=request.user).order_by('-created_at')
        else:
            visits = VisitRequest.objects.filter(user=request.user).order_by('-created_at')
        
        serializer = VisitRequestSerializer(visits, many=True)
        return Response(serializer.data)

class UpdateVisitStatusView(APIView):
    """PATCH: Owner approves/completes/cancels a visit request, or Guest cancels it. DELETE: Owner or Guest clears visit request."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        visit = get_object_or_404(VisitRequest, id=pk)
        
        if visit.property.owner != request.user and visit.user != request.user:
            return Response({'detail': 'You do not have permission to update this visit request.'}, status=status.HTTP_403_FORBIDDEN)
        
        new_status = request.data.get('status')
        if new_status not in ['PENDING', 'APPROVED', 'COMPLETED', 'CANCELLED']:
            return Response({'detail': 'Invalid status choice.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if visit.property.owner != request.user and new_status != 'CANCELLED':
            return Response({'detail': 'Guests can only cancel their own visit requests.'}, status=status.HTTP_403_FORBIDDEN)
        
        visit.status = new_status
        visit.save()
        
        return Response(VisitRequestSerializer(visit).data)

    def delete(self, request, pk):
        visit = get_object_or_404(VisitRequest, id=pk)
        
        if visit.property.owner != request.user and visit.user != request.user:
            return Response({'detail': 'You do not have permission to delete this visit request.'}, status=status.HTTP_403_FORBIDDEN)
        
        visit.delete()
        return Response({'detail': 'Visit request deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)

# ──────────────────────────────────────────────────────────
# ── OWNER DASHBOARD & TENANTS ──
# ──────────────────────────────────────────────────────────

class OwnerDashboardView(APIView):
    """GET: Analytical overview modules of owner properties"""
    permission_classes = [IsApprovedOwner]

    def get(self, request):
        if request.user.role != 'OWNER':
            return Response({'detail': 'Only owners can access dashboard'}, status=status.HTTP_403_FORBIDDEN)

        properties = Property.objects.filter(owner=request.user)
        total_properties = properties.count()

        rooms = Room.objects.filter(property__owner=request.user)
        total_rooms = rooms.count()

        metrics = rooms.aggregate(
            total_beds=Sum('total_beds'),
            occupied_beds=Sum('occupied_beds')
        )

        total_beds = metrics.get('total_beds') or 0
        occupied_beds = metrics.get('occupied_beds') or 0
        vacant_beds = max(0, total_beds - occupied_beds)

        active_tenants = Tenant.objects.filter(property__owner=request.user, is_active=True).count()
        open_complaints = Complaint.objects.filter(property__owner=request.user, status='OPEN').count()
        due_rent_count = RentPayment.objects.filter(
            tenant__property__owner=request.user,
            tenant__is_active=True,
            status__in=['UNPAID', 'OVERDUE']
        ).count()

        return Response({
            'total_properties': total_properties,
            'total_rooms': total_rooms,
            'total_beds': total_beds,
            'occupied_beds': occupied_beds,
            'vacant_beds': vacant_beds,
            'active_tenants': active_tenants,
            'open_complaints': open_complaints,
            'due_rent_count': due_rent_count
        })

class TenantRosterView(APIView):
    """GET/POST: List and register tenants (Owner only)"""
    permission_classes = [IsApprovedOwner]

    def get(self, request):
        if request.user.role != 'OWNER':
            return Response({'detail': 'Forbidden'}, status=status.HTTP_43_FORBIDDEN)
        
        tenants = Tenant.objects.filter(property__owner=request.user, is_active=True).order_by('-lease_start')
        return Response(TenantSerializer(tenants, many=True).data)

    def post(self, request):
        if request.user.role != 'OWNER':
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        property_id = request.data.get('property')
        room_id = request.data.get('room')
        tenant_name = request.data.get('tenant_name')
        phone = request.data.get('phone')
        lease_start = request.data.get('lease_start')
        lease_end = request.data.get('lease_end')

        if not all([property_id, room_id, tenant_name, phone, lease_start]):
            return Response({'detail': 'Mandatory tenant details missing'}, status=status.HTTP_400_BAD_REQUEST)

        prop = get_object_or_404(Property, id=property_id, owner=request.user)
        room = get_object_or_404(Room, id=room_id, property=prop)

        # Check room vacancy
        if room.occupied_beds >= room.total_beds:
            return Response({'detail': 'This room has no vacant beds'}, status=status.HTTP_400_BAD_REQUEST)

        tenant = Tenant.objects.create(
            property=prop,
            room=room,
            tenant_name=tenant_name,
            phone=phone,
            lease_start=lease_start,
            lease_end=lease_end,
            is_active=True
        )

        # Increment occupied beds
        room.occupied_beds += 1
        room.save()

        # Automatically create initial unpaid RentPayment for current month
        RentPayment.objects.create(
            tenant=tenant,
            amount=room.monthly_rent,
            due_date=timezone.now().date()
        )

        return Response(TenantSerializer(tenant).data, status=status.HTTP_201_CREATED)

    def delete(self, request, pk=None):
        if request.user.role != 'OWNER':
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        
        tenant_id = pk or request.query_params.get('id')
        if not tenant_id:
            return Response({'detail': 'Tenant ID is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        tenant = get_object_or_404(Tenant, id=tenant_id, property__owner=request.user)
        
        # Decrement occupied beds of the room if it was active
        if tenant.is_active and tenant.room:
            room = tenant.room
            if room.occupied_beds > 0:
                room.occupied_beds -= 1
                room.save()
                
        # Mark as inactive (soft delete)
        tenant.is_active = False
        tenant.save()
        
        # Delete rent payments and complaints associated with the tenant
        RentPayment.objects.filter(tenant=tenant).delete()
        Complaint.objects.filter(tenant=tenant).delete()
        
        return Response({'detail': 'Tenant unregistered successfully'}, status=status.HTTP_200_OK)

# ──────────────────────────────────────────────────────────
# ── COMPLAINTS & PAYMENTS ──
# ──────────────────────────────────────────────────────────

class ComplaintListView(APIView):
    """GET/POST: complaints dashboard tracking"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role == 'OWNER':
            if getattr(settings, 'REQUIRE_OWNER_APPROVAL', True) and (not getattr(request.user, 'owner_profile', None) or not request.user.owner_profile.is_approved):
                return Response({'detail': 'Your owner profile is pending admin approval.'}, status=status.HTTP_403_FORBIDDEN)
            complaints = Complaint.objects.filter(property__owner=request.user, tenant__is_active=True).order_by('-created_at')
        else:
            # Check if user is registered tenant
            tenancies = Tenant.objects.filter(user=request.user, is_active=True)
            if not tenancies.exists():
                return Response({'detail': 'Not a tenant'}, status=status.HTTP_403_FORBIDDEN)
            complaints = Complaint.objects.filter(tenant__user=request.user).order_by('-created_at')

        return Response(ComplaintSerializer(complaints, many=True).data)

    def post(self, request):
        # Tenant submits a ticket
        tenancy = get_object_or_404(Tenant, user=request.user, is_active=True)
        title = request.data.get('title')
        description = request.data.get('description')

        if not all([title, description]):
            return Response({'detail': 'title and description are required'}, status=status.HTTP_400_BAD_REQUEST)

        complaint = Complaint.objects.create(
            tenant=tenancy,
            property=tenancy.property,
            title=title,
            description=description,
            status='OPEN'
        )

        return Response(ComplaintSerializer(complaint).data, status=status.HTTP_201_CREATED)

    def patch(self, request, pk):
        # Update complaint status (Owner only)
        if request.user.role != 'OWNER':
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        if getattr(settings, 'REQUIRE_OWNER_APPROVAL', True) and (not getattr(request.user, 'owner_profile', None) or not request.user.owner_profile.is_approved):
            return Response({'detail': 'Your owner profile is pending admin approval.'}, status=status.HTTP_403_FORBIDDEN)

        complaint = get_object_or_404(Complaint, id=pk, property__owner=request.user)
        new_status = request.data.get('status')
        if new_status in ['OPEN', 'IN_PROGRESS', 'RESOLVED']:
            complaint.status = new_status
            complaint.save()

        return Response(ComplaintSerializer(complaint).data)

class RentPaymentListView(APIView):
    """GET/POST: Payments tracking ledger"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role == 'OWNER':
            if getattr(settings, 'REQUIRE_OWNER_APPROVAL', True) and (not getattr(request.user, 'owner_profile', None) or not request.user.owner_profile.is_approved):
                return Response({'detail': 'Your owner profile is pending admin approval.'}, status=status.HTTP_403_FORBIDDEN)
            payments = RentPayment.objects.filter(tenant__property__owner=request.user, tenant__is_active=True).order_by('-due_date')
        else:
            payments = RentPayment.objects.filter(tenant__user=request.user).order_by('-due_date')

        return Response(RentPaymentSerializer(payments, many=True).data)

    def post(self, request):
        # Owner records payment manually
        if request.user.role != 'OWNER':
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        if getattr(settings, 'REQUIRE_OWNER_APPROVAL', True) and (not getattr(request.user, 'owner_profile', None) or not request.user.owner_profile.is_approved):
            return Response({'detail': 'Your owner profile is pending admin approval.'}, status=status.HTTP_403_FORBIDDEN)

        payment_id = request.data.get('payment_id')
        pay_status = request.data.get('status', 'PAID')

        payment = get_object_or_404(RentPayment, id=payment_id, tenant__property__owner=request.user)
        
        # Check if it was not already paid to prevent double triggering next invoice
        already_paid = payment.status == 'PAID'
        
        payment.status = pay_status
        if pay_status == 'PAID':
            import datetime
            payment.payment_date = timezone.now().date()
            payment.save()
            
            if not already_paid:
                # Automatically create a new unpaid RentPayment for next month on same day
                orig_date = payment.due_date
                month = orig_date.month + 1
                year = orig_date.year
                if month > 12:
                    month = 1
                    year += 1
                day = orig_date.day
                # Safely handle shorter months (e.g. Jan 31 -> Feb 28)
                while True:
                    try:
                        next_due_date = datetime.date(year, month, day)
                        break
                    except ValueError:
                        day -= 1
                
                # Check if next month's payment already exists for this tenant
                if not RentPayment.objects.filter(tenant=payment.tenant, due_date=next_due_date).exists():
                    RentPayment.objects.create(
                        tenant=payment.tenant,
                        amount=payment.amount,
                        due_date=next_due_date,
                        status='UNPAID'
                    )
        else:
            payment.save()

        return Response(RentPaymentSerializer(payment).data)


class AnnouncementBannerView(APIView):
    """GET: Active announcement banner"""
    permission_classes = [AllowAny]

    def get(self, request):
        banner = AnnouncementBanner.objects.filter(is_active=True).last()
        if not banner:
            return Response(None, status=status.HTTP_200_OK)
        return Response(AnnouncementBannerSerializer(banner).data, status=status.HTTP_200_OK)


class GlobalNotificationView(APIView):
    """GET: Active global or user-targeted notifications"""
    permission_classes = [AllowAny]

    def get(self, request):
        from django.db.models import Q
        if request.user.is_authenticated:
            notifications = GlobalNotification.objects.filter(
                Q(user__isnull=True) | Q(user=request.user),
                is_active=True
            ).order_by('-created_at')
        else:
            notifications = GlobalNotification.objects.filter(user__isnull=True, is_active=True).order_by('-created_at')
        return Response(GlobalNotificationSerializer(notifications, many=True).data, status=status.HTTP_200_OK)


class HeroBannerListView(APIView):
    """GET: Active hero banners ordered by order priority"""
    permission_classes = [AllowAny]

    def get(self, request):
        banners = HeroBanner.objects.filter(is_active=True).order_by('order', '-created_at')
        return Response(HeroBannerSerializer(banners, many=True).data, status=status.HTTP_200_OK)


class SupportInquiryView(APIView):
    """POST: User submits a support inquiry"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SupportInquirySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
          
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

