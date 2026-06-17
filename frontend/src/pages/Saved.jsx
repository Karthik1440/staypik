import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Heart, MapPin, Search } from 'lucide-react';

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
              className="bg-white rounded-[24px] p-3.5 border border-slate-100 shadow-sm flex space-x-4 cursor-pointer hover:shadow-md transition duration-200 group"
            >
              <div className="relative w-28 h-28 rounded-2xl overflow-hidden bg-slate-50 flex-shrink-0">
                <img 
                  src={p.images && p.images.length > 0 ? p.images[0].image : 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=500&q=80'} 
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
              </div>
              <div className="flex-1 flex flex-col justify-between py-0.5">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-extrabold text-slate-800 text-sm leading-snug group-hover:text-amber-700 transition line-clamp-1">{p.name}</h3>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(p.id); }}
                      className="p-1 rounded-full text-red-500 hover:bg-red-50 transition"
                      title="Remove from Saved"
                    >
                      <Heart size={16} className="fill-red-500" />
                    </button>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-400 mt-1 flex items-center">
                    <MapPin size={10} className="mr-0.5 text-slate-400" />
                    {p.locality}, {p.city}
                  </p>
                </div>
                
                <div className="flex justify-between items-end mt-2">
                  <div className="flex items-center text-[11px] font-bold text-slate-500 space-x-1">
                    <span className="text-amber-500 text-xs">★</span>
                    <span className="font-extrabold text-slate-800">4.6</span>
                    <span className="text-slate-400 font-semibold">(120)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-[#2E180E]">₹{Number(p.base_rent).toLocaleString()}</span>
                    <span className="text-[9px] font-bold text-slate-400">/month</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
