from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = [('USER', 'User'), ('OWNER', 'Owner')]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='USER')
    display_name = models.CharField(max_length=255, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    def __str__(self):
        return self.username or self.email

class OwnerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='owner_profile')
    full_name = models.CharField(max_length=255)
    mobile_number = models.CharField(max_length=20)
    city = models.CharField(max_length=100)
    address = models.TextField()
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Owner Profile for {self.full_name}"

class Property(models.Model):
    TYPE_CHOICES = [('PG', 'PG'), ('Hostel', 'Hostel'), ('Co-Living', 'Co-Living'), ('Apartment', 'Apartment')]
    GENDER_CHOICES = [('Boys', 'Boys Only'), ('Girls', 'Girls Only'), ('Unisex', 'Unisex')]
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='properties')
    name = models.CharField(max_length=255)
    property_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    gender = models.CharField(max_length=15, choices=GENDER_CHOICES, default='Unisex')
    address = models.TextField()
    locality = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    description = models.TextField()
    base_rent = models.DecimalField(max_digits=10, decimal_places=2)
    deposit = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    amenities = models.JSONField(default=list)  # e.g., ["WiFi", "AC", "Laundry"]
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class PropertyImage(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='properties/')
    alt_text = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"Image for {self.property.name}"

class Room(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='rooms')
    room_number = models.CharField(max_length=50)
    room_type = models.CharField(max_length=50, help_text="e.g. Single, Double Sharing, Triple Sharing")
    total_beds = models.PositiveIntegerField(default=1)
    occupied_beds = models.PositiveIntegerField(default=0)
    monthly_rent = models.DecimalField(max_digits=10, decimal_places=2)
    deposit = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return f"Room {self.room_number} ({self.property.name})"

class VisitRequest(models.Model):
    STATUS_CHOICES = [('PENDING', 'Pending'), ('APPROVED', 'Approved'), ('COMPLETED', 'Completed'), ('CANCELLED', 'Cancelled')]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='visits')
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='visits')
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True, related_name='visit_requests')
    visit_date = models.DateField()
    visit_time = models.TimeField(null=True, blank=True)
    phone = models.CharField(max_length=20)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Visit to {self.property.name} by {self.user.username} on {self.visit_date}"

class Tenant(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='tenancy')
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='tenants')
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, related_name='tenants')
    tenant_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    lease_start = models.DateField()
    lease_end = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.tenant_name

class Complaint(models.Model):
    STATUS_CHOICES = [('OPEN', 'Open'), ('IN_PROGRESS', 'In Progress'), ('RESOLVED', 'Resolved')]
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='complaints')
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='complaints')
    title = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class RentPayment(models.Model):
    STATUS_CHOICES = [('PAID', 'Paid'), ('UNPAID', 'Unpaid'), ('OVERDUE', 'Overdue')]
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    due_date = models.DateField()
    payment_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='UNPAID')

    def __str__(self):
        return f"Rent payment for {self.tenant.tenant_name} due {self.due_date} ({self.status})"


class AnnouncementBanner(models.Model):
    text = models.TextField()
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Banner: {self.text[:30]} ({'Active' if self.is_active else 'Inactive'})"


class GlobalNotification(models.Model):
    TYPE_CHOICES = [('info', 'Info'), ('promo', 'Promo / Offer'), ('alert', 'Alert'), ('update', 'Update')]
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications', help_text="Leave blank to make this notification global (visible to all logged-in users).")
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='info')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class HeroBanner(models.Model):
    title = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=255, blank=True)
    image = models.ImageField(upload_to='banners/', null=True, blank=True)
    button_text = models.CharField(max_length=50, default='Explore Now')
    link_url = models.CharField(max_length=255, default='/', blank=True)
    order = models.PositiveIntegerField(default=0, help_text="Banners are displayed in ascending order")
    is_active = models.BooleanField(default=True)
    badge_text = models.CharField(max_length=100, default='Verified Properties', blank=True)
    feature_1 = models.CharField(max_length=100, default='No Hidden Charges', blank=True)
    feature_2 = models.CharField(max_length=100, default='Verified Properties', blank=True)
    feature_3 = models.CharField(max_length=100, default='Direct Owner', blank=True)
    feature_4 = models.CharField(max_length=100, default='Trusted by Thousands', blank=True)
    localities = models.CharField(max_length=255, default='HSR Layout, Koramangala, BTM Layout, Whitefield, Electronic City', blank=True, help_text="Comma-separated list of popular localities")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', '-created_at']

    def __str__(self):
        return f"Hero Banner: {self.title} (Order: {self.order})"


class SupportInquiry(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='support_inquiries')
    subject = models.CharField(max_length=255)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Support Inquiry: {self.subject} ({self.user.email if self.user else 'Guest'})"

