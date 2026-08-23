import { EMOTION_NODES } from '../data/emotions';
import { NODE_TEXTURES } from './textureAssets';

// Only the 24 primary variants (8 branches × 3 intensities) have a
// dedicated generated texture. Dyads (and anything else) borrow the
// nearest one by affective distance — so every wheel position still
// resolves to a real texture rather than a single generic fallback.
const PRIMARY_NODES = EMOTION_NODES.filter((n) => n.intensity !== 'dyad');

export interface ResolvedTexture {
  src: string;
  hue: number; // the hue this src was actually generated toward
}

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

export function resolveNodeTexture(nodeId: string, hue: number, valence: number, arousal: number): ResolvedTexture {
  const direct = NODE_TEXTURES[nodeId];
  if (direct) return { src: direct, hue };

  let best = PRIMARY_NODES[0];
  let bestDist = Infinity;
  for (const n of PRIMARY_NODES) {
    const dist = hueDistance(n.hue, hue) / 180 + Math.abs(n.valence - valence) + Math.abs(n.arousal - arousal);
    if (dist < bestDist) {
      bestDist = dist;
      best = n;
    }
  }
  return { src: NODE_TEXTURES[best.id], hue: best.hue };
}
