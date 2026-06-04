import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'hd_cache_';
const INTERSTITIAL_KEY = 'hd_interstitial_count';
const DISCLAIMER_KEY = 'hd_disclaimer_accepted';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function getCached(key) {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL_MS) {
      await AsyncStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export async function setCache(key, data) {
  try {
    await AsyncStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch {}
}

export async function getInterstitialCount() {
  try {
    const val = await AsyncStorage.getItem(INTERSTITIAL_KEY);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}

export async function incrementInterstitialCount() {
  try {
    const count = await getInterstitialCount();
    await AsyncStorage.setItem(INTERSTITIAL_KEY, String(count + 1));
    return count + 1;
  } catch {
    return 0;
  }
}

export async function resetInterstitialCount() {
  try {
    await AsyncStorage.setItem(INTERSTITIAL_KEY, '0');
  } catch {}
}

export async function hasAcceptedDisclaimer() {
  try {
    const val = await AsyncStorage.getItem(DISCLAIMER_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

export async function acceptDisclaimer() {
  try {
    await AsyncStorage.setItem(DISCLAIMER_KEY, 'true');
  } catch {}
}

// ─── Favorites (bookmarked diseases) ─────────────────────────────────────────
const FAVORITES_KEY = 'hd_favorites';

/** Returns the full saved disease objects (not just IDs) */
export async function getFavorites() {
  try {
    const raw = await AsyncStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function isFavorite(diseaseId) {
  const list = await getFavorites();
  return list.some((d) => d.id === diseaseId);
}

/** Toggles a disease in favorites. Returns true if now favorited. */
export async function toggleFavorite(disease) {
  try {
    const list = await getFavorites();
    const idx  = list.findIndex((d) => d.id === disease.id);
    if (idx === -1) list.push(disease);
    else list.splice(idx, 1);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
    return idx === -1;
  } catch { return false; }
}

// ─── Appointments ─────────────────────────────────────────────────────────────
const APPOINTMENTS_KEY = 'hd_appointments';

export async function getAppointments() {
  try {
    const raw = await AsyncStorage.getItem(APPOINTMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function saveAppointments(list) {
  try { await AsyncStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(list)); } catch {}
}

// ─── Medications ──────────────────────────────────────────────────────────────
const MEDICATIONS_KEY = 'hd_medications';

export async function getMedications() {
  try {
    const raw = await AsyncStorage.getItem(MEDICATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function saveMedications(list) {
  try { await AsyncStorage.setItem(MEDICATIONS_KEY, JSON.stringify(list)); } catch {}
}
