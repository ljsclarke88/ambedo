import { EmotionNode } from '../data/emotions';
import { BlendEntry, coordinateToBlend, blendToAffect } from './mappings';

// ---------------------------------------------------------------------------
// Derives deck-style, multi-emotion views from a single wheel selection.
// The wheel only ever produces one point at a time, but the client deck's
// "Emotional Palette" and "Emotional Mapping" slides both show several
// emotions at once (primary/secondary/tertiary + a complementary/contrast
// pair, or a full complementary/opposing field). Rather than hardcoding this
// project's specific emotion names, these functions read them off the
// blend engine so any wheel position produces a coherent 5-role palette or
// field map.
// ---------------------------------------------------------------------------

export type PaletteRole = 'primary' | 'secondary' | 'tertiary' | 'complementary' | 'contrast';

export interface PalettePanelData {
  role: PaletteRole;
  label: string;
  hue: number;
  valence: number;
  arousal: number;
  dominance: number;
  weightPct: number | null; // null for complementary/contrast (derived positions, not blend weights)
}

const HIGH_R = 0.36;
const LOW_R = 0.87;

export function derivePaletteRoles(
  angleDeg: number,
  radius: number,
  blend: BlendEntry[]
): PalettePanelData[] {
  const sig = blend.filter((e) => e.weight > 0.02).slice(0, 3);
  const primaries: PalettePanelData[] = sig.map((e, i) => ({
    role: (['primary', 'secondary', 'tertiary'] as const)[i],
    label: e.node.label,
    hue: e.node.hue,
    valence: e.node.valence,
    arousal: e.node.arousal,
    dominance: e.node.dominance,
    weightPct: Math.round(e.weight * 100),
  }));

  const compAngle = angleDeg + 180;

  const compBlend = coordinateToBlend(compAngle, radius);
  const compTop = compBlend[0].node;
  const compAffect = blendToAffect(compBlend);
  const complementary: PalettePanelData = {
    role: 'complementary',
    label: compTop.label,
    hue: compAffect.hue,
    valence: compAffect.valence,
    arousal: compAffect.arousal,
    dominance: compAffect.dominance,
    weightPct: null,
  };

  // Same hue neighbourhood as the complement, opposite intensity band —
  // shares a family with panel 4 while contrasting in energy/scale.
  const contrastRadius = radius > 0.6 ? HIGH_R : LOW_R;
  const contrastBlend = coordinateToBlend(compAngle, contrastRadius);
  const contrastTop = contrastBlend[0].node;
  const contrastAffect = blendToAffect(contrastBlend);
  const contrast: PalettePanelData = {
    role: 'contrast',
    label: contrastTop.label,
    hue: contrastAffect.hue,
    valence: contrastAffect.valence,
    arousal: contrastAffect.arousal,
    dominance: contrastAffect.dominance,
    weightPct: null,
  };

  return [...primaries, complementary, contrast];
}

// ---------------------------------------------------------------------------

export interface RadarPoint {
  label: string;
  angleDeg: number;
  radiusNorm: number; // 0–1, distance from field centre for plotting
  hue: number;
  weightPct: number | null;
  kind: 'complementary' | 'opposing';
}

export function deriveRadarData(blend: BlendEntry[]): RadarPoint[] {
  const sorted = [...blend].sort((a, b) => b.weight - a.weight);

  const complementary = sorted
    .filter((e) => e.weight > 0.015)
    .slice(0, 4)
    .map((e) => toRadarPoint(e.node, e.weight, 'complementary'));

  // Opposing = least-represented, angularly-distinct nodes — the tail of the
  // same blend, filtered to unique source families so we don't just list
  // three intensities of one emotion.
  const seen = new Set(complementary.map((p) => p.label));
  const opposing: RadarPoint[] = [];
  for (let i = sorted.length - 1; i >= 0 && opposing.length < 4; i--) {
    const node = sorted[i].node;
    if (seen.has(node.label)) continue;
    const bySource = opposing.find((p) => p.label === node.label);
    if (bySource) continue;
    seen.add(node.label);
    opposing.push(toRadarPoint(node, sorted[i].weight, 'opposing'));
  }

  return [...complementary, ...opposing];
}

function toRadarPoint(
  node: EmotionNode,
  weight: number,
  kind: 'complementary' | 'opposing'
): RadarPoint {
  return {
    label: node.label,
    angleDeg: node.angle,
    radiusNorm: kind === 'complementary' ? 0.35 + weight * 2.2 : 0.9,
    hue: node.hue,
    weightPct: kind === 'complementary' ? Math.round(weight * 100) : null,
    kind,
  };
}
