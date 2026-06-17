import { useState, useEffect } from 'react';
import api from '../api';
import { AlertCircle, CheckCircle, Clock, FileWarning, Check } from 'lucide-react';

export default function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.get('/rentals/owner/complaints/');
      setComplaints(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await api.patch(`/rentals/owner/complaints/${id}/`, { status: newStatus });
      setComplaints(complaints.map(c => c.id === id ? res.data : c));
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RESOLVED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'IN_PROGRESS':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      default:
        return 'bg-red-50 text-red-800 border-red-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Support Tickets</h2>
          <p className="text-sm font-semibold text-slate-400 mt-1">Review maintenance issues, cleaning and structural complaints reported by tenants</p>
        </div>
        <button 
          onClick={fetchComplaints}
          className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400 font-semibold">Loading complaints logs...</div>
      ) : complaints.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 font-semibold text-sm">
          No maintenance tickets logged by tenants.
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map((c) => (
            <div 
              key={c.id} 
              className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-3">
                <div className="flex items-center space-x-2.5 flex-wrap">
                  <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded border ${getStatusBadge(c.status)}`}>
                    {c.status.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                    Tenant: {c.tenant_name} • {c.property_name}
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-800 text-lg leading-tight">{c.title}</h3>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">{c.description}</p>
              </div>

              {/* Action Toggles */}
              <div className="flex gap-2 flex-wrap items-center">
                {c.status !== 'IN_PROGRESS' && c.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleUpdateStatus(c.id, 'IN_PROGRESS')}
                    className="px-3.5 py-2 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 text-xs font-bold transition flex items-center space-x-1"
                  >
                    <Clock size={12} />
                    <span>Investigate</span>
                  </button>
                )}

                {c.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleUpdateStatus(c.id, 'RESOLVED')}
                    className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition flex items-center space-x-1"
                  >
                    <Check size={12} />
                    <span>Resolve</span>
                  </button>
                )}

                {c.status === 'RESOLVED' && (
                  <div className="text-xs font-bold text-slate-400 flex items-center space-x-1 p-2">
                    <CheckCircle size={14} className="text-emerald-500" />
                    <span>Closed</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
