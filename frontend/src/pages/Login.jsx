import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, djangoLogin, register, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isRegister) {
        if (!name) throw new Error("Please enter your display name.");
        await register(email, password, name);
      } else {
        try {
          // 1. Try Firebase Authentication
          await login(email, password);
        } catch (firebaseErr) {
          console.warn("Firebase Auth returned error, attempting direct database fallback login...", firebaseErr);
          // 2. Direct database auth fallback (bypasses Firebase)
          await djangoLogin(email, password);
        }
      }
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || err.message || "Failed to authenticate. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address to request a password reset.");
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await resetPassword(email);
      setMessage("Password reset email sent! Please check your inbox.");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to send password reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden p-8 sm:p-10">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black tracking-tight text-slate-800">
          {isRegister ? 'Create an Account' : 'Welcome Back'}
        </h2>
        <p className="text-sm font-semibold text-slate-400 mt-2">
          {isRegister ? 'Join Staypik to find or manage premium PGs' : 'Sign in to access your PG & rental dashboard'}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 border border-red-100 text-sm font-medium flex items-center space-x-2">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 text-green-700 border border-green-100 text-sm font-medium flex items-center space-x-2">
          <CheckCircle size={16} className="flex-shrink-0 text-green-600" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {isRegister && (
          <div className="relative">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                required
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-700 focus:bg-white transition"
                placeholder="e.g. Ananya Sen"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="email"
              required
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-700 focus:bg-white transition"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="password"
              required
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-700 focus:bg-white transition"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {!isRegister && (
            <div className="flex justify-end mt-1.5">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline transition"
              >
                Forgot Password?
              </button>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2"
        >
          <span>{loading ? 'Processing...' : (isRegister ? 'Sign Up' : 'Sign In')}</span>
          {!loading && <ArrowRight size={16} />}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-100 text-center">
        <button
          onClick={() => { setIsRegister(!isRegister); setError(''); setMessage(''); }}
          className="text-sm font-bold text-amber-700 hover:underline"
        >
          {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  );
}
