import React, { useMemo } from 'react';
import { poolCandidates, Complexity } from '../lib/texturePool';
import { IntensityLevel } from '../data/emotions';

interface GeneratedTextureProps {
  nodeId: string;    // exact EmotionNode id (e.g. 'joy-mid') — seeds every per-node variation below
  hue: number;
  valence: number;
  arousal: number;
  dominance: number;
  // Ring the node sits on — maps to a desired image complexity (ring1 →
  // low, ring2 → medium, ring3 → high). Optional so older/simpler call
  // sites still get a sane mid-complexity default.
  intensity?: IntensityLevel;
  // Root family id (e.g. 'joy') — which family's curated pool to draw from.
  // Optional so older/simpler call sites fall back to a sane default pool.
  familyId?: string;
}

const RING_COMPLEXITY: Record<IntensityLevel, Complexity> = {
  ring1: 'low',
  ring2: 'medium',
  ring3: 'high',
};

// Deterministic string hash (FNV-1a) — which pool candidate a node draws,
// and its pan/zoom crop window, are both seeded from this, so the same node
// always renders the same way, and two different nodes that happen to
// share a candidate still never look pixel-identical.
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// A single generated texture per emotion-wheel node — picks a curated image
// from its own family's pool (see texturePool.ts) at the complexity its
// ring calls for, then applies the same science-driven colour tinting the
// app has always used: hue-rotate from that specific image's own measured
// hue onto the node's exact computed hue, saturation from dominance,
// brightness from arousal. A per-node pan/zoom window (seeded by the
// node's own id) means two nodes that share a pool image never show the
// same crop of it.
export default function GeneratedTexture({ nodeId, hue, valence, arousal, dominance, intensity = 'ring2', familyId = 'joy' }: GeneratedTextureProps) {
  const { src, filter, backgroundPosition, scale } = useMemo(() => {
    const candidates = poolCandidates(familyId, RING_COMPLEXITY[intensity]);
    const h = hashString(nodeId);
    const chosen = candidates[h % candidates.length];

    let rotate = hue - chosen.hue;
    rotate = ((rotate + 180) % 360 + 360) % 360 - 180;

    const saturate = 0.85 + dominance * 0.5;
    const brightness = 0.82 + arousal * 0.22;
    const contrast = 1 + dominance * 0.12;

    const posX = 30 + (((h >>> 0) % 997) / 997) * 40;
    const posY = 30 + (((h >>> 8) % 991) / 991) * 40;
    const zoom = 1.08 + (((h >>> 16) % 983) / 983) * 0.3;

    return {
      src: chosen.src,
      filter: `hue-rotate(${rotate.toFixed(1)}deg) saturate(${saturate.toFixed(2)}) brightness(${brightness.toFixed(2)}) contrast(${contrast.toFixed(2)})`,
      backgroundPosition: `${posX.toFixed(1)}% ${posY.toFixed(1)}%`,
      scale: zoom,
    };
  }, [nodeId, hue, valence, arousal, dominance, intensity, familyId]);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${src})`,
          backgroundSize: 'cover',
          backgroundPosition,
          transform: `scale(${scale})`,
          filter,
        }}
      />
    </div>
  );
}
