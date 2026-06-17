# trips/views.py — COMPLETE

from django.db import models
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404

from .models import (
    TourPackage, PackageBooking, PackageReview, Notification,
    Category, HeroBanner
)
from .serializers import (
    PackageListSerializer, PackageDetailSerializer,
    PackageBookingSerializer, PackageReviewCreateSerializer,
    PackageReviewSerializer, NotificationSerializer,
    CategorySerializer, HeroBannerSerializer
)


# ──────────────────────────────────────────────────────────
# ── PACKAGE VIEWS ──
# ──────────────────────────────────────────────────────────

class PackageListView(APIView):
    """GET: Browse all published packages"""
    permission_classes = [AllowAny]

    def get(self, request):
        location = request.query_params.get('location')
        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')
        days = request.query_params.get('days')
        category = request.query_params.get('category')
        
        packages = TourPackage.objects.filter(is_active=True).order_by('-avg_rating', '-total_bookings')
        
        if category:
            packages = packages.filter(category__slug=category)
        
        if location:
            packages = packages.filter(destination__icontains=location)
        if min_price:
            packages = packages.filter(base_price_per_person__gte=min_price)
        if max_price:
            packages = packages.filter(base_price_per_person__lte=max_price)
        if days:
            packages = packages.filter(duration_days=days)
        
        serializer = PackageListSerializer(packages, many=True, context={'request': request})
        return Response(serializer.data)


class PackageDetailView(APIView):
    """GET: Full package details"""
    permission_classes = [AllowAny]

    def get(self, request, package_id):
        package = get_object_or_404(TourPackage, id=package_id, is_active=True)
        serializer = PackageDetailSerializer(package, context={'request': request})
        return Response(serializer.data)


class BookPackageView(APIView):
    """POST: Inquire/Book a package"""
    permission_classes = [IsAuthenticated]
    parser_classes = (JSONParser, MultiPartParser, FormParser)

    def post(self, request, package_id):
        package = get_object_or_404(TourPackage, id=package_id, is_active=True)
        
        try:
            # Get data
            adults = int(request.data.get('adults', 1))
            children = int(request.data.get('children', 0))
            start_date = request.data.get('start_date')
            end_date = request.data.get('end_date')
            phone = request.data.get('phone')
            special_requests = request.data.get('special_requests', '')
            
            # Validate required fields
            if not all([start_date, end_date, phone]):
                return Response(
                    {'detail': 'start_date, end_date, and phone are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Calculate total cost
            total_cost = package.base_price_per_person * adults
            
            # Create booking
            booking = PackageBooking.objects.create(
                package=package,
                user=request.user,
                adults=adults,
                children=children,
                start_date=start_date,
                end_date=end_date,
                phone=phone,
                special_requests=special_requests,
                total_cost=total_cost,
                status='inquiry'
            )
            
            return Response(
                PackageBookingSerializer(booking, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        except ValueError as e:
            return Response(
                {'detail': f'Invalid data: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'detail': f'Booking failed: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )


class UserBookingsView(APIView):
    """GET: User's package bookings"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        bookings = PackageBooking.objects.filter(user=request.user).order_by('-created_at')
        serializer = PackageBookingSerializer(bookings, many=True)
        return Response(serializer.data)


class DeleteBookingView(APIView):
    """DELETE: Remove a booking from user history"""
    permission_classes = [IsAuthenticated]

    def delete(self, request, booking_id):
        booking = get_object_or_404(PackageBooking, id=booking_id, user=request.user)
        booking.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AllBookingsAdminView(APIView):
    """GET: All bookings — admin dashboard"""
    permission_classes = [IsAuthenticated]
    parser_classes = (JSONParser, MultiPartParser, FormParser)

    def get(self, request):
        status_filter = request.query_params.get('status')
        bookings = PackageBooking.objects.select_related('user', 'package').order_by('-created_at')
        if status_filter:
            bookings = bookings.filter(status=status_filter)
        serializer = PackageBookingSerializer(bookings, many=True)
        return Response(serializer.data)


class UpdateBookingStatusView(APIView):
    """PATCH: Update a booking status — admin only"""
    permission_classes = [IsAuthenticated]
    parser_classes = (JSONParser, MultiPartParser, FormParser)

    VALID_TRANSITIONS = {
        'inquiry':   ['confirmed', 'cancelled'],
        'confirmed': ['completed', 'cancelled'],
        'completed': [],
        'cancelled': [],
    }

    def patch(self, request, booking_id):
        booking = get_object_or_404(PackageBooking, id=booking_id)
        new_status = request.data.get('status')

        if not new_status:
            return Response({'detail': 'status field is required'}, status=status.HTTP_400_BAD_REQUEST)

        allowed = self.VALID_TRANSITIONS.get(booking.status, [])
        if new_status not in allowed:
            return Response(
                {'detail': f'Cannot move from "{booking.status}" to "{new_status}". Allowed: {allowed}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        booking.status = new_status
        booking.save()
        serializer = PackageBookingSerializer(booking)
        return Response(serializer.data)


class ReviewPackageView(APIView):
    """POST: Review a completed package"""
    permission_classes = [IsAuthenticated]
    parser_classes = (JSONParser, MultiPartParser, FormParser)

    def post(self, request, booking_id):
        booking = get_object_or_404(PackageBooking, id=booking_id, user=request.user)
        
        if booking.status != 'completed':
            return Response(
                {'detail': 'Can only review completed bookings'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if hasattr(booking, 'review'):
            return Response(
                {'detail': 'Already reviewed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = PackageReviewCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        review = serializer.save(
            booking=booking,
            package=booking.package,
            user=request.user
        )
        
        # Update package ratings
        package = booking.package
        all_reviews = package.reviews.all()
        avg = sum(r.rating for r in all_reviews) / len(all_reviews)
        package.avg_rating = round(avg, 1)
        package.total_reviews = all_reviews.count()
        
        # Count bookings
        completed = package.bookings.filter(status='completed').count()
        package.total_bookings = completed
        package.save()
        
        booking.review_submitted = True
        booking.save()
        
        return Response(
            PackageReviewSerializer(review, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


class PackageReviewsView(APIView):
    """GET: All reviews for a package"""
    permission_classes = [AllowAny]

    def get(self, request, package_id):
        package = get_object_or_404(TourPackage, id=package_id)
        reviews = package.reviews.all().order_by('-created_at')
        serializer = PackageReviewSerializer(reviews, many=True, context={'request': request})
        return Response(serializer.data)


class NotificationsView(APIView):
    """GET: Active notifications (admin-controlled)"""
    permission_classes = [AllowAny]

    def get(self, request):
        from django.utils import timezone
        now = timezone.now()
        notifications = Notification.objects.filter(is_active=True).filter(
            models.Q(expires_at__isnull=True) | models.Q(expires_at__gt=now)
        )
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)

class CategoryListView(APIView):
    """GET: All active categories"""
    permission_classes = [AllowAny]
    def get(self, request):
        categories = Category.objects.filter(is_active=True)
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)

class HeroBannerListView(APIView):
    """GET: All active hero banners"""
    permission_classes = [AllowAny]
    def get(self, request):
        banners = HeroBanner.objects.filter(is_active=True)
        serializer = HeroBannerSerializer(banners, many=True, context={'request': request})
        return Response(serializer.data)

