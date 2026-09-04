import anger1 from '../assets/textures/pool/anger-1.jpg';
import anger2 from '../assets/textures/pool/anger-2.jpg';
import anger3 from '../assets/textures/pool/anger-3.jpg';
import anger4 from '../assets/textures/pool/anger-4.jpg';
import fear1 from '../assets/textures/pool/fear-1.jpg';
import fear2 from '../assets/textures/pool/fear-2.jpg';
import fear3 from '../assets/textures/pool/fear-3.jpg';
import sadness1 from '../assets/textures/pool/sadness-1.jpg';
import sadness2 from '../assets/textures/pool/sadness-2.jpg';
import surprise1 from '../assets/textures/pool/surprise-1.jpg';
import surprise2 from '../assets/textures/pool/surprise-2.jpg';
import joy1 from '../assets/textures/pool/joy-1.jpg';
import joy2 from '../assets/textures/pool/joy-2.jpg';
import love1 from '../assets/textures/pool/love-1.jpg';
import love2 from '../assets/textures/pool/love-2.jpg';
import love3 from '../assets/textures/pool/love-3.jpg';
import love4 from '../assets/textures/pool/love-4.jpg';

export type Complexity = 'low' | 'medium' | 'high';

export interface PoolImage {
  src: string;
  // Each image's own measured average hue (sampled directly from the
  // source photo) — hue-rotate is computed from this, not a shared
  // constant, since every image in the pool has a different native colour.
  hue: number;
  complexity: Complexity;
}

// Curated per family (not per ring): each of the 6 core families draws only
// from its own set of images, picked by mood/content and by how close each
// photo's own measured hue already sits to that family's hue (so the
// hue-rotate needed to reach the family's exact colour stays small and
// clean). Within a family, `complexity` maps to ring — low for ring1
// (plain, near the wheel's centre), high for ring3 (detailed, at the edge).
export const FAMILY_POOL: Record<string, PoolImage[]> = {
  anger: [
    { src: anger1, hue: 349, complexity: 'low' },
    { src: anger4, hue: 342, complexity: 'medium' },
    { src: anger2, hue: 1, complexity: 'high' },
    { src: anger3, hue: 13, complexity: 'high' },
  ],
  fear: [
    { src: fear3, hue: 19, complexity: 'medium' },
    { src: fear1, hue: 24, complexity: 'high' },
    { src: fear2, hue: 15, complexity: 'high' },
  ],
  sadness: [
    { src: sadness1, hue: 268, complexity: 'medium' },
    { src: sadness2, hue: 263, complexity: 'high' },
  ],
  surprise: [
    { src: surprise1, hue: 191, complexity: 'high' },
    { src: surprise2, hue: 215, complexity: 'high' },
  ],
  joy: [
    { src: joy1, hue: 173, complexity: 'low' },
    { src: joy2, hue: 101, complexity: 'high' },
  ],
  love: [
    { src: love1, hue: 20, complexity: 'low' },
    { src: love3, hue: 343, complexity: 'low' },
    { src: love4, hue: 25, complexity: 'low' },
    { src: love2, hue: 24, complexity: 'medium' },
  ],
};

// Fallback order when a family has no image at the exact complexity a ring
// wants — some families (e.g. surprise) only have high-complexity images,
// so a ring1 node there borrows the closest thing available rather than
// finding an empty pool.
const FALLBACK_ORDER: Record<Complexity, Complexity[]> = {
  low: ['low', 'medium', 'high'],
  medium: ['medium', 'low', 'high'],
  high: ['high', 'medium', 'low'],
};

export function poolCandidates(familyId: string, desired: Complexity): PoolImage[] {
  const pool = FAMILY_POOL[familyId] ?? FAMILY_POOL.joy;
  for (const c of FALLBACK_ORDER[desired]) {
    const matches = pool.filter((p) => p.complexity === c);
    if (matches.length) return matches;
  }
  return pool;
}
