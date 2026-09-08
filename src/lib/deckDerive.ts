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
// emotions at once: the pick itself, its two complementary neighbours, and
// its two contrasting opposites.
//
// Both roles follow Plutchik's own wheel geometry, not a re-reading of the
// pick's own blend:
//   - Complementary = ADJACENT emotions, one step around the wheel either
//     direction. On Plutchik's model this is what actually blends into a
//     named compound (joy+trust=love, fear+surprise=awe) — "complementary"
//     in the everyday sense of "goes well with", not the color-wheel sense
//     of "directly opposite".
//   - Contrast/opposing = the true polar opposite, straight across the
//     wheel (four steps away on Plutchik's 8-primary version), matched at
//     the SAME intensity ring as the pick — joy contrasts with sadness,
//     ecstasy with grief, not ecstasy with pensiveness. Using a different
//     ring gets the axis right but overstates one side.
// ---------------------------------------------------------------------------

export type PaletteRole = 'primary' | 'complementary' | 'contrast';

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

// The wheel's 6 core families sit 60° apart — Plutchik's own "one step" on
// his 8-primary wheel, scaled to this wheel's family count.
const FAMILY_STEP = 60;

function nodeToPanel(e: BlendEntry, role: PaletteRole): PalettePanelData {
  // Only primary represents an actual share of this selection's own blend —
  // complementary/contrast are derived from different coordinates entirely,
  // so a weight percentage for them would be meaningless (and previously
  // rendered as a bogus "null%").
  return {
    role,
    label: e.node.label,
    hue: e.node.hue,
    valence: e.node.valence,
    arousal: e.node.arousal,
    dominance: e.node.dominance,
    weightPct: role === 'primary' ? Math.round(e.weight * 100) : null,
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
  const primary = nodeToPanel(topBlendEntry(blend), 'primary');

  // coordinateToBlend always returns all 165 nodes pre-sorted by weight —
  // the nearest node to a given coordinate is overwhelmingly dominant, so
  // a weight threshold here would almost always filter the second contrast
  // entry out. Taking the top-N directly just means "the N nearest specific
  // words", which is what we actually want.
  const complementary = [angleDeg + FAMILY_STEP, angleDeg - FAMILY_STEP]
    .map((a) => coordinateToBlend(a, radius)[0])
    .filter((e): e is BlendEntry => !!e)
    .map((e) => nodeToPanel(e, 'complementary'));

  const contrast = coordinateToBlend(angleDeg + 180, radius)
    .slice(0, 2)
    .map((e) => nodeToPanel(e, 'contrast'));

  return [primary, ...complementary, ...contrast];
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

// Complementary/opposing follow the same Plutchik geometry as
// derivePaletteRoles above: complementary is the pair of adjacent
// neighbours (one step either direction — what actually blends into a
// named compound on his model), opposing is the true polar opposite
// straight across the wheel, matched at the same intensity ring rather
// than a different one.
export function deriveRadarData(angleDeg: number, radius: number): RadarPoint[] {
  const complementary = [angleDeg + FAMILY_STEP, angleDeg - FAMILY_STEP]
    .flatMap((a) => coordinateToBlend(a, radius).slice(0, 2))
    .map((e) => toRadarPoint(e.node, e.weight, 'complementary'));

  const opposing = coordinateToBlend(angleDeg + 180, radius)
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
