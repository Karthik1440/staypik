// src/context/AuthContext.js
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { auth } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import axios from 'axios';

const AuthContext = createContext();

let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
if (!API_URL.endsWith('/api') && !API_URL.endsWith('/api/')) {
  API_URL = API_URL.replace(/\/$/, '') + '/api';
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('USER'); // USER or OWNER
  const [mode, setMode] = useState('GUEST'); // GUEST or HOST
  const [loading, setLoading] = useState(true);
  const pendingDisplayName = useRef(null);

  const refreshProfile = useCallback(async (token) => {
    const accessToken = token || localStorage.getItem('staypik_access_token');
    if (!accessToken) return;

    try {
      const res = await axios.get(`${API_URL}/rentals/profile/`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const userData = res.data.user;
      setRole(userData.role);
      
      setUser(prev => {
        if (!prev) return null;
        return {
          ...prev,
          displayName: userData.display_name,
          avatar: userData.avatar,
          isOwnerApproved: userData.is_owner_approved,
        };
      });

      // Auto-set mode based on role or user choice
      const savedMode = localStorage.getItem('staypik_mode');
      if (userData.role === 'OWNER' && savedMode === 'HOST' && userData.is_owner_approved) {
        setMode('HOST');
      } else {
        setMode('GUEST');
      }
    } catch (err) {
      console.error("Failed to fetch user profile", err);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          
          // Exchange Firebase token for Django SimpleJWT
          const payload = { idToken };
          if (pendingDisplayName.current) {
            payload.displayName = pendingDisplayName.current;
          }
          const exchangeRes = await axios.post(`${API_URL}/auth/firebase-login/`, payload);
          const { tokens, user: djangoUser } = exchangeRes.data;
          pendingDisplayName.current = null;
          
          localStorage.setItem('staypik_access_token', tokens.access);
          localStorage.setItem('staypik_refresh_token', tokens.refresh);
          
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: djangoUser.display_name,
            avatar: djangoUser.avatar,
            isOwnerApproved: djangoUser.is_owner_approved,
          });
          setRole(djangoUser.role);

          const savedMode = localStorage.getItem('staypik_mode') || 'GUEST';
          if (djangoUser.role === 'OWNER' && djangoUser.is_owner_approved) {
            setMode(savedMode);
          } else {
            setMode('GUEST');
          }
        } catch (err) {
          console.error("Authentication token exchange failed:", err);
          handleSignOut();
        }
      } else {
        handleSignOut();
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [refreshProfile]);

  const handleSignOut = () => {
    localStorage.removeItem('staypik_access_token');
    localStorage.removeItem('staypik_refresh_token');
    localStorage.removeItem('staypik_mode');
    setUser(null);
    setRole('USER');
    setMode('GUEST');
  };

  const register = useCallback((email, password, displayName) => {
    pendingDisplayName.current = displayName;
    return createUserWithEmailAndPassword(auth, email, password);
  }, []);

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const djangoLogin = async (email, password) => {
    const res = await axios.post(`${API_URL}/auth/django-login/`, { email, password });
    const { tokens, user: djangoUser } = res.data;
    
    localStorage.setItem('staypik_access_token', tokens.access);
    localStorage.setItem('staypik_refresh_token', tokens.refresh);
    
    setUser({
      uid: djangoUser.username,
      email: djangoUser.email,
      displayName: djangoUser.display_name,
      avatar: djangoUser.avatar,
      isOwnerApproved: djangoUser.is_owner_approved,
    });
    setRole(djangoUser.role);

    const savedMode = localStorage.getItem('staypik_mode') || 'GUEST';
    if (djangoUser.role === 'OWNER' && djangoUser.is_owner_approved) {
      setMode(savedMode);
    } else {
      setMode('GUEST');
    }
    return res.data;
  };

  const logout = async () => {
    await signOut(auth);
    handleSignOut();
  };

  const toggleMode = () => {
    if (role !== 'OWNER') return;
    if (user && !user.isOwnerApproved) {
      alert("Your owner profile is currently pending admin approval. You cannot access host mode yet.");
      return;
    }
    const newMode = mode === 'GUEST' ? 'HOST' : 'GUEST';
    setMode(newMode);
    localStorage.setItem('staypik_mode', newMode);
  };

  const resetPassword = (email) =>
    sendPasswordResetEmail(auth, email);

  return (
    <AuthContext.Provider value={{ user, role, mode, setMode, toggleMode, loading, register, login, djangoLogin, logout, refreshProfile, resetPassword }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);