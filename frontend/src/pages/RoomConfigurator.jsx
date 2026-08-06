import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { 
  Building2, Layers, DoorOpen, Bed, Plus, Edit2, Trash2, ArrowLeft, 
  ChevronRight, ChevronDown, Search, MoreVertical, Users, User, CheckCircle2,
  Sparkles, RefreshCw, UserPlus, X, BarChart3, LayoutGrid, ListTree, SlidersHorizontal
} from 'lucide-react';

export default function RoomConfigurator() {
  const { id } = useParams();
  const navigate = useNavigate();

  // State
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState(id || '');
  const [configData, setConfigData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tree'); // 'tree' or 'cards'
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFloors, setExpandedFloors] = useState({});
  const [expandedRooms, setExpandedRooms] = useState({});

  // Room Modal State
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formFloor, setFormFloor] = useState(1);
  const [formRoomNumber, setFormRoomNumber] = useState('');
  const [formRoomType, setFormRoomType] = useState('Double');
  const [formTotalBeds, setFormTotalBeds] = useState(2);
  const [formOccupiedBeds, setFormOccupiedBeds] = useState(0);
  const [formMonthlyRent, setFormMonthlyRent] = useState('');
  const [formDeposit, setFormDeposit] = useState('');
  const [formFurnishing, setFormFurnishing] = useState('Fully-Furnished');
  const [formBathroom, setFormBathroom] = useState('Attached');
  const [formBalcony, setFormBalcony] = useState('Yes');
  const [savingRoom, setSavingRoom] = useState(false);
  const [modalError, setModalError] = useState('');

  // Fetch owner's properties list on mount
  useEffect(() => {
    fetchPropertiesList();
  }, []);

  // Fetch configurator data when property selection changes
  useEffect(() => {
    if (selectedPropertyId) {
      fetchConfiguratorData(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  const fetchPropertiesList = async () => {
    try {
      const res = await api.get('/rentals/properties/?owner=true');
      const props = res.data || [];
      setProperties(props);

      if (props.length > 0) {
        const initialId = id && props.some(p => String(p.id) === String(id)) 
          ? id 
          : props[0].id;
        setSelectedPropertyId(initialId);
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const fetchConfiguratorData = async (propId) => {
    setLoading(true);
    try {
      const res = await api.get(`/rentals/properties/${propId}/room-config/`);
      setConfigData(res.data);
      
      if (res.data && res.data.floors) {
        const floorsExpand = {};
        const roomsExpand = {};
        res.data.floors.forEach((f) => {
          floorsExpand[f.floor_number] = true;
          f.rooms.forEach(r => {
            roomsExpand[r.id] = true;
          });
        });
        setExpandedFloors(floorsExpand);
        setExpandedRooms(roomsExpand);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleFloorExpand = (floorNum) => {
    setExpandedFloors(prev => ({ ...prev, [floorNum]: !prev[floorNum] }));
  };

  const toggleRoomExpand = (roomId) => {
    setExpandedRooms(prev => ({ ...prev, [roomId]: !prev[roomId] }));
  };

  const openAddRoomModal = (floorNum = 1) => {
    setEditingRoom(null);
    setFormFloor(floorNum);
    setFormRoomNumber('');
    setFormRoomType('Double');
    setFormTotalBeds(2);
    setFormOccupiedBeds(0);
    setFormMonthlyRent(configData?.property?.base_rent || '');
    setFormDeposit('');
    setFormFurnishing('Fully-Furnished');
    setFormBathroom('Attached');
    setFormBalcony('Yes');
    setModalError('');
    setShowRoomModal(true);
  };

  const openEditRoomModal = (room) => {
    setEditingRoom(room);
    setFormFloor(room.floor || 1);
    setFormRoomNumber(room.room_number);
    setFormRoomType(room.room_type);
    setFormTotalBeds(room.total_beds);
    setFormOccupiedBeds(room.occupied_beds);
    setFormMonthlyRent(room.monthly_rent);
    setFormDeposit(room.deposit || '');
    setFormFurnishing(room.furnishing || 'Fully-Furnished');
    setFormBathroom(room.bathroom || 'Attached');
    setFormBalcony(room.balcony || 'Yes');
    setModalError('');
    setShowRoomModal(true);
  };

  const handleSaveRoom = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!formRoomNumber || !formMonthlyRent) {
      setModalError('Room Number and Monthly Rent are mandatory.');
      return;
    }

    setSavingRoom(true);
    const roomPayload = {
      floor: formFloor,
      room_number: formRoomNumber,
      room_type: formRoomType,
      total_beds: formTotalBeds,
      occupied_beds: formOccupiedBeds,
      monthly_rent: formMonthlyRent,
      deposit: formDeposit || 0,
      furnishing: formFurnishing,
      bathroom: formBathroom,
      balcony: formBalcony
    };

    try {
      if (editingRoom) {
        await api.put(`/rentals/properties/${selectedPropertyId}/rooms/${editingRoom.id}/`, roomPayload);
      } else {
        await api.post(`/rentals/properties/${selectedPropertyId}/rooms/`, roomPayload);
      }
      setShowRoomModal(false);
      fetchConfiguratorData(selectedPropertyId);
    } catch (err) {
      console.error(err);
      setModalError(err.response?.data?.detail || 'Failed to save room details.');
    } finally {
      setSavingRoom(false);
    }
  };

  const handleDeleteRoom = async (roomId, roomNumber) => {
    if (window.confirm(`Are you sure you want to delete Room ${roomNumber}?`)) {
      try {
        await api.delete(`/rentals/properties/${selectedPropertyId}/rooms/${roomId}/`);
        fetchConfiguratorData(selectedPropertyId);
      } catch (err) {
        console.error(err);
        alert('Failed to delete room. Please check active tenancy attachments.');
      }
    }
  };

  const handlePropertyChange = (newPropId) => {
    setSelectedPropertyId(newPropId);
    navigate(`/properties/${newPropId}/rooms`);
  };

  // Search filter logic
  const filterFloors = (floors) => {
    if (!searchQuery.trim()) return floors;
    const q = searchQuery.toLowerCase();

    return floors.map(floor => {
      const matchingRooms = floor.rooms.filter(room => {
        const matchRoomNum = room.room_number.toLowerCase().includes(q);
        const matchRoomType = room.room_type.toLowerCase().includes(q);
        const matchTenant = room.beds.some(bed => bed.tenant_name && bed.tenant_name.toLowerCase().includes(q));
        return matchRoomNum || matchRoomType || matchTenant;
      });

      return {
        ...floor,
        rooms: matchingRooms
      };
    }).filter(floor => floor.rooms.length > 0);
  };

  const filteredFloors = configData?.floors ? filterFloors(configData.floors) : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-fadeIn font-sans">
      
      {/* Top Header & Property Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center space-x-3">
          <Link to="/properties" className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition shrink-0">
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5 sm:space-x-2 text-[10px] sm:text-xs font-bold text-amber-700 uppercase tracking-wider truncate">
              <span>Host Console</span>
              <span>/</span>
              <span>Room & Bed Configurator</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 mt-0.5 truncate">
              <Building2 size={22} className="text-amber-700 shrink-0" />
              <span className="truncate">{configData?.property?.name || 'Property Configurator'}</span>
            </h1>
          </div>
        </div>

        {properties.length > 0 && (
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-500 hidden sm:inline shrink-0">Active Property:</span>
            <select
              value={selectedPropertyId}
              onChange={(e) => handlePropertyChange(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
            >
              {properties.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.city})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* TABS HEADER BAR & SEARCH INPUT */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 sm:px-5 sm:py-3 rounded-2xl border border-slate-200/80 shadow-xs">
        
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('tree')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center space-x-2 transition ${
              activeTab === 'tree' 
                ? 'bg-amber-700 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ListTree size={15} />
            <span>Tree Hierarchy</span>
          </button>

          <button
            onClick={() => setActiveTab('cards')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center space-x-2 transition ${
              activeTab === 'cards' 
                ? 'bg-amber-700 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <LayoutGrid size={15} />
            <span>Floor Cards</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search rooms or tenant name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition placeholder-slate-400"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="animate-spin text-amber-700" size={30} />
          <span className="text-xs font-bold text-slate-500">Loading Property Architecture...</span>
        </div>
      ) : !configData || properties.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 font-semibold space-y-4">
          <p className="text-base text-slate-700 font-extrabold">No active properties available.</p>
          <Link
            to="/properties/new"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md hover:bg-amber-800 transition"
          >
            <Plus size={16} />
            <span>Add Property First</span>
          </Link>
        </div>
      ) : (
        <>
          {activeTab === 'tree' ? (
            /* PROFESSIONAL TREE HIERARCHY (NO EMOJIS) */
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs p-3 sm:p-6 space-y-5">
              
              {/* PROPERTY ROOT CARD */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="p-2.5 bg-amber-700 text-white rounded-xl shadow-xs shrink-0">
                    <Building2 size={20} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm sm:text-base font-black text-slate-900 truncate">
                      Property ({configData.property.name})
                    </h2>
                    <p className="text-[11px] sm:text-xs font-semibold text-slate-500 mt-0.5 truncate">
                      {configData.property.locality}, {configData.property.city}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                  <button
                    onClick={() => openAddRoomModal(1)}
                    className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1"
                  >
                    <Plus size={14} />
                    <span>Add Room</span>
                  </button>
                </div>
              </div>

              {/* FLOORS TREE LIST */}
              {filteredFloors.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-semibold text-xs">
                  {searchQuery ? `No rooms or tenants matching "${searchQuery}"` : 'No floors created yet.'}
                </div>
              ) : (
                <div className="space-y-4 pl-1 sm:pl-4">
                  {filteredFloors.map((floorObj) => {
                    const isFloorExpanded = expandedFloors[floorObj.floor_number] !== false;

                    return (
                      <div key={floorObj.floor_number} className="relative pl-4 sm:pl-6 border-l-2 border-amber-200/80 space-y-3">
                        {/* Connecting Line Accent */}
                        <div className="absolute -left-[9px] top-4 w-4 h-4 rounded-full bg-amber-700 ring-4 ring-amber-100 flex items-center justify-center text-white text-[9px] font-black">
                          {floorObj.floor_number}
                        </div>

                        {/* FLOOR BAR HEADER */}
                        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between p-2.5 sm:p-3.5 gap-2 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 transition">
                          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                            <button
                              onClick={() => toggleFloorExpand(floorObj.floor_number)}
                              className="text-slate-500 hover:text-slate-800 p-0.5 shrink-0"
                            >
                              {isFloorExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </button>
                            <Layers size={18} className="text-amber-700 shrink-0" />
                            <span className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">{floorObj.floor_name}</span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 text-[10px] sm:text-xs font-bold whitespace-nowrap">
                              {floorObj.rooms.length} Rooms
                            </span>
                          </div>

                          <div className="flex items-center space-x-3 shrink-0 ml-auto sm:ml-0">
                            <button
                              onClick={() => openAddRoomModal(floorObj.floor_number)}
                              className="text-xs font-extrabold text-amber-800 hover:text-amber-900 flex items-center space-x-1"
                            >
                              <Plus size={14} />
                              <span>Add Room</span>
                            </button>
                          </div>
                        </div>

                        {/* ROOMS LIST UNDER FLOOR */}
                        {isFloorExpanded && (
                          <div className="space-y-3 pl-2 sm:pl-8 pt-1">
                            {floorObj.rooms.map((room) => {
                              const isRoomExpanded = expandedRooms[room.id] !== false;
                              const isFull = room.occupied_beds >= room.total_beds;
                              const isEmpty = room.occupied_beds === 0;

                              return (
                                <div key={room.id} className="relative pl-3 sm:pl-6 border-l-2 border-slate-200 space-y-2">
                                  <div className="absolute -left-[1px] top-4 w-3 sm:w-4 h-[1px] bg-slate-300"></div>

                                  {/* ROOM ROW CONTAINER */}
                                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-between p-2.5 sm:p-3 gap-2 bg-white hover:bg-slate-50/80 rounded-xl border border-slate-200/80 transition shadow-xs">
                                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 min-w-0">
                                      <button
                                        onClick={() => toggleRoomExpand(room.id)}
                                        className="text-slate-400 hover:text-slate-700 p-0.5 shrink-0"
                                      >
                                        {isRoomExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                      </button>
                                      <DoorOpen size={16} className="text-amber-800 shrink-0" />
                                      <span className="font-extrabold text-slate-900 text-xs sm:text-sm whitespace-nowrap">
                                        Room {room.room_number}
                                      </span>
                                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 text-[10px] sm:text-xs font-bold border border-amber-200/60 whitespace-nowrap">
                                        {room.room_type}
                                      </span>
                                      <span className="text-[11px] sm:text-xs font-extrabold text-amber-700 whitespace-nowrap">
                                        ₹{Number(room.monthly_rent).toLocaleString()}/mo
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 ml-auto sm:ml-0">
                                      {/* Occupancy ratio pill */}
                                      <div className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-extrabold flex items-center space-x-1 ${
                                        isFull 
                                          ? 'bg-red-50 text-red-700 border border-red-200' 
                                          : isEmpty 
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                          : 'bg-amber-50 text-amber-900 border border-amber-200'
                                      }`}>
                                        <Users size={12} />
                                        <span>{room.occupied_beds}/{room.total_beds}</span>
                                      </div>

                                      <button
                                        onClick={() => openEditRoomModal(room)}
                                        className="p-1 sm:p-1.5 text-slate-500 hover:text-amber-800 hover:bg-slate-100 rounded-lg transition"
                                        title="Edit Room Details"
                                      >
                                        <Edit2 size={13} />
                                      </button>

                                      <button
                                        onClick={() => handleDeleteRoom(room.id, room.room_number)}
                                        className="p-1 sm:p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                        title="Delete Room"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* BEDS LIST UNDER ROOM */}
                                  {isRoomExpanded && (
                                    <div className="space-y-2 pl-2 sm:pl-10 pt-1">
                                      {room.beds.map((bed) => (
                                        <div key={bed.label} className="relative pl-3 sm:pl-6 border-l-2 border-slate-200">
                                          <div className="absolute -left-[1px] top-4 w-3 sm:w-4 h-[1px] bg-slate-300"></div>

                                          {/* BED ROW CONTAINER */}
                                          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between p-2.5 sm:p-3 gap-2 bg-slate-50/60 hover:bg-slate-100/60 rounded-xl border border-slate-200/60 transition">
                                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 min-w-0">
                                              <Bed size={14} className="text-slate-600 shrink-0" />
                                              <span className="font-extrabold text-xs text-slate-800 whitespace-nowrap">
                                                {bed.label}
                                              </span>
                                              <span className="text-slate-300 font-bold text-xs">→</span>

                                              {bed.is_occupied ? (
                                                <div className="flex items-center space-x-1 font-bold text-xs text-slate-900 min-w-0">
                                                  <User size={13} className="text-amber-700 shrink-0" />
                                                  <span className="truncate max-w-[100px] sm:max-w-none">{bed.tenant_name}</span>
                                                </div>
                                              ) : (
                                                <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">
                                                  Vacant
                                                </span>
                                              )}
                                            </div>

                                            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 ml-auto sm:ml-0">
                                              {bed.is_occupied ? (
                                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[9px] sm:text-[10px] uppercase tracking-wider border border-emerald-200 whitespace-nowrap">
                                                  OCCUPIED
                                                </span>
                                              ) : (
                                                <div className="flex items-center space-x-1.5">
                                                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-black text-[9px] sm:text-[10px] uppercase tracking-wider border border-emerald-200 whitespace-nowrap">
                                                    AVAILABLE
                                                  </span>
                                                  <Link
                                                    to="/tenants"
                                                    className="text-[10px] sm:text-[11px] font-bold text-amber-800 hover:underline flex items-center space-x-0.5 whitespace-nowrap"
                                                  >
                                                    <UserPlus size={12} />
                                                    <span>Assign</span>
                                                  </Link>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* SUMMARY BOX AT BOTTOM */}
              <div className="p-4 sm:p-5 bg-slate-900 text-white rounded-2xl space-y-3 font-sans shadow-md border border-slate-800">
                <div className="flex items-center space-x-2 font-black text-xs sm:text-sm">
                  <BarChart3 size={18} className="text-amber-400" />
                  <span>Property Occupancy Summary</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs font-extrabold text-slate-300">
                  <div>
                    <span className="text-slate-400 block text-[9px] sm:text-[10px] uppercase tracking-wider">Total Rooms</span>
                    <span className="text-white text-sm sm:text-base font-black">{configData.summary.total_rooms}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[9px] sm:text-[10px] uppercase tracking-wider">Total Beds</span>
                    <span className="text-white text-sm sm:text-base font-black">{configData.summary.total_beds}</span>
                  </div>

                  <div>
                    <span className="text-amber-400 block text-[9px] sm:text-[10px] uppercase tracking-wider">Occupied</span>
                    <span className="text-amber-400 text-sm sm:text-base font-black">{configData.summary.occupied_beds}</span>
                  </div>

                  <div>
                    <span className="text-emerald-400 block text-[9px] sm:text-[10px] uppercase tracking-wider">Vacant</span>
                    <span className="text-emerald-400 text-sm sm:text-base font-black">{configData.summary.vacant_beds}</span>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            /* FLOOR CARDS GRID TAB */
            <div className="space-y-6">
              {filteredFloors.map((floorObj) => (
                <div key={floorObj.floor_number} className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-2.5">
                      <Layers size={18} className="text-amber-700" />
                      <h3 className="font-black text-slate-900 text-base">{floorObj.floor_name}</h3>
                      <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">
                        {floorObj.rooms.length} Rooms
                      </span>
                    </div>

                    <button
                      onClick={() => openAddRoomModal(floorObj.floor_number)}
                      className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1 transition shadow-xs"
                    >
                      <Plus size={14} />
                      <span>Add Room</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {floorObj.rooms.map((room) => (
                      <div
                        key={room.id}
                        className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-3 hover:border-amber-400 transition flex flex-col justify-between shadow-xs"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <DoorOpen size={18} className="text-amber-800" />
                              <span className="font-black text-slate-900 text-base">Room {room.room_number}</span>
                            </div>
                            <span className="px-2.5 py-0.5 bg-white border border-slate-200 rounded-full text-xs font-extrabold text-slate-700">
                              {room.room_type}
                            </span>
                          </div>

                          <div className="flex items-baseline space-x-1 mt-1 text-slate-600">
                            <span className="text-xs font-bold text-amber-700">₹{Number(room.monthly_rent).toLocaleString()}</span>
                            <span className="text-[10px] text-slate-400">/mo</span>
                          </div>

                          {/* Bed Indicators */}
                          <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-200/60">
                            {room.beds.map((bed) => (
                              <div
                                key={bed.label}
                                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
                                  bed.is_occupied 
                                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
                                    : 'bg-white text-slate-600 border border-slate-200'
                                }`}
                              >
                                <span className="flex items-center space-x-2">
                                  <Bed size={14} />
                                  <span className="font-bold">{bed.label}</span>
                                </span>
                                {bed.is_occupied ? (
                                  <span className="font-extrabold text-[11px] text-slate-900">{bed.tenant_name}</span>
                                ) : (
                                  <span className="text-emerald-700 font-bold text-[11px]">Vacant</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Footer Card Actions */}
                        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200/60">
                          <button
                            onClick={() => openEditRoomModal(room)}
                            className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition flex items-center space-x-1"
                          >
                            <Edit2 size={12} />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteRoom(room.id, room.room_number)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ADD / EDIT ROOM MODAL */}
      {showRoomModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-50 text-amber-800 rounded-xl">
                  <DoorOpen size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">
                    {editingRoom ? `Edit Room ${editingRoom.room_number}` : 'Configure New Room'}
                  </h3>
                  <p className="text-xs font-bold text-slate-400">Set room capacity, floor, and rent terms</p>
                </div>
              </div>
              <button
                onClick={() => setShowRoomModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="p-3.5 bg-red-50 text-red-600 border border-red-200 rounded-2xl text-xs font-bold">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveRoom} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Floor Number *</label>
                  <input
                    type="number"
                    min="0"
                    value={formFloor}
                    onChange={(e) => setFormFloor(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Room Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. 101, 102"
                    value={formRoomNumber}
                    onChange={(e) => setFormRoomNumber(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Room Type</label>
                  <select
                    value={formRoomType}
                    onChange={(e) => setFormRoomType(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition"
                  >
                    <option value="Single">Single Room</option>
                    <option value="Double">Double Sharing</option>
                    <option value="Triple">Triple Sharing</option>
                    <option value="Quad">Quad Sharing</option>
                    <option value="1 BHK">1 BHK Apartment</option>
                    <option value="2 BHK">2 BHK Apartment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Total Beds Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formTotalBeds}
                    onChange={(e) => setFormTotalBeds(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Monthly Rent (₹) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 8500"
                    value={formMonthlyRent}
                    onChange={(e) => setFormMonthlyRent(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Security Deposit (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 10000"
                    value={formDeposit}
                    onChange={(e) => setFormDeposit(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Furnishing</label>
                  <select
                    value={formFurnishing}
                    onChange={(e) => setFormFurnishing(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                  >
                    <option value="Fully-Furnished">Fully</option>
                    <option value="Semi-Furnished">Semi</option>
                    <option value="Unfurnished">Unfurnished</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Bathroom</label>
                  <select
                    value={formBathroom}
                    onChange={(e) => setFormBathroom(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                  >
                    <option value="Attached">Attached</option>
                    <option value="Common">Common</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Balcony</label>
                  <select
                    value={formBalcony}
                    onChange={(e) => setFormBalcony(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRoomModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-extrabold hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRoom}
                  className="px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-extrabold transition shadow-md disabled:opacity-50"
                >
                  {savingRoom ? 'Saving...' : editingRoom ? 'Update Room' : 'Add Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
