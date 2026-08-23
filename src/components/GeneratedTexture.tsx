import React, { useMemo } from 'react';
import { resolveNodeTexture } from '../lib/resolveTexture';

interface GeneratedTextureProps {
  nodeId: string;    // exact EmotionNode id (e.g. 'joy-mid'), or a dyad id — resolved with fallback
  hue: number;
  valence: number;
  arousal: number;
  dominance: number;
}

// A single generated texture per emotion-wheel node — the science (V/A/D →
// colour/sound/taste/scent/geometry/motion) already shaped the image itself
// at generation time, so this component's job is just picking the right one
// and applying a light science-driven tint, not crossfading or compositing.
export default function GeneratedTexture({ nodeId, hue, valence, arousal, dominance }: GeneratedTextureProps) {
  const { src, filter } = useMemo(() => {
    const resolved = resolveNodeTexture(nodeId, hue, valence, arousal);

    // Shortest-path hue difference, wrapped to -180..180. Zero for any of
    // the 24 direct-match nodes (the image was already generated at this
    // exact hue); a small corrective nudge for a borrowed/fallback texture.
    let rotate = hue - resolved.hue;
    rotate = ((rotate + 180) % 360 + 360) % 360 - 180;

    const saturate = 0.85 + dominance * 0.5;
    const brightness = 0.82 + arousal * 0.22;
    const contrast = 1 + dominance * 0.12;

    return {
      src: resolved.src,
      filter: `hue-rotate(${rotate.toFixed(1)}deg) saturate(${saturate.toFixed(2)}) brightness(${brightness.toFixed(2)}) contrast(${contrast.toFixed(2)})`,
    };
  }, [nodeId, hue, valence, arousal, dominance]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter,
      }}
    />
  );
}
