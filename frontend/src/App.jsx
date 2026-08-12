import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HelmetProvider } from 'react-helmet-async';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';

import HostLayout from './components/HostLayout';

// Global Header/Footer Layout
import Header from './components/Header';
import Footer from './components/Footer';

// Lazy Loaded Pages
const Login = lazy(() => import('./pages/Login'));
const Profile = lazy(() => import('./pages/Profile'));

// Guest Pages
const Home = lazy(() => import('./pages/Home'));
const PropertyDetail = lazy(() => import('./pages/PropertyDetail'));
const VisitBooking = lazy(() => import('./pages/VisitBooking'));
const BookingSuccess = lazy(() => import('./pages/BookingSuccess'));
const Bookings = lazy(() => import('./pages/Bookings'));
const Saved = lazy(() => import('./pages/Saved'));
const TermsPrivacy = lazy(() => import('./pages/TermsPrivacy'));

// Host Pages
const Properties = lazy(() => import('./pages/Properties'));
const AddEditProperty = lazy(() => import('./pages/AddEditProperty'));
const HostDashboard = lazy(() => import('./pages/HostDashboard'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  );
}

function AppContent() {
  const { user, mode } = useAuth();
  const location = useLocation();
  const isPropertyDetail = location.pathname.startsWith('/property/');
  const isFullWidthPage = isPropertyDetail || mode === 'HOST';

  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col pb-20 md:pb-0 ${mode === 'HOST' ? 'host-mode font-proxima' : ''}`}>

      <Header />
      <main className={`flex-grow ${isFullWidthPage ? "w-full p-0 m-0" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full"}`}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Authentication */}
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
            <Route path="/terms-privacy" element={<TermsPrivacy />} />

            {/* Conditionally render Guest vs Host routes */}
            {mode === 'HOST' || user?.isAdmin ? (
              <Route element={<ProtectedRoute><HostLayout /></ProtectedRoute>}>
                {/* Owner Host / Admin Panel */}
                <Route path="/" element={<HostDashboard />} />
                <Route path="/dashboard" element={<HostDashboard />} />
                <Route path="/properties" element={<Properties />} />
                <Route path="/properties/new" element={<AddEditProperty />} />
                <Route path="/properties/edit/:id" element={<AddEditProperty />} />
                <Route path="/properties/:id/rooms" element={<Navigate to="/properties" replace />} />
                <Route path="/room-vacancies" element={<Navigate to="/properties" replace />} />
                <Route path="/bookings" element={<Bookings />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/property/:id" element={<PropertyDetail />} />
                <Route path="/property/:id/book" element={<VisitBooking />} />
                <Route path="/property/:id/success" element={<BookingSuccess />} />
                <Route path="/saved" element={<Saved />} />
                
                {/* Fallback to dashboard */}
                <Route path="*" element={<Navigate to="/" />} />
              </Route>
            ) : (
              <>
                {/* Guest Profile */}
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />

                {/* Guest Rentals Board */}
                <Route path="/" element={<Home />} />
                <Route path="/property/:id" element={<PropertyDetail />} />
                <Route path="/property/:id/book" element={<ProtectedRoute><VisitBooking /></ProtectedRoute>} />
                <Route path="/property/:id/success" element={<ProtectedRoute><BookingSuccess /></ProtectedRoute>} />
                <Route path="/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
                <Route path="/saved" element={<Saved />} />

                {/* Fallback to Home */}
                <Route path="*" element={<Navigate to="/" />} />
              </>
            )}
          </Routes>
        </Suspense>
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