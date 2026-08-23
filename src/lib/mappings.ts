import { EMOTION_NODES, EmotionNode } from '../data/emotions';
import { quantizeToScale, frequencyToNoteName } from './musicalScale';

// ---------------------------------------------------------------------------
// Blend engine — converts a polar click position to a weighted mixture of
// emotion nodes using inverse-distance weighting (IDW, power=2) in Cartesian
// space, then normalises to sum = 1.0.
// ---------------------------------------------------------------------------

export interface BlendEntry {
  node: EmotionNode;
  weight: number;  // 0–1; all entries sum to 1
}

export interface AffectVector {
  valence: number;
  arousal: number;
  dominance: number;
  hue: number;   // 0–360, circular weighted mean
}

function polarToXY(angleDeg: number, radius: number): [number, number] {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return [radius * Math.cos(rad), radius * Math.sin(rad)];
}

export function coordinateToBlend(angleDeg: number, radius: number): BlendEntry[] {
  const [cx, cy] = polarToXY(angleDeg, radius);
  const EPSILON = 1e-6;

  const raw = EMOTION_NODES.map((node) => {
    const [nx, ny] = polarToXY(node.angle, node.radius);
    const d2 = (cx - nx) ** 2 + (cy - ny) ** 2;
    return { node, w: 1 / (d2 + EPSILON) };
  });

  const total = raw.reduce((sum, e) => sum + e.w, 0);

  return raw
    .map(({ node, w }) => ({ node, weight: w / total }))
    .sort((a, b) => b.weight - a.weight);
}

// Reduces a BlendEntry[] to a single weighted-average affect vector.
// Hue is computed via circular mean to handle the 0/360 wrap-around.
export function blendToAffect(blend: BlendEntry[]): AffectVector {
  let valence = 0;
  let arousal = 0;
  let dominance = 0;
  let sinSum = 0;
  let cosSum = 0;

  for (const { node, weight } of blend) {
    valence   += weight * node.valence;
    arousal   += weight * node.arousal;
    dominance += weight * node.dominance;
    const hRad = (node.hue * Math.PI) / 180;
    sinSum += weight * Math.sin(hRad);
    cosSum += weight * Math.cos(hRad);
  }

  let hue = (Math.atan2(sinSum, cosSum) * 180) / Math.PI;
  if (hue < 0) hue += 360;

  return { valence, arousal, dominance, hue: Math.round(hue) };
}

// ---------------------------------------------------------------------------

export function emotionToColor(
  valence: number,
  arousal: number,
  baseHue: number,
  dominance = 0.5
): { hue: number; hue2: number; saturation: number; lightness: number; gradient: string } {
  const hue = baseHue;
  // High dominance → more saturated (assertive), low dominance → more muted
  const saturation = Math.min(92, Math.max(28, Math.round(28 + arousal * 52 + dominance * 16)));
  // High dominance → slightly darker / heavier presence
  const lightness = Math.min(62, Math.max(20, Math.round(22 + ((valence + 1) / 2) * 38 - dominance * 5)));
  const hue2 = Math.round((hue + 20 + dominance * 15) % 360);
  const gradient = `linear-gradient(135deg, hsl(${hue}, ${saturation}%, ${lightness}%) 0%, hsl(${hue2}, ${Math.round(saturation * 0.8)}%, ${Math.round(lightness * 1.25)}%) 100%)`;
  return { hue, hue2, saturation, lightness, gradient };
}

export function emotionToSound(
  valence: number,
  arousal: number,
  dominance = 0.5
): {
  frequency: number;
  noteFrequency: number;
  noteName: string;
  waveformType: 'sine' | 'triangle' | 'sawtooth';
  harmonics: number;
} {
  // High dominance → slightly deeper register (more imposing)
  const frequency = Math.round(110 + arousal * 770 - dominance * 40);
  const waveformType: 'sine' | 'triangle' | 'sawtooth' =
    valence > 0.3 ? 'sine' : valence > -0.3 ? 'triangle' : 'sawtooth';
  // High dominance → richer harmonic content
  const harmonics = Math.min(8, Math.round(1 + (1 - (valence + 1) / 2) * 5 + dominance * 2));
  // The raw frequency above is the scientific derivation (shown in the UI);
  // noteFrequency snaps it onto a consonant scale so playback reads as
  // musical rather than an arbitrary lab tone — see lib/musicalScale.ts.
  const noteFrequency = Math.round(quantizeToScale(frequency, valence));
  const noteName = frequencyToNoteName(noteFrequency);
  return { frequency, noteFrequency, noteName, waveformType, harmonics };
}

export function emotionToTaste(
  valence: number,
  arousal: number,
  dominance = 0.5
): { descriptor: string; icon: string; note: string; intensity: 'bold' | 'moderate' | 'delicate' } {
  const intensity: 'bold' | 'moderate' | 'delicate' =
    dominance > 0.65 ? 'bold' : dominance < 0.38 ? 'delicate' : 'moderate';

  if (arousal > 0.65 && valence > 0.2) {
    return {
      descriptor: 'sweet',
      icon: '◇',
      note: 'high-pitched tones correlate with sweetness',
      intensity,
    };
  }
  if (arousal > 0.65 && valence < -0.2) {
    return {
      descriptor: 'sour',
      icon: '△',
      note: 'high-pitched tones also correlate with sourness and acidity',
      intensity,
    };
  }
  if (arousal < 0.35 && valence > 0) {
    return {
      descriptor: 'savory',
      icon: '○',
      note: 'low, smooth tones correlate with umami and fullness',
      intensity,
    };
  }
  if (arousal < 0.35 && valence < 0) {
    return {
      descriptor: 'bitter',
      icon: '▽',
      note: 'low, dissonant tones correlate with bitterness',
      intensity,
    };
  }
  if (valence > 0) {
    return {
      descriptor: 'sweet-tart',
      icon: '◈',
      note: 'middle register: mixed sweet and bright qualities',
      intensity,
    };
  }
  if (valence < 0) {
    return {
      descriptor: 'astringent',
      icon: '▲',
      note: 'middle register with negative valence: drying, sharp',
      intensity,
    };
  }
  return {
    descriptor: 'neutral',
    icon: '□',
    note: 'at the valence-arousal centre, taste correspondences are diffuse',
    intensity,
  };
}

export function emotionToScent(
  valence: number,
  arousal: number,
  dominance = 0.5
): { descriptor: string; icon: string; note: string; intensity: 'bold' | 'moderate' | 'delicate' } {
  const intensity: 'bold' | 'moderate' | 'delicate' =
    dominance > 0.65 ? 'bold' : dominance < 0.38 ? 'delicate' : 'moderate';

  if (arousal > 0.65 && valence > 0.2) {
    return {
      descriptor: 'citrus-floral',
      icon: '✦',
      note: 'bright top notes correlate with high arousal and positive valence',
      intensity,
    };
  }
  if (arousal > 0.65 && valence < -0.2) {
    return {
      descriptor: 'smoky, ozonic',
      icon: '⟁',
      note: 'sharp, ionised notes correlate with high arousal and negative valence',
      intensity,
    };
  }
  if (arousal < 0.35 && valence > 0) {
    return {
      descriptor: 'warm amber',
      icon: '⬮',
      note: 'low, warm base notes correlate with calm, positive states',
      intensity,
    };
  }
  if (arousal < 0.35 && valence < 0) {
    return {
      descriptor: 'damp, mineral',
      icon: '▦',
      note: 'cold, still notes correlate with low arousal and negative valence',
      intensity,
    };
  }
  if (valence > 0) {
    return {
      descriptor: 'green, herbal',
      icon: '✢',
      note: 'middle register: fresh-cut and verdant qualities',
      intensity,
    };
  }
  if (valence < 0) {
    return {
      descriptor: 'metallic, bitter',
      icon: '✕',
      note: 'middle register with negative valence: sharp and mineral',
      intensity,
    };
  }
  return {
    descriptor: 'faint, ambiguous',
    icon: '·',
    note: 'at the valence-arousal centre, scent correspondences are diffuse',
    intensity,
  };
}

export function emotionToGeometry(
  valence: number,
  arousal: number,
  dominance = 0.5
): { points: number; curvature: number; size: number; spikiness: number } {
  const points = Math.round(3 + ((1 - valence) / 2) * 9);
  const curvature = Math.max(0, Math.min(1, (valence + 1) / 2));
  // High dominance → larger, more commanding form
  const size = Math.round(80 + arousal * 60 + dominance * 24);
  // High dominance adds a slight angularity regardless of valence
  const spikiness = Math.max(0, Math.min(1, arousal * 0.6 + (-valence) * 0.4 + dominance * 0.12));
  return { points, curvature, size, spikiness };
}

export function emotionToMotion(
  valence: number,
  arousal: number,
  dominance = 0.5
): { duration: number; ease: string; oscillationAmplitude: number; oscillationFrequency: number } {
  // High dominance = more decisive → shorter duration
  const duration = Math.max(0.3, 0.5 + (1 - arousal) * 2.5 - dominance * 0.5);
  const ease =
    valence > 0.2 ? 'easeInOut' : valence < -0.2 ? 'linear' : 'easeOut';
  // High dominance = more prominent movement
  const oscillationAmplitude = arousal * 18 + dominance * 8;
  const oscillationFrequency = 0.3 + arousal * 2.2;
  return { duration, ease, oscillationAmplitude, oscillationFrequency };
}

// ---------------------------------------------------------------------------
// Multisensory profile — sound/light/scent/touch/space descriptor pairs.
// Emotions are first classified into one of six experiential zones (the
// "emotional zones" referenced in the client's multisensory-map brief), then
// each zone carries a fixed bank of sensory correspondences. This keeps the
// table's language coherent (a zone reads the same across all five columns)
// while still responding to wherever the user has actually pointed on the
// wheel, rather than to a hardcoded emotion list.
// ---------------------------------------------------------------------------

export type SensoryZone = 'sublime' | 'discovery' | 'tension' | 'serenity' | 'gloom' | 'power';

export interface SensoryPair {
  title: string;
  detail: string;
}

export interface SensoryProfile {
  zone: SensoryZone;
  sound: SensoryPair;
  light: SensoryPair;
  scent: SensoryPair;
  touch: SensoryPair;
  space: SensoryPair;
}

export function classifySensoryZone(
  valence: number,
  arousal: number,
  dominance: number
): SensoryZone {
  if (arousal > 0.65 && dominance < 0.38) return 'sublime';
  if (valence > 0.25 && arousal >= 0.32 && arousal <= 0.78) return 'discovery';
  if (valence < -0.15 && arousal > 0.45) return 'tension';
  if (arousal < 0.35 && valence >= -0.12) return 'serenity';
  if (arousal < 0.35 && valence < -0.12) return 'gloom';
  return 'power';
}

const SENSORY_BANK: Record<SensoryZone, Omit<SensoryProfile, 'zone'>> = {
  sublime: {
    sound: { title: 'Sub-bass drone', detail: '20–60 Hz, felt not heard' },
    light: { title: 'Vast, singular', detail: 'low CCT, near-dark' },
    scent: { title: 'Petrichor, stone', detail: 'ancient, mineral' },
    touch: { title: 'Cold air, stillness', detail: 'temperature drop' },
    space: { title: 'Vertical scale', detail: 'ceiling height critical' },
  },
  discovery: {
    sound: { title: 'Delicate texture', detail: 'high-freq shimmer' },
    light: { title: 'Dappled, moving', detail: 'warm gold, shifting' },
    scent: { title: 'Neroli, fresh air', detail: 'citrus-floral' },
    touch: { title: 'Smooth surfaces', detail: 'unexpected textures' },
    space: { title: 'Discovery paths', detail: 'non-linear, revealed' },
  },
  tension: {
    sound: { title: 'Silence, then pulse', detail: 'rhythm accelerates' },
    light: { title: 'Narrowing, red-shift', detail: 'contrast increases' },
    scent: { title: 'Smoke, metal', detail: 'sharp, bitter' },
    touch: { title: 'Resistance, grip', detail: 'physical friction' },
    space: { title: 'Compression', detail: 'low ceilings, narrows' },
  },
  serenity: {
    sound: { title: 'Sustained pad', detail: 'slow attack, no percussion' },
    light: { title: 'Even, diffuse', detail: 'high CCT, soft shadow' },
    scent: { title: 'Linen, water', detail: 'clean, faint' },
    touch: { title: 'Warm, yielding', detail: 'even pressure' },
    space: { title: 'Open plan', detail: 'wide sightlines' },
  },
  gloom: {
    sound: { title: 'Detuned low tone', detail: 'slow decay, hollow' },
    light: { title: 'Flat, overcast', detail: 'desaturated, grey' },
    scent: { title: 'Damp paper, dust', detail: 'musty, faint' },
    touch: { title: 'Heavy, inert', detail: 'weight without give' },
    space: { title: 'Recessed corners', detail: 'low light pooling' },
  },
  power: {
    sound: { title: 'Struck impact', detail: 'fast attack, sharp decay' },
    light: { title: 'Hard, directional', detail: 'high contrast beam' },
    scent: { title: 'Leather, metal', detail: 'dense, assertive' },
    touch: { title: 'Firm edges', detail: 'structured, angular' },
    space: { title: 'Axial approach', detail: 'commanding sightline' },
  },
};

export function emotionToSensoryProfile(
  valence: number,
  arousal: number,
  dominance = 0.5
): SensoryProfile {
  const zone = classifySensoryZone(valence, arousal, dominance);
  return { zone, ...SENSORY_BANK[zone] };
}
