import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Plus, Minus, Edit2, Trash2, Home, Users, MapPin, DoorOpen, Eye, Building2, ShieldCheck, Shield, User } from 'lucide-react';

export default function Properties() {
  const { user } = useAuth();
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

  const formatLastUpdated = (dateStr) => {
    if (!dateStr) return 'Today, ' + new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      if (isToday) {
        return `Today, ${timeStr}`;
      }
      return `${d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}, ${timeStr}`;
    } catch (e) {
      return 'Recently';
    }
  };

  const handleQuickVacantChange = async (propertyId, room, delta) => {
    const currentVacant = Math.max(0, (room.total_beds || 1) - (room.occupied_beds || 0));
    const newVacant = Math.max(0, currentVacant + delta);
    const updatedTotalBeds = Math.max(newVacant, room.total_beds || 1);
    const newOccupied = Math.max(0, updatedTotalBeds - newVacant);

    const payload = {
      ...room,
      total_beds: updatedTotalBeds,
      occupied_beds: newOccupied
    };

    try {
      const res = await api.put(`/rentals/properties/${propertyId}/rooms/${room.id}/`, payload);
      setProperties(prev => prev.map(p => {
        if (p.id !== propertyId) return p;
        return {
          ...p,
          rooms: p.rooms ? p.rooms.map(r => r.id === room.id ? res.data : r) : [res.data]
        };
      }));
    } catch (err) {
      console.error("Failed to update bed vacancy:", err);
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
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
              {user?.isAdmin ? 'Admin Systemwide Property Control' : 'Host Property Control Panel'}
            </h1>
            {user?.isAdmin && (
              <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-extrabold rounded-full flex items-center gap-1 border border-red-200 shadow-2xs">
                <Shield size={12} />
                Admin Privileges
              </span>
            )}
          </div>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            {user?.isAdmin 
              ? 'Full administrative control to edit, verify, deactivate, manage rooms, or delete any listing systemwide.' 
              : 'Manage room options, live bed vacancies, monthly rents, and property details'}
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-amber-100/70 shadow-2xs space-y-1 text-left">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">TOTAL PROPERTIES</span>
            <p className="text-xl font-black text-slate-900">{totalProperties} {totalProperties === 1 ? 'Property' : 'Properties'}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-100/70 shadow-2xs space-y-1 text-left">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">TOTAL VACANT BEDS</span>
            <p className="text-xl font-black text-emerald-700">{totalVacantBedsSum} Available Beds</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-100/70 shadow-2xs space-y-1 text-left">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">LISTING STATUS</span>
            <p className="text-xl font-black text-slate-900 flex items-center space-x-1.5">
              <ShieldCheck size={18} className="text-emerald-600" />
              <span>Active Listing</span>
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-400 font-bold text-xs bg-white rounded-3xl border border-slate-100">
          Loading properties...
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 font-semibold space-y-3">
          <Building2 size={40} className="mx-auto text-slate-300" />
          <p className="text-sm font-bold text-slate-700">No properties found.</p>
          <Link
            to="/properties/new"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-amber-700 text-white rounded-xl text-xs font-black shadow-sm"
          >
            <Plus size={16} />
            <span>Add Property</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3.5">
          {properties.map((prop) => {
            const { id, name, property_type, gender, locality, city, base_rent, deposit, images, rooms, is_verified, is_active, owner_name } = prop;
            const coverImage = images && images.length > 0 ? images[0].image : 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=500&q=80';
            
            const isApartment = property_type === 'Apartment';
            const totalBeds = rooms ? rooms.reduce((acc, r) => acc + (r.total_beds || 1), 0) : 0;
            const occupiedBeds = rooms ? rooms.reduce((acc, r) => acc + (r.occupied_beds || 0), 0) : 0;
            const vacantBeds = Math.max(0, totalBeds - occupiedBeds);

            return (
              <div 
                key={id} 
                className="bg-white rounded-2xl border border-amber-100/80 p-4 shadow-2xs hover:shadow-xs transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left"
              >
                {/* Left Thumbnail & Info */}
                <div className="flex items-center space-x-4 w-full sm:w-auto min-w-0">
                  <img 
                    src={coverImage} 
                    alt={name} 
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-slate-200 flex-shrink-0 shadow-2xs bg-amber-50" 
                  />

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <h3 className="font-black text-slate-900 text-base sm:text-lg leading-snug truncate pr-1">
                        {name}
                      </h3>
                      <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-slate-900 text-white shadow-2xs">
                        {property_type}
                      </span>
                      <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-amber-50 border border-amber-200 text-amber-900">
                        {gender === 'Unisex' ? 'Co-Ed' : `${gender} Only`}
                      </span>
                      {user?.isAdmin && owner_name && (
                        <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md border border-slate-200 flex items-center gap-1">
                          <User size={10} />
                          {owner_name}
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-bold text-slate-400 flex items-center">
                      <MapPin size={13} className="mr-1 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{locality}, {city}</span>
                    </p>

                    <div className="flex items-center space-x-3 text-xs font-black pt-0.5">
                      <span className="text-amber-800 font-black text-sm">
                        ₹{Number(base_rent).toLocaleString()} <span className="text-[10px] text-slate-400 font-semibold">/mo</span>
                      </span>
                      <span className="px-2.5 py-0.5 text-[10px] font-black rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {vacantBeds} {isApartment ? 'Units' : 'Beds'} Vacant
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                  <Link 
                    to={`/properties/edit/${id}`}
                    className="px-4 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-black shadow-2xs transition flex items-center space-x-1.5"
                  >
                    <Edit2 size={14} />
                    <span>Edit Property</span>
                  </Link>

                  <Link 
                    to={`/property/${id}`}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center"
                    title="Preview Guest View"
                  >
                    <Eye size={16} />
                  </Link>

                  <button 
                    onClick={() => handleDelete(id, name)}
                    className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-xl text-xs font-bold transition flex items-center justify-center"
                    title="Delete Listing"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
