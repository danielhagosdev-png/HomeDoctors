/**
 * api.js
 *
 * Primary data source: assets/diseases.json  (1 008 diseases, generated locally)
 * Image source:        Open-i NLM API (best-effort, no auth required)
 * Fallback:            diseases.json always works offline
 */

import { getCached, setCache } from '../utils/storage';

// ─── Local dataset (bundled with the app) ────────────────────────────────────
const LOCAL_DB = require('../assets/diseases.json');

/** Quick lookup: category_id → disease[] */
const BY_CATEGORY = {};
for (const d of LOCAL_DB.diseases) {
  if (!BY_CATEGORY[d.category_id]) BY_CATEGORY[d.category_id] = [];
  BY_CATEGORY[d.category_id].push(d);
}

// ─── Open-i NLM image search ─────────────────────────────────────────────────
const OPENI_BASE = 'https://openi.nlm.nih.gov/api/search';

// ─── 14 Categories (matches diseases.json category_id keys) ──────────────────
export const CATEGORIES = [
  { id: 'eyes',        label: 'Eyes',              icon: '👁️',  color: '#4ECDC4' },
  { id: 'teeth',       label: 'Teeth & Mouth',     icon: '🦷',  color: '#FFE66D' },
  { id: 'skin',        label: 'Skin',              icon: '🩹',  color: '#FF6B6B' },
  { id: 'stomach',     label: 'Stomach',           icon: '🫃',  color: '#A8E6CF' },
  { id: 'fever',       label: 'Fever & Flu',       icon: '🤒',  color: '#FFB347' },
  { id: 'injuries',    label: 'Injuries',          icon: '🩼',  color: '#C9B1FF' },
  { id: 'respiratory', label: 'Respiratory',       icon: '🫁',  color: '#74B9FF' },
  { id: 'head',        label: 'Head & Ear',        icon: '🧠',  color: '#FD79A8' },
  { id: 'bones',       label: 'Bones & Joints',    icon: '🦴',  color: '#B8D4FF' },
  { id: 'heart',       label: 'Heart & Blood',     icon: '❤️',  color: '#FF8A80' },
  { id: 'mental',      label: 'Mental Health',     icon: '🧘',  color: '#CE93D8' },
  { id: 'urinary',     label: 'Urinary',           icon: '💧',  color: '#80DEEA' },
  { id: 'womens',      label: "Women's Health",    icon: '🌸',  color: '#F48FB1' },
  { id: 'childrens',   label: "Children's Health", icon: '👶',  color: '#FFCC80' },
];

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns enriched disease list for a category.
 * Serves from AsyncStorage cache (24h TTL) when available.
 */
export async function fetchDiseasesByCategory(categoryId) {
  const cacheKey = `v2_diseases_${categoryId}`;
  const cached = await getCached(cacheKey);
  if (cached) return cached;

  const raw = BY_CATEGORY[categoryId] || [];
  if (raw.length === 0) throw new Error(`No diseases for: ${categoryId}`);

  // Enrich with images (best-effort — never blocks rendering)
  const enriched = await Promise.all(
    raw.map(async (d) => {
      const img = await fetchDiseaseImage(d.name);
      return { ...d, image: img };
    })
  );

  await setCache(cacheKey, enriched);
  return enriched;
}

/**
 * Fetch an image from Open-i NLM for a disease name.
 * Returns null silently on any failure.
 */
export async function fetchDiseaseImage(query) {
  try {
    const url = `${OPENI_BASE}?q=${encodeURIComponent(query)}&ctype=1&m=1&n=1`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const json = await res.json();
    const list = json.list || [];
    if (list.length > 0 && list[0].imgLarge) {
      return `https://openi.nlm.nih.gov/${list[0].imgLarge}`;
    }
  } catch {}
  return null;
}

/**
 * Full-text search across all 1 008 diseases (name, intro, category).
 */
export function searchDiseases(query) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return LOCAL_DB.diseases
    .filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.intro.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)
    )
    .slice(0, 50);
}

export const TOTAL_DISEASES = LOCAL_DB.total;
