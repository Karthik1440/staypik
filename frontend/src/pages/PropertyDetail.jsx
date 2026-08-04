import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, MapPin, ShieldCheck, Heart, Share2, 
  Wifi, Utensils, Shirt, Shield, Bath, Zap, Sparkles, Star,
  ChevronLeft, ChevronRight, User, Home, DollarSign,
  Droplet, Car, ArrowUpDown, X, Grid, Camera, ZoomIn
} from 'lucide-react';

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [readMore, setReadMore] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [activeRoomFilter, setActiveRoomFilter] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Lightbox Modal States
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (index = 0) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  const nextLightboxImage = () => {
    if (property?.images && property.images.length > 0) {
      setLightboxIndex((prev) => (prev + 1) % property.images.length);
    }
  };

  const prevLightboxImage = () => {
    if (property?.images && property.images.length > 0) {
      setLightboxIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isLightboxOpen) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextLightboxImage();
      if (e.key === 'ArrowLeft') prevLightboxImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, property]);

  const handleRoomFilterChange = (filterType) => {
    setActiveRoomFilter(filterType);
    if (property?.rooms) {
      const firstMatchingRoom = property.rooms.find(r => r.room_type === filterType);
      if (firstMatchingRoom) {
        setSelectedRoom(firstMatchingRoom);
      }
    }
  };

  // Touch handlers for swipe gesture
  const [touchStart, setTouchStart] = useState(null);

  const minSwipeDistance = 50;

  const handleTouchStart = (e) => {
    if (e.touches && e.touches.length > 0) {
      setTouchStart(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = (e) => {
    if (!touchStart || !property?.images || property.images.length <= 1) return;
    if (e.changedTouches && e.changedTouches.length > 0) {
      const endX = e.changedTouches[0].clientX;
      const distance = touchStart - endX;
      const isLeftSwipe = distance > minSwipeDistance;
      const isRightSwipe = distance < -minSwipeDistance;
      if (isLeftSwipe) {
        setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
      } else if (isRightSwipe) {
        setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
      }
    }
  };

  // Favorites state
  const [favorites, setFavorites] = useState(() => {
    const stored = localStorage.getItem('staypik_favorites');
    return stored ? JSON.parse(stored) : [];
  });

  const toggleFavorite = (propertyId) => {
    let updated;
    if (favorites.includes(propertyId)) {
      updated = favorites.filter(id => id !== propertyId);
    } else {
      updated = [...favorites, propertyId];
    }
    setFavorites(updated);
    localStorage.setItem('staypik_favorites', JSON.stringify(updated));
  };

  const handleShare = async () => {
    const formattedText = 
      `🏡 *${property?.name || 'Staypik Accommodation'}*\n` +
      `📍 ${property?.locality ? `${property.locality}, ` : ''}${property?.city || 'Bangalore'}\n` +
      `💰 Rent: ₹${Number(selectedRoom ? selectedRoom.monthly_rent : (property?.base_rent || 0)).toLocaleString()}/mo | Deposit: ₹${Number(selectedRoom && selectedRoom.deposit ? selectedRoom.deposit : (property?.deposit || 0)).toLocaleString()}\n` +
      `✨ ${property?.property_type || 'PG'} for ${property?.gender || 'All'} • ${property?.amenities && property.amenities.length > 0 ? property.amenities.slice(0, 3).join(', ') : 'Verified listing'}\n\n` +
      `👉 View photos & book visit:\n${window.location.href}`;

    const shareData = {
      title: `${property?.name || 'Staypik Property'} - ${property?.locality || property?.city || ''}`,
      text: formattedText,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        console.warn("Native share failed:", err);
      }
    }

    // Fallback: Copy link and open WhatsApp
    try {
      await navigator.clipboard.writeText(`${formattedText}`);
      alert("Property details and link copied to clipboard! Opening WhatsApp to share...");
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
    
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(formattedText)}`;
    window.open(whatsappUrl, '_blank');
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchDetail(position.coords.latitude, position.coords.longitude);
        },
        () => {
          fetchDetail();
        },
        { enableHighAccuracy: true, timeout: 3000, maximumAge: 60000 }
      );
    } else {
      fetchDetail();
    }
  }, [id]);

  const fetchDetail = async (lat = null, lng = null) => {
    setLoading(true);
    try {
      let url = `/rentals/properties/${id}/`;
      if (lat && lng) {
        url += `?lat=${lat}&lng=${lng}`;
      }
      const res = await api.get(url);
      setProperty(res.data);
      if (res.data.rooms && res.data.rooms.length > 0) {
        // Look for matching sharing param
        const queryParams = new URLSearchParams(window.location.search);
        const sharingParam = queryParams.get('sharing');
        let initialFilter = '';
        if (sharingParam) {
          const matchedRoom = res.data.rooms.find(r => {
            const type = (r.room_type || '').toLowerCase();
            const param = sharingParam.toLowerCase();
            return type.includes(param) || param.includes(type) ||
                   (param.includes('single') && type.includes('single')) ||
                   (param.includes('double') && type.includes('double')) ||
                   (param.includes('triple') && type.includes('triple')) ||
                   (param.includes('quad') && type.includes('quad'));
          });
          if (matchedRoom) {
            initialFilter = matchedRoom.room_type;
          }
        }
        
        if (!initialFilter) {
          initialFilter = res.data.rooms[0].room_type;
        }

        setActiveRoomFilter(initialFilter);
        const initialRoom = res.data.rooms.find(r => r.room_type === initialFilter) || res.data.rooms[0];
        setSelectedRoom(initialRoom);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-24 text-slate-400 font-semibold">Loading details...</div>;
  if (!property) return <div className="text-center py-24 text-slate-400 font-semibold">Property listing not found</div>;

  const {
    name, property_type, gender, address, locality, city, description, base_rent, deposit, amenities, owner_name, owner_phone, images, rooms, is_verified
  } = property;

  const filteredRooms = rooms && activeRoomFilter
    ? rooms.filter(r => r.room_type === activeRoomFilter)
    : (rooms || []);

  const availableRoomTypes = rooms 
    ? Array.from(new Set(rooms.map(r => r.room_type)))
    : [];

  const rawCoverImage = images && images.length > 0 
    ? (images[currentImageIndex]?.image || images[0].image) 
    : 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80';

  const absoluteCoverImage = rawCoverImage.startsWith('http://') || rawCoverImage.startsWith('https://')
    ? rawCoverImage
    : `${window.location.origin}${rawCoverImage.startsWith('/') ? '' : '/'}${rawCoverImage}`;

  const coverImage = rawCoverImage;

  const shareTitle = `${name} - ${locality || city || 'Bangalore'} | Staypik`;
  const shareDescription = `Rent starting at ₹${Number(base_rent).toLocaleString()}/month. ${property_type || 'PG'} for ${gender || 'all'} in ${locality ? `${locality}, ` : ''}${city}. Verified listing on Staypik.`;

  const getAmenityIcon = (name) => {
    const norm = name.toLowerCase();
    if (norm.includes('wifi')) return <Wifi size={18} />;
    if (norm.includes('food') || norm.includes('kitchen') || norm.includes('meal')) return <Utensils size={18} />;
    if (norm.includes('laundry') || norm.includes('wash')) return <Shirt size={18} />;
    if (norm.includes('cctv') || norm.includes('security')) return <Shield size={18} />;
    if (norm.includes('washroom') || norm.includes('bathroom') || norm.includes('bath')) return <Bath size={18} />;
    if (norm.includes('power') || norm.includes('electricity') || norm.includes('generator') || norm.includes('ac')) return <Zap size={18} />;
    if (norm.includes('water') || norm.includes('drinking')) return <Droplet size={18} />;
    if (norm.includes('parking') || norm.includes('car')) return <Car size={18} />;
    if (norm.includes('lift') || norm.includes('elevator')) return <ArrowUpDown size={18} />;
    return <Sparkles size={18} />;
  };

  const getVacantBeds = (p) => {
    const totalBeds = p?.rooms ? p.rooms.reduce((acc, r) => acc + r.total_beds, 0) : 0;
    const occupiedBeds = p?.rooms ? p.rooms.reduce((acc, r) => acc + r.occupied_beds, 0) : 0;
    return Math.max(0, totalBeds - occupiedBeds);
  };

  const getAvailableUnits = (p) => {
    if (!p?.rooms) return 0;
    return p.rooms.filter(r => (r.occupied_beds || 0) < (r.total_beds || 1)).length;
  };

  const handleBookVisitRedirect = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    const roomIdQuery = selectedRoom ? `?room_id=${selectedRoom.id}` : '';
    navigate(`/property/${id}/book${roomIdQuery}`);
  };

  return (
    <div className="max-w-md md:max-w-6xl mx-auto bg-slate-50 min-h-screen pb-16 md:pb-12 px-0 md:px-6 pt-0 md:pt-4 text-left animate-fadeIn">
      <Helmet>
        <title>{shareTitle}</title>
        <meta name="description" content={shareDescription} />
        <link rel="canonical" href={`https://www.staypik.in/property/${id}`} />
        
        {/* OpenGraph & Social Cards for WhatsApp, Facebook, LinkedIn */}
        <meta property="og:site_name" content="Staypik" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={shareTitle} />
        <meta property="og:description" content={shareDescription} />
        <meta property="og:image" content={absoluteCoverImage} />
        <meta property="og:image:secure_url" content={absoluteCoverImage} />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content={`https://www.staypik.in/property/${id}`} />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={shareTitle} />
        <meta name="twitter:description" content={shareDescription} />
        <meta name="twitter:image" content={absoluteCoverImage} />

        {/* Schema.org Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Accommodation",
            "name": name,
            "description": description,
            "image": absoluteCoverImage,
            "address": {
              "@type": "PostalAddress",
              "streetAddress": address,
              "addressLocality": locality || city,
              "addressRegion": city,
              "addressCountry": "IN"
            },
            "offers": {
              "@type": "Offer",
              "priceCurrency": "INR",
              "price": base_rent || 0,
              "availability": "https://schema.org/InStock"
            }
          })}
        </script>
      </Helmet>

      {/* Desktop Top Action Header */}
      <div className="hidden md:flex justify-between items-center mb-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-xs font-extrabold text-slate-500 hover:text-amber-700 transition"
        >
          <ArrowLeft size={16} className="mr-1.5 stroke-[2.5px]" />
          <span>Back to Explore</span>
        </button>

        <div className="flex items-center space-x-3">
          <button 
            onClick={() => toggleFavorite(Number(id))}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 text-xs font-extrabold text-slate-700 transition shadow-sm"
          >
            <Heart 
              size={16} 
              className={`stroke-[2.5px] ${
                favorites.includes(Number(id)) ? 'fill-red-500 text-red-500' : 'text-slate-400'
              }`} 
            />
            <span>{favorites.includes(Number(id)) ? 'Saved' : 'Save'}</span>
          </button>

          <button 
            onClick={handleShare}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 text-xs font-extrabold text-slate-700 transition shadow-sm"
          >
            <Share2 size={16} className="stroke-[2.5px] text-slate-500" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Desktop Gallery View Grid (md:grid hidden on mobile) */}
      <div className="hidden md:grid md:grid-cols-3 gap-3 h-[400px] rounded-3xl overflow-hidden bg-slate-200 border border-slate-100 shadow-md relative group">
        {/* Main Cover Image */}
        <div 
          className="col-span-2 h-full relative overflow-hidden cursor-pointer group/item"
          onClick={() => openLightbox(0)}
        >
          <img 
            src={coverImage} 
            alt={name} 
            className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-500" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity flex items-end p-4">
            <span className="text-white text-xs font-black flex items-center space-x-1.5 bg-slate-900/60 backdrop-blur-sm px-3 py-1.5 rounded-xl">
              <ZoomIn size={14} />
              <span>Click to view full photo</span>
            </span>
          </div>
        </div>

        {/* Right Stacked Thumbnail Grid */}
        <div className="col-span-1 grid grid-rows-2 gap-3 h-full">
          <div 
            className="h-full relative overflow-hidden cursor-pointer group/item bg-slate-300"
            onClick={() => openLightbox(images && images.length > 1 ? 1 : 0)}
          >
            <img 
              src={images && images.length > 1 ? images[1].image : coverImage} 
              alt={`${name} preview 2`} 
              className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-500" 
            />
          </div>
          <div 
            className="h-full relative overflow-hidden cursor-pointer group/item bg-slate-300"
            onClick={() => openLightbox(images && images.length > 2 ? 2 : 0)}
          >
            <img 
              src={images && images.length > 2 ? images[2].image : coverImage} 
              alt={`${name} preview 3`} 
              className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-500" 
            />
            {images && images.length > 3 && (
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center text-white font-black text-sm">
                +{images.length - 2} Photos
              </div>
            )}
          </div>
        </div>

        {/* Floating View All Photos Button */}
        <button
          onClick={() => openLightbox(0)}
          className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-slate-800 text-xs font-black px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-md transition-all active:scale-95 flex items-center space-x-2 z-20 border border-slate-200/50"
        >
          <Camera size={16} className="text-amber-700" />
          <span>View All Photos ({images && images.length > 0 ? images.length : 1})</span>
        </button>
      </div>

      {/* Mobile Top Slider Hero Header (md:hidden) */}
      <div 
        className="md:hidden relative aspect-[4/3] bg-slate-200 w-full overflow-hidden cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img src={coverImage} alt={name} className="w-full h-full object-cover select-none pointer-events-none" />
        
        {/* Navigation Overlays directly on image */}
        <div className="absolute top-6 inset-x-6 flex justify-between items-center z-20">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-[#1E293B]/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-[#1E293B]/60 transition active:scale-90"
            title="Back"
          >
            <ArrowLeft size={20} className="stroke-[2.5px]" />
          </button>
          
          <div className="flex space-x-2">
            <button 
              onClick={() => toggleFavorite(Number(id))}
              className="w-10 h-10 rounded-full bg-[#1E293B]/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-[#1E293B]/60 transition active:scale-90"
              title="Favorite"
            >
              <Heart 
                size={20} 
                className={`stroke-[2.5px] ${
                  favorites.includes(Number(id)) ? 'fill-red-500 text-red-500' : 'text-white'
                }`} 
              />
            </button>
            <button 
              onClick={handleShare}
              className="w-10 h-10 rounded-full bg-[#1E293B]/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-[#1E293B]/60 transition active:scale-90"
              title="Share"
            >
              <Share2 size={20} className="stroke-[2.5px] text-white" />
            </button>
          </div>
        </div>

        {/* Left and Right Chevron Navigation */}
        {images && images.length > 1 && (
          <>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#1E293B]/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-[#1E293B]/60 transition active:scale-90 z-20"
              title="Previous Image"
            >
              <ChevronLeft size={18} className="stroke-[2.5px]" />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) => (prev + 1) % images.length);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#1E293B]/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-[#1E293B]/60 transition active:scale-90 z-20"
              title="Next Image"
            >
              <ChevronRight size={18} className="stroke-[2.5px]" />
            </button>
          </>
        )}

        {/* Slide Indicator Dots at bottom center */}
        <div className="absolute bottom-8 inset-x-0 flex justify-center space-x-1.5 z-20">
          {images && images.length > 0 ? (
            images.map((_, idx) => (
              <button 
                key={idx} 
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(idx);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 focus:outline-none ${
                  idx === currentImageIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/50'
                }`} 
              />
            ))
          ) : (
            <span className="w-5 h-1.5 rounded-full bg-white" />
          )}
        </div>
      </div>

      {/* Responsive Content Section: Two-Column Grid on Desktop */}
      <div className="bg-white rounded-t-[32px] md:rounded-3xl -mt-6 md:mt-6 relative z-10 px-6 md:px-8 pt-8 pb-8 shadow-xl md:shadow-sm border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Main Content (Left 2 Columns on Desktop) */}
          <div className="md:col-span-2 space-y-6">
            {/* Title Block */}
            <div className="space-y-3">
              {is_verified && (
                <div className="flex">
                  <span className="px-3 py-1 text-[11px] font-black rounded-lg bg-emerald-100 text-emerald-700 uppercase tracking-wider">
                    Verified Listing
                  </span>
                </div>
              )}

              <h1 className="text-2xl md:text-3xl font-black text-slate-800 leading-tight">{name}</h1>

              {/* Location and Rating on the same line */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-bold text-slate-400">
                <div className="flex items-center">
                  <MapPin size={14} className="text-slate-400 mr-1 flex-shrink-0" />
                  <span>{locality}, {city}</span>
                  {property.distance !== undefined && property.distance !== null && (
                    <span className="text-emerald-600 font-extrabold ml-1.5">
                      ({property.distance.toFixed(1)} km away)
                    </span>
                  )}
                </div>
                <div className="flex items-center text-slate-500">
                  <Star size={14} className="fill-amber-500 text-amber-500 mr-1" />
                  <span>4.6 <span className="text-slate-400 font-semibold">(128 reviews)</span></span>
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Premium Metadata Info Box Grid */}
            <div className="bg-[#F8F9FB] rounded-[24px] p-4.5 grid grid-cols-2 md:grid-cols-4 gap-y-3.5 gap-x-2 border border-slate-100/30">
              {/* Item 1: Gender */}
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-amber-700 flex-shrink-0 shadow-sm">
                  <User size={16} />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 leading-none">Gender</p>
                  <p className="text-xs font-extrabold text-slate-700 mt-1 truncate">{gender}</p>
                </div>
              </div>
              
              {/* Item 2: Property Type */}
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-amber-700 flex-shrink-0 shadow-sm">
                  <Home size={16} />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 leading-none">Type</p>
                  <p className="text-xs font-extrabold text-slate-700 mt-1 truncate">{property_type}</p>
                </div>
              </div>
              
              {/* Item 3: Beds Available or Units Available */}
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-amber-700 flex-shrink-0 shadow-sm">
                  <ShieldCheck size={16} />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 leading-none">
                    {property_type === 'Apartment' ? "Flats Left" : "Beds Left"}
                  </p>
                  <p className="text-xs font-extrabold text-slate-700 mt-1 truncate">
                    {property_type === 'Apartment' ? getAvailableUnits(property) : getVacantBeds(property)}
                  </p>
                </div>
              </div>

              {/* Item 4: Security Deposit */}
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-amber-700 flex-shrink-0 shadow-sm">
                  <DollarSign size={16} />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 leading-none">Deposit</p>
                  <p className="text-xs font-extrabold text-slate-700 mt-1 truncate">
                    ₹{Number(selectedRoom && Number(selectedRoom.deposit) > 0 ? selectedRoom.deposit : (deposit || 0)).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Amenities Icons Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Amenities</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {amenities && amenities.length > 0 ? (
                  amenities.map((amenity, idx) => (
                    <div key={idx} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 space-y-1.5">
                      <div className="text-amber-700">{getAmenityIcon(amenity)}</div>
                      <span className="text-[10px] font-extrabold w-full text-center break-words">{amenity}</span>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 md:col-span-6 text-center text-xs text-slate-400 font-semibold py-2">
                    Standard utilities provided.
                  </div>
                )}
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* About Block */}
            <div className="space-y-2">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                {property_type === 'Apartment' ? 'About this Apartment' : 'About this PG'}
              </h3>
              <p className="text-slate-600 text-xs md:text-sm leading-relaxed font-semibold">
                {readMore ? description : `${description.slice(0, 160)}...`}
              </p>
              {description.length > 160 && (
                <button 
                  type="button" 
                  onClick={() => setReadMore(!readMore)}
                  className="text-xs font-black text-amber-700 hover:underline"
                >
                  {readMore ? 'Read less' : 'Read more'}
                </button>
              )}
            </div>

            <hr className="border-slate-100" />

            {/* Room/Apartment Types Card Selector */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                {property_type === 'Apartment' ? 'Apartment Types' : 'Room Types'}
              </h3>

              {/* Room Type Selector Tabs */}
              {availableRoomTypes.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto pb-1.5 hide-scrollbar flex-nowrap whitespace-nowrap">
                  {availableRoomTypes.map((type) => {
                    const isActive = activeRoomFilter === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleRoomFilterChange(type)}
                        className={`px-4 py-2 rounded-xl text-xs font-black border transition-all duration-150 active:scale-95 flex-shrink-0 ${
                          isActive 
                            ? 'bg-amber-700 border-amber-700 text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                        }`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="space-y-3">
                {filteredRooms && filteredRooms.length > 0 ? (
                  filteredRooms.map((room) => {
                    const vacant = Math.max(0, room.total_beds - room.occupied_beds);
                    const isSelected = selectedRoom?.id === room.id;
                    return (
                      <div 
                        key={room.id}
                        onClick={() => setSelectedRoom(room)}
                        className={`p-4 rounded-2xl border transition duration-200 cursor-pointer flex justify-between items-center ${
                          isSelected 
                            ? 'border-amber-700 bg-amber-50/20 ring-1 ring-amber-700' 
                            : 'border-slate-100 bg-white hover:border-slate-200'
                        }`}
                      >
                        <div className="space-y-1 text-left">
                          <p className="font-extrabold text-slate-800 text-sm">
                            {room.room_type} {room.room_number ? (property_type === 'Apartment' ? `(Flat/Unit ${room.room_number})` : `(Room ${room.room_number})`) : ''}
                          </p>
                          <p className="text-[10px] md:text-xs font-bold text-slate-400">
                            {property_type === 'Apartment' ? (
                              <>
                                {room.furnishing && `${room.furnishing}`}
                                {room.bathroom && ` • ${room.bathroom} Bath`}
                                {room.balcony && ` • ${room.balcony} Balcony`}
                                {room.deposit > 0 && ` • Deposit: ₹${Number(room.deposit).toLocaleString()}`}
                                {room.occupied_beds > 0 ? ' • Rented / Occupied' : ' • Available'}
                              </>
                            ) : (
                              <>
                                {vacant === 0 ? 'No beds left' : `${vacant} bed${vacant > 1 ? 's' : ''} left`}
                                {room.deposit > 0 && ` • Deposit: ₹${Number(room.deposit).toLocaleString()}`}
                              </>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center space-x-3">
                          <span className="font-black text-slate-800 text-sm md:text-base">₹{Number(room.monthly_rent).toLocaleString()}<span className="text-[10px] font-bold text-slate-400">/mo</span></span>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-amber-700 bg-amber-700 text-white' : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center border border-slate-100 rounded-2xl text-slate-400 font-semibold text-xs bg-slate-50">
                    {rooms && rooms.length > 0 
                      ? "No rooms match your search query." 
                      : "No rooms configured. Contact host for details."}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sticky Desktop Booking Sidebar (Right 1 Column on Desktop) */}
          <div className="md:col-span-1 hidden md:block">
            <div className="sticky top-24 bg-white rounded-3xl p-6 shadow-xl border border-slate-100 space-y-6">
              <div className="space-y-1 text-left pb-4 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-400">Monthly Rent</p>
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl font-black text-slate-800">
                    ₹{Number(selectedRoom ? selectedRoom.monthly_rent : base_rent).toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-slate-400">/month</span>
                </div>
                <p className="text-xs font-extrabold text-amber-700 mt-1">
                  Deposit: ₹{Number(selectedRoom && Number(selectedRoom.deposit) > 0 ? selectedRoom.deposit : (deposit || 0)).toLocaleString()}
                </p>
              </div>

              {/* Selected Room Summary */}
              {selectedRoom && (
                <div className="p-3 bg-amber-50/40 rounded-2xl border border-amber-100 text-left">
                  <p className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">Selected Option</p>
                  <p className="text-xs font-black text-slate-800 mt-0.5">{selectedRoom.room_type} {selectedRoom.room_number ? `(Unit ${selectedRoom.room_number})` : ''}</p>
                </div>
              )}

              {/* Primary Book Visit CTA */}
              <button 
                onClick={handleBookVisitRedirect}
                className="w-full py-4 bg-amber-700 hover:bg-amber-800 text-white text-sm font-black rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-amber-700/20 active:scale-95 transition-all duration-150"
              >
                <span>Schedule Free Visit</span>
                <ChevronRight size={18} className="stroke-[3px]" />
              </button>

              {/* Trust Badges */}
              <div className="space-y-2 pt-2 text-left">
                <div className="flex items-center text-xs font-bold text-slate-500">
                  <ShieldCheck size={16} className="text-emerald-600 mr-2 flex-shrink-0" />
                  <span>100% Verified Accommodation</span>
                </div>
                <div className="flex items-center text-xs font-bold text-slate-500">
                  <Sparkles size={16} className="text-amber-500 mr-2 flex-shrink-0" />
                  <span>Zero Commission / Direct Host</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Mobile Floating Action Row (md:hidden) */}
        <div className="md:hidden border-t border-slate-100 pt-6 mt-6 flex justify-between items-center">
          <div className="text-left space-y-0.5">
            <p className="text-[10px] font-bold text-slate-400">Price starting from</p>
            <div className="flex items-baseline">
              <span className="text-xl font-black text-slate-800">
                ₹{Number(selectedRoom ? selectedRoom.monthly_rent : base_rent).toLocaleString()}
              </span>
              <span className="text-xs font-bold text-slate-400 ml-0.5">/month</span>
            </div>
            <p className="text-[10px] font-extrabold text-amber-700">
              Deposit: ₹{Number(selectedRoom && Number(selectedRoom.deposit) > 0 ? selectedRoom.deposit : (deposit || 0)).toLocaleString()}
            </p>
          </div>

          <button 
            onClick={handleBookVisitRedirect}
            className="px-6 py-3.5 bg-amber-700 hover:bg-amber-800 text-white text-sm font-black rounded-2xl flex items-center space-x-2 shadow-lg shadow-amber-700/10 active:scale-95 transition-all duration-150"
          >
            <span>Book Visit</span>
            <ChevronRight size={16} className="stroke-[3px]" />
          </button>
        </div>
      </div>

      {/* Fullscreen Lightbox Photo Viewer Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-4 md:p-6 text-white animate-fadeIn select-none">
          {/* Lightbox Header Bar */}
          <div className="flex justify-between items-center max-w-7xl mx-auto w-full z-10 pt-2">
            <div className="text-left">
              <p className="text-sm font-black tracking-wide">{name}</p>
              <p className="text-xs text-amber-400 font-extrabold mt-0.5">
                Photo {lightboxIndex + 1} of {images && images.length > 0 ? images.length : 1}
              </p>
            </div>

            <button 
              onClick={closeLightbox}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-90 border border-white/10"
              title="Close (Esc)"
            >
              <X size={20} className="stroke-[2.5px]" />
            </button>
          </div>

          {/* Centered Main Image (Uncropped object-contain) */}
          <div className="relative flex-grow flex items-center justify-center my-3 w-full overflow-hidden">
            <img 
              src={images && images.length > 0 ? (images[lightboxIndex]?.image || images[0].image) : coverImage} 
              alt={`${name} photo ${lightboxIndex + 1}`}
              className="max-h-[72vh] md:max-h-[78vh] max-w-[95vw] md:max-w-[85vw] object-contain rounded-2xl shadow-2xl transition-all duration-300 pointer-events-none"
            />

            {/* Lightbox Chevron Controls */}
            {images && images.length > 1 && (
              <>
                <button 
                  onClick={prevLightboxImage}
                  className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center transition backdrop-blur-sm active:scale-90 shadow-2xl border border-white/20 z-20"
                  title="Previous (←)"
                >
                  <ChevronLeft size={26} className="stroke-[3px]" />
                </button>
                <button 
                  onClick={nextLightboxImage}
                  className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center transition backdrop-blur-sm active:scale-90 shadow-2xl border border-white/20 z-20"
                  title="Next (→)"
                >
                  <ChevronRight size={26} className="stroke-[3px]" />
                </button>
              </>
            )}
          </div>

          {/* Lightbox Bottom Thumbnail Strip */}
          {images && images.length > 1 && (
            <div className="max-w-3xl mx-auto w-full overflow-x-auto py-2 flex justify-center items-center space-x-2.5 hide-scrollbar">
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => setLightboxIndex(idx)}
                  className={`w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                    idx === lightboxIndex ? 'border-amber-500 scale-105 opacity-100 shadow-lg' : 'border-white/20 opacity-40 hover:opacity-80'
                  }`}
                >
                  <img src={img.image} alt="thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

