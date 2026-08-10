import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Plus, Trash2, Home, CheckCircle2, AlertCircle, Pencil, DoorOpen, Shield } from 'lucide-react';

export default function AddEditProperty() {
  const { user } = useAuth();
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();


  // Property Form State
  const [name, setName] = useState('');
  const [propertyType, setPropertyType] = useState('PG');
  const [gender, setGender] = useState('Unisex');
  const [address, setAddress] = useState('');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [baseRent, setBaseRent] = useState('');
  const [deposit, setDeposit] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  // Admin status state
  const [isActive, setIsActive] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);

  // Room Form State (For Edit mode only)
  const [rooms, setRooms] = useState([]);
  const [roomNumber, setRoomNumber] = useState('');
  const [roomType, setRoomType] = useState('Single');
  const [totalBeds, setTotalBeds] = useState(1);
  const [occupiedBeds, setOccupiedBeds] = useState(0);
  const [monthlyRent, setMonthlyRent] = useState('');
  const [roomDeposit, setRoomDeposit] = useState('');
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [furnishing, setFurnishing] = useState('Semi-Furnished');
  const [bathroom, setBathroom] = useState('1');
  const [balcony, setBalcony] = useState('0');

  // Page States
  const [loading, setLoading] = useState(false);
  const [pinningLocation, setPinningLocation] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const amenitiesList = [
    'WiFi', 'AC', 'Attached Washroom', 'Laundry Service', 'Security / CCTV', 
    'Power Backup', 'Gym', 'Drinking Water', 'Parking', 'Lift', 'TV / Refrigerator', 'Housekeeping'
  ];

  const foodOptionsList = [
    'North Indian Food',
    'South Indian Food',
    'North & South Indian Food',
    '3 Meals Daily (Breakfast, Lunch, Dinner)',
    'Breakfast & Dinner Included',
    'Pure Veg Food',
    'Veg & Non-Veg Options',
    'Self-Cooking Kitchen',
    'No Food Included'
  ];

  useEffect(() => {
    if (isEdit) {
      fetchPropertyDetails();
    }
  }, [id]);

  const fetchPropertyDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/rentals/properties/${id}/`);
      const prop = res.data;
      setName(prop.name);
      setPropertyType(prop.property_type);
      setGender(prop.gender || 'Unisex');
      setAddress(prop.address);
      setLocality(prop.locality);
      setCity(prop.city);
      setDescription(prop.description);
      setBaseRent(prop.base_rent);
      setDeposit(prop.deposit || '');
      setSelectedAmenities(prop.amenities || []);
      setRooms(prop.rooms || []);
      setExistingImages(prop.images || []);
      setLatitude(prop.latitude || '');
      setLongitude(prop.longitude || '');
      setIsActive(prop.is_active ?? true);
      setIsVerified(prop.is_verified ?? false);
      setIsFeatured(prop.is_featured ?? false);
      if (prop.property_type === 'Apartment') {
        setRoomType('1 BHK');
      }
    } catch (e) {
      console.error(e);
      setError("Failed to load property details.");
    } finally {
      setLoading(false);
    }
  };

  const handleAmenityToggle = (amenity) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const handlePinCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setPinningLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setPinningLocation(false);
      },
      (err) => {
        console.error("Geolocation error:", err);
        alert(`Failed to pin location: ${err.message}`);
        setPinningLocation(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const handlePropertySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const totalImagesCount = existingImages.length + imageFiles.length;
    if (totalImagesCount > 5) {
      setError(`A property can have a maximum of 5 photos. Current total: ${totalImagesCount} (Existing: ${existingImages.length}, New: ${imageFiles.length}).`);
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('property_type', propertyType);
    formData.append('gender', gender);
    formData.append('address', address);
    formData.append('locality', locality);
    formData.append('city', city);
    formData.append('description', description);
    formData.append('base_rent', baseRent || 0);
    formData.append('deposit', deposit || 0);
    formData.append('amenities', JSON.stringify(selectedAmenities));
    if (latitude) formData.append('latitude', latitude);
    if (longitude) formData.append('longitude', longitude);

    if (user?.isAdmin) {
      formData.append('is_active', isActive);
      formData.append('is_verified', isVerified);
      formData.append('is_featured', isFeatured);
    }

    for (let i = 0; i < imageFiles.length; i++) {
      formData.append('images', imageFiles[i]);
    }

    try {
      if (isEdit) {
        const res = await api.put(`/rentals/properties/manage/${id}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setExistingImages(res.data.images || []);
        setImageFiles([]);
        // Reset file input element
        const fileInput = document.getElementById('property-photos-input');
        if (fileInput) fileInput.value = '';
        
        setSuccess('Property updated successfully!');
      } else {
        const res = await api.post('/rentals/properties/manage/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        navigate(`/properties/edit/${res.data.id}`);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to save property. Verify mandatory inputs.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const totalCount = existingImages.length + files.length;
    if (totalCount > 5) {
      alert(`Maximum of 5 photos allowed. You currently have ${existingImages.length} uploaded, so you can select at most ${5 - existingImages.length} more.`);
      e.target.value = '';
      return;
    }
    setImageFiles(files);
  };

  const handleDeleteExistingImage = async (imageId) => {
    if (!window.confirm("Are you sure you want to delete this photo?")) return;
    try {
      await api.delete(`/rentals/properties/manage/images/${imageId}/`);
      setExistingImages(existingImages.filter(img => img.id !== imageId));
      setSuccess("Photo deleted successfully!");
    } catch (err) {
      console.error(err);
      setError("Failed to delete photo.");
    }
  };

  const handleAddOrUpdateRoom = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!monthlyRent) {
      alert("Monthly rent is required.");
      return;
    }

    const payload = {
      room_number: roomNumber || `${roomType} Option`,
      room_type: roomType,
      total_beds: propertyType === 'Apartment' ? 1 : totalBeds,
      occupied_beds: propertyType === 'Apartment' ? 0 : Math.max(0, totalBeds - (occupiedBeds > 0 ? occupiedBeds : totalBeds)), // occupiedBeds used as vacant beds in UI
      monthly_rent: monthlyRent,
      deposit: roomDeposit || 0,
      furnishing: propertyType === 'Apartment' ? furnishing : '',
      bathroom: propertyType === 'Apartment' ? bathroom : '',
      balcony: propertyType === 'Apartment' ? balcony : ''
    };

    try {
      if (editingRoomId) {
        const res = await api.put(`/rentals/properties/${id}/rooms/${editingRoomId}/`, payload);
        setRooms(rooms.map(r => r.id === editingRoomId ? res.data : r));
        setSuccess("Room type updated successfully!");
        setEditingRoomId(null);
      } else {
        const res = await api.post(`/rentals/properties/${id}/rooms/`, payload);
        setRooms([...rooms, res.data]);
        setSuccess("Room type added successfully!");
      }
      
      // Reset room form
      setRoomNumber('');
      setRoomType(propertyType === 'Apartment' ? '1 BHK' : 'Single');
      setTotalBeds(1);
      setOccupiedBeds(1);
      setMonthlyRent('');
      setRoomDeposit('');
      setFurnishing('Semi-Furnished');
      setBathroom('1');
      setBalcony('0');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || `Failed to save room type.`);
    }
  };

  const handleEditClick = (room) => {
    setEditingRoomId(room.id);
    setRoomNumber(room.room_number || '');
    setRoomType(room.room_type);
    setTotalBeds(room.total_beds || 1);
    setOccupiedBeds(Math.max(0, (room.total_beds || 1) - (room.occupied_beds || 0)));
    setMonthlyRent(room.monthly_rent);
    setRoomDeposit(room.deposit || '');
    setFurnishing(room.furnishing || 'Semi-Furnished');
    setBathroom(room.bathroom || '1');
    setBalcony(room.balcony || '0');
  };

  const handleCancelEdit = () => {
    setEditingRoomId(null);
    setRoomNumber('');
    setRoomType(propertyType === 'Apartment' ? '1 BHK' : 'Single');
    setTotalBeds(1);
    setOccupiedBeds(1);
    setMonthlyRent('');
    setRoomDeposit('');
    setFurnishing('Semi-Furnished');
    setBathroom('1');
    setBalcony('0');
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm("Are you sure you want to delete this room/unit?")) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/rentals/properties/${id}/rooms/${roomId}/`);
      setRooms(rooms.filter(r => r.id !== roomId));
      setSuccess("Room/Unit deleted successfully!");
      if (editingRoomId === roomId) {
        handleCancelEdit();
      }
    } catch (err) {
      console.error(err);
      setError("Failed to delete room.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Header Back */}
      <button 
        onClick={() => navigate('/properties')}
        className="inline-flex items-center space-x-2 text-sm font-bold text-slate-500 hover:text-amber-700 transition"
      >
        <ArrowLeft size={16} />
        <span>Back to properties list</span>
      </button>

      {/* Main Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Form: Property Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-100 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-800">
                  {isEdit ? 'Configure Property' : 'List New Property'}
                </h2>
                <p className="text-xs font-semibold text-slate-400 mt-1">Configure layout, address guidelines, and visual gallery uploads</p>
              </div>

              {isEdit && (
                <Link
                  to={`/properties/${id}/rooms`}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition shadow-sm self-start sm:self-auto"
                >
                  <DoorOpen size={15} />
                  <span>Room Configurator</span>
                </Link>
              )}
            </div>

            {user?.isAdmin && (
              <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center space-x-2 text-amber-900 font-extrabold text-sm">
                  <Shield size={18} className="text-amber-700" />
                  <span>Admin Controls & Status Flags</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center space-x-2.5 bg-white px-3.5 py-2.5 rounded-xl border border-amber-200 cursor-pointer shadow-2xs">
                    <input
                      type="checkbox"
                      checked={isVerified}
                      onChange={(e) => setIsVerified(e.target.checked)}
                      className="w-4 h-4 text-amber-700 rounded focus:ring-amber-500"
                    />
                    <div>
                      <span className="text-xs font-black text-slate-800 block">Verified Badge</span>
                      <span className="text-[10px] font-semibold text-slate-400 block">Mark listing as verified</span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2.5 bg-white px-3.5 py-2.5 rounded-xl border border-amber-200 cursor-pointer shadow-2xs">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 text-amber-700 rounded focus:ring-amber-500"
                    />
                    <div>
                      <span className="text-xs font-black text-slate-800 block">Active Status</span>
                      <span className="text-[10px] font-semibold text-slate-400 block">Visible to public guests</span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2.5 bg-white px-3.5 py-2.5 rounded-xl border border-amber-200 cursor-pointer shadow-2xs">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="w-4 h-4 text-amber-700 rounded focus:ring-amber-500"
                    />
                    <div>
                      <span className="text-xs font-black text-slate-800 block">Featured Listing</span>
                      <span className="text-[10px] font-semibold text-slate-400 block">Highlight on home page</span>
                    </div>
                  </label>
                </div>
              </div>
            )}


            {error && (
              <div className="p-4 rounded-xl bg-red-50 text-red-700 border border-red-100 text-sm font-semibold flex items-center space-x-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-4 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 text-sm font-semibold flex items-center space-x-2">
                <CheckCircle2 size={16} />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handlePropertySubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Property Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sunshine PG"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-700 focus:bg-white transition"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Property Type</label>
                  <select
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-700 focus:bg-white transition"
                    value={propertyType}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPropertyType(val);
                      if (val === 'Apartment') {
                        setRoomType('1 BHK');
                      } else {
                        setRoomType('Single');
                      }
                    }}
                  >
                    <option value="PG">PG</option>
                    <option value="Hostel">Hostel</option>
                    <option value="Co-Living">Co-Living</option>
                    <option value="Apartment">Apartment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Gender Rules</label>
                  <select
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-700 focus:bg-white transition"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="Boys">Boys Only</option>
                    <option value="Girls">Girls Only</option>
                    <option value="Unisex">Unisex (Co-Ed)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bangalore"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-700 focus:bg-white transition"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Locality</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Koramangala"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-700 focus:bg-white transition"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Base Monthly Rent (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 8000"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-700 focus:bg-white transition"
                    value={baseRent}
                    onChange={(e) => setBaseRent(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Security Deposit (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 15000"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-700 focus:bg-white transition"
                    value={deposit}
                    onChange={(e) => setDeposit(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Latitude (Optional)</label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="e.g. 12.971598"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-700 focus:bg-white transition"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Longitude (Optional)</label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="e.g. 77.594562"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-700 focus:bg-white transition"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                  />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={handlePinCurrentLocation}
                    disabled={pinningLocation}
                    className="w-full p-3 bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow transition flex items-center justify-center space-x-1.5 h-[46px]"
                  >
                    <span>{pinningLocation ? "Pinning GPS..." : "Pin GPS Coordinates"}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Complete Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 12, 4th Block, 80 Feet Road"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-700 focus:bg-white transition"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe your property (amenities, cleanliness, house rules)..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-700 focus:bg-white transition"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Upload Images */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Upload Property Photos</label>
                  <p className="text-[11px] font-semibold text-slate-400 mb-2">A property can have a maximum of 5 photos. Selected: {existingImages.length + imageFiles.length}/5</p>
                  <input
                    id="property-photos-input"
                    type="file"
                    multiple
                    accept="image/*"
                    className="w-full text-sm font-semibold text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-amber-50 file:text-amber-800 hover:file:bg-amber-100 cursor-pointer"
                    onChange={handleImageChange}
                  />
                </div>

                {/* Image Previews Grid */}
                {(existingImages.length > 0 || imageFiles.length > 0) && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    {/* Existing Images */}
                    {existingImages.map((img) => (
                      <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden bg-slate-200 group border border-slate-200 shadow-sm">
                        <img src={img.image} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleDeleteExistingImage(img.id)}
                          className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition shadow"
                          title="Delete Photo"
                        >
                          <Trash2 size={12} />
                        </button>
                        <span className="absolute bottom-1 left-1.5 px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-900/60 text-white uppercase tracking-wider">
                          Uploaded
                        </span>
                      </div>
                    ))}

                    {/* New Selected Images Preview */}
                    {Array.from(imageFiles).map((file, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-amber-200 shadow-sm flex flex-col items-center justify-center p-2 text-center">
                        <Home size={16} className="text-amber-700 mb-1" />
                        <span className="text-[9px] font-extrabold text-slate-600 truncate max-w-full block">{file.name}</span>
                        <span className="text-[8px] text-slate-400 font-bold block">{(file.size / 1024).toFixed(0)} KB</span>
                        <span className="absolute bottom-1 left-1.5 px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-700 text-white uppercase tracking-wider">
                          Selected
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Food & Dining Options */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                  Food & Cuisine Options (North Indian / South Indian / Meals)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {foodOptionsList.map((foodOption) => {
                    const checked = selectedAmenities.includes(foodOption);
                    return (
                      <button
                        key={foodOption}
                        type="button"
                        onClick={() => handleAmenityToggle(foodOption)}
                        className={`flex items-center space-x-2.5 p-3 rounded-xl border text-left text-xs font-bold transition ${
                          checked 
                            ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[8px] text-white ${
                          checked ? 'bg-amber-700 border-amber-700' : 'border-slate-300 bg-white'
                        }`}>
                          {checked && '✓'}
                        </div>
                        <span>{foodOption}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* General Amenities checkboxes */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">General Amenities</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {amenitiesList.map((amenity) => {
                    const checked = selectedAmenities.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => handleAmenityToggle(amenity)}
                        className={`flex items-center space-x-2.5 p-3 rounded-xl border text-left text-xs font-bold transition ${
                          checked 
                            ? 'bg-amber-50 border-amber-200 text-amber-900 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[8px] text-white ${
                          checked ? 'bg-amber-700 border-amber-700' : 'border-slate-300 bg-white'
                        }`}>
                          {checked && '✓'}
                        </div>
                        <span>{amenity}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-3.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center"
                >
                  {loading ? 'Saving Property...' : (isEdit ? 'Save Property Details' : 'Add Property & Continue')}
                </button>

                {isEdit && (
                  <Link
                    to={`/properties/${id}/rooms`}
                    className="w-full sm:w-auto px-5 py-3.5 bg-slate-900 hover:bg-black text-white text-xs font-black rounded-xl shadow-md transition flex items-center justify-center space-x-2"
                  >
                    <DoorOpen size={16} />
                    <span>Configure Room Types</span>
                  </Link>
                )}
              </div>
            </form>
          </div>

          {/* Dedicated Room Types Banner for Edit Mode */}
          {isEdit && (
            <div className="p-6 bg-gradient-to-r from-amber-50 via-amber-50/80 to-orange-50 rounded-3xl border border-amber-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
              <div>
                <h4 className="text-base font-black text-slate-800 flex items-center">
                  <DoorOpen size={20} className="text-amber-700 mr-2" />
                  <span>Room Types & Bed Vacancies</span>
                </h4>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  Manage available room options, monthly rents, deposits, and vacant bed counts on a dedicated page.
                </p>
              </div>
              <Link
                to={`/properties/${id}/rooms`}
                className="px-5 py-3 bg-amber-700 hover:bg-amber-800 text-white text-xs font-black rounded-xl shadow-md transition flex items-center space-x-2 flex-shrink-0"
              >
                <DoorOpen size={16} />
                <span>Manage Room Types</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
