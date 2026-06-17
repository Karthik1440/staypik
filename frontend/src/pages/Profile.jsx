import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { 
  User, Plus, AlertCircle, CheckCircle2, 
  Camera, ChevronRight, Heart, Calendar, 
  Bell, HelpCircle, Headphones, FileText, 
  LogOut, X, Check, ArrowRight, ShieldCheck
} from 'lucide-react';

export default function Profile() {
  const { user, role, mode, toggleMode, refreshProfile, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Redesign profile states
  const [profileName, setProfileName] = useState(user?.displayName || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');

  // Modal control states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  // Onboarding Host Form state
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [propertyName, setPropertyName] = useState('');
  const [propertyType, setPropertyType] = useState('PG');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [onboardLoading, setOnboardLoading] = useState(false);
  const [onboardError, setOnboardError] = useState('');

  // Support Ticket Form state
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSuccess, setSupportSuccess] = useState(false);
  const [supportError, setSupportError] = useState('');
  const [supportLoading, setSupportLoading] = useState(false);

  useEffect(() => {
    if (user?.displayName) {
      setProfileName(user.displayName);
    }
  }, [user]);

  // Handle Profile Photo Upload
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Client-side image validation
    if (!file.type.startsWith('image/')) {
      setProfileError("Please select a valid image file.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setProfileError("Image size must be smaller than 3MB.");
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    setProfileLoading(true);
    setProfileError('');
    setProfileMessage('');

    try {
      await api.patch('/rentals/profile/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      await refreshProfile();
      setProfileMessage("Profile picture updated successfully!");
    } catch (err) {
      console.error(err);
      setProfileError("Failed to upload profile picture.");
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle Display Name Edit Submit
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileMessage('');
    setProfileLoading(true);

    try {
      await api.patch('/rentals/profile/', {
        display_name: profileName
      });
      await refreshProfile();
      setProfileMessage("Profile name updated successfully!");
      setShowEditModal(false);
    } catch (err) {
      console.error(err);
      setProfileError("Failed to update profile name.");
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle Host Onboarding Submit
  const handleBecomeOwner = async (e) => {
    e.preventDefault();
    setOnboardError('');
    setOnboardLoading(true);

    try {
      const res = await api.post('/rentals/become-owner/', {
        full_name: fullName,
        mobile_number: mobileNumber,
        property_name: propertyName,
        property_type: propertyType,
        city,
        address
      });
      await refreshProfile();
      setShowOnboardModal(false);
      
      const isApproved = res.data?.user?.is_owner_approved;
      if (isApproved) {
        navigate('/dashboard');
      } else {
        setProfileMessage("Owner registration successful! Your profile is pending admin approval.");
      }
    } catch (err) {
      console.error(err);
      setOnboardError(err.response?.data?.detail || "Failed to onboard as owner. Check fields.");
    } finally {
      setOnboardLoading(false);
    }
  };

  // Handle Support Ticket Submit (Real API)
  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    if (!supportSubject || !supportMessage) return;
    
    setSupportLoading(true);
    setSupportError('');
    setSupportSuccess(false);

    try {
      await api.post('/rentals/support/', {
        subject: supportSubject,
        message: supportMessage
      });
      setSupportSuccess(true);
      setSupportSubject('');
      setSupportMessage('');
      // Automatically close modal after success message
      setTimeout(() => {
        setSupportSuccess(false);
        setShowSupportModal(false);
      }, 2500);
    } catch (err) {
      console.error("Support submission error:", err);
      setSupportError(err.response?.data?.detail || "Failed to submit inquiry. Please try again later.");
    } finally {
      setSupportLoading(false);
    }
  };

  const handleLogoutClick = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-24 animate-fadeIn px-2 sm:px-0">
      
      {/* Top Card: Profile Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-600 to-amber-700 text-white p-6 sm:p-8 rounded-[32px] shadow-lg flex items-center space-x-5 sm:space-x-6">
        {/* Background blobs for premium depth */}
        <div className="absolute right-[-20px] top-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-[-20px] bottom-[-20px] w-32 h-32 bg-amber-500/20 rounded-full blur-xl pointer-events-none" />
        
        {/* Profile Avatar & Camera button */}
        <div className="relative flex-shrink-0 z-10">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.displayName || 'User'}
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-amber-800 border-4 border-white flex items-center justify-center text-white text-4xl font-black shadow-md transition-transform duration-300 hover:scale-105">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
          <button
            onClick={() => fileInputRef.current.click()}
            className="absolute bottom-0 right-0 w-8 h-8 bg-white text-slate-700 rounded-full flex items-center justify-center shadow-lg hover:bg-slate-50 transition border border-slate-200/50 active:scale-90"
            title="Upload Profile Photo"
          >
            <Camera size={14} className="text-slate-600" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* User Info & Edit Profile Trigger */}
        <div className="space-y-2 z-10 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-2xl font-black tracking-tight leading-tight truncate w-full">
              {user?.displayName || user?.email?.split('@')[0] || 'User'}
            </h3>
          </div>
          
          <p className="text-sm font-semibold text-white/80 leading-normal break-all">{user?.email}</p>
          
          <div className="pt-1">
            <button
              onClick={() => setShowEditModal(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-white text-amber-900 rounded-full text-xs font-black shadow-md hover:bg-amber-50 hover:shadow-lg transition active:scale-95"
            >
              <Camera size={13} className="stroke-[2.5px]" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success/Error Alerts */}
      {profileMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-100 text-xs font-bold flex items-center space-x-2.5 animate-fadeIn">
          <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
          <span>{profileMessage}</span>
        </div>
      )}
      {profileError && (
        <div className="p-4 rounded-2xl bg-red-50 text-red-850 border border-red-100 text-xs font-bold flex items-center space-x-2.5 animate-fadeIn">
          <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
          <span>{profileError}</span>
        </div>
      )}

      {/* Hosting/Onboarding Card */}
      {role === 'USER' ? (
        <div className="relative overflow-hidden bg-gradient-to-br from-[#FFF9F2] to-[#FFF4E7] border border-[#FFE7CD] p-6 rounded-[28px] shadow-sm flex items-center justify-between transition-all duration-300 hover:shadow-md">
          <div className="space-y-2.5 pr-2 max-w-[65%]">
            <h3 className="text-lg font-black text-slate-800 tracking-tight leading-tight">Become a Property Owner</h3>
            <p className="text-slate-500 text-xs font-semibold leading-relaxed">
              List your PG or Apartment and start earning monthly income.
            </p>
            <button
              onClick={() => setShowOnboardModal(true)}
              className="inline-flex items-center space-x-1.5 px-4.5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-black rounded-xl shadow-md transition active:scale-95"
            >
              <span>Start Hosting</span>
              <ArrowRight size={13} className="stroke-[2.5px]" />
            </button>
          </div>
          
          {/* Mockup SVG Illustration of PG Building */}
          <svg viewBox="0 0 200 150" className="w-28 h-24 object-contain flex-shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="70" y="20" width="60" height="110" rx="6" fill="#FDEEDB" />
            <rect x="70" y="20" width="60" height="110" rx="6" stroke="#B45309" strokeWidth="2" />
            <path d="M 65 20 L 135 20" stroke="#B45309" strokeWidth="3" strokeLinecap="round" />
            <rect x="80" y="32" width="12" height="12" rx="2" fill="#38BDF8" stroke="#B45309" strokeWidth="1.5" />
            <rect x="108" y="32" width="12" height="12" rx="2" fill="#38BDF8" stroke="#B45309" strokeWidth="1.5" />
            <rect x="80" y="56" width="12" height="12" rx="2" fill="#38BDF8" stroke="#B45309" strokeWidth="1.5" />
            <rect x="108" y="56" width="12" height="12" rx="2" fill="#38BDF8" stroke="#B45309" strokeWidth="1.5" />
            <rect x="80" y="80" width="12" height="12" rx="2" fill="#38BDF8" stroke="#B45309" strokeWidth="1.5" />
            <rect x="108" y="80" width="12" height="12" rx="2" fill="#38BDF8" stroke="#B45309" strokeWidth="1.5" />
            <path d="M 92 130 L 92 110 A 8 8 0 0 1 108 110 L 108 130 Z" fill="#B45309" />
            <path d="M150 40 a10 10 0 0 1 15 -5 a15 15 0 0 1 22 2 a10 10 0 0 1 0 13 z" fill="#E2E8F0" />
            <path d="M25 60 a8 8 0 0 1 12 -4 a12 12 0 0 1 18 2 a8 8 0 0 1 0 10 z" fill="#E2E8F0" />
            <circle cx="50" cy="122" r="8" fill="#16A34A" />
            <circle cx="150" cy="120" r="10" fill="#16A34A" />
          </svg>
        </div>
      ) : (
        /* Switch modes or pending approval status for Owners */
        <div className="bg-[#FFF9F2] border border-[#FFE7CD] p-6 rounded-[28px] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300 hover:shadow-md">
          <div className="space-y-2 max-w-full sm:max-w-[65%]">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-black text-slate-800 tracking-tight leading-tight">Host Control Panel</h3>
              {user?.isOwnerApproved ? (
                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-250 rounded-full">Approved</span>
              ) : (
                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-250 rounded-full animate-pulse">Pending Admin Approval</span>
              )}
            </div>
            <p className="text-slate-500 text-xs font-semibold leading-relaxed">
              {user?.isOwnerApproved 
                ? "Toggle between Guest view to book visits, and Host mode to manage properties & tenants."
                : "Your owner profile is currently pending review by our administrator team. You will be able to access host features once approved."
              }
            </p>
            {user?.isOwnerApproved ? (
              <button
                onClick={toggleMode}
                className="inline-flex items-center space-x-1.5 px-4.5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-black rounded-xl shadow-md transition active:scale-95"
              >
                <span>{mode === 'HOST' ? 'Switch to Guest Mode' : 'Switch to Host Mode'}</span>
              </button>
            ) : (
              <div className="inline-flex items-center space-x-2 text-amber-805 bg-amber-50/50 border border-amber-200/60 px-4 py-2.5 rounded-xl text-xs font-bold">
                <AlertCircle size={14} className="stroke-[2.5px] text-amber-700" />
                <span>Verification in progress</span>
              </div>
            )}
          </div>
          <svg viewBox="0 0 200 150" className="w-28 h-24 object-contain flex-shrink-0 self-center" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="65" y="30" width="70" height="90" rx="8" fill="#1E293B" />
            <rect x="75" y="42" width="50" height="40" rx="4" fill={user?.isOwnerApproved ? "#10B981" : "#F59E0B"} />
            <circle cx="85" cy="98" r="6" fill="#F59E0B" />
            <circle cx="115" cy="98" r="6" fill={user?.isOwnerApproved ? "#10B981" : "#E2E8F0"} />
          </svg>
        </div>
      )}

      {/* Account Section Menu */}
      <div className="bg-white border border-slate-100 p-4.5 rounded-[28px] shadow-sm space-y-1">
        <h4 className="text-sm font-extrabold text-slate-800 px-2.5 mb-2.5 tracking-tight uppercase">Account</h4>
        
        {/* Personal Details */}
        <div 
          onClick={() => setShowEditModal(true)}
          className="flex items-center space-x-3.5 p-3 rounded-2xl hover:bg-slate-50 transition cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-100 transition-colors">
            <User size={18} className="stroke-[2.5px]" />
          </div>
          <span className="text-sm font-bold text-slate-700">Personal Details</span>
          <ChevronRight size={16} className="text-slate-400 ml-auto group-hover:text-amber-700 group-hover:translate-x-0.5 transition" />
        </div>

        {/* Saved Properties */}
        <Link 
          to="/saved"
          className="flex items-center space-x-3.5 p-3 rounded-2xl hover:bg-slate-50 transition cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-100 transition-colors">
            <Heart size={18} className="stroke-[2.5px]" />
          </div>
          <span className="text-sm font-bold text-slate-700">Saved Properties</span>
          <ChevronRight size={16} className="text-slate-400 ml-auto group-hover:text-amber-700 group-hover:translate-x-0.5 transition" />
        </Link>

        {/* My Bookings */}
        <Link 
          to="/bookings"
          className="flex items-center space-x-3.5 p-3 rounded-2xl hover:bg-slate-50 transition cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-100 transition-colors">
            <Calendar size={18} className="stroke-[2.5px]" />
          </div>
          <span className="text-sm font-bold text-slate-700">My Bookings</span>
          <ChevronRight size={16} className="text-slate-400 ml-auto group-hover:text-amber-700 group-hover:translate-x-0.5 transition" />
        </Link>

        {/* Notifications */}
        <div 
          onClick={() => setShowNotificationsModal(true)}
          className="flex items-center space-x-3.5 p-3 rounded-2xl hover:bg-slate-50 transition cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-100 transition-colors">
            <Bell size={18} className="stroke-[2.5px]" />
          </div>
          <span className="text-sm font-bold text-slate-700">Notifications</span>
          <ChevronRight size={16} className="text-slate-400 ml-auto group-hover:text-amber-700 group-hover:translate-x-0.5 transition" />
        </div>
      </div>

      {/* Support Section Menu */}
      <div className="bg-white border border-slate-100 p-4.5 rounded-[28px] shadow-sm space-y-1">
        <h4 className="text-sm font-extrabold text-slate-800 px-2.5 mb-2.5 tracking-tight uppercase">Support</h4>
        
        {/* Help Center */}
        <div 
          onClick={() => setShowHelpModal(true)}
          className="flex items-center space-x-3.5 p-3 rounded-2xl hover:bg-slate-50 transition cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-100 transition-colors">
            <HelpCircle size={18} className="stroke-[2.5px]" />
          </div>
          <span className="text-sm font-bold text-slate-700">Help Center</span>
          <ChevronRight size={16} className="text-slate-400 ml-auto group-hover:text-amber-700 group-hover:translate-x-0.5 transition" />
        </div>

        {/* Contact Support */}
        <div 
          onClick={() => setShowSupportModal(true)}
          className="flex items-center space-x-3.5 p-3 rounded-2xl hover:bg-slate-50 transition cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-100 transition-colors">
            <Headphones size={18} className="stroke-[2.5px]" />
          </div>
          <span className="text-sm font-bold text-slate-700">Contact Support</span>
          <ChevronRight size={16} className="text-slate-400 ml-auto group-hover:text-amber-700 group-hover:translate-x-0.5 transition" />
        </div>

        {/* Terms & Privacy */}
        <Link 
          to="/terms-privacy"
          className="flex items-center space-x-3.5 p-3 rounded-2xl hover:bg-slate-50 transition cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-100 transition-colors">
            <FileText size={18} className="stroke-[2.5px]" />
          </div>
          <span className="text-sm font-bold text-slate-700">Terms & Privacy</span>
          <ChevronRight size={16} className="text-slate-400 ml-auto group-hover:text-amber-700 group-hover:translate-x-0.5 transition" />
        </Link>
      </div>

      {/* Logout Button */}
      <div>
        <button
          onClick={handleLogoutClick}
          className="w-full py-3.5 flex items-center justify-center space-x-2 bg-white hover:bg-red-50 text-red-650 border-2 border-red-200/80 hover:border-red-300 rounded-[24px] text-sm font-extrabold transition active:scale-98 shadow-sm hover:shadow"
        >
          <LogOut size={16} className="stroke-[2.5px]" />
          <span>Logout</span>
        </button>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* ── MODALS SECTION ── */}
      {/* ────────────────────────────────────────────────────────── */}

      {/* 1. Edit Profile Name Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[32px] w-full max-w-sm border border-slate-100 shadow-2xl p-6 relative animate-scaleIn origin-center">
            <button 
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
            >
              <X size={18} />
            </button>
            <div className="flex items-center space-x-2 mb-4">
              <User className="text-amber-700" size={20} />
              <h3 className="text-lg font-black text-slate-800">Edit Name</h3>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Display / Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Karthik Keyan"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:border-amber-700 focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 border border-slate-250 rounded-2xl text-slate-500 text-xs font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="flex-1 py-3 bg-amber-700 hover:bg-amber-800 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-1"
                >
                  {profileLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Onboard Property Host Modal */}
      {showOnboardModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-[32px] w-full max-w-md border border-slate-100 shadow-2xl p-6 sm:p-8 relative my-8 animate-scaleIn origin-center">
            <button 
              onClick={() => setShowOnboardModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
            >
              <X size={18} />
            </button>
            <div className="mb-4.5">
              <h3 className="text-xl font-black text-slate-800">Become a Staypik Host</h3>
              <p className="text-xs font-semibold text-slate-400 mt-1">Please enter your hosting details and register your first listing</p>
            </div>

            {onboardError && (
              <div className="mb-4 p-3.5 rounded-2xl bg-red-50 text-red-800 border border-red-100 text-xs font-bold flex items-center space-x-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{onboardError}</span>
              </div>
            )}

            <form onSubmit={handleBecomeOwner} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Host Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-amber-700 focus:bg-white transition"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 9988776655"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-amber-700 focus:bg-white transition"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Property Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sunshine PG"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-amber-700 focus:bg-white transition"
                    value={propertyName}
                    onChange={(e) => setPropertyName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Property Type</label>
                  <select
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-amber-700 focus:bg-white transition"
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                  >
                    <option value="PG">PG</option>
                    <option value="Hostel">Hostel</option>
                    <option value="Co-Living">Co-Living</option>
                    <option value="Apartment">Apartment</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bangalore"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-amber-700 focus:bg-white transition"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Complete Address</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5th Cross, Koramangala"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-amber-700 focus:bg-white transition"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-500 text-xs font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={onboardLoading}
                  className="flex-1 py-3 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition"
                >
                  {onboardLoading ? 'Onboarding...' : 'Onboard Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Help Center FAQ Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[32px] w-full max-w-md border border-slate-100 shadow-2xl p-6 relative animate-scaleIn origin-center max-h-[85vh] flex flex-col">
            <button 
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
            >
              <X size={18} />
            </button>
            <div className="flex items-center space-x-2 mb-4">
              <HelpCircle className="text-amber-700" size={20} />
              <h3 className="text-lg font-black text-slate-800">Help Center</h3>
            </div>
            
            <div className="space-y-4 overflow-y-auto pr-1 flex-1 text-slate-600">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <h4 className="text-xs font-extrabold text-slate-800">How do I book a visit to a PG?</h4>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Navigate to any property detail page, click "Book Visit", select your preferred target date/time, and submit. The property owner will review and confirm.
                </p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <h4 className="text-xs font-extrabold text-slate-800">What is the "Verified badge"?</h4>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  The verified badge is awarded to PGs that have been physically inspected by Staypik admins to guarantee accurate images and premium facilities.
                </p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <h4 className="text-xs font-extrabold text-slate-800">How can I pay my rent?</h4>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Once onboarding is complete, tenants can view active bills under the "Rent" section in their host panel or receive notifications to execute monthly UPI/Card payments.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Contact Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[32px] w-full max-w-sm border border-slate-100 shadow-2xl p-6 relative animate-scaleIn origin-center">
            <button 
              onClick={() => setShowSupportModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
            >
              <X size={18} />
            </button>
            <div className="flex items-center space-x-2 mb-4">
              <Headphones className="text-amber-700" size={20} />
              <h3 className="text-lg font-black text-slate-800">Contact Support</h3>
            </div>

            {supportSuccess ? (
              <div className="py-6 text-center space-y-3 animate-scaleIn">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <Check size={24} className="stroke-[3px]" />
                </div>
                <h4 className="font-extrabold text-slate-800">Ticket Submitted!</h4>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">We will review your inquiry and email you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSupportSubmit} className="space-y-4">
                {supportError && (
                  <div className="p-3 rounded-2xl bg-red-50 text-red-800 border border-red-100 text-xs font-bold flex items-center space-x-2 animate-fadeIn">
                    <AlertCircle size={16} className="text-red-650 flex-shrink-0" />
                    <span>{supportError}</span>
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Booking confirmation delay"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-amber-700 focus:bg-white transition"
                    value={supportSubject}
                    onChange={(e) => setSupportSubject(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Message Description</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe your issue in detail..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-amber-700 focus:bg-white transition resize-none"
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={supportLoading}
                  className="w-full py-3.5 bg-slate-900 hover:bg-black text-white rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-1"
                >
                  <span>{supportLoading ? 'Submitting...' : 'Submit Inquiry'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 5. Notifications Modal */}
      {showNotificationsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[32px] w-full max-w-sm border border-slate-100 shadow-2xl p-6 relative animate-scaleIn origin-center">
            <button 
              onClick={() => setShowNotificationsModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
            >
              <X size={18} />
            </button>
            <div className="flex items-center space-x-2 mb-4">
              <Bell className="text-amber-700" size={20} />
              <h3 className="text-lg font-black text-slate-800">Notifications</h3>
            </div>
            
            <div className="space-y-3 py-2 text-slate-600">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-start space-x-3">
                <div className="w-2.5 h-2.5 bg-amber-500 rounded-full flex-shrink-0 mt-1.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Welcome to Staypik!</h4>
                  <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mt-0.5">Explore listed co-living configurations or click "Onboard Property Host" to start listing.</p>
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-start space-x-3">
                <div className="w-2.5 h-2.5 bg-slate-300 rounded-full flex-shrink-0 mt-1.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Location Sorting is Active</h4>
                  <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mt-0.5">Allow GPS location permissions to immediately discover premium accommodations nearest to you.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
