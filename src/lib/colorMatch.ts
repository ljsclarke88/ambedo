import { EMOTION_NODES } from '../data/emotions';
import { coordinateToBlend, blendToAffect, emotionToColor } from './mappings';

export interface ColorMatch {
  angleDeg: number;
  radius: number;
  label: string; // nearest word at the resolved position — for a quick "you'll land near X" preview
  hex: string; // the resolved position's own computed colour, so it can be shown next to the input for comparison
  distance: number; // perceptual (Lab) distance from the input colour — lower is a tighter match
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.trim().replace(/^#/, '').match(/^([0-9a-f]{6}|[0-9a-f]{3})$/i);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const num = parseInt(h, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  return '#' + [r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('');
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const S = s / 100;
  const L = l / 100;
  const c = (1 - Math.abs(2 * L - 1)) * S;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = L - c / 2;
  let rgb: [number, number, number];
  if (h < 60) rgb = [c, x, 0];
  else if (h < 120) rgb = [x, c, 0];
  else if (h < 180) rgb = [0, c, x];
  else if (h < 240) rgb = [0, x, c];
  else if (h < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  return [(rgb[0] + m) * 255, (rgb[1] + m) * 255, (rgb[2] + m) * 255];
}

// sRGB -> CIE Lab, so "closest colour" is judged perceptually rather than by
// raw RGB/HSL distance (which doesn't track how humans actually perceive
// colour difference — equal steps in RGB space are not equal steps in
// perceived difference).
function rgbToLab([r, g, b]: [number, number, number]): [number, number, number] {
  const toLinear = (c: number) => {
    c /= 255;
    return c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92;
  };
  const [rl, gl, bl] = [toLinear(r), toLinear(g), toLinear(b)];
  const x = (rl * 0.4124 + gl * 0.3576 + bl * 0.1805) * 100;
  const y = (rl * 0.2126 + gl * 0.7152 + bl * 0.0722) * 100;
  const z = (rl * 0.0193 + gl * 0.1192 + bl * 0.9505) * 100;
  const [xn, yn, zn] = [95.047, 100.0, 108.883];
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const [fx, fy, fz] = [f(x / xn), f(y / yn), f(z / zn)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

function labDistance(a: [number, number, number], b: [number, number, number]): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

function colorAtLab(valence: number, arousal: number, hue: number, dominance: number): [number, number, number] {
  const color = emotionToColor(valence, arousal, hue, dominance);
  return rgbToLab(hslToRgb(color.hue, color.saturation, color.lightness));
}

// Given a hex colour, finds the wheel position whose computed colour
// (emotionToColor — the same hue/valence/arousal/dominance-driven function
// used everywhere else in the app) is the closest perceptual match. Starts
// from the nearest of the 165 named nodes, then refines with a small local
// search over the continuous blend field, so an input colour that falls
// between two emotions resolves to a genuine blend rather than snapping to
// whichever named word happens to be nearest.
export function findClosestEmotionPosition(hex: string): ColorMatch | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const targetLab = rgbToLab(rgb);

  let best = { angleDeg: 0, radius: 0.5, dist: Infinity };
  for (const node of EMOTION_NODES) {
    const dist = labDistance(targetLab, colorAtLab(node.valence, node.arousal, node.hue, node.dominance));
    if (dist < best.dist) {
      best = { angleDeg: node.angle, radius: node.radius, dist };
    }
  }

  const angleSteps = [-12, -8, -4, 0, 4, 8, 12];
  const radiusSteps = [-0.1, -0.05, 0, 0.05, 0.1];
  let refined = best;
  for (const da of angleSteps) {
    for (const dr of radiusSteps) {
      const angleDeg = best.angleDeg + da;
      const radius = Math.min(1, Math.max(0.05, best.radius + dr));
      const blend = coordinateToBlend(angleDeg, radius);
      const affect = blendToAffect(blend);
      const dist = labDistance(targetLab, colorAtLab(affect.valence, affect.arousal, affect.hue, affect.dominance));
      if (dist < refined.dist) {
        refined = { angleDeg, radius, dist };
      }
    }
  }

  const finalBlend = coordinateToBlend(refined.angleDeg, refined.radius);
  const finalAffect = blendToAffect(finalBlend);
  const finalColor = emotionToColor(finalAffect.valence, finalAffect.arousal, finalAffect.hue, finalAffect.dominance);
  const finalRgb = hslToRgb(finalColor.hue, finalColor.saturation, finalColor.lightness);

  return {
    angleDeg: refined.angleDeg,
    radius: refined.radius,
    label: finalBlend[0].node.label,
    hex: rgbToHex(finalRgb),
    distance: refined.dist,
  };
}
