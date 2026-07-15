import { EMOTION_NODES, EmotionNode } from '../data/emotions';

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
): { hue: number; saturation: number; lightness: number; gradient: string } {
  const hue = baseHue;
  // High dominance → more saturated (assertive), low dominance → more muted
  const saturation = Math.min(92, Math.max(28, Math.round(28 + arousal * 52 + dominance * 16)));
  // High dominance → slightly darker / heavier presence
  const lightness = Math.min(62, Math.max(20, Math.round(22 + ((valence + 1) / 2) * 38 - dominance * 5)));
  const hue2 = Math.round((hue + 20 + dominance * 15) % 360);
  const gradient = `linear-gradient(135deg, hsl(${hue}, ${saturation}%, ${lightness}%) 0%, hsl(${hue2}, ${Math.round(saturation * 0.8)}%, ${Math.round(lightness * 1.25)}%) 100%)`;
  return { hue, saturation, lightness, gradient };
}

export function emotionToSound(
  valence: number,
  arousal: number,
  dominance = 0.5
): { frequency: number; waveformType: 'sine' | 'triangle' | 'sawtooth'; harmonics: number } {
  // High dominance → slightly deeper register (more imposing)
  const frequency = Math.round(110 + arousal * 770 - dominance * 40);
  const waveformType: 'sine' | 'triangle' | 'sawtooth' =
    valence > 0.3 ? 'sine' : valence > -0.3 ? 'triangle' : 'sawtooth';
  // High dominance → richer harmonic content
  const harmonics = Math.min(8, Math.round(1 + (1 - (valence + 1) / 2) * 5 + dominance * 2));
  return { frequency, waveformType, harmonics };
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
