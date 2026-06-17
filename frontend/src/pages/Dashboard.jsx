import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Building, Home, Bed, UserCheck, AlertOctagon, FileText, Plus, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  const fetchDashboardMetrics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/rentals/owner/dashboard/');
      setMetrics(res.data);
    } catch (e) {
      console.error("Failed to load dashboard metrics:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-24 text-slate-400 font-semibold">Loading dashboard...</div>;

  const {
    total_properties, total_rooms, total_beds, occupied_beds, vacant_beds, active_tenants, due_rent_count
  } = metrics || {};

  const cards = [
    { label: 'Total Properties', value: total_properties, icon: Building, color: 'text-blue-600 bg-blue-50 border-blue-100' },
    { label: 'Total Rooms', value: total_rooms, icon: Home, color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { label: 'Total Beds', value: total_beds, icon: Bed, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
    { label: 'Occupied Beds', value: occupied_beds, icon: UserCheck, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    { label: 'Vacant Beds', value: vacant_beds, icon: Bed, color: 'text-teal-600 bg-teal-50 border-teal-100' },
    { label: 'Active Tenants', value: active_tenants, icon: UserCheck, color: 'text-purple-600 bg-purple-50 border-purple-100' },
    { label: 'Due Rent Count', value: due_rent_count, icon: FileText, color: due_rent_count > 0 ? 'text-amber-800 bg-amber-50 border-amber-200' : 'text-slate-500 bg-slate-50 border-slate-100' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Host Dashboard</h2>
          <p className="text-sm font-semibold text-slate-400 mt-1">Hello, {user?.displayName}. Here's the performance of your PG rentals.</p>
        </div>
        <div className="flex gap-2">
          <Link 
            to="/properties/new" 
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <Plus size={14} />
            <span>Add Property</span>
          </Link>
          <button 
            onClick={fetchDashboardMetrics} 
            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Metrics Card Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {cards.map((c, idx) => {
          const Icon = c.icon;
          return (
            <div 
              key={idx} 
              className={`bg-white rounded-3xl p-5 border shadow-sm flex flex-col justify-between h-36 ${c.color.split(' ').slice(2).join(' ')}`}
            >
              <div className="flex justify-between items-start">
                <span className="text-xs sm:text-sm font-bold text-slate-500 max-w-[120px]">{c.label}</span>
                <div className={`p-2 rounded-xl border ${c.color.split(' ').slice(0, 2).join(' ')}`}>
                  <Icon size={18} />
                </div>
              </div>
              <span className="text-3xl font-black text-slate-800 mt-4">{c.value !== undefined ? c.value : 0}</span>
            </div>
          );
        })}
      </div>

      {/* Quick Actions Portal */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <h3 className="font-extrabold text-slate-800 text-lg">Quick Host Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link 
            to="/tenants" 
            className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 hover:bg-slate-100/60 border border-slate-100 transition group"
          >
            <div>
              <h4 className="font-bold text-slate-700 text-sm">Tenant Registration</h4>
              <p className="text-xs text-slate-400 font-semibold mt-1">Register new tenant bookings</p>
            </div>
            <ArrowRight size={16} className="text-slate-400 group-hover:text-amber-700 transition transform group-hover:translate-x-1" />
          </Link>

          <Link 
            to="/rent" 
            className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 hover:bg-slate-100/60 border border-slate-100 transition group"
          >
            <div>
              <h4 className="font-bold text-slate-700 text-sm">Log Rent Payments</h4>
              <p className="text-xs text-slate-400 font-semibold mt-1">Track monthly rental invoices</p>
            </div>
            <ArrowRight size={16} className="text-slate-400 group-hover:text-amber-700 transition transform group-hover:translate-x-1" />
          </Link>

          <Link 
            to="/bookings" 
            className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 hover:bg-slate-100/60 border border-slate-100 transition group"
          >
            <div>
              <h4 className="font-bold text-slate-700 text-sm">Visit Requests</h4>
              <p className="text-xs text-slate-400 font-semibold mt-1">Check pending property visits</p>
            </div>
            <ArrowRight size={16} className="text-slate-400 group-hover:text-amber-700 transition transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
