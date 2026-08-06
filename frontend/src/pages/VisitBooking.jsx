import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, Calendar, Info, ShieldCheck, AlertCircle, Clock
} from 'lucide-react';

export default function VisitBooking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const roomIdFromUrl = searchParams.get('room_id') || '';

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [selectedRoomId, setSelectedRoomId] = useState(roomIdFromUrl);
  const [selectedBed, setSelectedBed] = useState('Bed A');
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('11:00 AM');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  
  // Custom date buttons
  const [selectedQuickDate, setSelectedQuickDate] = useState('Tomorrow');

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    fetchDetail();
    if (user && user.email) {
      setPhone(user.phone || '');
    }
    // Default pre-fill tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setVisitDate(tomorrow.toISOString().split('T')[0]);
  }, [id, user]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/rentals/properties/${id}/`);
      setProperty(res.data);
      if (!selectedRoomId && res.data.rooms && res.data.rooms.length > 0) {
        setSelectedRoomId(res.data.rooms[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selectedRoom = property?.rooms?.find(r => String(r.id) === String(selectedRoomId));
  
  // Real-Time Dynamic Vacant Beds Calculation
  const totalBeds = selectedRoom ? (selectedRoom.total_beds || 1) : 1;
  const occupiedBeds = selectedRoom ? (selectedRoom.occupied_beds || 0) : 0;
  const vacantBeds = Math.max(0, totalBeds - occupiedBeds);

  // Generate Real-Time Dynamic Bed Slots based on backend Room Capacity & Occupancy
  const dynamicBeds = Array.from({ length: totalBeds }, (_, idx) => {
    const bedLetter = String.fromCharCode(65 + idx); // Bed A, Bed B, Bed C...
    const isOccupied = idx < occupiedBeds;
    return {
      name: `Bed ${bedLetter}`,
      desc: isOccupied ? 'Occupied' : (idx === 0 ? 'Window | Attached Bathroom' : idx === 1 ? 'Balcony | Attached Bathroom' : 'Attached Bathroom'),
      isOccupied
    };
  });

  // Auto-select first available bed if current selectedBed is occupied
  useEffect(() => {
    const firstAvailable = dynamicBeds.find(b => !b.isOccupied);
    if (firstAvailable && (!selectedBed || dynamicBeds.find(b => b.name === selectedBed)?.isOccupied)) {
      setSelectedBed(firstAvailable.name);
    }
  }, [selectedRoomId, property]);

  const handleQuickDateSelect = (type) => {
    setSelectedQuickDate(type);
    const date = new Date();
    if (type === 'Today') {
      setVisitDate(date.toISOString().split('T')[0]);
    } else if (type === 'Tomorrow') {
      date.setDate(date.getDate() + 1);
      setVisitDate(date.toISOString().split('T')[0]);
    } else if (type === 'Weekend') {
      // Find upcoming Saturday
      const day = date.getDay();
      const distance = (6 - day + 7) % 7 || 7;
      date.setDate(date.getDate() + distance);
      setVisitDate(date.toISOString().split('T')[0]);
    }
  };

  const handleConfirmVisit = async () => {
    if (!phone) {
      setBookingError("Please enter your contact phone number.");
      return;
    }
    setBookingLoading(true);
    setBookingError('');

    try {
      const payload = {
        visit_date: visitDate,
        visit_time: visitTime,
        phone: phone,
        notes: `Selected Bed: ${selectedBed}. ${notes}`,
        room_id: selectedRoomId || null
      };

      const res = await api.post(`/rentals/properties/${id}/visit/`, payload);
      const bookingData = res.data;
      
      // Navigate to success screen with real-time payload
      navigate(`/property/${id}/success`, {
        state: {
          bookingId: `PG${bookingData.id || '12345678'}`,
          pgName: property.name,
          roomType: selectedRoom 
            ? `${selectedRoom.room_type} ${selectedRoom.room_number ? `(Room ${selectedRoom.room_number})` : ''}` 
            : 'PG Room',
          bedName: selectedBed,
          visitDate: visitDate,
          visitTime: visitTime,
          ownerPhone: property.owner_phone,
          ownerName: property.owner_name
        }
      });
    } catch (err) {
      console.error(err);
      setBookingError(err.response?.data?.detail || "Failed to schedule visit. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <div className="text-center py-24 text-slate-400 font-semibold">Loading details...</div>;
  if (!property) return <div className="text-center py-24 text-slate-400 font-semibold">Property listing not found</div>;

  // Real-Time System Dates Calculation
  const todayObj = new Date();
  const tomorrowObj = new Date();
  tomorrowObj.setDate(todayObj.getDate() + 1);

  const quickDates = [
    { name: 'Today', label: 'Today', sub: todayObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) },
    { name: 'Tomorrow', label: 'Tomorrow', sub: tomorrowObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) },
    { name: 'Weekend', label: 'Weekend', sub: 'Sat/Sun' },
    { name: 'Custom', label: 'Custom', sub: 'Pick Date' }
  ];

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen pb-12 text-left animate-fadeIn font-sans">
      {/* Header Toolbar */}
      <div className="bg-white border-b border-slate-100 px-5 py-4 flex items-center space-x-3.5 sticky top-0 z-30 shadow-xs">
        <button onClick={() => navigate(-1)} className="text-slate-700 hover:text-amber-700 transition">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-sm font-black text-slate-900">Book Your Visit</h1>
      </div>

      <div className="p-5 space-y-6">
        {bookingError && (
          <div className="p-4 rounded-2xl bg-red-50 text-red-700 border border-red-100 text-xs font-semibold flex items-center space-x-2">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{bookingError}</span>
          </div>
        )}

        {/* Selected Room Card Summary */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-3.5">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Selected Room</span>
          <div className="flex justify-between items-center">
            <div className="text-left space-y-1">
              <h3 className="font-black text-slate-900 text-sm">{property.name}</h3>
              <p className="text-xs font-extrabold text-slate-500">
                {selectedRoom ? `${selectedRoom.room_type} ${selectedRoom.room_number ? `(Room ${selectedRoom.room_number})` : ''}` : 'PG Room'}
              </p>
              <p className="text-xs font-black text-amber-700">
                ₹{Number(selectedRoom ? selectedRoom.monthly_rent : property.base_rent).toLocaleString()}
                <span className="text-[10px] font-bold text-slate-400"> /month</span>
              </p>
            </div>
            <button 
              onClick={() => navigate(`/property/${id}`)}
              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-extrabold shadow-xs transition"
            >
              Change
            </button>
          </div>
        </div>

        {/* Choose Bed Section - REAL-TIME VACANT BED METRIC & SLOTS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Choose Bed</h3>
            <span className="text-xs font-black text-amber-700">
              ({vacantBeds} {vacantBeds === 1 ? 'BED' : 'BEDS'} LEFT)
            </span>
          </div>

          <div className="space-y-2.5">
            {dynamicBeds.map((bed, idx) => (
              <div 
                key={idx}
                onClick={() => !bed.isOccupied && setSelectedBed(bed.name)}
                className={`p-3.5 rounded-2xl border transition duration-200 flex justify-between items-center ${
                  bed.isOccupied ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200' :
                  selectedBed === bed.name ? 'border-amber-700 bg-amber-50/30 ring-2 ring-amber-700/20 cursor-pointer shadow-xs' :
                  'border-slate-200/80 bg-white hover:border-amber-300 cursor-pointer'
                }`}
              >
                <div className="text-left space-y-0.5">
                  <p className="text-xs font-black text-slate-900">
                    {selectedRoom ? `${selectedRoom.room_type} ${selectedRoom.room_number ? `(Room ${selectedRoom.room_number})` : ''}` : 'Room 101'} - {bed.name}
                  </p>
                  <p className={`text-[10px] font-extrabold ${bed.isOccupied ? 'text-red-600' : 'text-slate-400'}`}>
                    {bed.isOccupied ? 'Occupied' : bed.desc}
                  </p>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  bed.isOccupied ? 'border-slate-300 bg-slate-200' :
                  selectedBed === bed.name ? 'border-amber-700 bg-amber-700' : 'border-slate-300 bg-white'
                }`}>
                  {selectedBed === bed.name && !bed.isOccupied && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Move-in Date Picker */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Move-in Date</h3>
          <div className="relative bg-white border border-slate-200/80 rounded-2xl shadow-xs p-4 flex items-center justify-between">
            <input 
              type="date"
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-transparent text-xs font-extrabold outline-none text-slate-800 py-1"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
            />
            <Calendar className="text-slate-400 absolute right-4 pointer-events-none" size={18} />
          </div>
        </div>

        {/* Schedule Your Visit Slots */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Schedule Your Visit</h3>
          <div className="grid grid-cols-4 gap-2.5">
            {quickDates.map((qDate) => (
              <div 
                key={qDate.name}
                onClick={() => qDate.name !== 'Custom' && handleQuickDateSelect(qDate.name)}
                className={`p-2.5 rounded-2xl border text-center cursor-pointer transition duration-150 flex flex-col justify-center items-center h-16 ${
                  selectedQuickDate === qDate.name 
                    ? 'border-amber-800 bg-amber-950 text-white shadow-md' 
                    : 'border-slate-200/80 bg-white hover:border-slate-300 text-slate-600'
                }`}
              >
                <span className="text-[10px] font-black">{qDate.label}</span>
                <span className={`text-[9px] font-extrabold mt-1 ${
                  selectedQuickDate === qDate.name ? 'text-amber-200' : 'text-slate-400'
                }`}>{qDate.sub}</span>
              </div>
            ))}
          </div>

          {/* Time Picker */}
          <div className="relative bg-white border border-slate-200/80 rounded-2xl shadow-xs p-4 flex items-center justify-between mt-3">
            <input 
              type="text"
              placeholder="Select Time (e.g. 11:00 AM)"
              className="w-full bg-transparent text-xs font-extrabold outline-none text-slate-800 py-1"
              value={visitTime}
              onChange={(e) => setVisitTime(e.target.value)}
            />
            <Clock className="text-slate-400 absolute right-4 pointer-events-none" size={18} />
          </div>

          {/* Phone Field */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-4 flex flex-col mt-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Contact Phone *</label>
            <input 
              type="tel"
              required
              placeholder="e.g. 9876543210"
              className="w-full bg-transparent text-xs font-extrabold outline-none text-slate-800 py-0.5"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        {/* Confirm Action Button */}
        <div className="pt-2">
          <button 
            onClick={handleConfirmVisit}
            disabled={bookingLoading}
            className="w-full py-4 bg-amber-900 hover:bg-amber-950 text-white text-xs font-black rounded-2xl shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {bookingLoading ? (
              <span>Scheduling Visit...</span>
            ) : (
              <span>Confirm Visit</span>
            )}
          </button>
          <span className="text-[10px] font-extrabold text-slate-400 mt-2.5 block text-center flex justify-center items-center space-x-1">
            <ShieldCheck size={13} className="text-emerald-600 mr-0.5" />
            <span>This visit is free of charge</span>
          </span>
        </div>
      </div>
    </div>
  );
}
