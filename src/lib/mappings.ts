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
  baseHue: number
): { hue: number; saturation: number; lightness: number; gradient: string } {
  const hue = baseHue;
  const saturation = Math.min(85, Math.max(30, Math.round(30 + arousal * 55)));
  const lightness = Math.min(60, Math.max(22, Math.round(22 + ((valence + 1) / 2) * 38)));
  const gradient = `linear-gradient(135deg, hsl(${hue}, ${saturation}%, ${lightness}%) 0%, hsl(${(hue + 25) % 360}, ${Math.round(saturation * 0.8)}%, ${Math.round(lightness * 1.25)}%) 100%)`;
  return { hue, saturation, lightness, gradient };
}

export function emotionToSound(
  valence: number,
  arousal: number
): { frequency: number; waveformType: 'sine' | 'triangle' | 'sawtooth'; harmonics: number } {
  const frequency = Math.round(110 + arousal * 770);
  const waveformType: 'sine' | 'triangle' | 'sawtooth' =
    valence > 0.3 ? 'sine' : valence > -0.3 ? 'triangle' : 'sawtooth';
  const harmonics = Math.round(1 + (1 - (valence + 1) / 2) * 5);
  return { frequency, waveformType, harmonics };
}

export function emotionToTaste(
  valence: number,
  arousal: number
): { descriptor: string; icon: string; note: string } {
  if (arousal > 0.65 && valence > 0.2) {
    return {
      descriptor: 'sweet',
      icon: '◇',
      note: 'high-pitched tones correlate with sweetness',
    };
  }
  if (arousal > 0.65 && valence < -0.2) {
    return {
      descriptor: 'sour',
      icon: '△',
      note: 'high-pitched tones also correlate with sourness and acidity',
    };
  }
  if (arousal < 0.35 && valence > 0) {
    return {
      descriptor: 'savory',
      icon: '○',
      note: 'low, smooth tones correlate with umami and fullness',
    };
  }
  if (arousal < 0.35 && valence < 0) {
    return {
      descriptor: 'bitter',
      icon: '▽',
      note: 'low, dissonant tones correlate with bitterness',
    };
  }
  if (valence > 0) {
    return {
      descriptor: 'sweet-tart',
      icon: '◈',
      note: 'middle register: mixed sweet and bright qualities',
    };
  }
  if (valence < 0) {
    return {
      descriptor: 'astringent',
      icon: '▲',
      note: 'middle register with negative valence: drying, sharp',
    };
  }
  return {
    descriptor: 'neutral',
    icon: '□',
    note: 'at the valence-arousal centre, taste correspondences are diffuse',
  };
}

export function emotionToGeometry(
  valence: number,
  arousal: number
): { points: number; curvature: number; size: number; spikiness: number } {
  const points = Math.round(3 + ((1 - valence) / 2) * 9);
  const curvature = Math.max(0, Math.min(1, (valence + 1) / 2));
  const size = 80 + arousal * 60;
  const spikiness = Math.max(0, arousal * 0.6 + -valence * 0.4);
  return { points, curvature, size, spikiness };
}

export function emotionToMotion(
  valence: number,
  arousal: number
): { duration: number; ease: string; oscillationAmplitude: number; oscillationFrequency: number } {
  const duration = 0.5 + (1 - arousal) * 2.5;
  const ease =
    valence > 0.2 ? 'easeInOut' : valence < -0.2 ? 'linear' : 'easeOut';
  const oscillationAmplitude = arousal * 18;
  const oscillationFrequency = 0.3 + arousal * 2.2;
  return { duration, ease, oscillationAmplitude, oscillationFrequency };
}
