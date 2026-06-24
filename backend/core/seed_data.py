import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.utils import timezone
from rentals.models import User, OwnerProfile, Property, PropertyImage, Room, VisitRequest, Tenant, Complaint, RentPayment, GlobalNotification

def seed():
    print("Clearing old data...")
    GlobalNotification.objects.all().delete()
    RentPayment.objects.all().delete()
    Complaint.objects.all().delete()
    Tenant.objects.all().delete()
    VisitRequest.objects.all().delete()
    Room.objects.all().delete()
    PropertyImage.objects.all().delete()
    Property.objects.all().delete()
    OwnerProfile.objects.all().delete()
    User.objects.all().delete()

    print("Creating users...")
    # Admin
    admin = User.objects.create_superuser('admin', 'admin@staypik.in', 'admin123')
    
    # Owner
    owner = User.objects.create_user('owner', 'owner@staypik.in', 'owner123')
    owner.display_name = "Ramesh Host"
    owner.role = "OWNER"
    owner.save()

    # User / Tenant
    tenant_user = User.objects.create_user('guest', 'guest@staypik.in', 'guest123')
    tenant_user.display_name = "Rahul Guest"
    tenant_user.save()

    print("Creating owner profile...")
    profile = OwnerProfile.objects.create(
        user=owner,
        full_name="Ramesh Kumar",
        mobile_number="9876543210",
        city="Bangalore",
        address="Sector 3, HSR Layout, Bangalore"
    )

    print("Creating properties...")
    prop1 = Property.objects.create(
        owner=owner,
        name="Maple Living PG",
        property_type="PG",
        gender="Unisex",
        address="12, 5th Cross, HSR Layout, Sector 3",
        locality="HSR Layout",
        city="Bangalore",
        description="Premium unisex PG offering clean rooms, high speed WiFi, delicious food, laundry service, and 24x7 security monitoring.",
        base_rent=9000.00,
        deposit=18000.00,
        amenities=["WiFi", "AC", "Attached Washroom", "Food Included", "Laundry Service", "Security / CCTV"],
        is_verified=True,
        is_featured=True,
        latitude=12.911600,
        longitude=77.638900
    )

    prop2 = Property.objects.create(
        owner=owner,
        name="Green View Hostel",
        property_type="Hostel",
        gender="Boys",
        address="55, 14th Main, Koramangala 4th Block",
        locality="Koramangala",
        city="Bangalore",
        description="Premium Boys Hostel located in the heart of Koramangala. Walking distance to offices and colleges.",
        base_rent=6500.00,
        deposit=10000.00,
        amenities=["WiFi", "Attached Washroom", "Power Backup", "Security / CCTV"],
        is_verified=True,
        is_featured=True,
        latitude=12.935200,
        longitude=77.624400
    )

    prop3 = Property.objects.create(
        owner=owner,
        name="Comfort Stay PG",
        property_type="PG",
        gender="Girls",
        address="Sector 2, HSR Layout",
        locality="HSR Layout",
        city="Bangalore",
        description="Premium Girls PG with high safety, home style food, laundry, cleaning, and great community.",
        base_rent=7000.00,
        deposit=12000.00,
        amenities=["WiFi", "Food Included", "Laundry Service", "Security / CCTV"],
        is_verified=True,
        is_featured=True,
        latitude=12.908100,
        longitude=77.647600
    )

    prop4 = Property.objects.create(
        owner=owner,
        name="Elite Co-Living",
        property_type="Co-Living",
        gender="Unisex",
        address="80 Feet Road, Koramangala",
        locality="Koramangala",
        city="Bangalore",
        description="Luxury Co-living space with modern designs, gaming zone, gym, and networking events.",
        base_rent=11000.00,
        deposit=20000.00,
        amenities=["WiFi", "AC", "Gym", "Gaming Lounge", "Attached Washroom"],
        is_verified=False,
        latitude=12.928400,
        longitude=77.621200
    )

    prop5 = Property.objects.create(
        owner=owner,
        name="Stanza Living Dublin",
        property_type="PG",
        gender="Boys",
        address="100 Feet Road, Indiranagar",
        locality="Indiranagar",
        city="Bangalore",
        description="Fully managed student and professional PG with top notch services, high speed internet, and curated meals.",
        base_rent=15000.00,
        deposit=30000.00,
        amenities=["WiFi", "AC", "Food Included", "Power Backup", "Gym"],
        is_verified=True,
        is_featured=True,
        latitude=12.978400,
        longitude=77.640800
    )

    prop6 = Property.objects.create(
        owner=owner,
        name="Sree PG for Gents",
        property_type="PG",
        gender="Boys",
        address="17th Cross, Sector 6, HSR Layout",
        locality="HSR Layout",
        city="Bangalore",
        description="Affordable and neat PG for guys. Includes regular food, daily cleaning, and basic amenities.",
        base_rent=5500.00,
        deposit=8000.00,
        amenities=["WiFi", "Food Included", "Attached Washroom"],
        is_verified=False,
        latitude=12.915000,
        longitude=77.641000
    )

    print("Creating rooms...")
    # Maple Living PG Rooms
    r101 = Room.objects.create(
        property=prop1,
        room_number="101",
        room_type="Double Sharing",
        total_beds=2,
        occupied_beds=1,
        monthly_rent=9000.00,
        deposit=18000.00
    )
    r102 = Room.objects.create(
        property=prop1,
        room_number="102",
        room_type="Single",
        total_beds=1,
        occupied_beds=1,
        monthly_rent=12000.00,
        deposit=24000.00
    )
    
    # Green View Hostel Rooms
    r201 = Room.objects.create(
        property=prop2,
        room_number="201",
        room_type="Triple Sharing",
        total_beds=3,
        occupied_beds=2,
        monthly_rent=6500.00,
        deposit=10000.00
    )

    # Comfort Stay PG Rooms
    r301 = Room.objects.create(
        property=prop3,
        room_number="301",
        room_type="Double Sharing",
        total_beds=2,
        occupied_beds=0,
        monthly_rent=7000.00,
        deposit=12000.00
    )

    # Elite Co-Living Rooms
    r401 = Room.objects.create(
        property=prop4,
        room_number="401",
        room_type="Single",
        total_beds=1,
        occupied_beds=0,
        monthly_rent=11000.00,
        deposit=20000.00
    )

    # Stanza Living Dublin Rooms
    r501 = Room.objects.create(
        property=prop5,
        room_number="501",
        room_type="Double Sharing",
        total_beds=2,
        occupied_beds=1,
        monthly_rent=15000.00,
        deposit=30000.00
    )

    # Sree PG Rooms
    r601 = Room.objects.create(
        property=prop6,
        room_number="601",
        room_type="Triple Sharing",
        total_beds=3,
        occupied_beds=0,
        monthly_rent=5500.00,
        deposit=8000.00
    )

    print("Creating tenants...")
    t1 = Tenant.objects.create(
        property=prop1,
        room=r101,
        tenant_name="Rahul Sharma",
        phone="9876540011",
        lease_start=timezone.now().date(),
        is_active=True
    )
    t2 = Tenant.objects.create(
        property=prop1,
        room=r102,
        tenant_name="Sneha Reddy",
        phone="9876540022",
        lease_start=timezone.now().date(),
        is_active=True
    )

    print("Creating complaints...")
    Complaint.objects.create(
        tenant=t1,
        property=prop1,
        title="AC Remote is missing",
        description="The AC remote in Room 101 was missing during check-in. Please provide a replacement.",
        status="OPEN"
    )

    print("Creating rent payments...")
    # Paid
    RentPayment.objects.create(
        tenant=t1,
        amount=9000.00,
        due_date=timezone.now().date(),
        payment_date=timezone.now().date(),
        status="PAID"
    )
    # Unpaid
    RentPayment.objects.create(
        tenant=t2,
        amount=12000.00,
        due_date=timezone.now().date(),
        status="UNPAID"
    )

    print("Creating notifications...")
    # Global notification for everyone
    GlobalNotification.objects.create(
        title="Welcome to Staypik!",
        message="Find premium PG, Hostels, and Co-Living spaces directly from owners with zero hidden charges.",
        notification_type="info"
    )

    # Owner notification
    GlobalNotification.objects.create(
        user=owner,
        title="Owner Onboarding Complete",
        message="Welcome to Staypik Ramesh! Your owner profile is approved and you can now manage your properties, add rooms, and track rent payments.",
        notification_type="update"
    )

    # Guest notification
    GlobalNotification.objects.create(
        user=tenant_user,
        title="Schedule Your First Visit",
        message="Explore properties in Indiranagar, HSR Layout, or Koramangala and schedule a visit free of charge.",
        notification_type="promo"
    )

    print("Seeding finished successfully!")

if __name__ == '__main__':
    seed()
