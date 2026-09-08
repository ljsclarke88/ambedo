import { EmotionNode, EmotionVariant, IntensityLevel } from '../data/emotions';
import { BlendEntry, AffectVector, coordinateToBlend } from './mappings';

// A single curated wheel pick, captured for the multi-emotion deck views
// (Emotional Palette / Mapping / Multisensory Map all take 2–8 of these).
export interface SelectionEntry {
  id: string;
  angleDeg: number;
  radius: number;
  emotionId: string;
  intensity: IntensityLevel;
  variant: EmotionVariant;
  baseHue: number;
  blend: BlendEntry[];
  affect: AffectVector;
}

// The single most-representative node in a blend — what the app already
// calls "primary" (derivePaletteRoles' first role). Shared so the palette
// summary swatch, the mapping overview's "choice" bubble, and the
// multisensory overview row all agree on which node represents a selection.
export function topBlendEntry(blend: BlendEntry[]): BlendEntry {
  return [...blend].sort((a, b) => b.weight - a.weight)[0];
}

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
  nodeId: string; // exact EmotionNode id (e.g. 'joy-mid') — which generated texture to use
  intensity: IntensityLevel; // which ring the source node sits on — drives texture pattern complexity
  sourceId: string; // root family id (e.g. 'joy') — which family's texture pool to draw from
}

const HIGH_R = 0.36;
const LOW_R = 0.87;

function nodeToPanel(e: BlendEntry, role: PaletteRole): PalettePanelData {
  // Only primary/secondary/tertiary represent an actual share of this
  // selection's own blend — complementary/contrast are derived from a
  // different coordinate entirely, so a weight percentage for them would be
  // meaningless (and previously rendered as a bogus "null%").
  const isBlendRole = role === 'primary' || role === 'secondary' || role === 'tertiary';
  return {
    role,
    label: e.node.label,
    hue: e.node.hue,
    valence: e.node.valence,
    arousal: e.node.arousal,
    dominance: e.node.dominance,
    weightPct: isBlendRole ? Math.round(e.weight * 100) : null,
    nodeId: e.node.id,
    intensity: e.node.intensity,
    sourceId: e.node.sourceId,
  };
}

export function derivePaletteRoles(
  angleDeg: number,
  radius: number,
  blend: BlendEntry[]
): PalettePanelData[] {
  const sig = blend.filter((e) => e.weight > 0.02).slice(0, 3);
  // A pure/100% pick (no meaningful secondary contribution) only has one
  // real thing to say about itself, so it borrows the two nearest
  // complementary and two nearest contrasting neighbours instead — keeping
  // every row at a full 5 panels the way a blended selection's
  // primary/secondary/tertiary + complementary/contrast naturally does.
  const isPure = sig.length <= 1;

  const primaries: PalettePanelData[] = sig.map((e, i) =>
    nodeToPanel(e, (['primary', 'secondary', 'tertiary'] as const)[i])
  );

  const compAngle = angleDeg + 180;

  const compEntries = coordinateToBlend(compAngle, radius)
    .filter((e) => e.weight > 0.02)
    .slice(0, isPure ? 2 : 1);
  const complementary = compEntries.map((e) => nodeToPanel(e, 'complementary'));

  // Same hue neighbourhood as the complement, opposite intensity band —
  // shares a family with the complementary panel(s) while contrasting in
  // energy/scale.
  const contrastRadius = radius > 0.6 ? HIGH_R : LOW_R;
  const contrastEntries = coordinateToBlend(compAngle, contrastRadius)
    .filter((e) => e.weight > 0.02)
    .slice(0, isPure ? 2 : 1);
  const contrast = contrastEntries.map((e) => nodeToPanel(e, 'contrast'));

  return [...primaries, ...complementary, ...contrast];
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

// Complementary/opposing here mean the same thing they do on Plutchik's
// wheel (and in derivePaletteRoles above): the emotion(s) directly across
// the wheel from the one you picked, not a re-reading of your own pick's
// own blend — sampling the SAME blend's top entries (as this used to do)
// just gives back whatever you clicked, which reads as "complementary to
// itself." Complementary = the opposite angle at the same radius (same
// intensity, opposite hue); opposing = the opposite angle at the opposite
// intensity band too (opposite hue AND opposite energy/scale).
export function deriveRadarData(angleDeg: number, radius: number): RadarPoint[] {
  const compAngle = angleDeg + 180;

  const complementary = coordinateToBlend(compAngle, radius)
    .filter((e) => e.weight > 0.02)
    .slice(0, 4)
    .map((e) => toRadarPoint(e.node, e.weight, 'complementary'));

  const contrastRadius = radius > 0.6 ? HIGH_R : LOW_R;
  const opposing = coordinateToBlend(compAngle, contrastRadius)
    .filter((e) => e.weight > 0.02)
    .slice(0, 4)
    .map((e) => toRadarPoint(e.node, e.weight, 'opposing'));

  return [...complementary, ...opposing];
}

export interface OverviewRadarPoint extends RadarPoint {
  selectionId: string;
  isChoice: boolean;
}

// Combines every curated selection's dominant "choice" (one large, labelled
// bubble) with up to two of its next-most-significant blend entries (small,
// unlabelled) onto one shared field. Deliberately thin — with up to 8
// selections a full per-selection breakdown here would be unreadable, so the
// overview only carries enough of each blend to gesture at its composition;
// the full breakdown lives in the per-selection chart underneath it.
export function deriveOverviewRadarData(selections: { id: string; blend: BlendEntry[] }[]): OverviewRadarPoint[] {
  const points: OverviewRadarPoint[] = [];
  for (const sel of selections) {
    const sorted = [...sel.blend].sort((a, b) => b.weight - a.weight);
    const [choice, ...rest] = sorted;
    if (!choice) continue;
    points.push({ ...toRadarPoint(choice.node, choice.weight, 'complementary'), selectionId: sel.id, isChoice: true });
    rest
      .filter((e) => e.weight > 0.04)
      .slice(0, 2)
      .forEach((e) => {
        points.push({ ...toRadarPoint(e.node, e.weight, 'complementary'), selectionId: sel.id, isChoice: false });
      });
  }
  return points;
}

function toRadarPoint(
  node: EmotionNode,
  weight: number,
  kind: 'complementary' | 'opposing'
): RadarPoint {
  return {
    label: node.label,
    angleDeg: node.angle,
    // Bounded to stay within the chart's outer ring (radiusNorm 1 = MAX_R)
    // even at weight 1 — a direct/pure selection (e.g. clicking exactly on
    // "Vigilance") used to compute radiusNorm past 2.5, plotting the point
    // far outside the visible SVG and making it look like it had vanished.
    radiusNorm: kind === 'complementary' ? 0.35 + Math.min(1, weight) * 0.65 : 0.9,
    hue: node.hue,
    weightPct: kind === 'complementary' ? Math.round(weight * 100) : null,
    kind,
  };
}
