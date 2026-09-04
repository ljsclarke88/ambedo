// ---------------------------------------------------------------------------
// A 3-tier "feelings wheel" — 6 core families, each with several ring2
// sub-categories, each with several specific ring3 words — matching the
// structure of a standard feelings-wheel reference chart (Anger / Fear /
// Sadness / Surprise / Love / Joy), rather than Plutchik's 8-family/dyad
// circumplex the app previously used.
//
// Every word still carries valence/arousal/dominance (Russell 1980 circumplex
// + Mehrabian & Russell 1977 PAD), sourced/extrapolated the same way as
// before (Warriner, Kuperman & Brysbaert 2013 norms, nearest-neighbour
// estimation for words outside that lexicon) — the cross-modal science
// (colour/sound/taste/scent/geometry/motion, all in lib/mappings.ts) is a
// pure function of these three numbers plus hue, so it applies to every
// node here unchanged.
// ---------------------------------------------------------------------------

export type WheelTier = 'ring1' | 'ring2' | 'ring3';
export type IntensityLevel = WheelTier; // kept name for minimal churn elsewhere

export interface EmotionVariant {
  label: string;
  valence: number;
  arousal: number;
  dominance: number;
}

// Flat anchor for the blend engine — every ring1 + ring2 + ring3 node.
export interface EmotionNode {
  id: string;
  label: string;
  angle: number;
  radius: number;     // normalised 0–1 within the wheel (0 = centre, 1 = outer edge)
  valence: number;
  arousal: number;
  dominance: number;
  hue: number;
  sourceId: string;   // root family id
  intensity: IntensityLevel;
}

export interface Ring3Word extends EmotionVariant {}

export interface Ring2Category extends EmotionVariant {
  label: string;
  words: Ring3Word[];
}

export interface CoreFamily extends EmotionVariant {
  id: string;
  label: string;
  hue: number;   // 0–360, Jonauskaite et al. (2023)-consistent colour anchor
  angle: number; // degrees, clockwise from top — polarToCartesian uses (angleDeg - 90), so 0 = 12 o'clock, 90 = 3 o'clock, 180 = 6 o'clock, 270 = 9 o'clock
  categories: Ring2Category[];
}

// Ring radius anchors, normalised 0–1. Must match EmotionWheel.tsx's pixel
// ring geometry (ring1 40–150, ring2 150–260, ring3 260–420, all normalised
// against the outer radius 420) so that clicking a wedge and rendering the
// indicator dot at that node's radius always land in the same place.
export const RING_RADIUS: Record<WheelTier, number> = {
  ring1: (40 + 150) / 2 / 420,
  ring2: (150 + 260) / 2 / 420,
  ring3: (260 + 420) / 2 / 420,
};

function slug(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ---------------------------------------------------------------------------
// WHEEL — the 6 core families, each 60° wide, in clockwise order from top.
// ---------------------------------------------------------------------------

export const WHEEL: CoreFamily[] = [
  {
    id: 'anger', label: 'Anger', hue: 330, angle: 0,
    valence: -0.65, arousal: 0.65, dominance: 0.60,
    categories: [
      {
        label: 'Annoyed', valence: -0.42, arousal: 0.48, dominance: 0.50,
        words: [
          { label: 'Irritable', valence: -0.42, arousal: 0.50, dominance: 0.29 },
          { label: 'Aggravated', valence: -0.55, arousal: 0.62, dominance: 0.29 },
          { label: 'Agitated', valence: -0.45, arousal: 0.70, dominance: 0.31 },
        ],
      },
      {
        label: 'Frustrated', valence: -0.60, arousal: 0.72, dominance: 0.48,
        words: [
          { label: 'Exasperated', valence: -0.50, arousal: 0.58, dominance: 0.24 },
          { label: 'Indignant', valence: -0.65, arousal: 0.70, dominance: 0.65 },
        ],
      },
      {
        label: 'Envious', valence: -0.55, arousal: 0.60, dominance: 0.45,
        words: [
          { label: 'Jealous', valence: -0.60, arousal: 0.65, dominance: 0.48 },
          { label: 'Resentful', valence: -0.68, arousal: 0.60, dominance: 0.58 },
          { label: 'Bitter', valence: -0.65, arousal: 0.55, dominance: 0.52 },
          { label: 'Envy', valence: -0.50, arousal: 0.55, dominance: 0.42 },
        ],
      },
      {
        label: 'Contemptuous', valence: -0.70, arousal: 0.60, dominance: 0.78,
        words: [
          { label: 'Scornful', valence: -0.75, arousal: 0.65, dominance: 0.80 },
          { label: 'Disdainful', valence: -0.70, arousal: 0.58, dominance: 0.78 },
          { label: 'Condescending', valence: -0.60, arousal: 0.55, dominance: 0.80 },
          { label: 'Smug', valence: -0.38, arousal: 0.50, dominance: 0.80 },
        ],
      },
      {
        label: 'Furious', valence: -0.88, arousal: 0.95, dominance: 0.82,
        words: [
          { label: 'Enraged', valence: -0.90, arousal: 0.97, dominance: 0.80 },
          { label: 'Livid', valence: -0.85, arousal: 0.92, dominance: 0.82 },
          { label: 'Rage', valence: -0.92, arousal: 0.98, dominance: 0.80 },
          { label: 'Hostile', valence: -0.72, arousal: 0.70, dominance: 0.68 },
          { label: 'Hate', valence: -0.80, arousal: 0.68, dominance: 0.62 },
        ],
      },
      {
        label: 'Aggressive', valence: -0.40, arousal: 0.85, dominance: 0.85,
        words: [
          { label: 'Determined', valence: 0.22, arousal: 0.75, dominance: 0.85 },
          { label: 'Driven', valence: 0.25, arousal: 0.78, dominance: 0.85 },
          { label: 'Competitive', valence: 0.12, arousal: 0.75, dominance: 0.78 },
        ],
      },
    ],
  },
  {
    id: 'fear', label: 'Fear', hue: 20, angle: 300,
    valence: -0.65, arousal: 0.65, dominance: 0.20,
    categories: [
      {
        label: 'Nervous', valence: -0.55, arousal: 0.65, dominance: 0.28,
        words: [
          { label: 'Uneasy', valence: -0.50, arousal: 0.55, dominance: 0.28 },
          { label: 'Worried', valence: -0.60, arousal: 0.62, dominance: 0.25 },
          { label: 'Anxious', valence: -0.65, arousal: 0.75, dominance: 0.25 },
        ],
      },
      {
        label: 'Scared', valence: -0.75, arousal: 0.80, dominance: 0.18,
        words: [
          { label: 'Frightened', valence: -0.78, arousal: 0.75, dominance: 0.15 },
          { label: 'Panicked', valence: -0.90, arousal: 0.96, dominance: 0.08 },
          { label: 'Panic', valence: -0.85, arousal: 0.90, dominance: 0.10 },
          { label: 'Hysterical', valence: -0.55, arousal: 0.85, dominance: 0.19 },
        ],
      },
      {
        label: 'Insecure', valence: -0.50, arousal: 0.45, dominance: 0.18,
        words: [
          { label: 'Humble', valence: 0.30, arousal: 0.20, dominance: 0.25 },
          { label: 'Meek', valence: 0.08, arousal: 0.28, dominance: 0.15 },
          { label: 'Timid', valence: -0.15, arousal: 0.45, dominance: 0.20 },
          { label: 'Inferior', valence: -0.45, arousal: 0.36, dominance: 0.17 },
          { label: 'Inadequate', valence: -0.50, arousal: 0.40, dominance: 0.16 },
          { label: 'Vulnerable', valence: -0.55, arousal: 0.45, dominance: 0.15 },
        ],
      },
      {
        label: 'Horrified', valence: -0.88, arousal: 0.92, dominance: 0.08,
        words: [
          { label: 'Horror', valence: -0.85, arousal: 0.88, dominance: 0.10 },
          { label: 'Terror', valence: -0.92, arousal: 0.96, dominance: 0.08 },
          { label: 'Dread', valence: -0.82, arousal: 0.80, dominance: 0.12 },
          { label: 'Mortified', valence: -0.65, arousal: 0.56, dominance: 0.16 },
        ],
      },
    ],
  },
  {
    id: 'sadness', label: 'Sadness', hue: 260, angle: 60,
    valence: -0.65, arousal: 0.30, dominance: 0.20,
    categories: [
      {
        label: 'Lonely', valence: -0.70, arousal: 0.22, dominance: 0.15,
        words: [
          { label: 'Isolated', valence: -0.55, arousal: 0.30, dominance: 0.20 },
          { label: 'Forlorn', valence: -0.85, arousal: 0.18, dominance: 0.08 },
          { label: 'Neglected', valence: -0.55, arousal: 0.36, dominance: 0.20 },
        ],
      },
      {
        label: 'Depressed', valence: -0.85, arousal: 0.24, dominance: 0.12,
        words: [
          { label: 'Melancholy', valence: -0.72, arousal: 0.22, dominance: 0.22 },
          { label: 'Gloomy', valence: -0.65, arousal: 0.20, dominance: 0.20 },
          { label: 'Despair', valence: -0.85, arousal: 0.45, dominance: 0.15 },
          { label: 'Powerless', valence: -0.69, arousal: 0.35, dominance: 0.10 },
          { label: 'Helpless', valence: -0.80, arousal: 0.22, dominance: 0.05 },
        ],
      },
      {
        label: 'Hurt', valence: -0.68, arousal: 0.35, dominance: 0.15,
        words: [
          { label: 'Sorrow', valence: -0.78, arousal: 0.25, dominance: 0.15 },
          { label: 'Sorrowful', valence: -0.80, arousal: 0.28, dominance: 0.15 },
          { label: 'Devastated', valence: -0.96, arousal: 0.42, dominance: 0.08 },
          { label: 'Heartbroken', valence: -0.90, arousal: 0.36, dominance: 0.08 },
        ],
      },
      {
        label: 'Guilty', valence: -0.75, arousal: 0.45, dominance: 0.18,
        words: [
          { label: 'Ashamed', valence: -0.78, arousal: 0.42, dominance: 0.15 },
          { label: 'Regretful', valence: -0.65, arousal: 0.35, dominance: 0.25 },
          { label: 'Embarrassed', valence: -0.60, arousal: 0.52, dominance: 0.20 },
          { label: 'Sheepish', valence: -0.45, arousal: 0.38, dominance: 0.22 },
          { label: 'Shameful', valence: -0.70, arousal: 0.47, dominance: 0.11 },
        ],
      },
      {
        label: 'Disappointed', valence: -0.60, arousal: 0.48, dominance: 0.28,
        words: [
          { label: 'Disillusioned', valence: -0.65, arousal: 0.45, dominance: 0.28 },
          { label: 'Let down', valence: -0.55, arousal: 0.45, dominance: 0.25 },
          { label: 'Dismayed', valence: -0.53, arousal: 0.44, dominance: 0.22 },
          { label: 'Displeased', valence: -0.45, arousal: 0.36, dominance: 0.33 },
        ],
      },
      {
        label: 'Grief', valence: -0.96, arousal: 0.38, dominance: 0.10,
        words: [
          { label: 'Bereaved', valence: -0.92, arousal: 0.35, dominance: 0.08 },
          { label: 'Suffering', valence: -0.80, arousal: 0.55, dominance: 0.15 },
          { label: 'Resigned', valence: -0.65, arousal: 0.15, dominance: 0.20 },
          { label: 'Wistful', valence: -0.38, arousal: 0.25, dominance: 0.30 },
          { label: 'Nostalgic', valence: -0.18, arousal: 0.30, dominance: 0.35 },
          { label: 'Yearning', valence: -0.28, arousal: 0.48, dominance: 0.28 },
        ],
      },
    ],
  },
  {
    id: 'surprise', label: 'Surprise', hue: 195, angle: 120,
    valence: 0.10, arousal: 0.75, dominance: 0.30,
    categories: [
      {
        label: 'Confused', valence: -0.30, arousal: 0.65, dominance: 0.28,
        words: [
          { label: 'Bewildered', valence: -0.22, arousal: 0.75, dominance: 0.25 },
          { label: 'Perplexed', valence: -0.20, arousal: 0.50, dominance: 0.31 },
          { label: 'Dumbfounded', valence: -0.12, arousal: 0.85, dominance: 0.20 },
        ],
      },
      {
        label: 'Amazed', valence: 0.30, arousal: 0.85, dominance: 0.30,
        words: [
          { label: 'Astonished', valence: 0.25, arousal: 0.88, dominance: 0.28 },
          { label: 'Astounded', valence: 0.38, arousal: 0.72, dominance: 0.39 },
          { label: 'Speechless', valence: 0.13, arousal: 0.61, dominance: 0.33 },
        ],
      },
      {
        label: 'Startled', valence: -0.05, arousal: 0.85, dominance: 0.25,
        words: [
          { label: 'Shocked', valence: -0.15, arousal: 0.78, dominance: 0.28 },
          { label: 'Stunned', valence: -0.05, arousal: 0.88, dominance: 0.20 },
        ],
      },
      {
        label: 'Overwhelmed', valence: -0.22, arousal: 0.88, dominance: 0.15,
        words: [
          { label: 'Awed', valence: -0.10, arousal: 0.82, dominance: 0.25 },
          { label: 'Awe-struck', valence: -0.08, arousal: 0.85, dominance: 0.22 },
          { label: 'Reverent', valence: 0.22, arousal: 0.65, dominance: 0.28 },
          { label: 'Stimulated', valence: 0.28, arousal: 0.70, dominance: 0.44 },
        ],
      },
    ],
  },
  {
    id: 'joy', label: 'Joy', hue: 105, angle: 180,
    valence: 0.75, arousal: 0.60, dominance: 0.65,
    categories: [
      {
        label: 'Content', valence: 0.65, arousal: 0.22, dominance: 0.60,
        words: [
          { label: 'Glad', valence: 0.70, arousal: 0.45, dominance: 0.62 },
          { label: 'Pleased', valence: 0.75, arousal: 0.52, dominance: 0.65 },
          { label: 'Happy', valence: 0.75, arousal: 0.55, dominance: 0.65 },
          { label: 'Satisfied', valence: 0.55, arousal: 0.33, dominance: 0.58 },
          { label: 'Calm', valence: 0.65, arousal: 0.10, dominance: 0.62 },
        ],
      },
      {
        label: 'Proud', valence: 0.82, arousal: 0.65, dominance: 0.85,
        words: [
          { label: 'Gratified', valence: 0.78, arousal: 0.55, dominance: 0.65 },
          { label: 'Triumphant', valence: 0.75, arousal: 0.70, dominance: 0.72 },
          { label: 'Illustrious', valence: 0.50, arousal: 0.44, dominance: 0.67 },
          { label: 'Confident', valence: 0.72, arousal: 0.55, dominance: 0.82 },
        ],
      },
      {
        label: 'Excited', valence: 0.80, arousal: 0.85, dominance: 0.72,
        words: [
          { label: 'Exhilarated', valence: 0.95, arousal: 0.93, dominance: 0.80 },
          { label: 'Elated', valence: 0.90, arousal: 0.80, dominance: 0.76 },
          { label: 'Euphoric', valence: 0.85, arousal: 0.85, dominance: 0.70 },
          { label: 'Zeal', valence: 0.50, arousal: 0.72, dominance: 0.58 },
          { label: 'Wired', valence: 0.55, arousal: 0.90, dominance: 0.65 },
          { label: 'Eager', valence: 0.65, arousal: 0.75, dominance: 0.65 },
        ],
      },
      {
        label: 'Optimistic', valence: 0.72, arousal: 0.60, dominance: 0.68,
        words: [
          { label: 'Hopeful', valence: 0.68, arousal: 0.55, dominance: 0.60 },
          { label: 'Enthusiastic', valence: 0.82, arousal: 0.80, dominance: 0.72 },
          { label: 'Inspired', valence: 0.80, arousal: 0.78, dominance: 0.70 },
          { label: 'Motivated', valence: 0.75, arousal: 0.75, dominance: 0.72 },
          { label: 'Curious', valence: 0.45, arousal: 0.55, dominance: 0.55 },
          { label: 'Intrigued', valence: 0.48, arousal: 0.60, dominance: 0.55 },
        ],
      },
      {
        label: 'Enchanted', valence: 0.73, arousal: 0.53, dominance: 0.44,
        words: [
          { label: 'Blissful', valence: 0.96, arousal: 0.88, dominance: 0.80 },
          { label: 'Rapture', valence: 0.88, arousal: 0.72, dominance: 0.61 },
          { label: 'Jubilant', valence: 0.92, arousal: 0.82, dominance: 0.78 },
          { label: 'Jubilation', valence: 0.90, arousal: 0.80, dominance: 0.75 },
          { label: 'Elation', valence: 0.88, arousal: 0.78, dominance: 0.74 },
        ],
      },
      {
        label: 'Amused', valence: 0.60, arousal: 0.49, dominance: 0.56,
        words: [
          { label: 'Cheerful', valence: 0.80, arousal: 0.60, dominance: 0.68 },
          { label: 'Jovial', valence: 0.55, arousal: 0.47, dominance: 0.50 },
          { label: 'Delighted', valence: 0.85, arousal: 0.68, dominance: 0.70 },
          { label: 'Moved', valence: 0.70, arousal: 0.62, dominance: 0.55 },
          { label: 'Touched', valence: 0.68, arousal: 0.52, dominance: 0.50 },
        ],
      },
    ],
  },
  {
    id: 'love', label: 'Love', hue: 50, angle: 240,
    valence: 0.75, arousal: 0.45, dominance: 0.50,
    categories: [
      {
        label: 'Affectionate', valence: 0.80, arousal: 0.42, dominance: 0.55,
        words: [
          { label: 'Loving', valence: 0.85, arousal: 0.52, dominance: 0.58 },
          { label: 'Adoring', valence: 0.88, arousal: 0.60, dominance: 0.55 },
          { label: 'Fond', valence: 0.72, arousal: 0.32, dominance: 0.50 },
          { label: 'Fondness', valence: 0.68, arousal: 0.28, dominance: 0.48 },
          { label: 'Tender', valence: 0.70, arousal: 0.28, dominance: 0.50 },
          { label: 'Tenderness', valence: 0.68, arousal: 0.25, dominance: 0.48 },
        ],
      },
      {
        label: 'Passion', valence: 0.63, arousal: 0.78, dominance: 0.56,
        words: [
          { label: 'Romantic', valence: 0.82, arousal: 0.60, dominance: 0.55 },
          { label: 'Infatuation', valence: 0.50, arousal: 0.70, dominance: 0.42 },
          { label: 'Desire', valence: 0.55, arousal: 0.62, dominance: 0.50 },
          { label: 'Longing', valence: 0.30, arousal: 0.42, dominance: 0.30 },
          { label: 'Enthralled', valence: 0.78, arousal: 0.58, dominance: 0.48 },
        ],
      },
      {
        label: 'Caring', valence: 0.65, arousal: 0.36, dominance: 0.49,
        words: [
          { label: 'Compassionate', valence: 0.63, arousal: 0.39, dominance: 0.50 },
          { label: 'Warm', valence: 0.74, arousal: 0.38, dominance: 0.55 },
          { label: 'Sentimental', valence: 0.38, arousal: 0.33, dominance: 0.39 },
        ],
      },
      {
        label: 'Devoted', valence: 0.78, arousal: 0.48, dominance: 0.52,
        words: [
          { label: 'Loyal', valence: 0.65, arousal: 0.42, dominance: 0.58 },
          { label: 'Grateful', valence: 0.75, arousal: 0.45, dominance: 0.55 },
          { label: 'Empathetic', valence: 0.60, arousal: 0.38, dominance: 0.50 },
        ],
      },
      {
        label: 'Secure', valence: 0.65, arousal: 0.28, dominance: 0.72,
        words: [
          { label: 'Reassured', valence: 0.62, arousal: 0.25, dominance: 0.65 },
          { label: 'Relieved', valence: 0.70, arousal: 0.32, dominance: 0.60 },
          { label: 'Attracted', valence: 0.45, arousal: 0.56, dominance: 0.47 },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// EMOTIONS — kept as a name for minimal churn in consumers that just do
// EMOTIONS.find(e => e.id === x)?.label — now the 6 core families.
// ---------------------------------------------------------------------------
export const EMOTIONS = WHEEL.map((f) => ({ id: f.id, label: f.label, hue: f.hue, angle: f.angle }));

// ---------------------------------------------------------------------------
// EMOTION_NODES — flattened ring1 + ring2 + ring3, for the blend engine.
// Ring1 and ring2 subdivide their parent's 60°/category-span evenly. Ring3
// does NOT nest strictly inside its own category's narrow slice — busy
// categories (Joy's "Excited" has 6 words inside a 10°-wide category) would
// produce unreadably thin wedges that way. Instead every ring3 word gets an
// equal share of its *family's* full 60°, ordered category-by-category, so
// slice width only depends on how many words the family has in total, not
// how unevenly they're distributed across its categories.
// ---------------------------------------------------------------------------
export const EMOTION_NODES: EmotionNode[] = (() => {
  const nodes: EmotionNode[] = [];
  const FAMILY_SPAN = 60;
  for (const family of WHEEL) {
    nodes.push({
      id: family.id, label: family.label, angle: family.angle, radius: RING_RADIUS.ring1,
      valence: family.valence, arousal: family.arousal, dominance: family.dominance,
      hue: family.hue, sourceId: family.id, intensity: 'ring1',
    });

    const catSpan = FAMILY_SPAN / family.categories.length;
    const familyStart = family.angle - FAMILY_SPAN / 2;

    family.categories.forEach((cat, ci) => {
      const catAngle = familyStart + catSpan * (ci + 0.5);
      const catId = `${family.id}-${slug(cat.label)}`;
      nodes.push({
        id: catId, label: cat.label, angle: catAngle, radius: RING_RADIUS.ring2,
        valence: cat.valence, arousal: cat.arousal, dominance: cat.dominance,
        hue: family.hue, sourceId: family.id, intensity: 'ring2',
      });
    });

    const totalWords = family.categories.reduce((sum, c) => sum + c.words.length, 0);
    const wordSpan = FAMILY_SPAN / totalWords;
    let wordIndex = 0;
    family.categories.forEach((cat) => {
      const catId = `${family.id}-${slug(cat.label)}`;
      cat.words.forEach((w) => {
        const wAngle = familyStart + wordSpan * (wordIndex + 0.5);
        wordIndex += 1;
        nodes.push({
          id: `${catId}-${slug(w.label)}`, label: w.label, angle: wAngle, radius: RING_RADIUS.ring3,
          valence: w.valence, arousal: w.arousal, dominance: w.dominance,
          hue: family.hue, sourceId: family.id, intensity: 'ring3',
        });
      });
    });
  }
  return nodes;
})();

export const NEUTRAL: EmotionVariant = { label: 'neutral', valence: 0, arousal: 0.3, dominance: 0.5 };
