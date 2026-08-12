import { useNavigate } from 'react-router-dom';
import { MapPin, Home, DollarSign, Users, ShieldAlert } from 'lucide-react';

export default function PropertyCard({ property }) {
  const navigate = useNavigate();
  
  const {
    id, name, property_type, gender, locality, city, base_rent, images, rooms
  } = property;

  const coverImage = images && images.length > 0 ? images[0].image : 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=500&q=80';

  const totalBeds = rooms ? rooms.reduce((acc, r) => acc + r.total_beds, 0) : 0;
  const occupiedBeds = rooms ? rooms.reduce((acc, r) => acc + r.occupied_beds, 0) : 0;
  const vacantBeds = Math.max(0, totalBeds - occupiedBeds);

  const roomTypeVacancies = rooms ? Object.values(rooms.reduce((acc, r) => {
    const type = r.room_type || 'Standard';
    const vacant = Math.max(0, (r.total_beds || 1) - (r.occupied_beds || 0));
    if (!acc[type]) {
      acc[type] = { type, vacant, total: r.total_beds || 1 };
    } else {
      acc[type].vacant += vacant;
      acc[type].total += (r.total_beds || 1);
    }
    return acc;
  }, {})) : [];

  const getGenderBadgeColor = (g) => {
    switch (g) {
      case 'Boys': return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Girls': return 'bg-pink-50 text-pink-800 border-pink-200';
      default: return 'bg-purple-50 text-purple-800 border-purple-200';
    }
  };

  const activeVacancies = roomTypeVacancies.filter(rt => rt.vacant > 0);

  return (
    <div 
      onClick={() => navigate(`/property/${id}`)}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition duration-300 cursor-pointer flex flex-col h-full group"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img 
          src={coverImage} 
          alt={name} 
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
        />
        <div className="absolute top-4 left-4 flex flex-col gap-1.5">
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-slate-900/80 text-white backdrop-blur-sm shadow-sm">
            {property_type}
          </span>
          <span className={`px-3 py-1 text-xs font-bold rounded-full border shadow-sm ${getGenderBadgeColor(gender)}`}>
            {gender === 'Unisex' ? 'Co-Ed' : `${gender} Only`}
          </span>
        </div>
        
        {vacantBeds === 0 ? (
          <div className="absolute bottom-4 right-4 px-3 py-1 text-xs font-bold rounded-md bg-red-500 text-white shadow-sm flex items-center space-x-1">
            <ShieldAlert size={12} />
            <span>Fully Booked</span>
          </div>
        ) : (
          <div className="absolute bottom-4 right-4 px-3 py-1 text-xs font-black rounded-md bg-white/90 text-slate-800 shadow-sm backdrop-blur-xs">
            {vacantBeds} {property_type === 'Apartment' ? 'Units' : 'Beds'} Vacant
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-4 flex flex-col flex-1 text-left space-y-2">
        <div>
          <h3 className="font-extrabold text-slate-900 text-lg group-hover:text-amber-700 transition leading-snug">
            {name}
          </h3>
          <p className="text-xs font-semibold text-slate-400 flex items-center mt-1">
            <MapPin size={12} className="mr-1 text-slate-400" />
            <span>{locality}, {city}</span>
          </p>
        </div>

        {/* Single line vacant beds summary */}
        <div className="pt-1.5 min-h-[28px]">
          <span className={`px-2.5 py-1 text-xs font-black rounded-lg border inline-flex items-center space-x-1 ${
            vacantBeds > 0 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80' 
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            <span>{vacantBeds > 0 ? `${vacantBeds} Available ${property_type === 'Apartment' ? 'Units' : 'Beds'}` : 'Fully Booked'}</span>
          </span>
        </div>
      </div>

      <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between p-4">
        <div className="flex items-baseline">
          <span className="text-xl font-black text-amber-700">₹{Number(base_rent).toLocaleString()}</span>
          <span className="text-xs font-semibold text-slate-400 ml-1">/mo</span>
        </div>

        <div className="flex items-center space-x-3 text-xs font-bold text-slate-500">
          <span className="flex items-center">
            <Home size={14} className="mr-1 text-slate-400" />
            {rooms ? rooms.length : 0} R
          </span>
          <span className="flex items-center">
            <Users size={14} className="mr-1 text-slate-400" />
            {totalBeds} Beds
          </span>
        </div>
      </div>
    </div>
  );
}
