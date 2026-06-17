import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Home, Compass, User, Calendar, LogOut, LayoutDashboard, Building, Users, FileWarning, DollarSign, Bell, X, Search, Heart } from 'lucide-react';

export default function Header() {
  const { user, role, mode, toggleMode, logout } = useAuth();
  const location = useLocation();
  const { 
    notifications, 
    unreadCount, 
    markAllRead, 
    clearAllNotifications, 
    banner, 
    bannerDismissedId, 
    dismissBanner 
  } = useNotifications();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);

  const isPropertyPage = location.pathname.startsWith('/property/');
  const isPropertyDetailPage = /^\/property\/[^/]+$/.test(location.pathname);

  if (isPropertyPage && !isPropertyDetailPage) return null;
  
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/' && !location.search.includes('focusSearch');
    }
    if (path === '/search') {
      return location.pathname === '/' && location.search.includes('focusSearch');
    }
    return location.pathname === path;
  };

  return (
    <>
      {!isPropertyPage && banner && banner.is_active && String(banner.id) !== bannerDismissedId && (
        <div className="bg-amber-700 text-white py-2.5 px-4 text-xs sm:text-sm font-bold flex items-center shadow-inner transition animate-fadeIn relative z-[60] overflow-hidden">
          <div className="flex items-center space-x-2 mr-3 bg-amber-700 relative z-10 pr-2 flex-shrink-0">
            <span className="inline-block px-2 py-0.5 bg-white/20 text-white rounded text-[10px] uppercase tracking-wider">Announcement</span>
          </div>
          <div className="flex-1 overflow-hidden relative flex items-center min-w-0">
            <span className="animate-marquee whitespace-nowrap inline-block hover:[animation-play-state:paused] cursor-pointer">
              {banner.text}
            </span>
          </div>
          <button 
            onClick={() => dismissBanner(banner.id)}
            className="text-white/80 hover:text-white ml-3 focus:outline-none p-1 rounded hover:bg-white/10 relative z-10 bg-amber-700 pl-2 flex-shrink-0"
            title="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      )}
      {!isPropertyPage && (
        <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              {/* Logo */}
              <div className="flex items-center">
                <Link to="/" className="flex items-center space-x-2">
                  <span className="text-2xl font-black tracking-tight text-amber-700">Stay<span className="text-slate-800">pik</span></span>
                </Link>
                {role === 'OWNER' && (
                  <span className="ml-3 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    {mode === 'HOST' ? 'Host Mode' : 'Guest Mode'}
                  </span>
                )}
              </div>

              {/* Navigation Links */}
              <nav className="hidden md:flex space-x-8 text-sm font-semibold text-slate-600">
                {mode === 'HOST' ? (
                  <>
                    <Link to="/dashboard" className="flex items-center space-x-1.5 hover:text-amber-700 transition">
                      <LayoutDashboard size={16} />
                      <span>Dashboard</span>
                    </Link>
                    <Link to="/properties" className="flex items-center space-x-1.5 hover:text-amber-700 transition">
                      <Building size={16} />
                      <span>Properties</span>
                    </Link>
                    <Link to="/tenants" className="flex items-center space-x-1.5 hover:text-amber-700 transition">
                      <Users size={16} />
                      <span>Tenants</span>
                    </Link>
                    <Link to="/rent" className="flex items-center space-x-1.5 hover:text-amber-700 transition">
                      <DollarSign size={16} />
                      <span>Rent Tracking</span>
                    </Link>
                    <Link to="/bookings" className="flex items-center space-x-1.5 hover:text-amber-700 transition">
                      <Calendar size={16} />
                      <span>Visit Requests</span>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/" className="flex items-center space-x-1.5 hover:text-amber-700 transition">
                      <Compass size={16} />
                      <span>Explore</span>
                    </Link>
                    {user && (
                      <Link to="/bookings" className="flex items-center space-x-1.5 hover:text-amber-700 transition">
                        <Calendar size={16} />
                        <span>Visits History</span>
                      </Link>
                    )}
                  </>
                )}
              </nav>

              {/* Profile & Mode Switcher */}
              <div className="flex items-center space-x-4">
                {user ? (
                  <>
                    {/* Notification Bell */}
                    <div className="relative">
                      <button 
                        onClick={() => setShowNotifs(!showNotifs)}
                        className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition relative focus:outline-none"
                        title="Notifications"
                      >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                          <span className="absolute top-1 right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white ring-2 ring-white">
                            {unreadCount}
                          </span>
                        )}
                      </button>

                      {showNotifs && (
                        <div className="fixed top-16 left-4 right-4 sm:absolute sm:top-auto sm:left-auto sm:right-0 sm:w-80 mt-2.5 bg-white rounded-2xl border border-slate-100 shadow-xl py-3 z-50 animate-scaleIn origin-top-right max-h-96 overflow-y-auto">
                          <div className="px-4 py-2 border-b border-slate-50 flex items-center justify-between">
                            <span className="font-extrabold text-sm text-slate-800">Notifications</span>
                            <div className="flex space-x-2">
                              <button 
                                onClick={markAllRead} 
                                className="text-[10px] font-bold text-amber-700 hover:underline"
                              >
                                Mark read
                              </button>
                              <span className="text-slate-200">|</span>
                              <button 
                                onClick={clearAllNotifications} 
                                className="text-[10px] font-bold text-slate-400 hover:underline"
                              >
                                Clear all
                              </button>
                            </div>
                          </div>

                          <div className="divide-y divide-slate-50">
                            {notifications.length === 0 ? (
                              <div className="px-4 py-8 text-center text-xs font-semibold text-slate-400">
                                No notifications yet
                              </div>
                            ) : (
                              notifications.map((notif) => (
                                <div key={notif.id} className="p-4 hover:bg-slate-50 transition flex items-start space-x-3">
                                  <div className={`p-1.5 rounded-lg text-white flex-shrink-0 ${
                                    notif.notification_type === 'alert' ? 'bg-red-500' :
                                    notif.notification_type === 'promo' ? 'bg-amber-500' :
                                    notif.notification_type === 'update' ? 'bg-blue-500' : 'bg-slate-400'
                                  }`}>
                                    <Bell size={14} />
                                  </div>
                                  <div className="flex-1 min-w-0 text-left">
                                    <p className="text-xs font-black text-slate-800 leading-snug">{notif.title}</p>
                                    <p className="text-[11px] font-medium text-slate-500 mt-1 leading-normal">{notif.message}</p>
                                    <span className="text-[9px] font-bold text-slate-300 mt-1.5 block">
                                      {new Date(notif.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <Link to="/profile" className="flex items-center space-x-1.5 text-slate-700 hover:text-amber-700 transition">
                      <User size={18} />
                      <span className="hidden sm:inline text-sm font-semibold">{user.displayName || user.email}</span>
                    </Link>

                    <button 
                      onClick={() => { logout(); navigate('/login'); }}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition"
                      title="Logout"
                    >
                      <LogOut size={18} />
                    </button>
                  </>
                ) : (
                  <Link 
                    to="/login" 
                    className="inline-flex items-center px-4 py-2 text-sm font-bold rounded-full bg-amber-700 text-white shadow-sm hover:bg-amber-800 transition"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Mobile Sticky Bottom Nav */}
      {(isPropertyDetailPage || !isPropertyPage) && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 py-2 z-50 shadow-lg flex justify-around items-center">
          {mode === 'HOST' ? (
            <>
              <Link to="/dashboard" className="flex flex-col items-center text-xs font-semibold text-slate-500 hover:text-amber-700">
                <LayoutDashboard size={20} />
                <span className="mt-0.5">Metrics</span>
              </Link>
              <Link to="/properties" className="flex flex-col items-center text-xs font-semibold text-slate-500 hover:text-amber-700">
                <Building size={20} />
                <span className="mt-0.5">Properties</span>
              </Link>
              <Link to="/tenants" className="flex flex-col items-center text-xs font-semibold text-slate-500 hover:text-amber-700">
                <Users size={20} />
                <span className="mt-0.5">Tenants</span>
              </Link>
              <Link to="/rent" className="flex flex-col items-center text-xs font-semibold text-slate-500 hover:text-amber-700">
                <DollarSign size={20} />
                <span className="mt-0.5">Rent</span>
              </Link>
              <Link to="/profile" className="flex flex-col items-center text-xs font-semibold text-slate-500 hover:text-amber-700">
                <User size={20} />
                <span className="mt-0.5">Profile</span>
              </Link>
            </>
          ) : (
            <>
              <Link 
                to="/" 
                className={`flex flex-col items-center text-xs font-semibold transition ${
                  isActive('/') 
                    ? 'text-amber-700 font-extrabold' 
                    : 'text-slate-500 hover:text-amber-700'
                }`}
              >
                <Home size={20} className={isActive('/') ? 'stroke-[2.5px]' : ''} />
                <span className="mt-0.5">Home</span>
              </Link>
              <Link 
                to="/?focusSearch=true" 
                className={`flex flex-col items-center text-xs font-semibold transition ${
                  isActive('/search') 
                    ? 'text-amber-700 font-extrabold' 
                    : 'text-slate-500 hover:text-amber-700'
                }`}
              >
                <Search size={20} className={isActive('/search') ? 'stroke-[2.5px]' : ''} />
                <span className="mt-0.5">Search</span>
              </Link>
              <Link 
                to="/saved" 
                className={`flex flex-col items-center text-xs font-semibold transition ${
                  isActive('/saved') 
                    ? 'text-amber-700 font-extrabold' 
                    : 'text-slate-500 hover:text-amber-700'
                }`}
              >
                <Heart size={20} className={isActive('/saved') ? 'stroke-[2.5px]' : ''} />
                <span className="mt-0.5">Saved</span>
              </Link>
              <Link 
                to="/bookings" 
                className={`flex flex-col items-center text-xs font-semibold transition ${
                  isActive('/bookings') 
                    ? 'text-amber-700 font-extrabold' 
                    : 'text-slate-500 hover:text-amber-700'
                }`}
              >
                <Calendar size={20} className={isActive('/bookings') ? 'stroke-[2.5px]' : ''} />
                <span className="mt-0.5">Bookings</span>
              </Link>
              <Link 
                to="/profile" 
                className={`flex flex-col items-center text-xs font-semibold transition ${
                  isActive('/profile') 
                    ? 'text-amber-700 font-extrabold' 
                    : 'text-slate-500 hover:text-amber-700'
                }`}
              >
                <User size={20} className={isActive('/profile') ? 'stroke-[2.5px]' : ''} />
                <span className="mt-0.5">Profile</span>
              </Link>
            </>
          )}
        </div>
      )}
    </>
  );
}
