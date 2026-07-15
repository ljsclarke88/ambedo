export type IntensityLevel = 'low' | 'mid' | 'high';

export interface EmotionVariant {
  label: string;
  valence: number;    // Russell circumplex: -1 to 1
  arousal: number;    // Russell circumplex: 0 to 1
  dominance: number;  // PAD model (Mehrabian & Russell 1977): 0 = powerless, 1 = in control
}

export interface PrimaryEmotion {
  id: string;
  label: string;
  hue: number;    // 0–360, Plutchik's colour association
  angle: number;  // degrees — convention: (angleDeg - 90) gives standard math angle, so -90 renders at top
  low: EmotionVariant;
  mid: EmotionVariant;
  high: EmotionVariant;
}

export interface Dyad {
  id: string;
  label: string;
  between: [string, string];
  angle: number;
  hue: number;
  valence: number;
  arousal: number;
  dominance: number;
}

// Flat anchor for the blend engine — all 24 primary variants + 8 dyads
export interface EmotionNode {
  id: string;
  label: string;
  angle: number;
  radius: number;     // normalised 0–1 within the wheel (0 = centre, 1 = outer edge at r=220)
  valence: number;
  arousal: number;
  dominance: number;
  hue: number;
  sourceId: string;   // parent emotion/dyad id
  intensity: IntensityLevel | 'dyad';
}

// Entry in the extended lexicon for text search + wheel navigation
export interface LexiconEntry {
  label: string;
  angle: number;
  radius: number;
  valence: number;
  arousal: number;
  dominance: number;
}

// ---------------------------------------------------------------------------
// Primary emotions — 8 axes, 3 intensity variants each
// Dominance values sourced from Warriner, Kuperman & Brysbaert (2013) and
// Mehrabian & Russell (1977) PAD scale.
// ---------------------------------------------------------------------------

export const EMOTIONS: PrimaryEmotion[] = [
  {
    id: 'joy',
    label: 'Joy',
    hue: 55,
    angle: -90,
    low:  { label: 'serenity',   valence:  0.70, arousal: 0.25, dominance: 0.65 },
    mid:  { label: 'joy',        valence:  0.88, arousal: 0.60, dominance: 0.75 },
    high: { label: 'ecstasy',    valence:  0.98, arousal: 0.92, dominance: 0.80 },
  },
  {
    id: 'trust',
    label: 'Trust',
    hue: 110,
    angle: -45,
    low:  { label: 'acceptance', valence:  0.50, arousal: 0.18, dominance: 0.45 },
    mid:  { label: 'trust',      valence:  0.62, arousal: 0.32, dominance: 0.55 },
    high: { label: 'admiration', valence:  0.75, arousal: 0.52, dominance: 0.48 },
  },
  {
    id: 'fear',
    label: 'Fear',
    hue: 82,
    angle: 0,
    low:  { label: 'apprehension', valence: -0.38, arousal: 0.48, dominance: 0.28 },
    mid:  { label: 'fear',         valence: -0.72, arousal: 0.78, dominance: 0.15 },
    high: { label: 'terror',       valence: -0.92, arousal: 0.96, dominance: 0.08 },
  },
  {
    id: 'surprise',
    label: 'Surprise',
    hue: 185,
    angle: 45,
    low:  { label: 'distraction', valence:  0.08, arousal: 0.45, dominance: 0.42 },
    mid:  { label: 'surprise',    valence:  0.20, arousal: 0.82, dominance: 0.38 },
    high: { label: 'amazement',   valence:  0.28, arousal: 0.96, dominance: 0.30 },
  },
  {
    id: 'sadness',
    label: 'Sadness',
    hue: 220,
    angle: 90,
    low:  { label: 'pensiveness', valence: -0.52, arousal: 0.18, dominance: 0.28 },
    mid:  { label: 'sadness',     valence: -0.78, arousal: 0.28, dominance: 0.18 },
    high: { label: 'grief',       valence: -0.96, arousal: 0.38, dominance: 0.10 },
  },
  {
    id: 'disgust',
    label: 'Disgust',
    hue: 285,
    angle: 135,
    low:  { label: 'boredom',  valence: -0.42, arousal: 0.12, dominance: 0.42 },
    mid:  { label: 'disgust',  valence: -0.72, arousal: 0.48, dominance: 0.52 },
    high: { label: 'loathing', valence: -0.94, arousal: 0.68, dominance: 0.55 },
  },
  {
    id: 'anger',
    label: 'Anger',
    hue: 5,
    angle: 180,
    low:  { label: 'annoyance', valence: -0.42, arousal: 0.48, dominance: 0.55 },
    mid:  { label: 'anger',     valence: -0.72, arousal: 0.82, dominance: 0.75 },
    high: { label: 'rage',      valence: -0.92, arousal: 0.98, dominance: 0.80 },
  },
  {
    id: 'anticipation',
    label: 'Anticipation',
    hue: 32,
    angle: 225,
    low:  { label: 'interest',      valence:  0.38, arousal: 0.38, dominance: 0.55 },
    mid:  { label: 'anticipation',  valence:  0.52, arousal: 0.65, dominance: 0.62 },
    high: { label: 'vigilance',     valence:  0.62, arousal: 0.86, dominance: 0.70 },
  },
];

// ---------------------------------------------------------------------------
// Dyads — Plutchik's first-order blends at seam angles
// hue = circular midpoint between the two parent emotions
// ---------------------------------------------------------------------------

export const DYADS: Dyad[] = [
  { id: 'love',            label: 'Love',            between: ['joy', 'trust'],            angle: -67.5, hue:  82, valence:  0.75, arousal: 0.45, dominance: 0.60 },
  { id: 'submission',      label: 'Submission',      between: ['trust', 'fear'],           angle: -22.5, hue:  96, valence: -0.05, arousal: 0.55, dominance: 0.18 },
  { id: 'awe',             label: 'Awe',             between: ['fear', 'surprise'],        angle:  22.5, hue: 133, valence: -0.25, arousal: 0.87, dominance: 0.25 },
  { id: 'disapproval',     label: 'Disapproval',     between: ['surprise', 'sadness'],     angle:  67.5, hue: 202, valence: -0.45, arousal: 0.55, dominance: 0.32 },
  { id: 'remorse',         label: 'Remorse',         between: ['sadness', 'disgust'],      angle: 112.5, hue: 252, valence: -0.85, arousal: 0.33, dominance: 0.18 },
  { id: 'contempt',        label: 'Contempt',        between: ['disgust', 'anger'],        angle: 157.5, hue: 325, valence: -0.80, arousal: 0.65, dominance: 0.72 },
  { id: 'aggressiveness',  label: 'Aggressiveness',  between: ['anger', 'anticipation'],   angle: 202.5, hue:  18, valence: -0.30, arousal: 0.83, dominance: 0.82 },
  { id: 'optimism',        label: 'Optimism',        between: ['anticipation', 'joy'],     angle: 247.5, hue:  43, valence:  0.72, arousal: 0.62, dominance: 0.65 },
];

// ---------------------------------------------------------------------------
// EMOTION_NODES — flat anchor array for the blend engine
// Radii are ring-centre values normalised to the outer wheel edge (r = 220):
//   high intensity ring (r 55–105)  → 0.36
//   mid  intensity ring (r 105–165) → 0.61
//   low  intensity ring (r 165–220) → 0.87
//   dyad ring (r 220–242, rendered at seam boundary) → 0.95
// ---------------------------------------------------------------------------

const RING_R = { high: 0.36, mid: 0.61, low: 0.87, dyad: 0.95 } as const;

export const EMOTION_NODES: EmotionNode[] = [
  ...EMOTIONS.flatMap((e) => [
    { id: `${e.id}-high`, label: e.high.label, angle: e.angle, radius: RING_R.high, ...e.high, hue: e.hue, sourceId: e.id, intensity: 'high' as const },
    { id: `${e.id}-mid`,  label: e.mid.label,  angle: e.angle, radius: RING_R.mid,  ...e.mid,  hue: e.hue, sourceId: e.id, intensity: 'mid'  as const },
    { id: `${e.id}-low`,  label: e.low.label,  angle: e.angle, radius: RING_R.low,  ...e.low,  hue: e.hue, sourceId: e.id, intensity: 'low'  as const },
  ]),
  ...DYADS.map((d) => ({
    id: d.id,
    label: d.label,
    angle: d.angle,
    radius: RING_R.dyad,
    valence: d.valence,
    arousal: d.arousal,
    dominance: d.dominance,
    hue: d.hue,
    sourceId: d.id,
    intensity: 'dyad' as const,
  })),
];

// ---------------------------------------------------------------------------
// EMOTION_LEXICON — ~110 common affect words with approximate wheel positions.
// angle/radius follow the same convention as EMOTION_NODES.
// V/A/D values derived from Warriner et al. (2013) and Russell circumplex
// placements; where exact data is unavailable, extrapolated from neighbours.
// Words that exactly match EMOTIONS/DYADS labels are excluded to avoid
// duplicates in search results.
// ---------------------------------------------------------------------------

export const EMOTION_LEXICON: LexiconEntry[] = [
  // --- Joy family ---
  { label: 'blissful',      angle:  -90, radius: 0.93, valence:  0.96, arousal: 0.88, dominance: 0.80 },
  { label: 'exhilarated',   angle:  -90, radius: 0.91, valence:  0.95, arousal: 0.93, dominance: 0.80 },
  { label: 'elated',        angle:  -90, radius: 0.82, valence:  0.90, arousal: 0.80, dominance: 0.76 },
  { label: 'delighted',     angle:  -90, radius: 0.68, valence:  0.85, arousal: 0.68, dominance: 0.70 },
  { label: 'pleased',       angle:  -90, radius: 0.55, valence:  0.75, arousal: 0.52, dominance: 0.65 },
  { label: 'glad',          angle:  -90, radius: 0.50, valence:  0.70, arousal: 0.45, dominance: 0.62 },
  { label: 'content',       angle:  -90, radius: 0.38, valence:  0.65, arousal: 0.22, dominance: 0.60 },
  { label: 'gratified',     angle:  -85, radius: 0.58, valence:  0.78, arousal: 0.55, dominance: 0.65 },
  { label: 'proud',         angle:  -85, radius: 0.72, valence:  0.82, arousal: 0.65, dominance: 0.85 },
  { label: 'moved',         angle:  -80, radius: 0.60, valence:  0.70, arousal: 0.62, dominance: 0.55 },
  { label: 'touched',       angle:  -78, radius: 0.55, valence:  0.68, arousal: 0.52, dominance: 0.50 },
  { label: 'cheerful',      angle:  -88, radius: 0.58, valence:  0.80, arousal: 0.60, dominance: 0.68 },
  { label: 'jubilant',      angle:  -90, radius: 0.78, valence:  0.92, arousal: 0.82, dominance: 0.78 },

  // --- Love dyad (Joy + Trust) ---
  { label: 'loving',        angle:  -68, radius: 0.65, valence:  0.85, arousal: 0.52, dominance: 0.58 },
  { label: 'adoring',       angle:  -68, radius: 0.78, valence:  0.88, arousal: 0.60, dominance: 0.55 },
  { label: 'affectionate',  angle:  -68, radius: 0.58, valence:  0.80, arousal: 0.42, dominance: 0.55 },
  { label: 'romantic',      angle:  -68, radius: 0.68, valence:  0.82, arousal: 0.60, dominance: 0.55 },
  { label: 'fond',          angle:  -68, radius: 0.50, valence:  0.72, arousal: 0.32, dominance: 0.50 },
  { label: 'tender',        angle:  -70, radius: 0.45, valence:  0.70, arousal: 0.28, dominance: 0.50 },
  { label: 'warm',          angle:  -65, radius: 0.52, valence:  0.74, arousal: 0.38, dominance: 0.55 },
  { label: 'devoted',       angle:  -65, radius: 0.70, valence:  0.78, arousal: 0.48, dominance: 0.52 },

  // --- Trust family ---
  { label: 'confident',     angle:  -45, radius: 0.65, valence:  0.72, arousal: 0.55, dominance: 0.82 },
  { label: 'secure',        angle:  -45, radius: 0.52, valence:  0.65, arousal: 0.28, dominance: 0.72 },
  { label: 'reassured',     angle:  -45, radius: 0.48, valence:  0.62, arousal: 0.25, dominance: 0.65 },
  { label: 'grateful',      angle:  -55, radius: 0.55, valence:  0.75, arousal: 0.45, dominance: 0.55 },
  { label: 'relieved',      angle:  -55, radius: 0.52, valence:  0.70, arousal: 0.32, dominance: 0.60 },
  { label: 'peaceful',      angle:  -58, radius: 0.35, valence:  0.72, arousal: 0.12, dominance: 0.62 },
  { label: 'calm',          angle:  -55, radius: 0.30, valence:  0.65, arousal: 0.10, dominance: 0.62 },
  { label: 'empathetic',    angle:  -45, radius: 0.55, valence:  0.60, arousal: 0.38, dominance: 0.50 },
  { label: 'loyal',         angle:  -45, radius: 0.68, valence:  0.65, arousal: 0.42, dominance: 0.58 },

  // --- Submission dyad (Trust + Fear) ---
  { label: 'humble',        angle:  -22, radius: 0.48, valence:  0.30, arousal: 0.20, dominance: 0.25 },
  { label: 'meek',          angle:  -22, radius: 0.62, valence:  0.08, arousal: 0.28, dominance: 0.15 },
  { label: 'timid',         angle:  -15, radius: 0.58, valence: -0.15, arousal: 0.45, dominance: 0.20 },
  { label: 'insecure',      angle:  -10, radius: 0.52, valence: -0.50, arousal: 0.45, dominance: 0.18 },
  { label: 'vulnerable',    angle:   10, radius: 0.55, valence: -0.55, arousal: 0.45, dominance: 0.15 },

  // --- Fear family ---
  { label: 'panicked',      angle:    0, radius: 0.92, valence: -0.90, arousal: 0.96, dominance: 0.08 },
  { label: 'horrified',     angle:    0, radius: 0.88, valence: -0.88, arousal: 0.92, dominance: 0.08 },
  { label: 'scared',        angle:    0, radius: 0.72, valence: -0.75, arousal: 0.80, dominance: 0.18 },
  { label: 'anxious',       angle:    5, radius: 0.65, valence: -0.65, arousal: 0.75, dominance: 0.25 },
  { label: 'nervous',       angle:    5, radius: 0.58, valence: -0.55, arousal: 0.65, dominance: 0.28 },
  { label: 'worried',       angle:    5, radius: 0.55, valence: -0.60, arousal: 0.62, dominance: 0.25 },
  { label: 'uneasy',        angle:    5, radius: 0.50, valence: -0.50, arousal: 0.55, dominance: 0.28 },
  { label: 'dread',         angle:    2, radius: 0.78, valence: -0.82, arousal: 0.80, dominance: 0.12 },

  // --- Awe dyad (Fear + Surprise) ---
  { label: 'awed',          angle:   22, radius: 0.72, valence: -0.10, arousal: 0.82, dominance: 0.25 },
  { label: 'reverent',      angle:   22, radius: 0.62, valence:  0.22, arousal: 0.65, dominance: 0.28 },
  { label: 'overwhelmed',   angle:   20, radius: 0.82, valence: -0.22, arousal: 0.88, dominance: 0.15 },
  { label: 'stunned',       angle:   25, radius: 0.80, valence: -0.05, arousal: 0.88, dominance: 0.20 },
  { label: 'dumbfounded',   angle:   28, radius: 0.75, valence: -0.12, arousal: 0.85, dominance: 0.20 },

  // --- Surprise family ---
  { label: 'astonished',    angle:   45, radius: 0.82, valence:  0.25, arousal: 0.88, dominance: 0.28 },
  { label: 'startled',      angle:   45, radius: 0.75, valence: -0.05, arousal: 0.85, dominance: 0.25 },
  { label: 'bewildered',    angle:   50, radius: 0.65, valence: -0.22, arousal: 0.75, dominance: 0.25 },
  { label: 'confused',      angle:   52, radius: 0.55, valence: -0.30, arousal: 0.65, dominance: 0.28 },

  // --- Disapproval dyad (Surprise + Sadness) ---
  { label: 'disappointed',  angle:   68, radius: 0.65, valence: -0.60, arousal: 0.48, dominance: 0.28 },
  { label: 'disillusioned', angle:   68, radius: 0.70, valence: -0.65, arousal: 0.45, dominance: 0.28 },
  { label: 'let down',      angle:   67, radius: 0.60, valence: -0.55, arousal: 0.45, dominance: 0.25 },

  // --- Sadness family ---
  { label: 'devastated',    angle:   90, radius: 0.90, valence: -0.96, arousal: 0.42, dominance: 0.08 },
  { label: 'heartbroken',   angle:   90, radius: 0.84, valence: -0.90, arousal: 0.36, dominance: 0.08 },
  { label: 'bereaved',      angle:   90, radius: 0.87, valence: -0.92, arousal: 0.35, dominance: 0.08 },
  { label: 'depressed',     angle:   90, radius: 0.76, valence: -0.85, arousal: 0.24, dominance: 0.12 },
  { label: 'melancholy',    angle:   90, radius: 0.65, valence: -0.72, arousal: 0.22, dominance: 0.22 },
  { label: 'gloomy',        angle:   90, radius: 0.60, valence: -0.65, arousal: 0.20, dominance: 0.20 },
  { label: 'lonely',        angle:   92, radius: 0.65, valence: -0.70, arousal: 0.22, dominance: 0.15 },
  { label: 'forlorn',       angle:   92, radius: 0.78, valence: -0.85, arousal: 0.18, dominance: 0.08 },
  { label: 'helpless',      angle:   95, radius: 0.75, valence: -0.80, arousal: 0.22, dominance: 0.05 },
  { label: 'wistful',       angle:   85, radius: 0.55, valence: -0.38, arousal: 0.25, dominance: 0.30 },
  { label: 'nostalgic',     angle:   82, radius: 0.50, valence: -0.18, arousal: 0.30, dominance: 0.35 },
  { label: 'yearning',      angle:   85, radius: 0.60, valence: -0.28, arousal: 0.48, dominance: 0.28 },
  { label: 'sorrowful',     angle:   90, radius: 0.72, valence: -0.80, arousal: 0.28, dominance: 0.15 },

  // --- Remorse dyad (Sadness + Disgust) ---
  { label: 'guilty',        angle:  112, radius: 0.72, valence: -0.75, arousal: 0.45, dominance: 0.18 },
  { label: 'ashamed',       angle:  112, radius: 0.74, valence: -0.78, arousal: 0.42, dominance: 0.15 },
  { label: 'regretful',     angle:  115, radius: 0.60, valence: -0.65, arousal: 0.35, dominance: 0.25 },
  { label: 'embarrassed',   angle:  110, radius: 0.58, valence: -0.60, arousal: 0.52, dominance: 0.20 },
  { label: 'sheepish',      angle:  110, radius: 0.50, valence: -0.45, arousal: 0.38, dominance: 0.22 },
  { label: 'resigned',      angle:  100, radius: 0.60, valence: -0.65, arousal: 0.15, dominance: 0.20 },

  // --- Disgust family ---
  { label: 'revolted',      angle:  135, radius: 0.88, valence: -0.92, arousal: 0.72, dominance: 0.48 },
  { label: 'nauseated',     angle:  135, radius: 0.80, valence: -0.85, arousal: 0.65, dominance: 0.45 },
  { label: 'repulsed',      angle:  135, radius: 0.78, valence: -0.88, arousal: 0.65, dominance: 0.48 },
  { label: 'appalled',      angle:  135, radius: 0.75, valence: -0.82, arousal: 0.62, dominance: 0.45 },
  { label: 'offended',      angle:  140, radius: 0.60, valence: -0.65, arousal: 0.55, dominance: 0.45 },
  { label: 'repelled',      angle:  135, radius: 0.70, valence: -0.78, arousal: 0.58, dominance: 0.45 },

  // --- Contempt dyad (Disgust + Anger) ---
  { label: 'contemptuous',  angle:  157, radius: 0.78, valence: -0.70, arousal: 0.60, dominance: 0.78 },
  { label: 'scornful',      angle:  157, radius: 0.82, valence: -0.75, arousal: 0.65, dominance: 0.80 },
  { label: 'disdainful',    angle:  157, radius: 0.74, valence: -0.70, arousal: 0.58, dominance: 0.78 },
  { label: 'smug',          angle:  155, radius: 0.65, valence: -0.38, arousal: 0.50, dominance: 0.80 },
  { label: 'condescending', angle:  158, radius: 0.70, valence: -0.60, arousal: 0.55, dominance: 0.80 },

  // --- Anger family ---
  { label: 'furious',       angle:  180, radius: 0.90, valence: -0.88, arousal: 0.95, dominance: 0.82 },
  { label: 'enraged',       angle:  180, radius: 0.88, valence: -0.90, arousal: 0.97, dominance: 0.80 },
  { label: 'livid',         angle:  180, radius: 0.85, valence: -0.85, arousal: 0.92, dominance: 0.82 },
  { label: 'irate',         angle:  180, radius: 0.76, valence: -0.78, arousal: 0.85, dominance: 0.78 },
  { label: 'resentful',     angle:  175, radius: 0.65, valence: -0.68, arousal: 0.60, dominance: 0.58 },
  { label: 'hostile',       angle:  170, radius: 0.72, valence: -0.72, arousal: 0.70, dominance: 0.68 },
  { label: 'indignant',     angle:  175, radius: 0.65, valence: -0.65, arousal: 0.70, dominance: 0.65 },
  { label: 'frustrated',    angle:  175, radius: 0.60, valence: -0.60, arousal: 0.72, dominance: 0.48 },
  { label: 'bitter',        angle:  162, radius: 0.68, valence: -0.65, arousal: 0.55, dominance: 0.52 },
  { label: 'envious',       angle:  165, radius: 0.62, valence: -0.55, arousal: 0.60, dominance: 0.45 },
  { label: 'jealous',       angle:  162, radius: 0.65, valence: -0.60, arousal: 0.65, dominance: 0.48 },

  // --- Aggressiveness dyad (Anger + Anticipation) ---
  { label: 'aggressive',    angle:  202, radius: 0.82, valence: -0.40, arousal: 0.85, dominance: 0.85 },
  { label: 'determined',    angle:  210, radius: 0.72, valence:  0.22, arousal: 0.75, dominance: 0.85 },
  { label: 'driven',        angle:  210, radius: 0.74, valence:  0.25, arousal: 0.78, dominance: 0.85 },
  { label: 'competitive',   angle:  205, radius: 0.68, valence:  0.12, arousal: 0.75, dominance: 0.78 },

  // --- Anticipation family ---
  { label: 'eager',         angle:  225, radius: 0.70, valence:  0.65, arousal: 0.75, dominance: 0.65 },
  { label: 'excited',       angle:  235, radius: 0.82, valence:  0.80, arousal: 0.85, dominance: 0.72 },
  { label: 'curious',       angle:  225, radius: 0.55, valence:  0.45, arousal: 0.55, dominance: 0.55 },
  { label: 'intrigued',     angle:  225, radius: 0.60, valence:  0.48, arousal: 0.60, dominance: 0.55 },
  { label: 'restless',      angle:  215, radius: 0.65, valence: -0.15, arousal: 0.70, dominance: 0.45 },
  { label: 'wired',         angle:  228, radius: 0.78, valence:  0.55, arousal: 0.90, dominance: 0.65 },

  // --- Optimism dyad (Anticipation + Joy) ---
  { label: 'optimistic',    angle:  247, radius: 0.65, valence:  0.72, arousal: 0.60, dominance: 0.68 },
  { label: 'hopeful',       angle:  247, radius: 0.60, valence:  0.68, arousal: 0.55, dominance: 0.60 },
  { label: 'enthusiastic',  angle:  250, radius: 0.80, valence:  0.82, arousal: 0.80, dominance: 0.72 },
  { label: 'inspired',      angle:  250, radius: 0.76, valence:  0.80, arousal: 0.78, dominance: 0.70 },
  { label: 'motivated',     angle:  248, radius: 0.72, valence:  0.75, arousal: 0.75, dominance: 0.72 },
];

export const NEUTRAL: EmotionVariant = { label: 'neutral', valence: 0, arousal: 0.3, dominance: 0.5 };
