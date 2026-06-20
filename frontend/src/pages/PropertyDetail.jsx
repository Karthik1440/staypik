import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, MapPin, ShieldCheck, Heart, Share2, 
  Wifi, Utensils, Shirt, Shield, Bath, Zap, Sparkles, Star,
  ChevronLeft, ChevronRight, User, Home, DollarSign,
  Droplet, Car, ArrowUpDown
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
    const shareData = {
      title: property?.name || 'Staypik Property',
      text: `Check out ${property?.name || 'this property'} on Staypik!`,
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
      await navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard! Opening WhatsApp to share...");
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
    
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      `Check out ${property?.name || 'this property'} on Staypik! ${window.location.href}`
    )}`;
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

  const coverImage = images && images.length > 0 
    ? (images[currentImageIndex]?.image || images[0].image) 
    : 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80';

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
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen pb-10 text-left animate-fadeIn">
      {/* Top Slider Hero Header */}
      <div 
        className="relative aspect-[4/3] bg-slate-200 w-full overflow-hidden cursor-grab active:cursor-grabbing"
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

      {/* Main Details Body */}
      <div className="bg-white rounded-t-[32px] -mt-6 relative z-10 px-6 pt-8 pb-4 space-y-6 shadow-xl border-t border-slate-100/30">
        {/* Title Block */}
        <div className="space-y-3">
          {is_verified && (
            <div className="flex">
              <span className="px-3 py-1 text-[11px] font-black rounded-lg bg-emerald-100 text-emerald-700 uppercase tracking-wider">
                Verified
              </span>
            </div>
          )}

          <h1 className="text-2xl font-black text-slate-800 leading-tight">{name}</h1>

          {/* Location and Rating on the same line */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-bold text-slate-400">
            <div className="flex items-center">
              <MapPin size={13} className="text-slate-400 mr-1 flex-shrink-0" />
              <span>{locality}, {city}</span>
              {property.distance !== undefined && property.distance !== null && (
                <span className="text-emerald-600 font-extrabold ml-1.5">
                  ({property.distance.toFixed(1)} km away)
                </span>
              )}
            </div>
            <div className="flex items-center text-slate-500">
              <Star size={13} className="fill-amber-500 text-amber-500 mr-1" />
              <span>4.6 <span className="text-slate-400 font-semibold">(128 reviews)</span></span>
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Premium Metadata Info Box Grid */}
        <div className="bg-[#F8F9FB] rounded-[24px] p-4.5 grid grid-cols-2 gap-y-3.5 gap-x-2 border border-slate-100/30">
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
              <p className="text-[10px] font-bold text-slate-400 leading-none">Security Deposit</p>
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
          <div className="grid grid-cols-3 gap-3">
            {amenities && amenities.length > 0 ? (
              amenities.slice(0, 6).map((amenity, idx) => (
                <div key={idx} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 space-y-1.5">
                  <div className="text-amber-700">{getAmenityIcon(amenity)}</div>
                  <span className="text-[10px] font-extrabold w-full text-center break-words">{amenity}</span>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center text-xs text-slate-400 font-semibold py-2">
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
          <p className="text-slate-600 text-xs leading-relaxed font-semibold">
            {readMore ? description : `${description.slice(0, 140)}...`}
          </p>
          <button 
            type="button" 
            onClick={() => setReadMore(!readMore)}
            className="text-xs font-black text-amber-700 hover:underline"
          >
            {readMore ? 'Read less' : 'Read more'}
          </button>
        </div>

        <hr className="border-slate-100" />

        {/* Room/Apartment Types Card Selector */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
            {property_type === 'Apartment' ? 'Apartment Types' : 'Room Types'}
          </h3>

          {/* Room Type Selector Tabs */}
          {availableRoomTypes.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto pb-1.5 -mx-6 px-6 hide-scrollbar flex-nowrap whitespace-nowrap">
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
                      <p className="text-[10px] font-bold text-slate-400">
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
                      <span className="font-black text-slate-800 text-sm">₹{Number(room.monthly_rent).toLocaleString()}<span className="text-[10px] font-bold text-slate-400">/mo</span></span>
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

          <hr className="border-slate-100 mt-6" />

          {/* Booking Action Row */}
          <div className="flex justify-between items-center pt-6">
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
      </div>
    </div>
  );
}
