import { useState, useEffect } from 'react';
import api from '../api';
import { Users, Plus, Phone, Calendar, Home, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Copy, Check, Trash2 } from 'lucide-react';

export default function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [rooms, setRooms] = useState([]);
  
  // Roster Register Form State
  const [showForm, setShowForm] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [phone, setPhone] = useState('');
  const [leaseStart, setLeaseStart] = useState('');
  const [leaseEnd, setLeaseEnd] = useState('');

  // Page States
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [expandedTenants, setExpandedTenants] = useState([]);
  const [copiedPhoneId, setCopiedPhoneId] = useState(null);

  const toggleExpandTenant = (id) => {
    if (expandedTenants.includes(id)) {
      setExpandedTenants(expandedTenants.filter(tId => tId !== id));
    } else {
      setExpandedTenants([...expandedTenants, id]);
    }
  };

  const handleDeleteTenant = async (id, name) => {
    setError('');
    setSuccess('');
    if (window.confirm(`Are you sure you want to unregister tenant "${name}"? This will mark them inactive and vacate their room bed.`)) {
      try {
        await api.delete(`/rentals/owner/tenants/${id}/`);
        setTenants(tenants.filter(t => t.id !== id));
        setSuccess(`Tenant "${name}" unregistered successfully!`);
      } catch (err) {
        console.error(err);
        setError("Failed to unregister tenant. Check your permissions.");
      }
    }
  };

  const getAvatarColor = (name) => {
    const colors = [
      'bg-amber-100 text-amber-800 border-amber-200',
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-emerald-100 text-emerald-800 border-emerald-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200',
      'bg-rose-100 text-rose-800 border-rose-200',
      'bg-teal-100 text-teal-800 border-teal-200'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  useEffect(() => {
    fetchTenantsAndProperties();
  }, []);

  const fetchTenantsAndProperties = async () => {
    setLoading(true);
    try {
      const [tenantsRes, propsRes] = await Promise.all([
        api.get('/rentals/owner/tenants/'),
        api.get('/rentals/properties/?owner=true')
      ]);
      setTenants(tenantsRes.data);
      setProperties(propsRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Dynamically load room choices when a property is chosen
  const handlePropertyChange = async (e) => {
    const propId = e.target.value;
    setSelectedProperty(propId);
    setSelectedRoom('');
    setRooms([]);

    if (!propId) return;

    try {
      const res = await api.get(`/rentals/properties/${propId}/`);
      setRooms(res.data.rooms || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegisterTenant = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFormLoading(true);

    try {
      const res = await api.post('/rentals/owner/tenants/', {
        property: selectedProperty,
        room: selectedRoom,
        tenant_name: tenantName,
        phone,
        lease_start: leaseStart,
        lease_end: leaseEnd || null
      });

      setTenants([res.data, ...tenants]);
      setSuccess("Tenant registered successfully and room occupied!");
      
      // Reset form
      setSelectedProperty('');
      setSelectedRoom('');
      setRooms([]);
      setTenantName('');
      setPhone('');
      setLeaseStart('');
      setLeaseEnd('');
      setShowForm(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to register tenant. Check room vacancy limits.");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Tenants Directory</h2>
          <p className="text-sm font-semibold text-slate-400 mt-1">Register tenant bookings, occupancy agreements and room configurations</p>
        </div>
        <button 
          onClick={() => { setShowForm(!showForm); setError(''); setSuccess(''); }}
          className="inline-flex items-center space-x-2 px-5 py-3 bg-amber-700 hover:bg-amber-800 text-white text-sm font-bold rounded-xl shadow-md transition"
        >
          <Plus size={16} />
          <span>Register Tenant</span>
        </button>
      </div>

      {/* Add Tenant Expandable Form */}
      {showForm && (
        <div className="bg-white border border-slate-100 p-6 sm:p-8 rounded-3xl shadow-md space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-800">New Tenant Registration</h3>
            <p className="text-xs font-semibold text-slate-400 mt-1">Fill in the fields to assign a tenant to an active room bed</p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 text-red-700 border border-red-100 text-sm font-semibold flex items-center space-x-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegisterTenant} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Property</label>
                <select
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-700 focus:bg-white transition"
                  value={selectedProperty}
                  onChange={handlePropertyChange}
                >
                  <option value="">-- Choose Property --</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Room</label>
                <select
                  required
                  disabled={!selectedProperty}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-700 focus:bg-white transition disabled:opacity-50"
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                >
                  <option value="">-- Choose Room --</option>
                  {rooms.map(r => {
                    const vacant = r.total_beds - r.occupied_beds;
                    return (
                      <option key={r.id} value={r.id} disabled={vacant <= 0}>
                        Room {r.room_number} ({r.room_type}) - {vacant} Vacant Beds
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tenant Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-700 focus:bg-white transition"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contact / Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 9988776655"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-700 focus:bg-white transition"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Lease Start Date</label>
                <input
                  type="date"
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-700 focus:bg-white transition"
                  value={leaseStart}
                  onChange={(e) => setLeaseStart(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Lease End Date (Optional)</label>
                <input
                  type="date"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-700 focus:bg-white transition"
                  value={leaseEnd}
                  onChange={(e) => setLeaseEnd(e.target.value)}
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-500 text-sm font-bold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="flex-1 py-3 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-sm font-bold shadow-md transition"
              >
                {formLoading ? 'Registering...' : 'Register Tenant'}
              </button>
            </div>
          </form>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 text-sm font-semibold flex items-center space-x-2">
          <CheckCircle2 size={16} />
          <span>{success}</span>
        </div>
      )}

      {/* Roster list Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 font-semibold">Loading tenant directory...</div>
      ) : tenants.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 font-semibold text-sm">
          No tenants currently registered. Fill out the registration form to list one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tenants.map(tenant => {
            const isExpanded = expandedTenants.includes(tenant.id);
            return (
              <div 
                key={tenant.id} 
                onClick={() => toggleExpandTenant(tenant.id)}
                className={`bg-white rounded-3xl border ${isExpanded ? 'border-amber-200 shadow-md ring-1 ring-amber-100/30' : 'border-slate-100 shadow-sm'} hover:shadow-md hover:border-slate-200 hover:scale-[1.01] cursor-pointer transition-all duration-300 p-6 flex flex-col justify-between space-y-3 relative overflow-hidden`}
              >
                {/* Collapsed top view */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`w-11 h-11 rounded-full border flex items-center justify-center font-extrabold text-base flex-shrink-0 shadow-inner ${getAvatarColor(tenant.tenant_name)}`}>
                      {tenant.tenant_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-slate-800 leading-tight truncate text-sm sm:text-base">
                        {tenant.tenant_name}
                      </h3>
                      <div className="flex items-center space-x-1.5 mt-1">
                        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-50 text-amber-800 border border-amber-100">
                          Room {tenant.room_number || 'N/A'}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400">
                          Occupant
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 text-[9px] font-black rounded bg-slate-100 text-slate-600 border border-slate-200 truncate max-w-[80px]" title={tenant.property_name}>
                      {tenant.property_name}
                    </span>
                    <button 
                      type="button"
                      className="text-slate-400 hover:text-slate-700 transition p-0.5 hover:bg-slate-50 rounded"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Expanded details view */}
                <div className={`transition-all duration-300 ease-in-out overflow-hidden space-y-3 ${isExpanded ? 'max-h-60 opacity-100 mt-2' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                  <div className="h-px bg-slate-100 my-1"></div>
                  <div className="space-y-2.5 text-xs font-semibold text-slate-600 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100 relative">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center min-w-0">
                        <Phone size={13} className="text-slate-400 mr-2 flex-shrink-0" />
                        <span className="truncate">Phone: {tenant.phone}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(tenant.phone);
                          setCopiedPhoneId(tenant.id);
                          setTimeout(() => setCopiedPhoneId(null), 2000);
                        }}
                        className="p-1 rounded bg-white text-slate-400 hover:text-amber-800 hover:border-amber-200 border border-slate-200 transition shadow-sm"
                        title="Copy Phone Number"
                      >
                        {copiedPhoneId === tenant.id ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                      </button>
                    </div>
                    
                    <div className="flex items-center">
                      <Calendar size={13} className="text-slate-400 mr-2" />
                      <span>Move-in: {tenant.lease_start}</span>
                    </div>

                    {tenant.lease_end && (
                      <div className="flex items-center">
                        <Calendar size={13} className="text-slate-400 mr-2" />
                        <span>Move-out: {tenant.lease_end}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex pt-1 justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTenant(tenant.id, tenant.tenant_name);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 text-xs font-bold transition flex items-center justify-center space-x-1.5"
                    >
                      <Trash2 size={12} />
                      <span>Unregister Tenant</span>
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
