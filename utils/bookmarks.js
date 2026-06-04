import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'hd_bookmarks';

export async function getBookmarks() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function isBookmarked(diseaseId) {
  const list = await getBookmarks();
  return list.includes(diseaseId);
}

export async function toggleBookmark(disease) {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const ids  = raw ? JSON.parse(raw) : [];
    const idx  = ids.indexOf(disease.id);
    if (idx === -1) ids.push(disease.id);
    else ids.splice(idx, 1);
    await AsyncStorage.setItem(KEY, JSON.stringify(ids));
    return idx === -1; // true = now bookmarked
  } catch { return false; }
}
