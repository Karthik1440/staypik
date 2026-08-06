import { useState, useEffect } from 'react';
import api from '../api';
import { 
  Calendar, MapPin, Clock, Phone, CheckCircle2, Clock3, XCircle, Home, User, 
  MessageCircle, Navigation, Search, Check, Copy, Trash2, ShieldCheck, RefreshCw, Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Bookings() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL', 'PENDING', 'APPROVED', 'HISTORY'
  const [copiedPhoneId, setCopiedPhoneId] = useState(null);
  const { user, mode } = useAuth();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/rentals/bookings/');
      setVisits(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (visitId, newStatus) => {
    try {
      await api.patch(`/rentals/bookings/${visitId}/`, { status: newStatus });
      fetchHistory();
    } catch (err) {
      console.error("Failed to update visit status:", err);
      alert(err.response?.data?.detail || "Failed to update visit status.");
    }
  };

  const handleClearVisit = async (visitId) => {
    if (!window.confirm("Are you sure you want to clear this visit request from your records?")) return;
    try {
      await api.delete(`/rentals/bookings/${visitId}/`);
      fetchHistory();
    } catch (err) {
      console.error("Failed to clear visit request:", err);
      alert(err.response?.data?.detail || "Failed to clear visit request.");
    }
  };

  const handleNavigateMap = (visit) => {
    let mapUrl = '';
    if (visit.property_latitude && visit.property_longitude) {
      mapUrl = `https://www.google.com/maps/search/?api=1&query=${visit.property_latitude},${visit.property_longitude}`;
    } else {
      const fullAddress = [visit.property_name, visit.property_address, visit.property_locality, visit.property_city]
        .filter(Boolean)
        .join(', ');
      mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
    }
    window.open(mapUrl, '_blank');
  };

  // Helper to format YYYY-MM-DD into "05 Aug 2026"
  const formatDateFormatted = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const parts = String(dateStr).split('T')[0].split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const monthIdx = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        if (months[monthIdx]) {
          return `${day < 10 ? '0' + day : day} ${months[monthIdx]} ${year}`;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return dateStr;
  };

  // Helper to format time strings e.g. "11:00:00" -> "11:00 AM"
  const formatTimeFormatted = (timeStr) => {
    if (!timeStr) return '';
    try {
      const parts = timeStr.split(':');
      if (parts.length >= 2) {
        let hour = parseInt(parts[0], 10);
        const minutes = parts[1];
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12 || 12;
        return `${hour}:${minutes} ${ampm}`;
      }
    } catch (e) {
      console.error(e);
    }
    return timeStr;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-200">
            <CheckCircle2 size={13} />
            <span>Approved Visit</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={13} />
            <span>Completed Visit</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-black bg-red-100 text-red-900 border border-red-200">
            <XCircle size={13} />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-950 border border-amber-200">
            <Clock3 size={13} />
            <span>Pending Host Approval</span>
          </span>
        );
    }
  };

  // Filter Visits
  const filteredVisits = visits.filter(visit => {
    if (activeTab === 'PENDING' && visit.status !== 'PENDING') return false;
    if (activeTab === 'APPROVED' && visit.status !== 'APPROVED') return false;
    if (activeTab === 'HISTORY' && (visit.status === 'PENDING' || visit.status === 'APPROVED')) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = visit.property_name?.toLowerCase().includes(q);
    const phoneMatch = visit.phone?.toLowerCase().includes(q);
    const emailMatch = visit.user_email?.toLowerCase().includes(q);
    const roomMatch = String(visit.room_number || '').toLowerCase().includes(q);
    return nameMatch || phoneMatch || emailMatch || roomMatch;
  });

  const pendingCount = visits.filter(v => v.status === 'PENDING').length;
  const approvedCount = visits.filter(v => v.status === 'APPROVED').length;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn font-proxima text-left">

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Visit Requests</h1>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            {mode === 'HOST' 
              ? 'Review, approve, and manage guest property inspection visit requests' 
              : 'Keep track of your scheduled property inspection visits and booking status'}
          </p>
        </div>

        <button 
          onClick={fetchHistory}
          disabled={loading}
          className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-extrabold rounded-2xl hover:bg-slate-50 transition shadow-xs flex items-center space-x-1.5 self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-amber-700" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* SEARCH & REFRESH BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:px-6 sm:py-4 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 bg-amber-100/90 text-amber-900 border border-amber-200 text-xs font-black rounded-full">
            All Requests ({visits.length})
          </span>
        </div>

        {/* Search Input Bar */}
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search PG, guest name, or room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-extrabold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition placeholder-slate-400"
          />
        </div>
      </div>


      {/* VISITS LIST */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 font-bold text-xs bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          Loading visit requests...
        </div>
      ) : filteredVisits.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 font-bold text-xs space-y-2">
          <p className="text-base text-slate-800 font-black">No visit requests found</p>
          <p className="text-xs font-semibold text-slate-400">
            {searchQuery ? `No requests matching "${searchQuery}"` : 'There are no visit requests in this category.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredVisits.map((visit) => {
            const formattedVisitDate = formatDateFormatted(visit.visit_date);
            const formattedVisitTime = formatTimeFormatted(visit.visit_time);
            const createdDateFormatted = formatDateFormatted(visit.created_at);

            return (
              <div 
                key={visit.id} 
                className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6 hover:shadow-md transition duration-200"
              >
                {/* Left Metadata Section */}
                <div className="space-y-3.5 min-w-0 flex-1">
                  <div className="flex items-center space-x-2.5">
                    <h3 className="font-black text-slate-900 text-lg leading-tight truncate">
                      {visit.property_name}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-amber-100/90 text-amber-900 border border-amber-200 flex-shrink-0">
                      {visit.property_type || 'PG'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs font-bold text-slate-700">
                    <div className="flex items-center text-slate-900">
                      <Calendar size={14} className="text-amber-700 mr-2 flex-shrink-0" />
                      <span>Date: <strong className="font-black">{formattedVisitDate}</strong></span>
                    </div>

                    {formattedVisitTime && (
                      <div className="flex items-center text-slate-900">
                        <Clock size={14} className="text-amber-700 mr-2 flex-shrink-0" />
                        <span>Time: <strong className="font-black">{formattedVisitTime}</strong></span>
                      </div>
                    )}

                    <div className="flex items-center col-span-1 sm:col-span-2 text-slate-800">
                      <Phone size={14} className="text-amber-700 mr-2 flex-shrink-0" />
                      <span className="mr-2">Contact Phone: <strong>{visit.phone}</strong></span>
                      {visit.phone && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(visit.phone);
                            setCopiedPhoneId(visit.id);
                            setTimeout(() => setCopiedPhoneId(null), 2000);
                          }}
                          className="p-1 rounded bg-slate-100 text-slate-500 hover:text-amber-800 border border-slate-200 transition"
                          title="Copy Phone"
                        >
                          {copiedPhoneId === visit.id ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                        </button>
                      )}
                    </div>

                    {visit.room_number && (
                      <div className="flex items-center col-span-1 sm:col-span-2 text-slate-800">
                        <Home size={14} className="text-amber-700 mr-2 flex-shrink-0" />
                        <span>Preferred Room: <strong>{visit.room_type} (Room {visit.room_number})</strong></span>
                      </div>
                    )}

                    {visit.user_email && (
                      <div className="flex items-center col-span-1 sm:col-span-2 text-slate-500">
                        <User size={14} className="text-slate-400 mr-2 flex-shrink-0" />
                        <span>Guest Email: <strong>{visit.user_email}</strong></span>
                      </div>
                    )}
                  </div>

                  {visit.notes && (
                    <div className="text-xs font-bold italic text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                      "{visit.notes}"
                    </div>
                  )}
                </div>

                {/* Right Actions & Status Section */}
                <div className="md:text-right flex flex-col justify-between md:items-end flex-shrink-0 space-y-3">
                  <div>
                    {getStatusBadge(visit.status)}
                    <span className="text-[10px] font-bold text-slate-400 block mt-1.5 uppercase tracking-wider">
                      Requested on {createdDateFormatted}
                    </span>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="flex flex-wrap gap-2 pt-1 md:justify-end">
                    
                    {/* HOST MODE ACTIONS */}
                    {mode === 'HOST' && visit.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(visit.id, 'APPROVED')}
                          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black shadow-xs transition flex items-center space-x-1"
                        >
                          <CheckCircle2 size={14} />
                          <span>Approve Visit</span>
                        </button>

                        <button
                          onClick={() => handleUpdateStatus(visit.id, 'CANCELLED')}
                          className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-black transition flex items-center space-x-1"
                        >
                          <XCircle size={14} />
                          <span>Reject</span>
                        </button>
                      </>
                    )}

                    {mode === 'HOST' && visit.status === 'APPROVED' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(visit.id, 'COMPLETED')}
                          className="px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-black shadow-xs transition flex items-center space-x-1"
                        >
                          <CheckCircle2 size={14} />
                          <span>Mark Completed</span>
                        </button>

                        <button
                          onClick={() => handleUpdateStatus(visit.id, 'CANCELLED')}
                          className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-black transition flex items-center space-x-1"
                        >
                          <XCircle size={14} />
                          <span>Cancel Visit</span>
                        </button>
                      </>
                    )}


                    {/* GUEST MODE ACTIONS */}
                    {mode !== 'HOST' && (visit.status === 'PENDING' || visit.status === 'APPROVED') && (
                      <>
                        {visit.status === 'APPROVED' && (
                          <button
                            onClick={() => handleNavigateMap(visit)}
                            className="px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-black shadow-xs transition flex items-center space-x-1"
                            title="Navigate to property on Google Maps"
                          >
                            <Navigation size={13} />
                            <span>Navigate Map</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleUpdateStatus(visit.id, 'CANCELLED')}
                          className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-black transition"
                        >
                          Cancel Request
                        </button>
                      </>
                    )}

                    {/* Clear history for Cancelled or Completed visits */}
                    {(visit.status === 'CANCELLED' || visit.status === 'COMPLETED') && (
                      <button
                        onClick={() => handleClearVisit(visit.id)}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black transition flex items-center space-x-1"
                      >
                        <Trash2 size={13} />
                        <span>Clear Request</span>
                      </button>
                    )}
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
