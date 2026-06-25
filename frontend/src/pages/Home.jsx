import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import { Search, MapPin, SlidersHorizontal, Heart, Sparkles, Locate, ShieldCheck, Phone, ArrowRight, IndianRupee, Star, Wifi, Utensils, Shirt, User, Droplet, Car, ArrowUpDown } from 'lucide-react';
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
  const [selectedSharing, setSelectedSharing] = useState('');
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

  const getAmenityIcon = (name) => {
    const norm = name.toLowerCase();
    if (norm.includes('wifi')) return <Wifi size={12} />;
    if (norm.includes('food') || norm.includes('kitchen') || norm.includes('meal')) return <Utensils size={12} />;
    if (norm.includes('laundry') || norm.includes('wash')) return <Shirt size={12} />;
    if (norm.includes('water') || norm.includes('drinking')) return <Droplet size={12} />;
    if (norm.includes('parking') || norm.includes('car')) return <Car size={12} />;
    if (norm.includes('lift') || norm.includes('elevator')) return <ArrowUpDown size={12} />;
    return <Sparkles size={12} />;
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
    const matchesSearch = (
      (p.name && p.name.toLowerCase().includes(s)) ||
      (p.locality && p.locality.toLowerCase().includes(s)) ||
      (p.city && p.city.toLowerCase().includes(s)) ||
      (p.property_type && p.property_type.toLowerCase().includes(s)) ||
      (p.gender && p.gender.toLowerCase().includes(s))
    );
    const matchesSharing = !selectedSharing || (p.rooms && p.rooms.some(r => r.room_type === selectedSharing));
    return matchesSearch && matchesSharing;
  });

  // Separate properties into featured and nearby lists using is_featured
  const featuredProperties = filteredProperties.filter(p => p.is_featured);
  const nearbyProperties = filteredProperties.filter(p => !p.is_featured);

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
            <p className="text-xs font-bold text-slate-400 mt-0.5">Explore PGs & Co-living spaces</p>
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
            className={`p-3 rounded-full border shadow-sm transition flex items-center justify-center ${useGeoLocation
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
              }`}
            title="Find PGs Near Me"
          >
            <Locate size={18} className={locLoading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-full border shadow-sm transition ${showFilters
                ? 'bg-amber-700 text-white border-amber-700'
                : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
              }`}
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>

        {/* Expandable Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-white text-slate-800 p-5 rounded-2xl shadow-lg text-left animate-scaleIn origin-top border border-slate-100">
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
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Sharing Type</label>
              <select
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                value={selectedSharing}
                onChange={(e) => setSelectedSharing(e.target.value)}
              >
                <option value="">Any Sharing</option>
                <option value="Single">Single</option>
                <option value="Double Sharing">Double Sharing</option>
                <option value="Triple Sharing">Triple Sharing</option>
                <option value="Quad Sharing">Quad Sharing</option>
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

      <style>{`
        @media (min-width: 768px) {
          .clip-curved-left {
            clip-path: ellipse(95% 100% at 100% 50%);
          }
        }
      `}</style>

      {/* Category Pills horizontal scroll */}
      <div id="properties-list-section" className="flex space-x-2.5 overflow-x-auto pb-1 -mx-4 px-4 hide-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.name}
            onClick={() => setSelectedCategory(cat.value)}
            className={`px-5 py-2.5 rounded-full text-xs font-bold border flex-shrink-0 transition ${selectedCategory === cat.value
                ? 'bg-amber-700 text-white border-amber-700 shadow-sm'
                : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
              }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Hero Banner Redesigned Card */}
      {(() => {
        const fallbackBanners = [
          {
            id: 'fallback-1',
            title: 'No Brokerage. \nDirect Owner Contact.',
            subtitle: 'Save money and connect directly with verified property owners.',
            image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80',
            button_text: 'Explore Properties',
            link_url: '#listings'
          }
        ];
        const activeBanners = heroBanners.length > 0 ? heroBanners : fallbackBanners;
        const activeBanner = activeBanners[currentSlide] || activeBanners[0];

        const renderTitle = (title) => {
          if (!title) return '';
          const highlightText1 = "Direct Owner Contact";
          const highlightText2 = "Direct Owner Contact.";
          if (title.includes(highlightText1)) {
            const parts = title.split(highlightText1);
            return (
              <>
                {parts[0]}
                <span className="text-[#D97706]">{highlightText1}</span>
                {parts[1]}
              </>
            );
          } else if (title.includes(highlightText2)) {
            const parts = title.split(highlightText2);
            return (
              <>
                {parts[0]}
                <span className="text-[#D97706]">{highlightText2}</span>
                {parts[1]}
              </>
            );
          }
          return title;
        };

        const handleBannerClick = () => {
          if (activeBanner.link_url && activeBanner.link_url.startsWith('http')) {
            window.open(activeBanner.link_url, '_blank');
          } else {
            const element = document.getElementById('properties-list-section');
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          }
        };

        const handleLocalityTagClick = (localityName) => {
          setSelectedLocality(localityName);
          setShowFilters(true);
          const element = document.getElementById('properties-list-section');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        };

        const getBannerImageUrl = (banner) => {
          if (!banner || !banner.image) {
            return 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80';
          }
          if (banner.image.startsWith('http://') || banner.image.startsWith('https://')) {
            return banner.image;
          }
          const base = api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '') : '';
          return `${base}/${banner.image.replace(/^\//, '')}`;
        };

        const getLocalitiesList = (banner) => {
          if (!banner || !banner.localities) {
            return ['HSR Layout', 'Koramangala', 'BTM Layout', 'Whitefield', 'Electronic City'];
          }
          return banner.localities.split(',').map(item => item.trim()).filter(item => item.length > 0);
        };

        return (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-[#FFFDF9] via-[#FFF9EE] to-[#FFF3DE] rounded-[32px] border border-[#EFE5D9] shadow-sm relative overflow-hidden flex flex-col md:flex-row items-stretch min-h-[380px] md:h-[420px] transition duration-500 text-left">
              {/* Left Content Column */}
              <div className="flex-1 p-6 md:p-10 flex flex-col justify-between space-y-6 z-10 max-w-full md:max-w-[55%]">
                {/* Top Badge */}
                <div className="flex">
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#FEF3C7] text-[#D97706] rounded-full text-xs font-black uppercase tracking-wider border border-[#FDE68A]">
                    <ShieldCheck size={14} className="stroke-[2.5px]" />
                    <span>{activeBanner.badge_text || 'Verified Properties'}</span>
                  </span>
                </div>

                {/* Main Headings */}
                <div className="space-y-3.5">
                  <h2 className="text-2xl md:text-4.5xl font-black text-slate-800 leading-[1.15] whitespace-pre-line tracking-tight">
                    {renderTitle(activeBanner.title)}
                  </h2>
                  {activeBanner.subtitle && (
                    <p className="text-sm md:text-base font-semibold text-slate-500 leading-relaxed max-w-md">
                      {activeBanner.subtitle}
                    </p>
                  )}
                </div>

                {/* Features Row */}
                <div className="grid grid-cols-2 gap-y-4 gap-x-3 sm:flex sm:space-x-4 pt-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center flex-shrink-0">
                      <IndianRupee size={14} className="stroke-[2.5px]" />
                    </div>
                    <span className="text-[11px] md:text-xs font-extrabold text-slate-600 leading-tight">
                      {activeBanner.feature_1 || 'No Hidden Charges'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center flex-shrink-0">
                      <ShieldCheck size={14} className="stroke-[2.5px]" />
                    </div>
                    <span className="text-[11px] md:text-xs font-extrabold text-slate-600 leading-tight">
                      {activeBanner.feature_2 || 'Verified Properties'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center flex-shrink-0">
                      <Phone size={14} className="stroke-[2.5px]" />
                    </div>
                    <span className="text-[11px] md:text-xs font-extrabold text-slate-600 leading-tight">
                      {activeBanner.feature_3 || 'Direct Owner'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center flex-shrink-0">
                      <Heart size={14} className="stroke-[2.5px]" />
                    </div>
                    <span className="text-[11px] md:text-xs font-extrabold text-slate-600 leading-tight">
                      {activeBanner.feature_4 || 'Trusted by Thousands'}
                    </span>
                  </div>
                </div>

                {/* Button Action */}
                <div className="pt-2">
                  <button
                    onClick={handleBannerClick}
                    className="px-6 py-3.5 bg-[#D97706] hover:bg-[#B45309] text-white text-sm font-black rounded-2xl flex items-center space-x-2 shadow-lg shadow-amber-700/20 transition duration-150 active:scale-95"
                  >
                    <span>{activeBanner.button_text || 'Explore Properties'}</span>
                    <ArrowRight size={16} className="stroke-[2.5px]" />
                  </button>
                </div>
              </div>

              {/* Right Image Column (with curved overlay clip) */}
              <div className="relative w-full md:w-[45%] h-64 md:h-auto flex-shrink-0 overflow-hidden select-none">
                <img
                  src={getBannerImageUrl(activeBanner)}
                  alt={activeBanner.title}
                  className="w-full h-full object-cover transition duration-500 clip-curved-left"
                />

                {/* Floating Tags Card */}
                <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-slate-100 max-w-[280px] animate-fadeIn">
                  <div className="flex items-center space-x-1.5 text-slate-800 font-extrabold text-xs mb-2">
                    <MapPin size={14} className="text-[#D97706]" />
                    <span>Popular in Bangalore</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {getLocalitiesList(activeBanner).map((loc) => (
                      <button
                        key={loc}
                        onClick={() => handleLocalityTagClick(loc)}
                        className="px-2.5 py-1 bg-slate-50 hover:bg-[#FEF3C7] text-slate-600 hover:text-[#D97706] text-[10px] font-bold rounded-lg border border-slate-100 transition"
                      >
                        {loc}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setShowFilters(true);
                        document.getElementById('properties-list-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-500 text-[10px] font-bold rounded-lg border border-slate-100 transition"
                    >
                      + More
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Carousel indicators */}
            {activeBanners.length > 1 && (
              <div className="flex justify-center space-x-2 pt-1">
                {activeBanners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${currentSlide === idx ? 'w-6 bg-[#D97706]' : 'w-2 bg-slate-200'
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
          {(viewAll || search.trim() !== '' || selectedCategory || selectedGender || selectedLocality || maxRent || selectedSharing) ? (
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
                    setSelectedSharing('');
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
                    onClick={() => navigate(`/property/${p.id}${selectedSharing ? `?sharing=${encodeURIComponent(selectedSharing)}` : ''}`)}
                    className="w-full bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 cursor-pointer group"
                  >
                    <div className="relative aspect-[16/10] w-full bg-slate-50">
                      <img
                        src={p.images && p.images.length > 0 ? p.images[0].image : 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=500&q=80'}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      {p.is_featured && (
                        <div className="absolute top-3.5 left-3.5 flex flex-col gap-1">
                          <span className="px-2.5 py-1 text-[10px] font-extrabold rounded bg-[#FEF3C7] text-[#D97706] shadow-sm border border-[#FDE68A]">
                            ★ Featured
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
                      {getVacantBeds(p) === 0 && (
                        <span className="absolute bottom-3.5 right-3.5 px-2.5 py-1 text-[10px] font-black rounded bg-red-500 text-white shadow-sm">House Full</span>
                      )}
                    </div>
                    <div className="p-5 text-left space-y-1.5">
                      <div className="flex justify-between items-start">
                        <h3 className="font-extrabold text-slate-800 text-base leading-snug group-hover:text-amber-700 transition line-clamp-2">{p.name}</h3>
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
                    <h2 className="text-base font-black text-slate-800 tracking-tight text-left">Featured Listings</h2>
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
                        onClick={() => navigate(`/property/${p.id}${selectedSharing ? `?sharing=${encodeURIComponent(selectedSharing)}` : ''}`)}
                        className="w-80 bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 flex-shrink-0 cursor-pointer group flex flex-col h-full"
                      >
                        {/* Thumbnail */}
                        <div className="relative aspect-[4/3] w-full bg-slate-50 overflow-hidden">
                          <img
                            src={p.images && p.images.length > 0 ? p.images[0].image : 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=500&q=80'}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                          <div className="absolute top-3 left-3 bg-[#FEF3C7] text-[#D97706] px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-[#FDE68A] flex items-center space-x-1 shadow-sm">
                            <Star size={10} className="fill-[#D97706] text-[#D97706]" />
                            <span>FEATURED</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(p.id); }}
                            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/90 backdrop-blur-sm text-slate-400 hover:text-red-500 shadow-sm transition active:scale-95 flex items-center justify-center z-10"
                          >
                            <Heart size={14} className={favorites.includes(p.id) ? 'fill-red-500 text-red-500' : 'text-slate-400'} />
                          </button>
                          {getVacantBeds(p) === 0 && (
                            <span className="absolute bottom-3 right-3 px-2 py-0.5 text-[9px] font-black rounded bg-red-500 text-white shadow-sm">House Full</span>
                          )}
                        </div>
                        {/* Body */}
                        <div className="p-4 flex-1 flex flex-col justify-between text-left space-y-3.5">
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-start">
                              <h3 className="font-extrabold text-slate-800 text-[15px] sm:text-base leading-snug truncate pr-2 group-hover:text-amber-700 transition">
                                {p.name}
                              </h3>
                              <div className="flex items-center text-xs font-black text-slate-800 flex-shrink-0">
                                <Star size={12} className="text-amber-500 fill-amber-500 mr-0.5" />
                                <span>{getRating(p.id)} <span className="text-slate-400 font-semibold">({getReviewsCount(p.id)})</span></span>
                              </div>
                            </div>
                            <div className="flex items-center text-xs font-bold text-slate-400">
                              <MapPin size={12} className="mr-1 text-slate-400 flex-shrink-0" />
                              <span className="truncate">{p.locality}, {p.city}</span>
                              {p.distance !== undefined && p.distance !== null && (
                                <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded ml-2 whitespace-nowrap">
                                  📍 {p.distance.toFixed(1)} km
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-[10px] font-black bg-[#FFF2E6] text-[#D97706]">
                                <User size={10} className="stroke-[2.5px]" />
                                <span>Direct Owner</span>
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-[11px] font-bold text-slate-500 pt-1.5">
                              {p.amenities && p.amenities.slice(0, 3).map((amenity, idx) => (
                                <div key={idx} className="flex items-center space-x-1 flex-shrink-0">
                                  <span className="text-[#D97706]">{getAmenityIcon(amenity)}</span>
                                  <span>{amenity.split(' ')[0]}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                              <div className="text-left">
                                <div className="flex items-baseline">
                                  <span className="text-base sm:text-lg font-black text-slate-800">₹{Number(p.base_rent).toLocaleString()}</span>
                                  <span className="text-xs font-semibold text-slate-400 ml-0.5">/month</span>
                                </div>
                                {p.deposit > 0 && (
                                  <div className="text-[10px] font-bold text-slate-400 mt-0.5">
                                    Deposit: ₹{Number(p.deposit).toLocaleString()}
                                  </div>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="w-full mt-3 py-2 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-black rounded-xl transition duration-150 active:scale-[0.98] shadow-sm flex items-center justify-center"
                            >
                              View Details
                            </button>
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
                        onClick={() => navigate(`/property/${p.id}${selectedSharing ? `?sharing=${encodeURIComponent(selectedSharing)}` : ''}`)}
                        className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex space-x-3.5 cursor-pointer hover:shadow-md transition duration-300 group text-left"
                      >
                        <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-slate-50 flex-shrink-0">
                          <img
                            src={p.images && p.images.length > 0 ? p.images[0].image : 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=500&q=80'}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(p.id); }}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 backdrop-blur-sm text-slate-400 hover:text-red-500 shadow-sm transition active:scale-95 flex items-center justify-center z-10"
                          >
                            <Heart size={12} className={favorites.includes(p.id) ? 'fill-red-500 text-red-500' : 'text-slate-400'} />
                          </button>
                        </div>
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div className="space-y-1">
                            <div className="flex justify-between items-start">
                              <h3 className="font-extrabold text-slate-800 text-[14px] sm:text-base leading-snug truncate pr-2 group-hover:text-amber-700 transition">
                                {p.name}
                              </h3>
                              <div className="flex items-center text-xs font-black text-slate-800 flex-shrink-0">
                                <Star size={11} className="text-amber-500 fill-amber-500 mr-0.5" />
                                <span>{getRating(p.id)} <span className="text-slate-400 font-semibold">({getReviewsCount(p.id)})</span></span>
                              </div>
                            </div>
                            <div className="flex items-center text-[11px] font-bold text-slate-400">
                              <MapPin size={11} className="mr-1 text-slate-400 flex-shrink-0" />
                              <span className="truncate">{p.locality}, {p.city}</span>
                              {p.distance !== undefined && p.distance !== null && (
                                <span className="inline-flex items-center gap-0.5 text-emerald-600 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded text-[9px] ml-2 whitespace-nowrap">
                                  📍 {p.distance.toFixed(1)} km
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[9px] font-black bg-[#FFF2E6] text-[#D97706]">
                                <User size={9} className="stroke-[2.5px]" />
                                <span>Direct Owner</span>
                              </span>
                            </div>
                            <div className="flex items-center space-x-3 text-[10px] font-bold text-slate-500 pt-1">
                              {p.amenities && p.amenities.slice(0, 3).map((amenity, idx) => (
                                <div key={idx} className="flex items-center space-x-0.5 flex-shrink-0">
                                  <span className="text-[#D97706]">{getAmenityIcon(amenity)}</span>
                                  <span>{amenity.split(' ')[0]}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex justify-between items-end pt-2 border-t border-slate-50">
                            <div className="text-left">
                              <div className="flex items-baseline leading-none">
                                <span className="text-sm sm:text-base font-black text-slate-800">₹{Number(p.base_rent).toLocaleString()}</span>
                                <span className="text-[10px] font-bold text-slate-450 ml-0.5">/mo</span>
                              </div>
                              {p.deposit > 0 && (
                                <div className="text-[9px] font-bold text-slate-400 mt-1 leading-none">
                                  Deposit: ₹{Number(p.deposit).toLocaleString()}
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              className="px-3.5 py-1.5 border border-[#D97706] text-[#D97706] hover:bg-amber-50/50 bg-white text-[11px] font-black rounded-lg transition active:scale-95"
                            >
                              View Details
                            </button>
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
