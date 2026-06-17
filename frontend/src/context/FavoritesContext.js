// src/context/FavoritesContext.js
import { createContext, useContext, useState, useEffect } from 'react';

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('staypik_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('staypik_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (pkg) => {
    setFavorites(prev => {
      const exists = prev.find(p => p.id === pkg.id);
      if (exists) return prev.filter(p => p.id !== pkg.id);
      return [...prev, pkg];
    });
  };

  const isFavorite = (id) => favorites.some(p => p.id === id);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => useContext(FavoritesContext);
