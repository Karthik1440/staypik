import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, Calendar, Info, ShieldCheck, AlertCircle, Clock, MapPin, CheckCircle2, Phone
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
      setPhone(user.phone || user.mobile_number || '');
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
  
  // Vacant beds calculation
  const totalBeds = selectedRoom ? (selectedRoom.total_beds || 1) : 1;
  const occupiedBeds = selectedRoom ? (selectedRoom.occupied_beds || 0) : 0;
  const vacantBeds = Math.max(0, totalBeds - occupiedBeds);
  const isApartment = property?.property_type === 'Apartment';

  const handleQuickDateSelect = (type) => {
    setSelectedQuickDate(type);
    const date = new Date();
    if (type === 'Today') {
      setVisitDate(date.toISOString().split('T')[0]);
    } else if (type === 'Tomorrow') {
      date.setDate(date.getDate() + 1);
      setVisitDate(date.toISOString().split('T')[0]);
    } else if (type === 'Weekend') {
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
        notes: notes || 'Scheduled Property Visit',
        room_id: selectedRoomId || null
      };

      const res = await api.post(`/rentals/properties/${id}/visit/`, payload);
      const bookingData = res.data;
      
      // Navigate to success screen
      navigate(`/property/${id}/success`, {
        state: {
          bookingId: `PG${bookingData.id || '12345678'}`,
          pgName: property.name,
          roomType: selectedRoom ? selectedRoom.room_type : 'Property Visit',
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
    <div className="max-w-lg mx-auto bg-slate-50 min-h-screen pb-12 text-left animate-fadeIn font-sans">
      {/* Header Toolbar */}
      <div className="bg-white border-b border-slate-100 px-5 py-4 flex items-center space-x-3.5 sticky top-0 z-30 shadow-xs">
        <button onClick={() => navigate(-1)} className="text-slate-700 hover:text-amber-700 transition">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-base font-black text-slate-900">Schedule Property Visit</h1>
          <p className="text-[11px] font-semibold text-slate-400">Free in-person property walkthrough</p>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {bookingError && (
          <div className="p-4 rounded-2xl bg-red-50 text-red-700 border border-red-100 text-xs font-semibold flex items-center space-x-2">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{bookingError}</span>
          </div>
        )}

        {/* Property & Selected Room Summary Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider block mb-1">
                {property.property_type || 'PG / Co-Living'}
              </span>
              <h3 className="font-black text-slate-900 text-lg">{property.name}</h3>
              <p className="text-xs font-semibold text-slate-400 flex items-center mt-1">
                <MapPin size={12} className="mr-1 text-slate-400" />
                {property.locality}, {property.city}
              </p>
            </div>
            {selectedRoom && (
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                vacantBeds > 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                {vacantBeds > 0 ? `${vacantBeds} ${isApartment ? 'unit' : 'bed'}${vacantBeds > 1 ? 's' : ''} vacant` : 'Full'}
              </span>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
            <div>
              <p className="text-xs font-black text-slate-800">
                {selectedRoom ? selectedRoom.room_type : 'Standard Room'}
              </p>
              <p className="text-[11px] font-bold text-amber-700 mt-0.5">
                ₹{Number(selectedRoom ? selectedRoom.monthly_rent : property.base_rent).toLocaleString()}
                <span className="text-[10px] font-bold text-slate-400">/month</span>
                {selectedRoom?.deposit > 0 && (
                  <span className="text-slate-400 font-semibold"> • Deposit: ₹{Number(selectedRoom.deposit).toLocaleString()}</span>
                )}
              </p>
            </div>
            <button 
              onClick={() => navigate(`/property/${id}`)}
              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-extrabold shadow-xs transition"
            >
              Change Room
            </button>
          </div>
        </div>

        {/* Visit Date Selection */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Select Visit Date</h3>
          <div className="grid grid-cols-4 gap-2.5">
            {quickDates.map((qDate) => (
              <div 
                key={qDate.name}
                onClick={() => qDate.name !== 'Custom' && handleQuickDateSelect(qDate.name)}
                className={`p-2.5 rounded-2xl border text-center cursor-pointer transition duration-150 flex flex-col justify-center items-center h-16 ${
                  selectedQuickDate === qDate.name 
                    ? 'border-amber-700 bg-amber-700 text-white shadow-md' 
                    : 'border-slate-200/80 bg-white hover:border-slate-300 text-slate-600'
                }`}
              >
                <span className="text-[11px] font-black">{qDate.label}</span>
                <span className={`text-[10px] font-extrabold mt-1 ${
                  selectedQuickDate === qDate.name ? 'text-amber-100' : 'text-slate-400'
                }`}>{qDate.sub}</span>
              </div>
            ))}
          </div>

          <div className="relative bg-white border border-slate-200/80 rounded-2xl shadow-xs p-4 flex items-center justify-between">
            <input 
              type="date"
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-transparent text-xs font-extrabold outline-none text-slate-800 py-1"
              value={visitDate}
              onChange={(e) => {
                setVisitDate(e.target.value);
                setSelectedQuickDate('Custom');
              }}
            />
            <Calendar className="text-slate-400 absolute right-4 pointer-events-none" size={18} />
          </div>
        </div>

        {/* Visit Time Selection */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Preferred Time Slot</h3>
          <div className="grid grid-cols-3 gap-2.5">
            {['10:00 AM', '11:30 AM', '02:00 PM', '04:30 PM', '06:00 PM', '07:30 PM'].map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setVisitTime(slot)}
                className={`p-3 rounded-2xl text-xs font-extrabold border transition ${
                  visitTime === slot
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        {/* Contact Phone & Notes */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Contact Details</h3>
          
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-4 flex flex-col space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Your Phone Number *</label>
            <div className="flex items-center space-x-2">
              <Phone size={16} className="text-slate-400" />
              <input 
                type="tel"
                required
                placeholder="Enter 10-digit mobile number"
                className="w-full bg-transparent text-xs font-extrabold outline-none text-slate-800 py-1"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-4 flex flex-col space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Optional Message / Note for Owner</label>
            <input 
              type="text"
              placeholder="e.g. Prefer evening visit around 5 PM"
              className="w-full bg-transparent text-xs font-semibold outline-none text-slate-800 py-1"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Confirm Action Button */}
        <div className="pt-2">
          <button 
            onClick={handleConfirmVisit}
            disabled={bookingLoading}
            className="w-full py-4 bg-amber-700 hover:bg-amber-800 text-white text-xs font-black rounded-2xl shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {bookingLoading ? (
              <span>Scheduling Visit...</span>
            ) : (
              <span>Confirm & Schedule Free Visit</span>
            )}
          </button>
          <span className="text-[10px] font-extrabold text-slate-400 mt-3 block text-center flex justify-center items-center space-x-1">
            <ShieldCheck size={14} className="text-emerald-600 mr-1" />
            <span>Visit is 100% free of charge • Contact details protected</span>
          </span>
        </div>
      </div>
    </div>
  );
}
