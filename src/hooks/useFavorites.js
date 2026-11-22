import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'soundora-favorites';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function useFavorites() {
  const [favorites, setFavorites] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // localStorage có thể bị chặn, bỏ qua
    }
  }, [favorites]);

  const isFavorite = useCallback(
    (id) => favorites.some((s) => s.id === id),
    [favorites]
  );

  const toggleFavorite = useCallback((song) => {
    setFavorites((prev) =>
      prev.some((s) => s.id === song.id)
        ? prev.filter((s) => s.id !== song.id)
        : [
            ...prev,
            {
              id: song.id,
              title: song.title,
              artist: song.artist,
              url: song.url,
              score: song.score,
              mood_tags: song.mood_tags || [],
            },
          ]
    );
  }, []);

  return { favorites, isFavorite, toggleFavorite };
}
