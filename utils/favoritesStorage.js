/**
 * favoritesStorage.js
 * Stores bookmarked disease IDs in AsyncStorage.
 * The full disease objects are resolved from the master JSON at read time,
 * so the store stays small and always has fresh data.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'favorites'; // simple key as requested

export async function getFavoriteIds() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function isFavorite(diseaseId) {
  const ids = await getFavoriteIds();
  return ids.includes(diseaseId);
}

/** Returns true if now favorited, false if removed */
export async function toggleFavoriteId(diseaseId) {
  try {
    const ids = await getFavoriteIds();
    const idx = ids.indexOf(diseaseId);
    if (idx === -1) ids.push(diseaseId);
    else ids.splice(idx, 1);
    await AsyncStorage.setItem(KEY, JSON.stringify(ids));
    return idx === -1;
  } catch { return false; }
}

export async function clearFavorites() {
  try { await AsyncStorage.removeItem(KEY); } catch {}
}
