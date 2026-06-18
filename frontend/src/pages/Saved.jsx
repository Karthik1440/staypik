import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Heart, MapPin, Search, Star } from 'lucide-react';

export default function Saved() {
  const [properties, setProperties] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('staypik_favorites');
      setFavorites(stored ? JSON.parse(stored) : []);
    } catch (e) {
      console.error("Failed to parse favorites:", e);
    }
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const res = await api.get('/rentals/properties/');
      setProperties(res.data);
    } catch (e) {
      console.error("Failed to load listings:", e);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (propertyId) => {
    const updated = favorites.filter(id => id !== propertyId);
    setFavorites(updated);
    localStorage.setItem('staypik_favorites', JSON.stringify(updated));
  };

  const getVacantBeds = (p) => {
    const totalBeds = p.rooms ? p.rooms.reduce((acc, r) => acc + r.total_beds, 0) : 0;
    const occupiedBeds = p.rooms ? p.rooms.reduce((acc, r) => acc + r.occupied_beds, 0) : 0;
    return Math.max(0, totalBeds - occupiedBeds);
  };

  const getRating = (id) => {
    return (4.1 + (id % 9) / 10).toFixed(1);
  };

  const getReviewsCount = (id) => {
    return 30 + (id * 23) % 150;
  };

  const savedProperties = properties.filter(p => favorites.includes(p.id));

  return (
    <div className="max-w-md mx-auto sm:max-w-3xl space-y-8 animate-fadeIn text-left">
      <div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Saved Properties</h2>
        <p className="text-sm font-semibold text-slate-400 mt-1">Keep track of PGs and rooms you are interested in</p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400 font-semibold">Loading saved listings...</div>
      ) : savedProperties.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 font-semibold text-sm flex flex-col items-center justify-center p-6 space-y-4">
          <Heart size={48} className="text-slate-300 stroke-[1.5]" />
          <p>You haven't saved any property listings yet.</p>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-full text-xs font-black shadow-sm flex items-center space-x-1.5 transition active:scale-95"
          >
            <span>Explore Properties</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {savedProperties.map(p => (
            <div 
              key={p.id}
              onClick={() => navigate(`/property/${p.id}`)}
              className="bg-white rounded-2xl p-3 border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex space-x-3.5 cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-amber-200/50 transition-all duration-300 active:scale-[0.99] group"
            >
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-slate-50 flex-shrink-0">
                <img 
                  src={p.images && p.images.length > 0 ? p.images[0].image : 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=500&q=80'} 
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60"></div>
                
                {/* Overlaid Badges on Image */}
                <span className={`absolute top-2 left-2 px-2 py-0.5 text-[9px] font-black rounded shadow-sm text-white ${
                  p.gender === 'Boys' ? 'bg-blue-600/90' : p.gender === 'Girls' ? 'bg-pink-600/90' : 'bg-purple-600/90'
                }`}>
                  {p.gender === 'Unisex' ? 'Co-Ed' : p.gender}
                </span>

                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(p.id); }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 backdrop-blur-sm text-red-500 hover:scale-105 shadow-sm transition active:scale-95"
                  title="Remove from Saved"
                >
                  <Heart size={12} className="fill-red-500 text-red-500" />
                </button>
                
              </div>
              <div className="flex-1 flex justify-between items-stretch min-w-0">
                {/* Middle Column: Title, Locality + PG Tag, Rating */}
                <div className="flex flex-col justify-between py-0.5 min-w-0 flex-1 pr-2">
                  <div>
                    {/* Title */}
                    <h3 className="font-extrabold text-slate-800 text-[15px] sm:text-base leading-snug group-hover:text-amber-700 transition line-clamp-2 min-w-0">
                      {p.name}
                    </h3>
                    
                    {/* Locality and PG Tag inline */}
                    <div className="flex items-center flex-wrap gap-x-1.5 gap-y-1 mt-1 text-[11px] font-semibold text-slate-400 min-w-0">
                      <span className="truncate flex items-center">
                        <MapPin size={11} className="mr-0.5 text-slate-450 flex-shrink-0" />
                        {p.locality}, {p.city}
                      </span>
                      <span className="text-[9px] font-extrabold bg-[#1E3A8A]/90 text-white px-1.5 py-0.5 rounded flex-shrink-0 uppercase">
                        {p.property_type}
                      </span>
                    </div>
                  </div>
                  
                  {/* Rating at bottom-left */}
                  <div className="flex items-center text-xs font-bold text-slate-500 space-x-1 mt-2">
                    <Star size={11} className="text-amber-500 fill-amber-500 stroke-[2px]" />
                    <span className="font-extrabold text-slate-800">{getRating(p.id)}</span>
                    <span className="text-slate-450 font-medium">({getReviewsCount(p.id)})</span>
                  </div>
                </div>
                
                {/* Right Column: Rent and Deposit stacked */}
                <div className="flex flex-col justify-between items-end py-0.5 text-right flex-shrink-0 pl-1.5">
                  {/* Rent Section */}
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block leading-none">Rent</span>
                    <div className="leading-none flex items-baseline justify-end mt-1.5">
                      <span className="text-base sm:text-lg font-black text-[#2E180E]">₹{Number(p.base_rent).toLocaleString()}</span>
                      <span className="text-[10px] font-bold text-slate-450 ml-0.5">/mo</span>
                    </div>
                  </div>
                  
                  {/* Deposit Section */}
                  {p.deposit > 0 && (
                    <div className="mt-2 text-right">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block leading-none">Deposit</span>
                      <span className="text-xs sm:text-sm font-black text-slate-700 block mt-1.5 leading-none">₹{Number(p.deposit).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
