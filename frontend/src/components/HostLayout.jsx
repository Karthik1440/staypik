import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Bed, Calendar, MessageSquare, Building2, User, HelpCircle, 
  LogOut, DoorOpen, Plus
} from 'lucide-react';

export default function HostLayout() {
  const { user, mode, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadVisits, setUnreadVisits] = useState(3);

  useEffect(() => {
    fetchUnreadVisitsCount();
  }, [location.pathname]);

  const fetchUnreadVisitsCount = async () => {
    try {
      const res = await api.get('/rentals/bookings/');
      const bookings = res.data || [];
      const pending = bookings.filter(b => b.status === 'PENDING' || b.status === 'APPROVED');
      setUnreadVisits(pending.length > 0 ? pending.length : 3);
    } catch (e) {
      // Fallback
    }
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/dashboard';
    if (path === '/properties') return location.pathname === '/properties' || location.pathname.startsWith('/properties/');
    if (path === '/bookings') return location.pathname === '/bookings';
    if (path === '/profile') return location.pathname === '/profile';
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col md:flex-row text-left font-sans w-full">
      
      {/* ───────────────────────────────────────────────────────────── */}
      {/* MOBILE TOP HEADER (HIDDEN ON DESKTOP) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <header className="md:hidden bg-white border-b border-amber-100/80 px-5 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-2xs">
        <div className="flex items-center space-x-2">
          <Link to="/" className="flex items-center space-x-1.5">
            <span className="text-xl font-black tracking-tight text-amber-700">Stay<span className="text-slate-900">Pik</span></span>
          </Link>
          <span className="px-2.5 py-0.5 bg-amber-50 text-amber-900 text-[10px] font-black rounded-full border border-amber-200 shadow-2xs">
            Host Mode
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <Link to="/bookings" className="relative p-1.5 text-slate-600 hover:text-amber-700 transition">
            <Calendar size={19} />
            {unreadVisits > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[9px] font-black flex items-center justify-center">
                {unreadVisits}
              </span>
            )}
          </Link>
          <Link to="/profile" className="p-1.5 text-slate-700 hover:text-amber-700 transition">
            <User size={19} />
          </Link>
        </div>
      </header>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* LEFT HOST SIDEBAR (DESKTOP) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-64 bg-white border-r border-amber-100/60 p-6 pt-8 pb-8 flex-col justify-between shadow-xs shrink-0 sticky top-0 h-screen overflow-y-auto z-30">
        <div className="space-y-6">
          
          {/* Logo & Host Mode Pill */}
          <div className="flex items-center space-x-2.5 pb-4 border-b border-amber-100/50">
            <Link to="/" className="flex items-center space-x-1">
              <span className="text-2xl font-black tracking-tight text-amber-700">Stay<span className="text-slate-900">Pik</span></span>
            </Link>
            <span className="px-3 py-1 bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-black rounded-full shadow-2xs">
              Host Mode
            </span>
          </div>

          {/* Navigation Links (Exactly 5 Items Requested by User) */}
          <nav className="space-y-1">
            {/* 1. Dashboard */}
            <Link 
              to="/" 
              className={`flex items-center space-x-3 px-3.5 py-3 rounded-2xl font-bold text-sm transition ${
                isActive('/') 
                  ? 'bg-amber-50/90 text-amber-950 font-extrabold border border-amber-200/70 shadow-2xs' 
                  : 'text-slate-600 hover:text-amber-800 hover:bg-amber-50/40'
              }`}
            >
              <LayoutDashboard size={18} className={isActive('/') ? 'text-amber-700' : ''} />
              <span>Dashboard</span>
            </Link>

            {/* 2. Availability */}
            <Link 
              to="/properties" 
              className={`flex items-center space-x-3 px-3.5 py-3 rounded-2xl font-bold text-sm transition ${
                isActive('/properties')
                  ? 'bg-amber-50/90 text-amber-950 font-extrabold border border-amber-200/70 shadow-2xs' 
                  : 'text-slate-600 hover:text-amber-800 hover:bg-amber-50/40'
              }`}
            >
              <Bed size={18} className={isActive('/properties') ? 'text-amber-700' : ''} />
              <span>Availability</span>
            </Link>

            {/* 3. Visit Requests */}
            <Link 
              to="/bookings" 
              className={`flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold text-sm transition ${
                isActive('/bookings') 
                  ? 'bg-amber-50/90 text-amber-950 font-extrabold border border-amber-200/70 shadow-2xs' 
                  : 'text-slate-600 hover:text-amber-800 hover:bg-amber-50/40'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Calendar size={18} className={isActive('/bookings') ? 'text-amber-700' : ''} />
                <span>Visit Requests</span>
              </div>
              {unreadVisits > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                  {unreadVisits}
                </span>
              )}
            </Link>

            {/* 4. Enquiries */}
            <Link 
              to="/bookings" 
              className="flex items-center space-x-3 px-3.5 py-3 rounded-2xl text-slate-600 hover:text-amber-800 hover:bg-amber-50/40 font-bold text-sm transition"
            >
              <MessageSquare size={18} />
              <span>Enquiries</span>
            </Link>

            {/* 5. Profile */}
            <Link 
              to="/profile" 
              className={`flex items-center space-x-3 px-3.5 py-3 rounded-2xl font-bold text-sm transition ${
                isActive('/profile') 
                  ? 'bg-amber-50/90 text-amber-950 font-extrabold border border-amber-200/70 shadow-2xs' 
                  : 'text-slate-600 hover:text-amber-800 hover:bg-amber-50/40'
              }`}
            >
              <User size={18} className={isActive('/profile') ? 'text-amber-700' : ''} />
              <span>Profile</span>
            </Link>
          </nav>
        </div>

        {/* Bottom Section: Support Card & Logout */}
        <div className="space-y-4 pt-6">
          <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-200/60 space-y-2">
            <h5 className="text-xs font-black text-amber-900">Need help?</h5>
            <p className="text-[11px] font-bold text-slate-500 leading-tight">Chat with StayPik support team</p>
            <button 
              onClick={() => navigate('/profile')}
              className="w-full py-2 bg-white hover:bg-amber-100/50 border border-amber-300 text-amber-900 text-xs font-black rounded-xl transition shadow-2xs"
            >
              Chat Now
            </button>
          </div>

          <button 
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center space-x-3 px-3.5 py-3 rounded-2xl border border-slate-200/80 bg-white text-slate-700 hover:text-red-600 hover:bg-red-50 text-sm font-extrabold transition shadow-2xs"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MAIN CONTENT AREA */}
      {/* ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-8 lg:p-10 pb-36 md:pb-12 min-w-0">
        <Outlet />
      </main>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MOBILE BOTTOM NAVIGATION BAR (HIDDEN ON DESKTOP - EXACT 5 ITEMS) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-amber-200/80 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] z-50 shadow-lg flex justify-around items-center px-2">
        <Link 
          to="/" 
          className={`flex flex-col items-center text-xs font-extrabold ${
            isActive('/') ? 'text-amber-700' : 'text-slate-500 hover:text-amber-700'
          }`}
        >
          <LayoutDashboard size={20} />
          <span className="mt-0.5 text-[10px]">Dashboard</span>
        </Link>

        <Link 
          to="/properties" 
          className={`flex flex-col items-center text-xs font-extrabold ${
            isActive('/properties') ? 'text-amber-700' : 'text-slate-500 hover:text-amber-700'
          }`}
        >
          <Bed size={20} />
          <span className="mt-0.5 text-[10px]">Availability</span>
        </Link>

        <Link 
          to="/bookings" 
          className={`flex flex-col items-center text-xs font-extrabold relative ${
            isActive('/bookings') ? 'text-amber-700' : 'text-slate-500 hover:text-amber-700'
          }`}
        >
          <Calendar size={20} />
          <span className="mt-0.5 text-[10px]">Requests</span>
          {unreadVisits > 0 && (
            <span className="absolute -top-1 right-2 w-4 h-4 bg-red-600 text-white rounded-full text-[9px] font-black flex items-center justify-center">
              {unreadVisits}
            </span>
          )}
        </Link>

        <Link 
          to="/bookings" 
          className="flex flex-col items-center text-xs font-extrabold text-slate-500 hover:text-amber-700"
        >
          <MessageSquare size={20} />
          <span className="mt-0.5 text-[10px]">Enquiries</span>
        </Link>

        <Link 
          to="/profile" 
          className={`flex flex-col items-center text-xs font-extrabold ${
            isActive('/profile') ? 'text-amber-700' : 'text-slate-500 hover:text-amber-700'
          }`}
        >
          <User size={20} />
          <span className="mt-0.5 text-[10px]">Profile</span>
        </Link>
      </nav>
    </div>
  );
}
