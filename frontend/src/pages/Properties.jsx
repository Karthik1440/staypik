import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Plus, Edit2, Trash2, Home, Users, MapPin, DoorOpen, Eye, Building2, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function Properties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const res = await api.get('/rentals/properties/?owner=true');
      setProperties(res.data || []);
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

  // Stats calculation
  const totalProperties = properties.length;
  const totalVacantBedsSum = properties.reduce((acc, p) => {
    if (!p.rooms) return acc;
    return acc + p.rooms.reduce((rAcc, r) => rAcc + Math.max(0, (r.total_beds || 1) - (r.occupied_beds || 0)), 0);
  }, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn text-left font-sans">
      
      {/* Top Admin Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <Building2 size={24} className="text-amber-700" />
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Host Property Control Panel</h1>
          </div>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Manage room options, live bed vacancies, monthly rents, and property details
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {properties.length > 0 && (
            <Link
              to={`/properties/${properties[0].id}/rooms`}
              className="px-4 py-3 bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 rounded-2xl text-xs font-black transition flex items-center space-x-2 shadow-2xs"
            >
              <DoorOpen size={16} className="text-amber-700" />
              <span>Room Vacancies & Rents</span>
            </Link>
          )}

          <Link 
            to="/properties/new" 
            className="px-5 py-3 bg-amber-700 hover:bg-amber-800 text-white text-xs font-black rounded-2xl shadow-md transition flex items-center space-x-1.5"
          >
            <Plus size={16} />
            <span>Add Property</span>
          </Link>
        </div>
      </div>

      {/* Quick Dashboard Stat Cards */}
      {properties.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-2xs space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Listed</span>
            <p className="text-xl font-black text-slate-800">{totalProperties} {totalProperties === 1 ? 'Property' : 'Properties'}</p>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-2xs space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Live Vacancy</span>
            <p className="text-xl font-black text-emerald-700">{totalVacantBedsSum} Units/Beds Vacant</p>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-white p-4.5 rounded-2xl border border-slate-100 shadow-2xs space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Listing Status</span>
            <p className="text-xl font-black text-slate-800 flex items-center space-x-1.5">
              <ShieldCheck size={18} className="text-emerald-600" />
              <span>Active</span>
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-400 font-bold text-xs bg-white rounded-3xl border border-slate-100">
          Loading your properties...
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 font-semibold space-y-3">
          <Building2 size={40} className="mx-auto text-slate-300" />
          <p className="text-sm font-bold text-slate-700">You haven't listed any properties yet.</p>
          <Link
            to="/properties/new"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-amber-700 text-white rounded-xl text-xs font-black shadow-sm"
          >
            <Plus size={16} />
            <span>Add Your First Property</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {properties.map((prop) => {
            const { id, name, property_type, gender, locality, city, base_rent, deposit, images, rooms, is_verified } = prop;
            const coverImage = images && images.length > 0 ? images[0].image : 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=500&q=80';
            
            const isApartment = property_type === 'Apartment';
            const totalBeds = rooms ? rooms.reduce((acc, r) => acc + (r.total_beds || 1), 0) : 0;
            const occupiedBeds = rooms ? rooms.reduce((acc, r) => acc + (r.occupied_beds || 0), 0) : 0;
            const vacantBeds = Math.max(0, totalBeds - occupiedBeds);

            return (
              <div 
                key={id} 
                className="bg-white rounded-3xl border border-slate-100 shadow-2xs overflow-hidden flex flex-col justify-between hover:shadow-md transition duration-200"
              >
                {/* Thumbnail Header */}
                <div className="relative aspect-[16/9] bg-slate-100 overflow-hidden">
                  <img src={coverImage} alt={name} className="w-full h-full object-cover" />
                  
                  <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-1.5 max-w-[85%]">
                    <span className="px-3 py-1 text-[11px] font-black rounded-full bg-slate-900/85 text-white backdrop-blur-xs shadow-2xs">
                      {property_type}
                    </span>
                    <span className="px-3 py-1 text-[11px] font-black rounded-full bg-amber-50 border border-amber-200 text-amber-800 shadow-2xs">
                      {gender === 'Unisex' ? 'Co-Ed' : `${gender} Only`}
                    </span>
                    {is_verified ? (
                      <span className="px-3 py-1 text-[11px] font-black rounded-full bg-emerald-600 text-white shadow-2xs">
                        Verified
                      </span>
                    ) : (
                      <span className="px-3 py-1 text-[11px] font-black rounded-full bg-amber-500 text-white shadow-2xs">
                        Listed
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-3.5 right-3.5 px-3 py-1 text-xs font-black rounded-xl bg-white/95 text-slate-800 shadow-2xs backdrop-blur-xs border border-slate-200">
                    {vacantBeds} {isApartment ? 'Units' : 'Beds'} Vacant
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="font-black text-slate-900 text-xl leading-snug">{name}</h3>
                    <div className="flex items-center text-xs font-semibold text-slate-400 mt-1">
                      <MapPin size={12} className="mr-1 text-slate-400" />
                      <span>{locality}, {city}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 pt-3 border-t border-slate-100">
                    <div className="flex items-center space-x-3.5">
                      <span className="flex items-center">
                        <Home size={14} className="mr-1 text-slate-400" />
                        {rooms ? rooms.length : 0} Options
                      </span>
                      <span className="flex items-center">
                        <Users size={14} className="mr-1 text-slate-400" />
                        {isApartment ? `${rooms ? rooms.length : 0} Units` : `${totalBeds} Capacity`}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="flex items-baseline justify-end">
                        <span className="text-base font-black text-amber-700">₹{Number(base_rent).toLocaleString()}</span>
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
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                    <Link 
                      to={`/properties/${id}/rooms`}
                      className="flex-1 min-w-[150px] py-2.5 px-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-black transition flex items-center justify-center space-x-1.5 shadow-2xs"
                    >
                      <DoorOpen size={15} />
                      <span>Manage Rooms & Rents</span>
                    </Link>

                    <Link 
                      to={`/properties/edit/${id}`}
                      className="py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-extrabold transition flex items-center justify-center space-x-1"
                      title="Edit Property Details"
                    >
                      <Edit2 size={13} />
                      <span>Edit</span>
                    </Link>

                    <Link 
                      to={`/property/${id}`}
                      className="py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-extrabold transition flex items-center justify-center space-x-1"
                      title="Preview Guest View"
                    >
                      <Eye size={13} />
                      <span>Preview</span>
                    </Link>

                    <button 
                      onClick={() => handleDelete(id, name)}
                      className="py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 text-xs font-bold transition flex items-center justify-center"
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
