import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, Plus, Pencil, Trash2, Home, CheckCircle2, AlertCircle, DoorOpen, Minus, Building } from 'lucide-react';

export default function RoomTypes() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [allProperties, setAllProperties] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [roomType, setRoomType] = useState('Single');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [roomDeposit, setRoomDeposit] = useState('');
  const [vacantBeds, setVacantBeds] = useState(1);
  const [totalBeds, setTotalBeds] = useState(1);
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [furnishing, setFurnishing] = useState('Semi-Furnished');
  const [bathroom, setBathroom] = useState('1');
  const [balcony, setBalcony] = useState('0');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProperty();
    } else {
      fetchAllProperties();
    }
  }, [id]);

  const fetchAllProperties = async () => {
    setLoading(true);
    try {
      const res = await api.get('/rentals/properties/?owner=true');
      const list = res.data || [];
      setAllProperties(list);
      if (list.length > 0) {
        navigate(`/properties/${list[0].id}/rooms`, { replace: true });
      } else {
        setError("No properties found to manage room vacancies.");
      }
    } catch (e) {
      console.error(e);
      setError("Failed to load properties list.");
    } finally {
      setLoading(false);
    }
  };

  const fetchProperty = async () => {
    setLoading(true);
    try {
      const [propRes, allPropsRes] = await Promise.all([
        api.get(`/rentals/properties/${id}/`),
        api.get('/rentals/properties/?owner=true')
      ]);
      setProperty(propRes.data);
      setRooms(propRes.data.rooms || []);
      setAllProperties(allPropsRes.data || []);
      if (propRes.data.property_type === 'Apartment') {
        setRoomType('1 BHK');
      }
    } catch (e) {
      console.error(e);
      setError("Failed to load property details.");
    } finally {
      setLoading(false);
    }
  };

  // Quick Direct Vacancy Control (+ / - buttons on cards)
  const handleQuickVacantChange = async (room, delta) => {
    setError('');
    setSuccess('');
    const isApartment = property?.property_type === 'Apartment';
    const currentVacant = Math.max(0, (room.total_beds || 1) - (room.occupied_beds || 0));
    const newVacant = Math.max(0, currentVacant + delta);
    const updatedTotalBeds = Math.max(newVacant, room.total_beds || 1);
    const newOccupied = Math.max(0, updatedTotalBeds - newVacant);

    const payload = {
      ...room,
      total_beds: updatedTotalBeds,
      occupied_beds: newOccupied
    };

    try {
      const res = await api.put(`/rentals/properties/${id}/rooms/${room.id}/`, payload);
      setRooms(rooms.map(r => r.id === room.id ? res.data : r));
      setSuccess(`Updated ${room.room_type}: ${newVacant} ${isApartment ? 'unit' : 'bed'}${newVacant !== 1 ? 's' : ''} vacant`);
    } catch (err) {
      console.error(err);
      setError("Failed to update vacancy.");
    }
  };

  // Quick Mark Full / Mark Available Toggle
  const handleQuickToggleStatus = async (room) => {
    setError('');
    setSuccess('');
    const isApartment = property?.property_type === 'Apartment';
    const currentVacant = Math.max(0, (room.total_beds || 1) - (room.occupied_beds || 0));
    const newVacant = currentVacant > 0 ? 0 : 1;
    const updatedTotalBeds = Math.max(1, room.total_beds || 1);
    const newOccupied = Math.max(0, updatedTotalBeds - newVacant);

    const payload = {
      ...room,
      total_beds: updatedTotalBeds,
      occupied_beds: newOccupied
    };

    try {
      const res = await api.put(`/rentals/properties/${id}/rooms/${room.id}/`, payload);
      setRooms(rooms.map(r => r.id === room.id ? res.data : r));
      setSuccess(`Marked ${room.room_type} as ${newVacant > 0 ? 'Available' : 'Full'}`);
    } catch (err) {
      console.error(err);
      setError("Failed to update status.");
    }
  };

  const handleAddOrUpdateRoom = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!monthlyRent) {
      alert("Monthly rent is required.");
      return;
    }

    setSubmitting(true);

    const isApartment = property?.property_type === 'Apartment';
    const totalBedsCount = isApartment ? 1 : Math.max(1, totalBeds);
    const vacantCount = isApartment ? 1 : Math.max(0, vacantBeds);
    const occupiedCount = Math.max(0, totalBedsCount - vacantCount);

    const payload = {
      room_number: `${roomType} Option`,
      room_type: roomType,
      total_beds: totalBedsCount,
      occupied_beds: occupiedCount,
      monthly_rent: monthlyRent,
      deposit: roomDeposit || 0,
      furnishing: isApartment ? furnishing : '',
      bathroom: isApartment ? bathroom : '',
      balcony: isApartment ? balcony : ''
    };

    try {
      if (editingRoomId) {
        const res = await api.put(`/rentals/properties/${id}/rooms/${editingRoomId}/`, payload);
        setRooms(rooms.map(r => r.id === editingRoomId ? res.data : r));
        setSuccess("Room option updated!");
        setEditingRoomId(null);
      } else {
        const res = await api.post(`/rentals/properties/${id}/rooms/`, payload);
        setRooms([...rooms, res.data]);
        setSuccess("Room option added!");
      }

      // Reset form
      setRoomType(isApartment ? '1 BHK' : 'Single');
      setMonthlyRent('');
      setRoomDeposit('');
      setVacantBeds(1);
      setTotalBeds(1);
      setFurnishing('Semi-Furnished');
      setBathroom('1');
      setBalcony('0');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to save room option.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (room) => {
    setEditingRoomId(room.id);
    setRoomType(room.room_type || 'Single');
    setMonthlyRent(room.monthly_rent);
    setRoomDeposit(room.deposit || '');
    const total = room.total_beds || 1;
    const occupied = room.occupied_beds || 0;
    setTotalBeds(total);
    setVacantBeds(Math.max(0, total - occupied));
    setFurnishing(room.furnishing || 'Semi-Furnished');
    setBathroom(room.bathroom || '1');
    setBalcony(room.balcony || '0');
  };

  const handleCancelEdit = () => {
    setEditingRoomId(null);
    setRoomType(property?.property_type === 'Apartment' ? '1 BHK' : 'Single');
    setMonthlyRent('');
    setRoomDeposit('');
    setVacantBeds(1);
    setTotalBeds(1);
    setFurnishing('Semi-Furnished');
    setBathroom('1');
    setBalcony('0');
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm("Are you sure you want to delete this room option?")) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/rentals/properties/${id}/rooms/${roomId}/`);
      setRooms(rooms.filter(r => r.id !== roomId));
      setSuccess("Room option deleted!");
      if (editingRoomId === roomId) {
        handleCancelEdit();
      }
    } catch (err) {
      console.error(err);
      setError("Failed to delete room option.");
    }
  };

  if (loading) {
    return <div className="text-center py-24 text-slate-400 font-semibold">Loading room options...</div>;
  }

  if (!property) {
    return <div className="text-center py-24 text-slate-400 font-semibold">Property not found.</div>;
  }

  const isApartment = property.property_type === 'Apartment';
  const totalVacantSum = rooms.reduce((acc, r) => acc + Math.max(0, (r.total_beds || 1) - (r.occupied_beds || 0)), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn text-left">
      {/* Top Header with Property Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div className="space-y-1">
          <button 
            onClick={() => navigate('/properties')}
            className="inline-flex items-center space-x-2 text-xs font-bold text-slate-500 hover:text-amber-700 transition mb-1"
          >
            <ArrowLeft size={16} />
            <span>Back to My Properties</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center space-x-2">
            <DoorOpen size={28} className="text-amber-700" />
            <span>Manage Room Vacancies & Rents</span>
          </h1>

          {/* Property Selector Dropdown */}
          {allProperties.length > 0 && (
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold text-slate-500 flex items-center">
                <Building size={14} className="mr-1 text-amber-700" />
                Select Property:
              </span>
              <select
                value={id}
                onChange={(e) => navigate(`/properties/${e.target.value}/rooms`)}
                className="bg-amber-50/90 border border-amber-200 rounded-xl px-3 py-1.5 text-xs font-black text-slate-800 outline-none focus:ring-2 focus:ring-amber-700 cursor-pointer shadow-2xs"
              >
                {allProperties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.locality || p.city})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-2xl text-left">
            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">Live Vacancy</span>
            <span className="text-sm font-black text-emerald-900">
              {totalVacantSum} {isApartment ? 'Flats' : 'Beds'} Vacant
            </span>
          </div>
          <Link
            to={`/properties/edit/${id}`}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition shadow-xs flex items-center space-x-1.5"
          >
            <Pencil size={14} />
            <span>Edit Details</span>
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-bold flex items-center space-x-2 animate-fadeIn">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-xs font-bold flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 size={16} className="flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form to Add/Full Edit (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-5">
          <div>
            <h3 className="text-base font-black text-slate-800 flex items-center">
              <Plus size={18} className="text-amber-700 mr-2" />
              <span>{editingRoomId ? 'Edit Room Type Details' : 'Add New Room Type'}</span>
            </h3>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              Add a new room configuration option or edit rent & capacity
            </p>
          </div>

          <form onSubmit={handleAddOrUpdateRoom} className="space-y-4 pt-3 border-t border-slate-50">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {isApartment ? 'BHK / Flat Type' : 'Sharing / Room Type'}
              </label>
              <select
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-700 focus:bg-white transition"
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
              >
                {isApartment ? (
                  <>
                    <option value="1 BHK">1 BHK</option>
                    <option value="2 BHK">2 BHK</option>
                    <option value="3 BHK">3 BHK</option>
                    <option value="4 BHK">4 BHK</option>
                    <option value="1 RK">1 RK</option>
                    <option value="Studio">Studio</option>
                  </>
                ) : (
                  <>
                    <option value="Single">Single Sharing</option>
                    <option value="Double Sharing">Double Sharing</option>
                    <option value="Triple Sharing">Triple Sharing</option>
                    <option value="Quad Sharing">Quad Sharing</option>
                  </>
                )}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Monthly Rent (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 8000"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-700 focus:bg-white transition"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Deposit (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 2000"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-700 focus:bg-white transition"
                  value={roomDeposit}
                  onChange={(e) => setRoomDeposit(e.target.value)}
                />
              </div>
            </div>

            {isApartment ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Furnishing</label>
                  <select
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-700 focus:bg-white transition"
                    value={furnishing}
                    onChange={(e) => setFurnishing(e.target.value)}
                  >
                    <option value="Fully Furnished">Fully Furnished</option>
                    <option value="Semi-Furnished">Semi-Furnished</option>
                    <option value="Unfurnished">Unfurnished</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Bathroom</label>
                    <select
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-700 focus:bg-white transition"
                      value={bathroom}
                      onChange={(e) => setBathroom(e.target.value)}
                    >
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="Shared">Shared</option>
                      <option value="Attached">Attached</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Balcony</label>
                    <select
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-700 focus:bg-white transition"
                      value={balcony}
                      onChange={(e) => setBalcony(e.target.value)}
                    >
                      <option value="0">0</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3+">3+</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Vacant Beds</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-700 focus:bg-white transition"
                    value={vacantBeds}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setVacantBeds(val);
                      if (val > totalBeds) setTotalBeds(val);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Total Capacity</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-700 focus:bg-white transition"
                    value={totalBeds}
                    onChange={(e) => setTotalBeds(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
            )}

            <div className="flex space-x-2 pt-2">
              {editingRoomId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition flex items-center justify-center"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-black shadow-sm transition flex items-center justify-center space-x-1.5"
              >
                <Plus size={16} />
                <span>{submitting ? 'Saving...' : (editingRoomId ? 'Update Option' : 'Add Room Option')}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Quick Easy Management Cards Roster (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-black text-slate-800">Owner Quick Control Panel</h3>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                  Tap <span className="text-emerald-700 font-bold">+ / -</span> to instantly update vacant beds without opening form
                </p>
              </div>
              <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-extrabold">
                {rooms.length} {rooms.length === 1 ? 'Option' : 'Options'}
              </span>
            </div>

            {rooms.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 font-semibold text-xs space-y-2">
                <DoorOpen size={32} className="mx-auto text-slate-300" />
                <p>No room options added yet. Fill out the form on the left to add your first room option!</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {rooms.map((room) => {
                  const vacantCount = Math.max(0, (room.total_beds || 1) - (room.occupied_beds || 0));
                  return (
                    <div 
                      key={room.id} 
                      className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 hover:border-amber-200 transition space-y-3"
                    >
                      {/* Top Row: Room Type Name, Rent & Main Controls */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2.5">
                            <span className="text-lg font-black text-slate-800">{room.room_type}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                              vacantCount > 0 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {vacantCount > 0 ? `${vacantCount} ${isApartment ? 'unit' : 'bed'}${vacantCount > 1 ? 's' : ''} vacant` : 'Full'}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-400">
                            Rent: <span className="font-extrabold text-amber-700">₹{Number(room.monthly_rent).toLocaleString()}/mo</span>
                            {room.deposit > 0 && ` • Deposit: ₹${Number(room.deposit).toLocaleString()}`}
                            {room.total_beds && ` • Capacity: ${room.total_beds} beds`}
                          </p>
                        </div>

                        {/* Action Icons */}
                        <div className="flex items-center space-x-1.5 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleEditClick(room)}
                            className="p-2 rounded-xl text-slate-400 hover:text-amber-700 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition"
                            title="Edit Room Option"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRoom(room.id)}
                            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition"
                            title="Delete Room Option"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Bottom Control Bar: Direct 1-Tap Vacancy Controls */}
                      <div className="pt-3 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2.5">
                        
                        {/* Instant Vacancy Stepper */}
                        <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                          <span className="text-[11px] font-extrabold text-slate-500 mr-1">Quick Vacancy:</span>
                          <button
                            type="button"
                            onClick={() => handleQuickVacantChange(room, -1)}
                            disabled={vacantCount <= 0}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-black text-sm flex items-center justify-center transition active:scale-95 disabled:opacity-40 disabled:hover:bg-slate-100"
                            title="Decrease vacant beds by 1"
                          >
                            <Minus size={14} />
                          </button>

                          <span className="text-xs font-black text-slate-900 min-w-[65px] text-center">
                            {vacantCount} {isApartment ? 'Unit' : 'Bed'}{vacantCount !== 1 ? 's' : ''}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleQuickVacantChange(room, 1)}
                            className="w-7 h-7 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-black text-sm flex items-center justify-center transition active:scale-95 shadow-2xs"
                            title="Increase vacant beds by 1"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        {/* Instant Toggle Mark Full / Mark Available */}
                        <button
                          type="button"
                          onClick={() => handleQuickToggleStatus(room)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition border shadow-2xs active:scale-95 ${
                            vacantCount > 0
                              ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {vacantCount > 0 ? '● Mark as Full' : '✓ Mark as Available'}
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
