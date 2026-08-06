import { useState, useEffect } from 'react';
import api from '../api';
import { 
  Users, Plus, Phone, Calendar, Home, CheckCircle2, AlertCircle, 
  ChevronDown, ChevronUp, Copy, Check, Trash2, Search, Building2, DoorOpen, DollarSign, MessageSquare
} from 'lucide-react';

export default function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [rooms, setRooms] = useState([]);
  
  // Register Form State
  const [showForm, setShowForm] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [phone, setPhone] = useState('');
  const [leaseStart, setLeaseStart] = useState('');
  const [leaseEnd, setLeaseEnd] = useState('');

  // Page & Search States
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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
      'bg-indigo-100 text-indigo-900 border-indigo-200',
      'bg-blue-100 text-blue-900 border-blue-200',
      'bg-emerald-100 text-emerald-900 border-emerald-200',
      'bg-amber-100 text-amber-900 border-amber-200',
      'bg-purple-100 text-purple-900 border-purple-200',
      'bg-rose-100 text-rose-900 border-rose-200'
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

  // Filter tenants by name, room number, or property
  const filteredTenants = tenants.filter(t => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = t.tenant_name?.toLowerCase().includes(q);
    const roomMatch = String(t.room_number || '').toLowerCase().includes(q);
    const propMatch = t.property_name?.toLowerCase().includes(q);
    const phoneMatch = t.phone?.toLowerCase().includes(q);
    return nameMatch || roomMatch || propMatch || phoneMatch;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tenants Directory</h1>
          <p className="text-xs font-semibold text-slate-400 mt-1">Register tenant bookings, occupancy agreements and room configurations</p>
        </div>
        <button 
          onClick={() => { setShowForm(!showForm); setError(''); setSuccess(''); }}
          className="inline-flex items-center space-x-2 px-5 py-3 bg-amber-700 hover:bg-amber-800 text-white text-xs font-black rounded-2xl shadow-md transition"
        >
          <Plus size={16} />
          <span>Register Tenant</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search tenant by name, room number (e.g. Room 101), or property..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200/90 rounded-2xl text-xs font-bold text-slate-800 shadow-xs focus:ring-2 focus:ring-amber-500 focus:outline-none transition placeholder-slate-400"
        />
      </div>

      {/* Add Tenant Expandable Form */}
      {showForm && (
        <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl shadow-md space-y-6 animate-scaleIn">
          <div>
            <h3 className="text-lg font-black text-slate-900">New Tenant Registration</h3>
            <p className="text-xs font-semibold text-slate-400 mt-1">Fill in the fields to assign a tenant to an active room bed</p>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-red-50 text-red-700 border border-red-200 text-xs font-bold flex items-center space-x-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegisterTenant} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">Select Property *</label>
                <select
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                  value={selectedProperty}
                  onChange={handlePropertyChange}
                >
                  <option value="">-- Choose Property --</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.city})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">Select Room *</label>
                <select
                  required
                  disabled={!selectedProperty}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition disabled:opacity-50"
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
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">Tenant Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">Contact / Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 9988776655"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">Lease Start Date *</label>
                <input
                  type="date"
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                  value={leaseStart}
                  onChange={(e) => setLeaseStart(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">Lease End Date (Optional)</label>
                <input
                  type="date"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                  value={leaseEnd}
                  onChange={(e) => setLeaseEnd(e.target.value)}
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 text-xs font-extrabold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="flex-1 py-3 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-extrabold shadow-md transition disabled:opacity-50"
              >
                {formLoading ? 'Registering...' : 'Register Tenant'}
              </button>
            </div>
          </form>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-extrabold flex items-center space-x-2">
          <CheckCircle2 size={16} />
          <span>{success}</span>
        </div>
      )}

      {/* TENANT CARDS GRID */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 font-bold text-xs">Loading tenant directory...</div>
      ) : filteredTenants.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 font-bold text-xs">
          {searchQuery ? `No tenant found matching "${searchQuery}"` : 'No tenants currently registered. Click "+ Register Tenant" above.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTenants.map(tenant => {
            const isExpanded = expandedTenants.includes(tenant.id);
            return (
              <div 
                key={tenant.id} 
                className={`bg-white rounded-3xl border ${
                  isExpanded ? 'border-amber-400 shadow-md ring-2 ring-amber-500/10' : 'border-slate-200/80 shadow-xs'
                } hover:shadow-md hover:border-amber-300 transition-all duration-200 p-5 space-y-3 relative overflow-hidden`}
              >
                {/* Top Header Row (Avatar, Tenant Name, Room # Pill, Property Pill & Expand Button) */}
                <div 
                  onClick={() => toggleExpandTenant(tenant.id)}
                  className="flex items-start justify-between cursor-pointer group"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center font-black text-lg flex-shrink-0 shadow-xs ${getAvatarColor(tenant.tenant_name)}`}>
                      {tenant.tenant_name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-extrabold text-slate-900 leading-tight truncate text-base group-hover:text-amber-800 transition">
                        {tenant.tenant_name}
                      </h3>
                      
                      {/* Prominent Room Number Badge */}
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="px-2.5 py-0.5 text-xs font-black rounded-lg bg-amber-100/90 text-amber-900 border border-amber-200/90 shadow-xs flex items-center space-x-1">
                          <span>Room</span>
                          <span className="font-black">{tenant.room_number || 'N/A'}</span>
                        </span>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                          Occupant
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <span className="px-2.5 py-1 text-[11px] font-extrabold rounded-xl bg-slate-100 text-slate-700 border border-slate-200 truncate max-w-[100px]" title={tenant.property_name}>
                      {tenant.property_name}
                    </span>
                    <button 
                      type="button"
                      className="text-slate-400 group-hover:text-amber-800 transition p-1 rounded-lg hover:bg-slate-100"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* EXPANDED TENANT DETAILS PANEL */}
                <div className={`transition-all duration-300 ease-in-out overflow-hidden space-y-3 ${isExpanded ? 'max-h-96 opacity-100 pt-2 border-t border-slate-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                  
                  {/* Property & Room Details Info */}
                  <div className="space-y-2 text-xs font-bold text-slate-700 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70">
                    
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center space-x-1.5">
                        <Building2 size={13} className="text-amber-700" />
                        <span>Property:</span>
                      </span>
                      <span className="font-extrabold text-slate-900">{tenant.property_name}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center space-x-1.5">
                        <DoorOpen size={13} className="text-amber-700" />
                        <span>Room / Unit:</span>
                      </span>
                      <span className="font-black text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded-md border border-amber-200">
                        Room {tenant.room_number} {tenant.room_type ? `(${tenant.room_type})` : ''}
                      </span>
                    </div>

                    {tenant.monthly_rent && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center space-x-1.5">
                          <DollarSign size={13} className="text-amber-700" />
                          <span>Monthly Rent:</span>
                        </span>
                        <span className="font-black text-amber-800">₹{Number(tenant.monthly_rent).toLocaleString()}/mo</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                      <span className="text-slate-400 flex items-center space-x-1.5">
                        <Phone size={13} className="text-slate-400" />
                        <span>Contact Phone:</span>
                      </span>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-extrabold text-slate-900">{tenant.phone}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(tenant.phone);
                            setCopiedPhoneId(tenant.id);
                            setTimeout(() => setCopiedPhoneId(null), 2000);
                          }}
                          className="p-1 rounded bg-white text-slate-400 hover:text-amber-800 hover:border-amber-300 border border-slate-200 transition shadow-xs"
                          title="Copy Phone Number"
                        >
                          {copiedPhoneId === tenant.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center space-x-1.5">
                        <Calendar size={13} className="text-slate-400" />
                        <span>Lease Start:</span>
                      </span>
                      <span className="font-extrabold text-slate-900">{tenant.lease_start}</span>
                    </div>

                    {tenant.lease_end && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center space-x-1.5">
                          <Calendar size={13} className="text-slate-400" />
                          <span>Lease End:</span>
                        </span>
                        <span className="font-extrabold text-slate-900">{tenant.lease_end}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar (Unregister button) */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTenant(tenant.id, tenant.tenant_name);
                      }}
                      className="w-full px-3 py-2.5 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-200/80 text-xs font-black transition flex items-center justify-center space-x-1.5"
                    >
                      <Trash2 size={13} />
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
