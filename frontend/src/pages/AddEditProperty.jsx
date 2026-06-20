import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, Plus, Trash2, Home, CheckCircle2, AlertCircle, Pencil } from 'lucide-react';

export default function AddEditProperty() {
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

  const amenitiesList = ['WiFi', 'AC', 'Attached Washroom', 'Food Included', 'Laundry Service', 'Security / CCTV', 'Power Backup', 'Gym', 'Drinking Water', 'Parking', 'Lift'];

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
    
    if (!roomNumber || !monthlyRent) {
      alert(`${propertyType === 'Apartment' ? 'Unit/Flat number' : 'Room number'} and monthly rent are required.`);
      return;
    }

    const payload = {
      room_number: roomNumber,
      room_type: roomType,
      total_beds: propertyType === 'Apartment' ? 1 : totalBeds,
      occupied_beds: propertyType === 'Apartment' ? 0 : occupiedBeds,
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
        setSuccess("Room/Unit updated successfully!");
        setEditingRoomId(null);
      } else {
        const res = await api.post(`/rentals/properties/${id}/rooms/`, payload);
        setRooms([...rooms, res.data]);
        setSuccess("Room/Unit added successfully!");
      }
      
      // Reset room form
      setRoomNumber('');
      setRoomType(propertyType === 'Apartment' ? '1 BHK' : 'Single');
      setTotalBeds(1);
      setOccupiedBeds(0);
      setMonthlyRent('');
      setRoomDeposit('');
      setFurnishing('Semi-Furnished');
      setBathroom('1');
      setBalcony('0');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || `Failed to save room/unit. Ensure the room/flat number is unique.`);
    }
  };

  const handleEditClick = (room) => {
    setEditingRoomId(room.id);
    setRoomNumber(room.room_number);
    setRoomType(room.room_type);
    setTotalBeds(room.total_beds || 1);
    setOccupiedBeds(room.occupied_beds || 0);
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
    setOccupiedBeds(0);
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
            <div>
              <h2 className="text-2xl font-black text-slate-800">
                {isEdit ? 'Configure Property' : 'List New Property'}
              </h2>
              <p className="text-xs font-semibold text-slate-400 mt-1">Configure layout, address guidelines, and visual gallery uploads</p>
            </div>

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

              {/* Amenities checkboxes */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Amenities</label>
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

              <div className="pt-6 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center"
                >
                  {loading ? 'Saving Property...' : (isEdit ? 'Save Updates' : 'Add Property & Continue')}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Form: Rooms Setup (Edit mode only) */}
        <div className="lg:col-span-1 space-y-6">
          {isEdit ? (
            <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-800 flex items-center">
                  <Home size={18} className="text-amber-700 mr-2" />
                  <span>{editingRoomId ? 'Edit Room / Unit' : 'Configure Rooms'}</span>
                </h3>
                <p className="text-xs font-semibold text-slate-400 mt-1">
                  {propertyType === 'Apartment' 
                    ? "Define flat units, configuration types, furnishing and rent" 
                    : "Define specific PG room types, bed vacancy lists and monthly rents"}
                </p>
              </div>

              {/* Add/Edit Room Mini Form */}
              <form onSubmit={handleAddOrUpdateRoom} className="space-y-4 pt-4 border-t border-slate-50">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    {propertyType === 'Apartment' ? 'Flat/Unit Number' : 'Room Number'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={propertyType === 'Apartment' ? "e.g. 302" : "e.g. 101"}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-700 focus:bg-white transition"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      {propertyType === 'Apartment' ? 'BHK Type' : 'Room Type'}
                    </label>
                    <select
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-700 focus:bg-white transition"
                      value={roomType}
                      onChange={(e) => setRoomType(e.target.value)}
                    >
                      {propertyType === 'Apartment' ? (
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
                          <option value="Single">Single</option>
                          <option value="Double Sharing">Double Sharing</option>
                          <option value="Triple Sharing">Triple Sharing</option>
                          <option value="Quad Sharing">Quad Sharing</option>
                        </>
                      )}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Monthly Rent (₹)</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 9000"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-700 focus:bg-white transition"
                        value={monthlyRent}
                        onChange={(e) => setMonthlyRent(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Security Deposit (₹)</label>
                      <input
                        type="number"
                        placeholder="e.g. 15000"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-700 focus:bg-white transition"
                        value={roomDeposit}
                        onChange={(e) => setRoomDeposit(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {propertyType === 'Apartment' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Furnishing</label>
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
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Bathroom</label>
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
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Balcony</label>
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
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Beds</label>
                      <input
                        type="number"
                        min={1}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-700 focus:bg-white transition"
                        value={totalBeds}
                        onChange={(e) => setTotalBeds(parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Occupied Beds</label>
                      <input
                        type="number"
                        min={0}
                        max={totalBeds}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-700 focus:bg-white transition"
                        value={occupiedBeds}
                        onChange={(e) => setOccupiedBeds(parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  {editingRoomId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-bold transition flex items-center justify-center"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center space-x-1.5"
                  >
                    <Plus size={14} />
                    <span>{editingRoomId ? 'Update Room/Unit' : 'Add Room/Unit'}</span>
                  </button>
                </div>
              </form>

              {/* Room Config List */}
              <div className="pt-6 border-t border-slate-50 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rooms roster list</h4>
                {rooms.length === 0 ? (
                  <p className="text-xs text-slate-400 font-semibold italic">No rooms configured yet.</p>
                ) : (
                  <div className="space-y-2.5">
                    {rooms.map((room, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-amber-200 transition group relative">
                        <div className="min-w-0 pr-8">
                          <div className="text-sm font-extrabold text-slate-800">
                            {propertyType === 'Apartment' ? `Flat/Unit ${room.room_number}` : `Room ${room.room_number}`}
                          </div>
                          <div className="text-[10px] text-slate-400 font-bold leading-normal">
                            {room.room_type}
                            {propertyType === 'Apartment' ? (
                              <>
                                {room.furnishing && ` • ${room.furnishing}`}
                                {room.bathroom && ` • ${room.bathroom} Bath`}
                                {room.balcony && ` • ${room.balcony} Balcony`}
                              </>
                            ) : (
                              ` • Vacant: ${room.total_beds - room.occupied_beds}/${room.total_beds}`
                            )}
                            {room.deposit > 0 && ` • Deposit: ₹${Number(room.deposit).toLocaleString()}`}
                          </div>
                        </div>
                        <div className="text-right flex items-center space-x-2">
                          <div className="mr-2">
                            <span className="text-sm font-black text-amber-700">₹{Number(room.monthly_rent).toLocaleString()}</span>
                            <span className="text-[10px] font-bold text-slate-400">/mo</span>
                          </div>
                          <div className="flex space-x-1">
                            <button
                              type="button"
                              onClick={() => handleEditClick(room)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition"
                              title="Edit Room/Unit"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRoom(room.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                              title="Delete Room/Unit"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-amber-50/60 border border-dashed border-amber-200 p-6 rounded-3xl shadow-sm text-center text-amber-900/80 space-y-3">
              <h3 className="font-extrabold text-sm">Add Property First</h3>
              <p className="text-xs font-semibold leading-relaxed">
                Save your basic property details first to unlock the room and bed configuration tables panel.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
