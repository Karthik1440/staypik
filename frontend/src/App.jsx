// src/App.js — Staypik Rental Routing
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HelmetProvider } from 'react-helmet-async';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';

// Global Header/Footer Layout
import Header from './components/Header';
import Footer from './components/Footer';

// Pages
import Login from './pages/Login';
import Profile from './pages/Profile';

// Guest Pages
import Home from './pages/Home';
import PropertyDetail from './pages/PropertyDetail';
import VisitBooking from './pages/VisitBooking';
import BookingSuccess from './pages/BookingSuccess';
import Bookings from './pages/Bookings';
import Saved from './pages/Saved';
import TermsPrivacy from './pages/TermsPrivacy';

// Host Pages
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import AddEditProperty from './pages/AddEditProperty';
import Tenants from './pages/Tenants';
import RentTracking from './pages/RentTracking';

function AppContent() {
  const { user, mode } = useAuth();
  const location = useLocation();
  const isPropertyDetail = location.pathname.startsWith('/property/');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20 md:pb-0">
      <Header />
      <main className={`flex-grow ${isPropertyDetail ? "w-full" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full"}`}>
        <Routes>
          {/* Public Authentication */}
          <Route path="/login" element={user ? <Navigate to={mode === 'HOST' ? '/dashboard' : '/'} /> : <Login />} />
          <Route path="/terms-privacy" element={<TermsPrivacy />} />

          {/* Shared Profile Page */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          {/* Conditionally render Guest vs Host routes */}
          {mode === 'HOST' ? (
            <>
              {/* Owner Host Panel */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/properties" element={<ProtectedRoute><Properties /></ProtectedRoute>} />
              <Route path="/properties/new" element={<ProtectedRoute><AddEditProperty /></ProtectedRoute>} />
              <Route path="/properties/edit/:id" element={<ProtectedRoute><AddEditProperty /></ProtectedRoute>} />
              <Route path="/tenants" element={<ProtectedRoute><Tenants /></ProtectedRoute>} />
              <Route path="/rent" element={<ProtectedRoute><RentTracking /></ProtectedRoute>} />
              <Route path="/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
              
              {/* Fallback to dashboard */}
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </>
          ) : (
            <>
              {/* Guest Rentals Board */}
              <Route path="/" element={<Home />} />
              <Route path="/property/:id" element={<PropertyDetail />} />
              <Route path="/property/:id/book" element={<ProtectedRoute><VisitBooking /></ProtectedRoute>} />
              <Route path="/property/:id/success" element={<ProtectedRoute><BookingSuccess /></ProtectedRoute>} />
              <Route path="/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
              <Route path="/saved" element={<Saved />} />

              {/* Fallback to explore */}
              <Route path="*" element={<Navigate to="/" />} />
            </>
          )}
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <HelmetProvider>
        <AuthProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </AuthProvider>
      </HelmetProvider>
    </BrowserRouter>
  );
}