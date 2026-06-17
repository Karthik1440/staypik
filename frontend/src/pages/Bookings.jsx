import { useState, useEffect } from 'react';
import api from '../api';
import { Calendar, MapPin, Clock, Phone, CheckCircle, Clock3, XCircle, Home, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Bookings() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

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
    if (!window.confirm("Are you sure you want to clear this visit request from your history?")) return;
    try {
      await api.delete(`/rentals/bookings/${visitId}/`);
      fetchHistory();
    } catch (err) {
      console.error("Failed to clear visit request:", err);
      alert(err.response?.data?.detail || "Failed to clear visit request.");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
            <CheckCircle size={12} />
            <span>Approved Visit</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
            <CheckCircle size={12} />
            <span>Completed Visit</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-red-700 border border-red-100">
            <XCircle size={12} />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
            <Clock3 size={12} />
            <span>Pending Host Approval</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Visit Requests</h2>
        <p className="text-sm font-semibold text-slate-400 mt-1">Keep track of your scheduled property inspection visits</p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400 font-semibold">Loading visits history...</div>
      ) : visits.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 font-semibold text-sm">
          You haven't scheduled any visit requests yet. Browse properties to schedule one!
        </div>
      ) : (
        <div className="space-y-4">
          {visits.map((visit) => (
            <div 
              key={visit.id} 
              className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-center space-x-2.5">
                  <h3 className="font-extrabold text-slate-800 text-lg leading-snug">{visit.property_name}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                    {visit.property_type}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs font-bold text-slate-500">
                  <div className="flex items-center">
                    <Calendar size={14} className="text-amber-700 mr-2" />
                    <span>{visit.visit_date}</span>
                  </div>
                  {visit.visit_time && (
                    <div className="flex items-center">
                      <Clock size={14} className="text-amber-700 mr-2" />
                      <span>{visit.visit_time}</span>
                    </div>
                  )}
                  <div className="flex items-center col-span-1 sm:col-span-2">
                    <Phone size={14} className="text-amber-700 mr-2" />
                    <span>Contact Phone: {visit.phone}</span>
                  </div>
                  {visit.room_number && (
                    <div className="flex items-center col-span-1 sm:col-span-2">
                      <Home size={14} className="text-amber-700 mr-2 flex-shrink-0" />
                      <span>Preferred Room: {visit.room_type} (Room {visit.room_number})</span>
                    </div>
                  )}
                  {user && visit.user_email && user.email !== visit.user_email && (
                    <div className="flex items-center col-span-1 sm:col-span-2">
                      <User size={14} className="text-amber-700 mr-2 flex-shrink-0" />
                      <span>Guest Email: {visit.user_email}</span>
                    </div>
                  )}
                </div>

                {visit.notes && (
                  <p className="text-xs italic text-slate-400 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    "{visit.notes}"
                  </p>
                )}
              </div>

              <div className="sm:text-right flex items-center sm:flex-col sm:justify-center sm:items-end flex-shrink-0 gap-2">
                {getStatusBadge(visit.status)}
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 block sm:text-right">
                  Requested {new Date(visit.created_at).toLocaleDateString()}
                </span>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-1.5 mt-2 justify-end">
                  {/* Owner Controls */}
                  {user && user.email !== visit.user_email && visit.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(visit.id, 'APPROVED')}
                        className="px-2.5 py-1 text-[11px] font-bold bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(visit.id, 'CANCELLED')}
                        className="px-2.5 py-1 text-[11px] font-bold bg-red-50 text-red-700 border border-red-100 rounded-lg hover:bg-red-100 transition"
                      >
                        Cancel
                      </button>
                    </>
                  )}

                  {user && user.email !== visit.user_email && visit.status === 'APPROVED' && (
                    <button
                      onClick={() => handleUpdateStatus(visit.id, 'CANCELLED')}
                      className="px-2.5 py-1 text-[11px] font-bold bg-red-50 text-red-700 border border-red-100 rounded-lg hover:bg-red-100 transition"
                    >
                      Cancel
                    </button>
                  )}

                  {user && user.email === visit.user_email && (visit.status === 'PENDING' || visit.status === 'APPROVED') && (
                    <button
                      onClick={() => handleUpdateStatus(visit.id, 'CANCELLED')}
                      className="px-2.5 py-1 text-[11px] font-bold bg-red-50 text-red-700 border border-red-100 rounded-lg hover:bg-red-100 transition"
                    >
                      Cancel
                    </button>
                  )}

                  {/* Clear option for Cancelled or Completed bookings */}
                  {(visit.status === 'CANCELLED' || visit.status === 'COMPLETED') && (
                    <button
                      onClick={() => handleClearVisit(visit.id)}
                      className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition"
                    >
                      Clear Request
                    </button>
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
