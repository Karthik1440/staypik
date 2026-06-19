import os
import sys
import subprocess

# ──────────────────────────────────────────────────────────
# ── BOOTSTRAP REPORTLAB INSTALLATION ──
# ──────────────────────────────────────────────────────────

try:
    import reportlab
    print("ReportLab is already installed.")
except ImportError:
    print("ReportLab not found. Installing ReportLab dynamically...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "reportlab"])
        import reportlab
        print("ReportLab successfully installed!")
    except Exception as e:
        print(f"Failed to install ReportLab: {e}")
        sys.exit(1)

# ──────────────────────────────────────────────────────────
# ── IMPORTS ──
# ──────────────────────────────────────────────────────────

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, 
    PageBreak, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY

# ──────────────────────────────────────────────────────────
# ── NUMBERED CANVAS FOR HEADER/FOOTER & COVER PAGE ──
# ──────────────────────────────────────────────────────────

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_elements(num_pages)
            super().showPage()
        super().save()

    def draw_page_elements(self, page_count):
        self.saveState()
        
        # ── COVER PAGE (PAGE 1) ──
        if self._pageNumber == 1:
            # Draw dark navy top block
            self.setFillColor(colors.HexColor('#1E293B'))
            self.rect(0, 450, 612, 342, stroke=0, fill=1)
            
            # Draw bright blue accent band
            self.setFillColor(colors.HexColor('#3B82F6'))
            self.rect(0, 438, 612, 12, stroke=0, fill=1)
            
            # Title text (White on Navy)
            self.setFillColor(colors.white)
            self.setFont("Helvetica-Bold", 34)
            self.drawString(54, 620, "STAYPIK")
            
            self.setFont("Helvetica", 18)
            self.setFillColor(colors.HexColor('#E2E8F0'))
            self.drawString(54, 580, "TECHNICAL ARCHITECTURE MANUAL")
            
            self.setFont("Helvetica-Oblique", 11)
            self.setFillColor(colors.HexColor('#94A3B8'))
            self.drawString(54, 555, "System Blueprint, Database Models, and API Reference Manual")
            
            # Bottom metadata (Dark text on white)
            self.setFillColor(colors.HexColor('#0F172A'))
            
            self.setFont("Helvetica-Bold", 12)
            self.drawString(54, 320, "PROJECT CORE")
            self.setFont("Helvetica", 10)
            self.setFillColor(colors.HexColor('#475569'))
            self.drawString(54, 302, "PG & Accommodation Management System")
            
            self.setFillColor(colors.HexColor('#0F172A'))
            self.setFont("Helvetica-Bold", 12)
            self.drawString(54, 250, "SYSTEM ARCHITECTURE")
            self.setFont("Helvetica", 10)
            self.setFillColor(colors.HexColor('#475569'))
            self.drawString(54, 232, "Django REST Framework & React/Vite SPA")
            
            self.setFillColor(colors.HexColor('#0F172A'))
            self.setFont("Helvetica-Bold", 12)
            self.drawString(54, 180, "DOCUMENT VERSION")
            self.setFont("Helvetica", 10)
            self.setFillColor(colors.HexColor('#475569'))
            self.drawString(54, 162, "v1.2 (Stable Production Release)")
            
            self.setFillColor(colors.HexColor('#0F172A'))
            self.setFont("Helvetica-Bold", 12)
            self.drawString(54, 110, "GENERATION DATE")
            self.setFont("Helvetica", 10)
            self.setFillColor(colors.HexColor('#475569'))
            self.drawString(54, 92, "June 18, 2026")
            
            # Footer copyright on Cover
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor('#94A3B8'))
            self.drawString(54, 40, "© 2026 Staypik. All rights reserved. Confidential System Reference.")
            
        # ── INTERIOR PAGES (PAGE 2+) ──
        else:
            # Draw Top Header
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(colors.HexColor('#64748B')) # Slate
            self.drawString(54, 752, "STAYPIK — SYSTEM BLUEPRINT & ARCHITECTURE MANUAL")
            
            # Thin divider line under header
            self.setStrokeColor(colors.HexColor('#E2E8F0'))
            self.setLineWidth(0.5)
            self.line(54, 744, 558, 744)
            
            # Draw Bottom Footer
            self.line(54, 48, 558, 48)
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor('#64748B'))
            self.drawString(54, 34, "Staypik System Technical Reference Manual")
            
            # Page Number "Page X of Y"
            page_str = f"Page {self._pageNumber} of {page_count}"
            self.drawRightString(558, 34, page_str)
            
        self.restoreState()

# ──────────────────────────────────────────────────────────
# ── DOCUMENT BUILDER FUNCTION ──
# ──────────────────────────────────────────────────────────

def build_pdf(filename):
    # Setup document template with 0.75" margins
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=72,
        bottomMargin=72
    )

    styles = getSampleStyleSheet()

    # ── CUSTOM PARAGRAPH STYLES ──
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#1E293B'),
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=18,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'SubSectionHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#3B82F6'),
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor('#334155'),
        spaceAfter=8
    )

    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#334155'),
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )

    table_body_style = ParagraphStyle(
        'TableBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.0,
        leading=11,
        textColor=colors.HexColor('#334155')
    )

    table_body_bold_style = ParagraphStyle(
        'TableBodyBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.0,
        leading=11,
        textColor=colors.HexColor('#0F172A')
    )

    code_style = ParagraphStyle(
        'CodeCustom',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8.0,
        leading=10,
        textColor=colors.HexColor('#0F172A')
    )

    # ── HELPERS ──
    def p(text, style=body_style):
        return Paragraph(text, style)

    def wrap_table_data(data, header_cols=set()):
        """Helper to wrap text cells inside paragraphs to enable text wrapping"""
        wrapped = []
        for row_idx, row in enumerate(data):
            wrapped_row = []
            for col_idx, cell in enumerate(row):
                if row_idx == 0:
                    wrapped_row.append(Paragraph(cell, table_header_style))
                elif col_idx in header_cols:
                    wrapped_row.append(Paragraph(cell, table_body_bold_style))
                else:
                    wrapped_row.append(Paragraph(cell, table_body_style))
            wrapped.append(wrapped_row)
        return wrapped

    def make_table(data, col_widths, highlight_col0=True):
        wrapped_data = wrap_table_data(data, header_cols={0} if highlight_col0 else set())
        t = Table(wrapped_data, colWidths=col_widths)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ]))
        return t

    story = []

    # ──────────────────────────────────────────────────────────
    # ── PAGE 1: COVER PAGE GRAPHICS ON NUMBEREDCANVAS ──
    # ──────────────────────────────────────────────────────────
    story.append(PageBreak())  # Pushes all Flowable contents to Page 2

    # ──────────────────────────────────────────────────────────
    # ── PAGE 2: EXECUTIVE OVERVIEW & SYSTEM ARCHITECTURE ──
    # ──────────────────────────────────────────────────────────
    story.append(p("1. Executive Summary & System Overview", h1_style))
    story.append(p(
        "<b>Staypik</b> is a modern, full-stack PG (Paying Guest) and accommodation management "
        "web application. The system solves key logistical challenges of rental housing by providing "
        "distinct workspaces for two main user roles: <b>Guests</b> (property seekers looking to book visits "
        "and maintain tenancies) and <b>Hosts/Owners</b> (property administrators managing listings, rooms, "
        "active tenants, monthly rent payment records, and support inquiries)."
    ))
    story.append(p(
        "Key operational workflows supported by the Staypik ecosystem include:"
    ))
    story.append(p("• <b>Property Discovery:</b> Location-aware exploration using latitude/longitude metrics and distance sorting.", bullet_style))
    story.append(p("• <b>Scheduling Visits:</b> Calendar-based visit booking with SMS/phone context and automated host notification alerts.", bullet_style))
    story.append(p("• <b>Tenancy Management:</b> Formal room rosters, occupancy metrics, bed allocation tracking, and soft-delete unregistrations.", bullet_style))
    story.append(p("• <b>Rent Ledger:</b> Automated generation of monthly rent logs, payment tracking (Paid/Unpaid/Overdue), and ledger summaries.", bullet_style))
    story.append(p("• <b>Tenant Ticket Board:</b> Direct communications channels for active tenants to file maintenance and policy complaints.", bullet_style))

    story.append(Spacer(1, 10))
    story.append(p("2. Technology Stack Blueprint", h1_style))
    story.append(p(
        "The application is engineered as a decoupled Client-Server architecture utilizing a modern, "
        "highly responsive single page React frontend interacting with a secure Python/Django REST API."
    ))
    
    # Tech Stack Table
    tech_data = [
        ["Layer / Component", "Technology Used", "Version", "Operational Role in System"],
        ["Frontend UI SPA", "React.js", "19.2.5", "Client application interface, routing, dashboard panels."],
        ["Frontend Bundler", "Vite.js", "5.0.0", "Fast build server and static asset packager."],
        ["Styling Framework", "Tailwind CSS", "3.4.1", "Responsive utility classes and modern glassmorphism styling."],
        ["Backend REST API", "Django & DRF", "5.2.10 / 3.14.0", "Core API routing, request validation, serializers, and logic."],
        ["Authentication Service", "SimpleJWT / Firebase", "5.3.1 / 6.5.0", "Dual-auth stack: token verification & custom local Django auth."],
        ["Database Engine", "PostgreSQL", "16+", "Relational database schema storing properties, rooms, rents, and users."],
        ["Media Asset Cloud", "Cloudinary Storage", "1.44.1", "Remote hosting for property photos and user profile avatars."],
        ["Static Asset Server", "Whitenoise", "6.12.0", "Compressed manifest engine serving production CSS and JS files."]
    ]
    story.append(make_table(tech_data, [100, 110, 60, 234]))

    story.append(PageBreak())

    # ──────────────────────────────────────────────────────────
    # ── PAGE 3: PRODUCT ARCHITECTURAL SYSTEM DIAGRAM & FLOWS ──
    # ──────────────────────────────────────────────────────────
    story.append(p("3. System Architecture & Flowchart", h1_style))
    story.append(p(
        "The following diagram represents the core architectural layers of the Staypik system, illustrating "
        "how the React client maps authentication, route matching, and state changes to the Django backend. "
        "Media assets are offloaded to Cloudinary, and relational state is persisted in PostgreSQL."
    ))

    # ASCII Architecture Diagram Table
    diag_data = [
        ["System Layer", "Sub-Components & Interfaces"],
        ["Client View (React)", "Guest Home | Property Detail | Host Dashboard | Rent Ledger | Complaints"],
        ["State & Auth Context", "SimpleJWT LocalStorage Bearer Token Interceptor | Firebase SDK Login Handler"],
        ["API Gateway (Django)", "URL Router (api/auth/*, api/rentals/*) | JWTAuthentication Middleware | CORS Headers"],
        ["Business Logic (Views)", "Serializer Validation | Owner Approval Guard | Vacancy Counter | Auto Rent Generator"],
        ["Database (PostgreSQL)", "Users (Auth) | Properties | Rooms | Tenants | RentPayments | Complaints"],
        ["Static / Media Assets", "Whitenoise Storage (Static CSS/JS) | Cloudinary Storage API (Tenant/Property Photos)"]
    ]
    story.append(make_table(diag_data, [130, 374]))

    story.append(Spacer(1, 10))
    story.append(p("4. Authentication Flow Mechanics", h1_style))
    story.append(p(
        "Staypik employs a dual authentication strategy designed to maximize security while facilitating easy local development:"
    ))
    story.append(p(
        "<b>1. Firebase Identity Federation (Production Core):</b> The React frontend obtains a secure ID token from Firebase. "
        "This token is posted to <code>/api/auth/firebase-login/</code>. The Django backend decodes the token "
        "using the <code>firebase-admin</code> SDK, extracts the unique UID, checks or creates a local Django database user, "
        "and issues a high-security Django REST framework SimpleJWT token pair (Access: 30 days, Refresh: 90 days). In local "
        "development mode with <code>DEBUG = True</code>, a split decoding fallback runs to facilitate sandbox tests."
    ))
    story.append(p(
        "<b>2. Django Native Authentication (Testing Fallback):</b> To bypass complex Firebase dependencies during offline "
        "or sandbox execution, hosts and administrators can login directly via <code>/api/auth/django-login/</code>. This endpoint "
        "authenticates username/password payloads directly against the Django database."
    ))
    story.append(p(
        "<b>3. Access Controls:</b> Every stateful request uses an Axios interceptor to append the Bearer access token. "
        "API access is restricted using permissions classes like <code>IsAuthenticated</code> and the custom class "
        "<code>IsApprovedOwner</code> which verifies that the user holds an <code>OWNER</code> role and has been vetted "
        "by the administrator."
    ))

    story.append(PageBreak())

    # ──────────────────────────────────────────────────────────
    # ── PAGE 4: DATABASE SCHEMAS (RENTALS ACTIVE APP) ──
    # ──────────────────────────────────────────────────────────
    story.append(p("5. Database Models & Schema: 'rentals' Core", h1_style))
    story.append(p(
        "The relational database schema is structured around Django models. Below are the key entities defined in the "
        "active <code>rentals</code> application:"
    ))

    # User & Owner Profile Schema
    story.append(p("User & Profile Relationships", h2_style))
    user_schema = [
        ["Field Name", "Data Type", "Constraint", "System Purpose"],
        ["id", "BigAutoField", "Primary Key", "Unique identifier for user account."],
        ["username", "CharField", "Unique (Max 150)", "Firebase UID (for Firebase auth) or username (native auth)."],
        ["email", "EmailField", "Required", "Email address used for communications and billing."],
        ["role", "CharField", "Default: 'USER'", "Enum choice: 'USER' (Guest seeker) or 'OWNER' (Host admin)."],
        ["display_name", "CharField", "Optional", "Friendly name displayed on headers and cards."],
        ["avatar", "ImageField", "Nullable", "Uploaded avatar file stored on Cloudinary."]
    ]
    story.append(make_table(user_schema, [90, 80, 110, 224]))
    
    story.append(Spacer(1, 8))
    owner_schema = [
        ["Field Name", "Data Type", "Constraint", "System Purpose"],
        ["id", "BigAutoField", "Primary Key", "Unique owner identifier."],
        ["user", "OneToOneField", "CASCADE", "Maps exactly to one User model instance (role=OWNER)."],
        ["full_name", "CharField", "Required", "Legal name of the host/landlord."],
        ["mobile_number", "CharField", "Required", "Contact number shared with guests booking property visits."],
        ["is_approved", "BooleanField", "Default: False", "Admin toggle regulating access to host dashboard operations."]
    ]
    story.append(make_table(owner_schema, [90, 80, 110, 224]))

    # Property & Room Schema
    story.append(Spacer(1, 10))
    story.append(p("Property & Room Configurations", h2_style))
    property_schema = [
        ["Field Name", "Data Type", "Constraint", "System Purpose"],
        ["id", "BigAutoField", "Primary Key", "Unique property listing ID."],
        ["owner", "ForeignKey", "CASCADE", "References the owner User instance."],
        ["name", "CharField", "Required", "Display name of the PG, hostel, or co-living space."],
        ["property_type", "CharField", "Choices", "PG | Hostel | Co-Living | Apartment."],
        ["gender", "CharField", "Default: 'Unisex'", "Target demographics: Boys Only | Girls Only | Unisex."],
        ["base_rent / deposit", "DecimalField", "Required", "Base rent amount and security deposit required."],
        ["amenities", "JSONField", "Default: list", "Raw list of amenities (e.g. WiFi, AC, Geyser, Food)."],
        ["latitude / longitude", "DecimalField", "Nullable", "Coordinates used for Google Maps integrations and local sorting."]
    ]
    story.append(make_table(property_schema, [110, 80, 90, 224]))

    story.append(PageBreak())

    # ──────────────────────────────────────────────────────────
    # ── PAGE 5: DATABASE SCHEMAS CONTINUED (LEASES, COMPLAINTS, ANCILLARY) ──
    # ──────────────────────────────────────────────────────────
    story.append(p("Room Details Schema", h2_style))
    room_schema = [
        ["Field Name", "Data Type", "Constraint", "System Purpose"],
        ["id", "BigAutoField", "Primary Key", "Unique room record ID."],
        ["property", "ForeignKey", "CASCADE", "Links the room to a specific property."],
        ["room_number", "CharField", "Required", "Room number or identifier (e.g. '101A')."],
        ["room_type", "CharField", "Required", "e.g. Single, Double Sharing, Triple Sharing."],
        ["total_beds / occupied", "PositiveIntegerField", "Required", "Counter managing vacancy (occupied_beds incremented on lease)."],
        ["monthly_rent / deposit", "DecimalField", "Required", "Specific room pricing (overrides default property base rent)."]
    ]
    story.append(make_table(room_schema, [110, 80, 90, 224]))

    # Tenancy & Rental Accounting Schema
    story.append(Spacer(1, 10))
    story.append(p("Tenancy Ledger & Complaints Schema", h2_style))
    tenant_schema = [
        ["Field Name", "Data Type", "Constraint", "System Purpose"],
        ["id", "BigAutoField", "Primary Key", "Unique tenant record ID."],
        ["user", "ForeignKey", "Nullable", "Links the tenant to a registered User account (for logging complaints)."],
        ["property / room", "ForeignKey", "Required", "Links the tenant to their assigned building and room."],
        ["tenant_name / phone", "CharField", "Required", "Contact info of the occupant (may be manual entry)."],
        ["lease_start / end", "DateField", "Required / Nullable", "Dates of active residency."],
        ["is_active", "BooleanField", "Default: True", "Soft-delete toggle. Unregistering tenant sets this to False."]
    ]
    story.append(make_table(tenant_schema, [110, 80, 90, 224]))

    story.append(Spacer(1, 8))
    payment_schema = [
        ["Field Name", "Data Type", "Constraint", "System Purpose"],
        ["id", "BigAutoField", "Primary Key", "Unique transaction ledger ID."],
        ["tenant", "ForeignKey", "CASCADE", "Links transaction to the resident."],
        ["amount", "DecimalField", "Required", "Monthly rent fee billed."],
        ["due_date", "DateField", "Required", "Target due date (automatically defaulted to lease start month)."],
        ["payment_date", "DateField", "Nullable", "Date payment was settled by host action."],
        ["status", "CharField", "Choices", "Payment state tracking: PAID | UNPAID | OVERDUE."]
    ]
    story.append(make_table(payment_schema, [110, 80, 90, 224]))

    story.append(Spacer(1, 8))
    complaint_schema = [
        ["Field Name", "Data Type", "Constraint", "System Purpose"],
        ["id", "BigAutoField", "Primary Key", "Unique ticket ID."],
        ["tenant", "ForeignKey", "CASCADE", "Links grievance to the reporting tenant."],
        ["property", "ForeignKey", "CASCADE", "Links grievance to the physical property building."],
        ["title / description", "CharField / TextField", "Required", "Brief title and full text description of the issue."],
        ["status", "CharField", "Default: 'OPEN'", "Ticket workflow state: OPEN | IN_PROGRESS | RESOLVED."]
    ]
    story.append(make_table(complaint_schema, [110, 80, 90, 224]))

    story.append(PageBreak())

    # ──────────────────────────────────────────────────────────
    # ── PAGE 6: DATABASE SCHEMAS (TRIPS APP - ARCHIVED) ──
    # ──────────────────────────────────────────────────────────
    story.append(p("6. Modular Application Template: 'trips' (Travel packages)", h1_style))
    story.append(p(
        "In addition to the rentals platform, the codebase contains a fully defined <code>trips</code> application directory. "
        "This app models a tour booking and travel packages engine. While the code is modular and complete, "
        "it is currently <b>inactive</b> in settings configuration. Below is the documentation of its database models:"
    ))

    # TourPackage Model
    story.append(p("TourPackage Model Schema", h2_style))
    package_schema = [
        ["Field Name", "Data Type", "Constraint", "System Purpose"],
        ["id", "BigAutoField", "Primary Key", "Unique travel package ID."],
        ["title / destination", "CharField", "Required", "Name and landing destination of the tour package."],
        ["duration_days / nights", "PositiveIntegerField", "Required", "Duration of package (e.g. 5D/4N)."],
        ["base_price_per_person", "DecimalField", "Required", "Starting package price per traveler."],
        ["cover_image", "ImageField", "Nullable", "Upload path stored in Cloudinary package_covers/."],
        ["category", "ForeignKey", "SET_NULL / Nullable", "Category taxonomy classification (e.g. Hill Station, Beach)."],
        ["avg_rating / total_reviews", "Float / Integer", "Defaults: 0", "Cached metrics for search result sorting."]
    ]
    story.append(make_table(package_schema, [120, 80, 100, 204]))

    # DayItinerary & PricingBreakdown Schema
    story.append(Spacer(1, 10))
    story.append(p("Itinerary & Pricing Breakdown Schema", h2_style))
    itinerary_schema = [
        ["Field Name", "Data Type", "Constraint", "System Purpose"],
        ["id", "BigAutoField", "Primary Key", "Unique day record ID."],
        ["package", "ForeignKey", "CASCADE", "Links itinerary day to the package."],
        ["day_number", "PositiveIntegerField", "Required", "Order index of the day (e.g. Day 1, Day 2)."],
        ["title / description", "CharField / TextField", "Required", "Day summary and detailed itinerary instructions."],
        ["stay_type", "CharField", "Nullable", "Type of accommodation provided for the night."]
    ]
    story.append(make_table(itinerary_schema, [120, 80, 100, 204]))

    story.append(Spacer(1, 8))
    price_breakdown_schema = [
        ["Field Name", "Data Type", "Constraint", "System Purpose"],
        ["id", "BigAutoField", "Primary Key", "Unique breakdown ID."],
        ["package", "OneToOneField", "CASCADE", "Maps strictly to one TourPackage."],
        ["transport_cost_total", "DecimalField", "Required", "Total transport components (cab/bus/flight)."],
        ["stay_cost_total", "DecimalField", "Required", "Total lodging cost allocated."],
        ["food_cost_per_person", "DecimalField", "Required", "Meals components per traveler."],
        ["price_per_person_calculated", "DecimalField", "Calculated", "Computed total base package pricing."]
    ]
    story.append(make_table(price_breakdown_schema, [120, 80, 100, 204]))

    story.append(Spacer(1, 8))
    booking_schema = [
        ["Field Name", "Data Type", "Constraint", "System Purpose"],
        ["id", "BigAutoField", "Primary Key", "Unique booking reservation ID."],
        ["package", "ForeignKey", "CASCADE", "Links reservation to the booked package."],
        ["user", "ForeignKey", "CASCADE", "References Firebase AppUser instance."],
        ["start_date / end_date", "DateField", "Required", "Trip schedule dates."],
        ["status", "CharField", "Choices", "Booking state: inquiry | confirmed | completed | cancelled."]
    ]
    story.append(make_table(booking_schema, [120, 80, 100, 204]))

    story.append(PageBreak())

    # ──────────────────────────────────────────────────────────
    # ── PAGE 7: REST API ROUTING REFERENCE TABLE (ACTIVE APIS) ──
    # ──────────────────────────────────────────────────────────
    story.append(p("7. Active API Endpoints Reference", h1_style))
    story.append(p(
        "The Staypik backend provides a rich JSON REST API exposed via <code>/api/</code> URL patterns. "
        "All endpoints require an active JWT token in the Authorization header unless specified as AllowAny."
    ))

    # API Endpoints Table
    api_data = [
        ["HTTP Path", "Method", "Permission Level", "Description & Key Functionality"],
        ["/api/auth/firebase-login/", "POST", "AllowAny", "Accepts Firebase ID token; logs in/registers user; returns JWT."],
        ["/api/auth/django-login/", "POST", "AllowAny", "Authenticates username/email & password directly; returns JWT."],
        ["/api/rentals/profile/", "GET/PATCH", "IsAuthenticated", "Fetches active user details and owner profiles; supports patch updates."],
        ["/api/rentals/become-owner/", "POST", "IsAuthenticated", "Elevates User role to OWNER and registers their first Property listing."],
        ["/api/rentals/properties/", "GET", "AllowAny", "Lists active property cards; supports filters (city, max_rent, type, search)."],
        ["/api/rentals/properties/<id>/", "GET", "AllowAny", "Retrieves complete property details including list of available rooms."],
        ["/api/rentals/properties/manage/", "POST", "IsApprovedOwner", "Creates a new property listing. Handles multipart file image uploads."],
        ["/api/rentals/properties/manage/<id>/", "PUT/DELETE", "IsApprovedOwner", "Updates details of a property or deletes the listing entirely."],
        ["/api/rentals/properties/<id>/rooms/", "POST", "IsApprovedOwner", "Adds a Room configuration row to the selected property."],
        ["/api/rentals/properties/<id>/visit/", "POST", "IsAuthenticated", "Schedules a visit to a property; auto-alerts host via notifications."],
        ["/api/rentals/bookings/", "GET", "IsAuthenticated", "Retrieves list of booked visit requests (filtered to User/Host contexts)."],
        ["/api/rentals/bookings/<id>/", "PATCH/DELETE", "IsAuthenticated", "Cancels/modifies status of a visit request, or deletes the log."],
        ["/api/rentals/owner/dashboard/", "GET", "IsApprovedOwner", "Returns KPIs: occupied/vacant beds, tenant counts, open complaints."],
        ["/api/rentals/owner/tenants/", "GET/POST", "IsApprovedOwner", "Lists active tenants; registers tenant, link room, billing initial rent."],
        ["/api/rentals/owner/tenants/<id>/", "DELETE", "IsApprovedOwner", "Soft-deletes tenant, decrements occupied beds, clears associated bills."],
        ["/api/rentals/owner/complaints/", "GET/POST", "IsAuthenticated", "Tenant submits grievances; Host retrieves the list of complaints."],
        ["/api/rentals/owner/complaints/<id>/", "PATCH", "IsApprovedOwner", "Updates complaint status (OPEN | IN_PROGRESS | RESOLVED)."],
        ["/api/rentals/owner/payments/", "GET", "IsApprovedOwner", "Lists rent logs due, showing amount and payment states."],
        ["/api/rentals/support/", "POST", "AllowAny", "Submits a support inquiry form directly to the database backend."]
    ]
    story.append(make_table(api_data, [140, 50, 94, 220]))

    story.append(PageBreak())

    # ──────────────────────────────────────────────────────────
    # ── PAGE 8: FRONTEND NAVIGATION, STATE, DEPLOYMENT & ENV ──
    # ──────────────────────────────────────────────────────────
    story.append(p("8. Frontend Navigation & Router Structure", h1_style))
    story.append(p(
        "The React single-page frontend uses <code>react-router-dom</code> to declare distinct navigation paths "
        "based on the authenticated user's active session mode. Mode toggle switches between <b>GUEST</b> and <b>HOST</b> viewports."
    ))

    # UI Pages Table
    ui_data = [
        ["Workspace Mode", "React URL Path", "Page Component File", "Primary Purpose"],
        ["GUEST (Public)", "/", "Home.jsx", "Displays hero search, search listings, locality filters, banners."],
        ["GUEST (Vetted)", "/property/:id", "PropertyDetail.jsx", "Shows property specs, room list tables, maps, host info."],
        ["GUEST (Vetted)", "/property/:id/book", "VisitBooking.jsx", "Booking wizard scheduling site visits for selected property."],
        ["GUEST (Vetted)", "/bookings", "Bookings.jsx", "Renders list of scheduled visit requests and status history."],
        ["GUEST (Vetted)", "/saved", "Saved.jsx", "Displays property cards bookmarked by the user locally."],
        ["HOST (Owner Panel)", "/dashboard", "Dashboard.jsx", "Metric indicators (total rooms, occupied/vacant beds, unpaid bills)."],
        ["HOST (Owner Panel)", "/properties", "Properties.jsx", "Listings inventory list allowing owners to deactivate/edit properties."],
        ["HOST (Owner Panel)", "/properties/new", "AddEditProperty.jsx", "Form creation for listing new PGs, rooms, uploading photos."],
        ["HOST (Owner Panel)", "/tenants", "Tenants.jsx", "Tenant registration ledger showing residents, leases, unregistrations."],
        ["HOST (Owner Panel)", "/rent", "RentTracking.jsx", "Financial control center for marking rent payments PAID/UNPAID."],
        ["HOST (Owner Panel)", "/bookings", "Bookings.jsx", "Host variant page displaying visit requests needing approval/completion."]
    ]
    story.append(make_table(ui_data, [100, 100, 104, 200]))

    story.append(Spacer(1, 10))
    story.append(p("9. System Deployment & Configuration", h1_style))
    story.append(p(
        "Both backend and frontend require environment configuration files to maintain state across different environments:"
    ))
    
    # Environment Variables Table
    env_data = [
        ["Config Environment Variable", "Target System", "Description & Operational Function"],
        ["VITE_API_URL", "Frontend (.env)", "Points the React client to the HTTP API url (defaults to localhost:8000)."],
        ["DATABASE_URL", "Backend (.env)", "PostgreSQL database connection string (URI). SQLite fallback if empty."],
        ["SECRET_KEY", "Backend (.env)", "Secret cryptographic key used for Django signing processes and JWT tokens."],
        ["DEBUG", "Backend (.env)", "Boolean control. If False, triggers CORS restrictions and secure cookies."],
        ["CLOUDINARY_CLOUD_NAME", "Backend (.env)", "Target storage cloud identifier on Cloudinary servers."],
        ["CLOUDINARY_API_KEY / API_SECRET", "Backend (.env)", "Vetting credentials authorized to write to Cloudinary bucket."],
        ["FIREBASE_CREDENTIALS", "Backend (.env)", "Raw JSON string credential credentials dictionary for production auth."],
        ["FIREBASE_CREDENTIALS_PATH", "Backend (.env)", "Fallback server file path pointing to the Firebase service account JSON key."]
    ]
    story.append(make_table(env_data, [150, 94, 260]))

    story.append(Spacer(1, 10))
    story.append(p("10. Deployment Strategy", h1_style))
    story.append(p(
        "<b>Frontend:</b> Deployed on Vercel utilizing routing directives declared in <code>vercel.json</code>, forcing Vite SPA path "
        "rewrites to index.html for React Router compatibility.<br/>"
        "<b>Backend:</b> Optimized for cloud host services (Render, Railway, Heroku) via Gunicorn servers defined in the <code>Procfile</code>. "
        "Whitenoise is built in the middleware pipeline to serve production-ready static assets directly without separate Nginx setups."
    ))

    # Build the PDF file
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Documentation compiled successfully to: {filename}")

if __name__ == "__main__":
    pdf_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Staypik_Technical_Documentation.pdf")
    build_pdf(pdf_path)
