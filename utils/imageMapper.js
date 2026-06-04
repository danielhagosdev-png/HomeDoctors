/**
 * imageMapper.js
 *
 * Maps a disease category_id to:
 *  - gradient  : two-colour array for LinearGradient
 *  - accent    : single highlight colour
 *  - icon      : Ionicons name (from @expo/vector-icons)
 *  - emoji     : fallback text emoji
 */

export const CATEGORY_META = {
  eyes: {
    gradient: ['#00C9FF', '#92FE9D'],
    accent:   '#00C9FF',
    icon:     'eye-outline',
    emoji:    '👁️',
    label:    'Eyes',
  },
  teeth: {
    gradient: ['#F7971E', '#FFD200'],
    accent:   '#F7971E',
    icon:     'happy-outline',
    emoji:    '🦷',
    label:    'Teeth & Mouth',
  },
  skin: {
    gradient: ['#FF6B6B', '#FFA07A'],
    accent:   '#FF6B6B',
    icon:     'body-outline',
    emoji:    '🩹',
    label:    'Skin',
  },
  stomach: {
    gradient: ['#43E97B', '#38F9D7'],
    accent:   '#43E97B',
    icon:     'nutrition-outline',
    emoji:    '🫃',
    label:    'Stomach',
  },
  fever: {
    gradient: ['#FA709A', '#FEE140'],
    accent:   '#FA709A',
    icon:     'thermometer-outline',
    emoji:    '🤒',
    label:    'Fever & Flu',
  },
  injuries: {
    gradient: ['#A18CD1', '#FBC2EB'],
    accent:   '#A18CD1',
    icon:     'bandage-outline',
    emoji:    '🩼',
    label:    'Injuries',
  },
  respiratory: {
    gradient: ['#4481EB', '#04BEFE'],
    accent:   '#4481EB',
    icon:     'cloud-outline',
    emoji:    '🫁',
    label:    'Respiratory',
  },
  head: {
    gradient: ['#FD79A8', '#E17055'],
    accent:   '#FD79A8',
    icon:     'medical-outline',
    emoji:    '🧠',
    label:    'Head & Ear',
  },
  bones: {
    gradient: ['#89F7FE', '#66A6FF'],
    accent:   '#66A6FF',
    icon:     'fitness-outline',
    emoji:    '🦴',
    label:    'Bones & Joints',
  },
  heart: {
    gradient: ['#FF416C', '#FF4B2B'],
    accent:   '#FF416C',
    icon:     'heart-outline',
    emoji:    '❤️',
    label:    'Heart & Blood',
  },
  mental: {
    gradient: ['#B06AB3', '#4568DC'],
    accent:   '#B06AB3',
    icon:     'leaf-outline',
    emoji:    '🧘',
    label:    'Mental Health',
  },
  urinary: {
    gradient: ['#56CCF2', '#2F80ED'],
    accent:   '#56CCF2',
    icon:     'water-outline',
    emoji:    '💧',
    label:    'Urinary',
  },
  womens: {
    gradient: ['#FDA085', '#F6D365'],
    accent:   '#FDA085',
    icon:     'flower-outline',
    emoji:    '🌸',
    label:    "Women's Health",
  },
  childrens: {
    gradient: ['#FCCB90', '#D57EEB'],
    accent:   '#FCCB90',
    icon:     'happy-outline',
    emoji:    '👶',
    label:    "Children's Health",
  },
};

const DEFAULT_META = {
  gradient: ['#1a8fe3', '#4ECDC4'],
  accent:   '#1a8fe3',
  icon:     'medkit-outline',
  emoji:    '⚕️',
  label:    'General',
};

/** Get visual meta for a category_id or category label string */
export function getCategoryMeta(categoryIdOrLabel) {
  if (!categoryIdOrLabel) return DEFAULT_META;
  const key = categoryIdOrLabel.toLowerCase().replace(/[^a-z]/g, '');
  // Direct match
  if (CATEGORY_META[categoryIdOrLabel]) return CATEGORY_META[categoryIdOrLabel];
  // Fuzzy match by checking if key starts with known id
  for (const [id, meta] of Object.entries(CATEGORY_META)) {
    if (key.startsWith(id) || id.startsWith(key)) return meta;
  }
  return DEFAULT_META;
}
