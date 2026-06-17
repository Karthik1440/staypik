import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Plus, Edit2, Trash2, Home, Users, MapPin } from 'lucide-react';

export default function Properties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      // Endpoint returns owner's properties if authenticated
      const res = await api.get('/rentals/properties/?owner=true');
      // Filter list for current user only
      setProperties(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to permanently delete "${name}"?`)) {
      try {
        await api.delete(`/rentals/properties/manage/${id}/`);
        setProperties(properties.filter(p => p.id !== id));
      } catch (err) {
        console.error(err);
        alert("Failed to delete property listing. Verify permissions.");
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">My Properties</h2>
          <p className="text-sm font-semibold text-slate-400 mt-1">Manage listed apartments, co-living rooms, and PG structures</p>
        </div>
        <Link 
          to="/properties/new" 
          className="inline-flex items-center space-x-2 px-5 py-3 bg-amber-700 hover:bg-amber-800 text-white text-sm font-bold rounded-xl shadow-md transition"
        >
          <Plus size={16} />
          <span>Add Property</span>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400 font-semibold">Loading properties list...</div>
      ) : properties.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 font-semibold">
          You haven't listed any properties yet. Click "Add Property" to begin!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {properties.map((prop) => {
            const { id, name, property_type, gender, address, locality, city, base_rent, deposit, images, rooms, is_verified } = prop;
            const coverImage = images && images.length > 0 ? images[0].image : 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=500&q=80';
            
            const totalBeds = rooms ? rooms.reduce((acc, r) => acc + r.total_beds, 0) : 0;
            const occupiedBeds = rooms ? rooms.reduce((acc, r) => acc + r.occupied_beds, 0) : 0;
            const vacantBeds = Math.max(0, totalBeds - occupiedBeds);

            return (
              <div 
                key={id} 
                className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between"
              >
                {/* Visual Thumbnail */}
                <div className="relative aspect-[16/9] bg-slate-100 overflow-hidden">
                  <img src={coverImage} alt={name} className="w-full h-full object-cover" />
                  <div className="absolute top-4 left-4 flex flex-wrap gap-1.5 max-w-[85%]">
                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-slate-900/80 text-white backdrop-blur-sm shadow-sm">
                      {property_type}
                    </span>
                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-50 border border-amber-200 text-amber-800 shadow-sm">
                      {gender === 'Unisex' ? 'Co-Ed' : `${gender} Only`}
                    </span>
                    {is_verified ? (
                      <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-500 text-white shadow-sm">
                        Verified
                      </span>
                    ) : (
                      <span className="px-3 py-1 text-xs font-bold rounded-full bg-red-500 text-white shadow-sm" title="Pending approval from administrator">
                        Pending Verification
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-4 right-4 px-3 py-1 text-xs font-bold rounded-md bg-white/95 text-slate-800 shadow-sm backdrop-blur-sm border border-slate-200">
                    {vacantBeds} / {totalBeds} Beds Vacant
                  </div>
                </div>

                {/* Text Body */}
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-xl leading-snug">{name}</h3>
                    <div className="flex items-center text-xs font-semibold text-slate-400 mt-1">
                      <MapPin size={12} className="mr-1" />
                      <span>{locality}, {city}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 pt-3 border-t border-slate-50">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <Home size={14} className="mr-1 text-slate-400" />
                        {rooms ? rooms.length : 0} Rooms
                      </span>
                      <span className="flex items-center">
                        <Users size={14} className="mr-1 text-slate-400" />
                        {totalBeds} Beds
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="flex items-baseline justify-end">
                        <span className="text-lg font-black text-amber-700">₹{Number(base_rent).toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400 ml-0.5">/mo</span>
                      </div>
                      {deposit > 0 && (
                        <span className="text-[9px] font-bold text-slate-400 block -mt-0.5">
                          Deposit: ₹{Number(deposit).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Button Panel */}
                  <div className="flex space-x-3 pt-3 border-t border-slate-50">
                    <Link 
                      to={`/properties/edit/${id}`}
                      className="flex-1 py-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800 border border-slate-200 text-xs font-bold transition flex items-center justify-center space-x-1.5"
                    >
                      <Edit2 size={12} />
                      <span>Configure & Rooms</span>
                    </Link>

                    <button 
                      onClick={() => handleDelete(id, name)}
                      className="px-4 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 text-xs font-bold transition flex items-center justify-center"
                      title="Delete Listing"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
