import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import { Search, MapPin, SlidersHorizontal, Heart, Sparkles, Locate } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(''); // Empty means 'All'
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedLocality, setSelectedLocality] = useState('');
  const [maxRent, setMaxRent] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [heroBanners, setHeroBanners] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [viewAll, setViewAll] = useState(false);

  // Search input ref and location query
  const searchInputRef = useRef(null);
  const location = useLocation();

  // Geolocation states
  const [useGeoLocation, setUseGeoLocation] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [locLoading, setLocLoading] = useState(false);

  // Favorites state
  const [favorites, setFavorites] = useState(() => {
    try {
      const stored = localStorage.getItem('staypik_favorites');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
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

  const getRating = (id) => {
    return (4.1 + (id % 9) / 10).toFixed(1);
  };

  const getReviewsCount = (id) => {
    return 30 + (id * 23) % 150;
  };

  // Focus search input when navigated with focusSearch query
  useEffect(() => {
    if (location.search.includes('focusSearch') && searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [location.search]);

  const navigate = useNavigate();

  useEffect(() => {
    fetchProperties();
    fetchHeroBanners();
  }, [selectedCategory, selectedGender, selectedLocality, maxRent, useGeoLocation, userCoords]);

  const fetchHeroBanners = async () => {
    try {
      const res = await api.get('/rentals/hero-banners/');
      setHeroBanners(res.data);
    } catch (e) {
      console.error("Failed to load hero banners:", e);
    }
  };

  useEffect(() => {
    const activeLength = heroBanners.length > 0 ? heroBanners.length : 1;
    if (activeLength <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeLength);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroBanners]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      let url = '/rentals/properties/';
      const params = [];
      if (selectedCategory) params.push(`type=${selectedCategory}`);
      if (selectedGender) params.push(`gender=${selectedGender}`);
      if (selectedLocality) params.push(`locality=${selectedLocality}`);
      if (maxRent) params.push(`max_rent=${maxRent}`);
      if (useGeoLocation && userCoords) {
        params.push(`lat=${userCoords.latitude}`);
        params.push(`lng=${userCoords.longitude}`);
      }
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const res = await api.get(url);
      setProperties(res.data);
    } catch (e) {
      console.error("Failed to load listings:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationToggle = () => {
    if (useGeoLocation) {
      setUseGeoLocation(false);
      setUserCoords(null);
      return;
    }

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setUseGeoLocation(true);
        setLocLoading(false);
      },
      (err) => {
        console.error("Geolocation error:", err);
        alert(`Unable to retrieve your location: ${err.message}`);
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const categories = [
    { name: 'All', value: '' },
    { name: 'PG', value: 'PG' },
    { name: 'Hostel', value: 'Hostel' },
    { name: 'Co-Living', value: 'Co-Living' },
    { name: 'Apartment', value: 'Apartment' },
  ];

  const popularLocalities = ['Koramangala', 'HSR Layout', 'Indiranagar', 'BTM Layout', 'Whitefield'];

  // Filter listings client side for text search
  const filteredProperties = properties.filter(p => {
    const s = search.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(s)) ||
      (p.locality && p.locality.toLowerCase().includes(s)) ||
      (p.city && p.city.toLowerCase().includes(s)) ||
      (p.property_type && p.property_type.toLowerCase().includes(s)) ||
      (p.gender && p.gender.toLowerCase().includes(s))
    );
  });

  // Separate properties into featured (verified) and nearby (unverified) lists
  const featuredProperties = filteredProperties.filter(p => p.is_verified);
  const nearbyProperties = filteredProperties.filter(p => !p.is_verified);

  const getVacantBeds = (p) => {
    const totalBeds = p.rooms ? p.rooms.reduce((acc, r) => acc + r.total_beds, 0) : 0;
    const occupiedBeds = p.rooms ? p.rooms.reduce((acc, r) => acc + r.occupied_beds, 0) : 0;
    return Math.max(0, totalBeds - occupiedBeds);
  };

  return (
    <div className="space-y-8 max-w-md mx-auto sm:max-w-7xl">
      {/* Mobile Search and Header */}
      <div className="space-y-4">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div className="text-left">
            <h1 className="text-xl font-black text-slate-800 flex items-center">
              <span>Hi, Welcome {user ? (user.displayName || user.email.split('@')[0]) : 'Guest'}</span>
              <Sparkles size={16} className="text-amber-500 ml-1.5 animate-pulse" />
            </h1>
            <p className="text-xs font-bold text-slate-400 mt-0.5">Explore premium PGs & Co-living spaces</p>
          </div>
        </div>
        {/* Pill Search Input */}
        <div className="flex space-x-3 items-center">
          <div className="relative flex-1 bg-white border border-slate-100 shadow-sm rounded-full py-1.5 pl-4 pr-10 flex items-center">
            <Search className="text-slate-400 mr-2" size={18} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search locality, PG name..."
              className="w-full bg-transparent text-sm font-semibold outline-none text-slate-700 placeholder-slate-400 py-1"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={handleLocationToggle}
            disabled={locLoading}
            className={`p-3 rounded-full border shadow-sm transition flex items-center justify-center ${
              useGeoLocation 
                ? 'bg-emerald-600 text-white border-emerald-600' 
                : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
            }`}
            title="Find PGs Near Me"
          >
            <Locate size={18} className={locLoading ? "animate-spin" : ""} />
          </button>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-full border shadow-sm transition ${
              showFilters 
                ? 'bg-amber-700 text-white border-amber-700' 
                : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
            }`}
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>

        {/* Expandable Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white text-slate-800 p-5 rounded-2xl shadow-lg text-left animate-scaleIn origin-top border border-slate-100">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Gender</label>
              <select 
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
              >
                <option value="">Any Gender</option>
                <option value="Boys">Boys Only</option>
                <option value="Girls">Girls Only</option>
                <option value="Unisex">Co-Ed (Unisex)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Locality</label>
              <select 
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                value={selectedLocality}
                onChange={(e) => setSelectedLocality(e.target.value)}
              >
                <option value="">Any Locality</option>
                {popularLocalities.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Max Budget (₹/mo)</label>
              <input 
                type="number"
                placeholder="e.g. 10000"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                value={maxRent}
                onChange={(e) => setMaxRent(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Category Pills horizontal scroll */}
      <div className="flex space-x-2.5 overflow-x-auto pb-1 -mx-4 px-4 hide-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.name}
            onClick={() => setSelectedCategory(cat.value)}
            className={`px-5 py-2.5 rounded-full text-xs font-bold border flex-shrink-0 transition ${
              selectedCategory === cat.value
                ? 'bg-amber-700 text-white border-amber-700 shadow-sm'
                : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Hero Banner Slider Card */}
      {(() => {
        const fallbackBanners = [
          {
            id: 'fallback-1',
            title: 'Find your \nperfect stay',
            subtitle: 'Comfortable stays, \nverified places.',
            image: '/hero_banner_interior.png',
            button_text: 'Explore Now',
            link_url: '/properties'
          }
        ];
        const activeBanners = heroBanners.length > 0 ? heroBanners : fallbackBanners;
        const activeBanner = activeBanners[currentSlide] || activeBanners[0];
        
        return (
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-[#FCF9F4] to-[#F5ECE1] rounded-[32px] p-6 border border-[#EFE5D9] shadow-sm flex items-center justify-between relative overflow-hidden h-44 transition duration-500">
              <div className="z-10 max-w-[55%] text-left space-y-2.5">
                <h2 className="text-xl font-extrabold text-[#2E180E] leading-tight whitespace-pre-line">
                  {activeBanner.title}
                </h2>
                {activeBanner.subtitle && (
                  <p className="text-[11px] font-semibold text-slate-500 leading-normal whitespace-pre-line">
                    {activeBanner.subtitle}
                  </p>
                )}
                <button 
                  onClick={() => {
                    if (activeBanner.link_url && activeBanner.link_url.startsWith('http')) {
                      window.open(activeBanner.link_url, '_blank');
                    } else if (activeBanner.link_url === '/properties') {
                      setSelectedCategory('PG');
                    } else if (activeBanner.link_url) {
                      navigate(activeBanner.link_url);
                    } else {
                      setSelectedCategory('PG');
                    }
                  }}
                  className="mt-2.5 px-4 py-2.5 bg-[#2E180E] hover:bg-[#1C0F09] text-white text-xs font-black rounded-full flex items-center space-x-1.5 shadow-md shadow-amber-950/20 transition duration-150 active:scale-95"
                >
                  <span>{activeBanner.button_text || 'Explore Now'}</span>
                  <span className="text-sm">→</span>
                </button>
              </div>
              
              {/* Right side decorative image */}
              <div className="absolute right-0 bottom-0 top-0 w-[45%] flex items-end">
                <img 
                  src={activeBanner.image || '/hero_banner_interior.png'} 
                  alt={activeBanner.title} 
                  className="w-full h-[90%] object-cover object-left-bottom rounded-tl-[32px] border-l border-t border-[#EFE5D9]"
                />
              </div>
            </div>

            {/* Carousel indicators */}
            {activeBanners.length > 1 && (
              <div className="flex justify-center space-x-1.5 pt-1">
                {activeBanners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      currentSlide === idx ? 'w-4 bg-[#2E180E]' : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })()}


      {loading ? (
        <div className="text-center py-20 text-slate-400 font-semibold">
          Loading properties...
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 font-semibold">
          No properties found matching your filters.
        </div>
      ) : (
        <>
          {(viewAll || search.trim() !== '' || selectedCategory || selectedGender || selectedLocality || maxRent) ? (
            /* Vertical list for "See All" or "Search Results" */
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h2 className="text-base font-black text-slate-800 tracking-tight text-left">
                  {search.trim() !== '' ? 'Search Results' : 'All Properties'}
                </h2>
                <button 
                  onClick={() => {
                    setViewAll(false);
                    setSearch('');
                    setSelectedCategory('');
                    setSelectedGender('');
                    setSelectedLocality('');
                    setMaxRent('');
                  }} 
                  className="text-xs font-bold text-amber-700 hover:underline"
                >
                  Back to home
                </button>
              </div>

              <div className="space-y-6">
                {filteredProperties.map(p => (
                  <div 
                    key={p.id}
                    onClick={() => navigate(`/property/${p.id}`)}
                    className="w-full bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 cursor-pointer group"
                  >
                    <div className="relative aspect-[16/10] w-full bg-slate-50">
                      <img 
                        src={p.images && p.images.length > 0 ? p.images[0].image : 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=500&q=80'} 
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      {p.is_verified && (
                        <div className="absolute top-3.5 left-3.5 flex flex-col gap-1">
                          <span className="px-2.5 py-1 text-[10px] font-extrabold rounded bg-emerald-500 text-white shadow-sm">
                            ✓ Verified
                          </span>
                        </div>
                      )}
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(p.id); }}
                        className="absolute top-3.5 right-3.5 p-2 rounded-full bg-white/85 backdrop-blur-sm text-slate-400 hover:text-red-500 shadow-sm transition"
                      >
                        <Heart size={16} className={favorites.includes(p.id) ? 'fill-red-500 text-red-500' : 'text-slate-400'} />
                      </button>
                      {getVacantBeds(p) === 0 ? (
                        <span className="absolute bottom-3.5 right-3.5 px-2.5 py-1 text-[10px] font-black rounded bg-red-500 text-white shadow-sm">House Full</span>
                      ) : (
                        <span className="absolute bottom-3.5 right-3.5 px-2.5 py-1 text-[10px] font-black rounded bg-amber-600 text-white shadow-sm">{getVacantBeds(p)} Beds Left</span>
                      )}
                    </div>
                    <div className="p-5 text-left space-y-1.5">
                      <div className="flex justify-between items-start">
                        <h3 className="font-extrabold text-slate-800 text-base leading-snug group-hover:text-amber-700 transition line-clamp-1">{p.name}</h3>
                        <div className="flex items-center text-xs font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded ml-3">
                          ⭐ {getRating(p.id)} ({getReviewsCount(p.id)})
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-slate-400 flex items-center justify-between">
                        <span className="flex items-center">
                          <MapPin size={12} className="mr-0.5" />
                          {p.locality}, {p.city}
                        </span>
                        {p.distance !== undefined && p.distance !== null && (
                          <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded ml-2">
                            📍 {p.distance.toFixed(1)} km away
                          </span>
                        )}
                      </p>
 
                      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                        <div>
                          <div className="flex items-baseline">
                            <span className="text-base font-black text-amber-700">₹{Number(p.base_rent).toLocaleString()}</span>
                            <span className="text-xs font-semibold text-slate-400 ml-0.5">/month</span>
                          </div>
                          {p.deposit > 0 && (
                            <div className="text-[9px] font-bold text-amber-700/80 text-left mt-0.5">
                              Deposit: ₹{Number(p.deposit).toLocaleString()}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
                          {p.property_type}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Home Grid Sectioned View (Featured Row & Nearby Row) */
            <>
              {/* Featured PGs horizontal scroll section */}
              {featuredProperties.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-baseline">
                    <h2 className="text-base font-black text-slate-800 tracking-tight text-left">Featured PGs</h2>
                    <button 
                      onClick={() => setViewAll(true)} 
                      className="text-xs font-bold text-slate-400 hover:text-slate-600"
                    >
                      View all
                    </button>
                  </div>
                  
                  <div className="flex space-x-4 overflow-x-auto pb-4 -mx-4 px-4 hide-scrollbar">
                    {featuredProperties.map(p => (
                      <div 
                        key={p.id}
                        onClick={() => navigate(`/property/${p.id}`)}
                        className="w-72 bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 flex-shrink-0 cursor-pointer group"
                      >
                        <div className="relative aspect-[4/3] w-full bg-slate-50">
                          <img 
                            src={p.images && p.images.length > 0 ? p.images[0].image : 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=500&q=80'} 
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                          {p.is_verified && (
                            <div className="absolute top-3 left-3 flex flex-col gap-1">
                              <span className="px-2 py-0.5 text-[9px] font-extrabold rounded bg-emerald-500 text-white shadow-sm">
                                ✓ Verified
                              </span>
                            </div>
                          )}
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(p.id); }}
                            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/85 backdrop-blur-sm text-slate-400 hover:text-red-500 shadow-sm transition"
                          >
                            <Heart size={14} className={favorites.includes(p.id) ? 'fill-red-500 text-red-500' : 'text-slate-400'} />
                          </button>
                          {getVacantBeds(p) === 0 ? (
                            <span className="absolute bottom-3 right-3 px-2 py-0.5 text-[9px] font-black rounded bg-red-500 text-white shadow-sm">House Full</span>
                          ) : (
                            <span className="absolute bottom-3 right-3 px-2 py-0.5 text-[9px] font-black rounded bg-[#FFF2E6] text-[#D97706] shadow-sm">{getVacantBeds(p)} Beds Left</span>
                          )}
                        </div>
                        <div className="p-4 text-left">
                          <h3 className="font-extrabold text-slate-800 text-sm leading-snug group-hover:text-amber-700 transition line-clamp-1">{p.name}</h3>
                          <p className="text-[10px] font-semibold text-slate-400 mt-1 flex items-center justify-between">
                            <span className="flex items-center">
                              <MapPin size={10} className="mr-0.5" />
                              {p.locality}, {p.city}
                            </span>
                            {p.distance !== undefined && p.distance !== null && (
                              <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded ml-2">
                                📍 {p.distance.toFixed(1)} km
                              </span>
                            )}
                          </p>
                          <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-slate-50">
                            <div>
                              <div className="flex items-baseline">
                                <span className="text-sm font-black text-[#2E180E]">₹{Number(p.base_rent).toLocaleString()}</span>
                                <span className="text-[9px] font-semibold text-slate-400 ml-0.5">/month</span>
                              </div>
                              {p.deposit > 0 && (
                                <div className="text-[8px] font-bold text-[#2E180E]/70 mt-0.5">
                                  Deposit: ₹{Number(p.deposit).toLocaleString()}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center text-[10px] font-black text-[#D97706] bg-[#FFF2E6] px-1.5 py-0.5 rounded">
                              ⭐ {getRating(p.id)} ({getReviewsCount(p.id)})
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nearby PGs compact list section */}
              {nearbyProperties.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-baseline">
                    <h2 className="text-base font-black text-slate-800 tracking-tight text-left">Nearby PGs</h2>
                    <button 
                      onClick={() => setViewAll(true)} 
                      className="text-xs font-bold text-slate-400 hover:text-slate-600"
                    >
                      View all
                    </button>
                  </div>

                  <div className="space-y-3.5">
                    {nearbyProperties.map(p => (
                      <div 
                        key={p.id}
                        onClick={() => navigate(`/property/${p.id}`)}
                        className="bg-white rounded-[24px] p-3.5 border border-slate-100 shadow-sm flex space-x-4 cursor-pointer hover:shadow-md transition duration-200 group"
                      >
                        <div className="relative w-28 h-28 rounded-2xl overflow-hidden bg-slate-50 flex-shrink-0">
                          <img 
                            src={p.images && p.images.length > 0 ? p.images[0].image : 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=500&q=80'} 
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                        </div>
                        <div className="flex-1 flex flex-col justify-between text-left py-0.5">
                          {/* Row 1 */}
                          <div className="flex justify-between items-start">
                            <h3 className="font-extrabold text-slate-800 text-sm leading-snug group-hover:text-amber-700 transition line-clamp-1">{p.name}</h3>
                            {getVacantBeds(p) === 0 ? (
                              <span className="px-2 py-0.5 text-[9px] font-extrabold rounded-lg bg-red-50 text-red-700 flex-shrink-0 ml-2">House Full</span>
                            ) : (
                              <span className="px-2 py-0.5 text-[9px] font-extrabold rounded-lg bg-[#FFF2E6] text-[#D97706] flex-shrink-0 ml-2">{getVacantBeds(p)} Beds Left</span>
                            )}
                          </div>
                          
                          {/* Row 2 */}
                          <div className="flex justify-between items-baseline mt-1">
                            <p className="text-[11px] font-semibold text-slate-400 flex items-center">
                              {p.locality}, {p.city}
                              {p.distance !== undefined && p.distance !== null && (
                                <span className="text-emerald-600 font-extrabold ml-1.5 bg-emerald-50 px-1 py-0.5 rounded text-[9px]">
                                  📍 {p.distance.toFixed(1)} km
                                </span>
                              )}
                            </p>
                             <div className="text-right">
                               <div>
                                 <span className="text-sm font-extrabold text-[#2E180E]">₹{Number(p.base_rent).toLocaleString()}</span>
                                 <span className="text-[9px] font-bold text-slate-400">/month</span>
                               </div>
                               {p.deposit > 0 && (
                                 <span className="text-[8px] font-bold text-[#2E180E]/70 block -mt-0.5">Deposit: ₹{Number(p.deposit).toLocaleString()}</span>
                               )}
                             </div>
                          </div>
                          
                          {/* Row 3 */}
                          <div className="flex justify-between items-end mt-2">
                            <div className="flex items-center text-[11px] font-bold text-slate-500 space-x-1">
                              <span>⭐</span>
                              <span className="font-extrabold text-slate-800">{getRating(p.id)}</span>
                              <span className="text-slate-400 font-semibold">({getReviewsCount(p.id)})</span>
                            </div>

                            <div className="text-right leading-none">
                              <span className="text-[9px] font-bold text-slate-400">Starting from</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
