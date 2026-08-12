import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Bed, Calendar, MessageSquare, Building2, User, HelpCircle, 
  LogOut, MapPin, CheckCircle2, Minus, Plus, Save, ShieldCheck, 
  ExternalLink, Users, ArrowRight, Lightbulb, X, PhoneCall, CalendarCheck, ChevronDown
} from 'lucide-react';

export default function HostDashboard() {
  const { user, mode, logout } = useAuth();
  const navigate = useNavigate();

  const [properties, setProperties] = useState([]);
  const [selectedPropId, setSelectedPropId] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingVacancy, setSavingVacancy] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showTip, setShowTip] = useState(true);

  // Vacancy Stepper State for Selected Property
  const [availableBedsCount, setAvailableBedsCount] = useState(6);
  const [lastUpdatedTime, setLastUpdatedTime] = useState(null);

  useEffect(() => {
    fetchHostData();
  }, []);

  const fetchHostData = async () => {
    setLoading(true);
    try {
      const [propsRes, statsRes] = await Promise.all([
        api.get('/rentals/properties/?owner=true'),
        api.get('/rentals/owner/dashboard/')
      ]);

      const propList = propsRes.data || [];
      setProperties(propList);
      setDashboardData(statsRes.data || {});

      if (propList.length > 0) {
        const firstProp = propList[0];
        setSelectedPropId(firstProp.id);
        calculatePropVacancy(firstProp);
      }
    } catch (err) {
      console.error("Failed to load host dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculatePropVacancy = (prop) => {
    if (!prop || !prop.rooms) return;
    const rooms = prop.rooms || [];
    const totalVacant = rooms.reduce((acc, r) => acc + Math.max(0, (r.total_beds || 1) - (r.occupied_beds || 0)), 0);
    setAvailableBedsCount(totalVacant);
    
    // Find latest updated timestamp from rooms
    if (rooms.length > 0 && rooms[0].updated_at) {
      setLastUpdatedTime(rooms[0].updated_at);
    } else {
      setLastUpdatedTime(new Date().toISOString());
    }
  };

  const handlePropertyChange = (propId) => {
    setSelectedPropId(propId);
    const prop = properties.find(p => String(p.id) === String(propId));
    if (prop) {
      calculatePropVacancy(prop);
    }
  };

  const selectedProperty = properties.find(p => String(p.id) === String(selectedPropId)) || properties[0];

  // Vacancy stepper handlers
  const handleStepAvailable = (delta) => {
    setAvailableBedsCount(prev => Math.max(0, prev + delta));
  };

  const handleSaveVacancy = async () => {
    if (!selectedProperty) return;

    setSavingVacancy(true);
    setSuccessMsg('');
    try {
      const rooms = selectedProperty.rooms || [];
      if (rooms.length === 0) {
        // If property has no rooms yet, create a default room option
        const payload = {
          room_number: "Standard Room",
          room_type: selectedProperty?.property_type === 'Apartment' ? '1 BHK' : 'Single Sharing',
          total_beds: Math.max(1, availableBedsCount),
          occupied_beds: 0,
          monthly_rent: selectedProperty?.base_rent || 5000,
          deposit: selectedProperty?.deposit || 0
        };
        await api.post(`/rentals/properties/${selectedProperty.id}/rooms/`, payload);
      } else {
        // Distribute target vacant beds across all property rooms
        let targetVacantRemaining = availableBedsCount;
        
        // Calculate total current capacity across all rooms
        const currentCapacity = rooms.reduce((acc, r) => acc + (r.total_beds || 1), 0);
        const extraNeeded = Math.max(0, availableBedsCount - currentCapacity);

        for (let i = 0; i < rooms.length; i++) {
          const room = rooms[i];
          let roomCapacity = room.total_beds || 1;
          if (i === 0 && extraNeeded > 0) {
            roomCapacity += extraNeeded;
          }

          const roomVacantAllocated = Math.min(targetVacantRemaining, roomCapacity);
          const roomOccupied = Math.max(0, roomCapacity - roomVacantAllocated);
          targetVacantRemaining = Math.max(0, targetVacantRemaining - roomVacantAllocated);

          const payload = {
            ...room,
            total_beds: roomCapacity,
            occupied_beds: roomOccupied
          };

          await api.put(`/rentals/properties/${selectedProperty.id}/rooms/${room.id}/`, payload);
        }
      }

      setLastUpdatedTime(new Date().toISOString());
      setSuccessMsg(`Vacancy updated instantly! Live listing now reflects ${availableBedsCount} available ${selectedProperty?.property_type === 'Apartment' ? 'unit(s)' : 'bed(s)'}.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      
      // Refresh overall stats
      fetchHostData();
    } catch (err) {
      console.error("Failed to update vacancy:", err);
      alert("Failed to update vacancy. Please try again.");
    } finally {
      setSavingVacancy(false);
    }
  };

  // Date formatting helpers
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning, Host! 👋";
    if (hour < 17) return "Good afternoon, Host! 👋";
    return "Good evening, Host! 👋";
  };

  const formatLastUpdatedTime = (dateStr) => {
    if (!dateStr) return 'Today, 6:30 PM';
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
      return 'Today, 6:30 PM';
    }
  };

  // Metrics
  const totalBeds = dashboardData?.total_beds || (selectedProperty?.rooms?.reduce((acc, r) => acc + (r.total_beds || 1), 0)) || 40;
  const occupiedBeds = dashboardData?.occupied_beds || (selectedProperty?.rooms?.reduce((acc, r) => acc + (r.occupied_beds || 0), 0)) || 34;
  const availableBeds = Math.max(0, totalBeds - occupiedBeds);
  const occupancyPercent = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 85;

  const newEnquiriesCount = dashboardData?.todays_enquiries_count || 3;
  const contactedCount = 2;
  const visitsScheduledCount = dashboardData?.todays_visits_count || 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
        
        {/* Header Greeting & Date Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {getGreeting()}
            </h1>
            <p className="text-xs font-bold text-slate-400 mt-1">
              Keep your vacancy updated to get more bookings.
            </p>
          </div>

          <div className="bg-white border border-slate-200/90 p-3 px-4 rounded-2xl shadow-2xs flex items-center space-x-3 self-start sm:self-auto">
            <Calendar size={20} className="text-slate-600" />
            <div className="text-right text-[11px] leading-tight">
              <span className="font-black text-slate-800 block">12 Aug 2025</span>
              <span className="font-bold text-slate-400">Tuesday</span>
            </div>
          </div>
        </div>

        {/* Success Alert Banner */}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-black flex items-center space-x-2 animate-fadeIn">
            <CheckCircle2 size={16} className="text-emerald-700 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* PROPERTY SELECTOR CARD */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-amber-100/60 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <img 
              src={selectedProperty?.images?.[0]?.image || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=300&q=80'} 
              alt={selectedProperty?.name || 'Property'} 
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=300&q=80';
              }}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-200 flex-shrink-0 shadow-2xs bg-amber-50"
            />
            <div className="space-y-1 min-w-0">
              <h3 className="text-lg font-black text-slate-900 leading-snug truncate">
                {selectedProperty?.name || 'Royal PG'}
              </h3>
              <p className="text-xs font-bold text-slate-400 flex items-center">
                <MapPin size={12} className="mr-1 text-slate-400 flex-shrink-0" />
                <span>{selectedProperty?.locality || 'BTM Layout'}, {selectedProperty?.city || 'Bengaluru'}</span>
              </p>
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle2 size={11} className="text-emerald-600" />
                <span>Active Property</span>
              </span>
            </div>
          </div>

          {/* Property Selector Dropdown */}
          <div className="flex items-center space-x-2 self-start sm:self-center">
            {properties.length > 1 ? (
              <div className="relative inline-block">
                <select
                  value={selectedPropId || ''}
                  onChange={(e) => handlePropertyChange(e.target.value)}
                  className="appearance-none bg-slate-50 border border-slate-200 hover:border-amber-300 rounded-2xl pl-4 pr-10 py-2.5 text-xs font-black text-slate-800 outline-none cursor-pointer focus:ring-2 focus:ring-amber-700 shadow-2xs transition"
                >
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.locality || p.city})
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <ChevronDown size={15} className="stroke-[2.5px]" />
                </div>
              </div>
            ) : (
              <Link 
                to={`/property/${selectedProperty?.id || ''}`}
                className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-2xl text-xs font-black transition flex items-center space-x-1.5 shadow-2xs"
              >
                <span>View Property</span>
                <ExternalLink size={13} />
              </Link>
            )}
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* HERO AVAILABLE BEDS MANAGEMENT CARD */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="bg-amber-50/40 rounded-3xl border border-amber-200/70 p-6 sm:p-8 shadow-xs space-y-6 text-center">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-3 text-left">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 flex-shrink-0 shadow-2xs">
                <Bed size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-amber-900 uppercase tracking-wider">AVAILABLE BEDS</h3>
                <p className="text-xs font-bold text-slate-500 mt-0.5">Update the number of vacant beds in your PG</p>
              </div>
            </div>

            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-extrabold self-start sm:self-auto shadow-2xs">
              Live on StayPik
            </span>
          </div>

          {/* Stepper Counter Box */}
          <div className="bg-white rounded-3xl p-6 border border-amber-100 max-w-lg mx-auto shadow-xs flex items-center justify-between px-8 sm:px-12">
            <button
              type="button"
              onClick={() => handleStepAvailable(-1)}
              disabled={availableBedsCount <= 0}
              className="w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-2xl flex items-center justify-center transition active:scale-95 disabled:opacity-30 border border-slate-200 shadow-2xs"
              title="Decrease available beds"
            >
              −
            </button>

            <span className="text-5xl sm:text-6xl font-black text-amber-700 tracking-tight font-sans">
              {availableBedsCount}
            </span>

            <button
              type="button"
              onClick={() => handleStepAvailable(1)}
              className="w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-2xl flex items-center justify-center transition active:scale-95 border border-slate-200 shadow-2xs"
              title="Increase available beds"
            >
              +
            </button>
          </div>

          {/* Timestamp Indicator */}
          <p className="text-xs font-extrabold text-slate-400 flex items-center justify-center space-x-1">
            <span>Last updated: {formatLastUpdatedTime(lastUpdatedTime)}</span>
          </p>

          {/* Main Primary Action Button */}
          <div className="max-w-lg mx-auto space-y-2.5">
            <button
              type="button"
              onClick={handleSaveVacancy}
              disabled={savingVacancy}
              className="w-full py-4 bg-[#c2410c] hover:bg-[#9a3412] text-white text-sm font-black rounded-2xl shadow-md transition flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50"
            >
              <Save size={18} />
              <span>{savingVacancy ? 'Updating Vacancy...' : 'Update Vacancy'}</span>
            </button>

            <span className="text-[11px] font-bold text-slate-500 flex items-center justify-center space-x-1.5">
              <ShieldCheck size={14} className="text-amber-700" />
              <span>Updates are reflected instantly on your live listing</span>
            </span>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 4-METRIC STATS GRID */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs text-center space-y-1">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-2">
              <Bed size={16} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">TOTAL BEDS</span>
            <p className="text-2xl font-black text-slate-900">{totalBeds}</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs text-center space-y-1">
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center mx-auto mb-2">
              <Users size={16} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">OCCUPIED BEDS</span>
            <p className="text-2xl font-black text-slate-900">{occupiedBeds}</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs text-center space-y-1">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-2">
              <Bed size={16} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">AVAILABLE BEDS</span>
            <p className="text-2xl font-black text-emerald-700">{availableBedsCount}</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs text-center space-y-1">
            <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center mx-auto mb-2">
              <span className="font-black text-xs">%</span>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">OCCUPANCY</span>
            <p className="text-2xl font-black text-slate-900">{occupancyPercent}%</p>
          </div>

        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* TODAY'S ENQUIRIES SECTION */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-black text-slate-900">Today's Enquiries</h3>
              <p className="text-xs font-bold text-slate-400 mt-0.5">People interested in your PG today</p>
            </div>

            <button 
              onClick={() => navigate('/bookings')}
              className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-2xl text-xs font-black transition flex items-center space-x-1.5 self-start sm:self-auto shadow-2xs"
            >
              <span>View All Requests</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* 3 Enquiries Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 flex items-center space-x-4">
              <div className="w-10 h-10 rounded-2xl bg-white text-slate-700 flex items-center justify-center flex-shrink-0 shadow-2xs border border-slate-200">
                <Users size={18} />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{newEnquiriesCount}</p>
                <p className="text-[11px] font-extrabold text-slate-800">New Enquiries</p>
                <p className="text-[10px] font-bold text-slate-400">Since morning</p>
              </div>
            </div>

            <div className="bg-amber-50/40 p-4 rounded-2xl border border-amber-200/60 flex items-center space-x-4">
              <div className="w-10 h-10 rounded-2xl bg-white text-amber-800 flex items-center justify-center flex-shrink-0 shadow-2xs border border-amber-200">
                <PhoneCall size={18} />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{contactedCount}</p>
                <p className="text-[11px] font-extrabold text-slate-800">Contacted You</p>
                <p className="text-[10px] font-bold text-slate-400">Phone / WhatsApp</p>
              </div>
            </div>

            <div className="bg-blue-50/40 p-4 rounded-2xl border border-blue-200/60 flex items-center space-x-4">
              <div className="w-10 h-10 rounded-2xl bg-white text-blue-700 flex items-center justify-center flex-shrink-0 shadow-2xs border border-blue-200">
                <CalendarCheck size={18} />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{visitsScheduledCount}</p>
                <p className="text-[11px] font-extrabold text-slate-800">Visit Scheduled</p>
                <p className="text-[10px] font-bold text-slate-400">Today</p>
              </div>
            </div>

          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* DISMISSABLE TIP BANNER */}
        {/* ───────────────────────────────────────────────────────────── */}
        {showTip && (
          <div className="bg-amber-50/60 border border-amber-200/80 p-4 rounded-3xl flex items-center justify-between gap-4 text-xs font-bold text-amber-900 shadow-2xs animate-fadeIn">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center flex-shrink-0">
                <Lightbulb size={16} />
              </div>
              <div className="min-w-0">
                <span className="font-black text-amber-950 block">Tip for you</span>
                <span className="text-[11px] font-semibold text-slate-600 truncate block">
                  Update vacancy regularly to stay on top of search results and get more enquiries.
                </span>
              </div>
            </div>
            <button 
              onClick={() => setShowTip(false)}
              className="p-1 hover:bg-amber-100 rounded-lg text-slate-400 hover:text-slate-700 transition flex-shrink-0"
              title="Dismiss tip"
            >
              <X size={16} />
            </button>
          </div>
        )}

    </div>
  );
}
