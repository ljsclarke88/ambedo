// Shared polygon-path geometry: turns (points, curvature, spikiness) into an
// SVG path — a smooth rounded n-gon at curvature=1/spikiness=0 ("geodesic"),
// a jagged alternating-radius star as spikiness rises. Used by MorphShape for
// the central indicator, and by GeometricTexture to draw echoes of that same
// shape language as a background pattern.

export interface PolygonPathOptions {
  rotationDeg?: number;
  // Extra per-vertex radius multiplier (1 = no change) — lets a caller layer
  // ripple/jitter perturbation onto the base star/polygon shape.
  radiusScale?: (angleRad: number, index: number) => number;
}

export function generatePolygonPath(
  points: number,
  curvature: number,
  size: number,
  spikiness: number,
  options: PolygonPathOptions = {}
): string {
  const { rotationDeg = 0, radiusScale } = options;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = (size / 2) * 0.88;
  const innerR = outerR * (1 - spikiness * 0.5);
  const rotationRad = (rotationDeg * Math.PI) / 180;

  // For a star-like shape, alternate outer/inner radius vertices.
  // When spikiness is 0, inner = outer so it's a regular polygon.
  const totalPoints = spikiness > 0.05 ? points * 2 : points;
  const angleStep = (Math.PI * 2) / totalPoints;

  const vertices: { x: number; y: number }[] = [];
  for (let i = 0; i < totalPoints; i++) {
    const angle = i * angleStep - Math.PI / 2 + rotationRad;
    let r = spikiness > 0.05 ? (i % 2 === 0 ? outerR : innerR) : outerR;
    if (radiusScale) r *= radiusScale(angle, i);
    vertices.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    });
  }

  if (curvature < 0.1 || vertices.length < 3) {
    // Sharp polygon
    return vertices.map((v, i) => `${i === 0 ? 'M' : 'L'} ${v.x.toFixed(2)} ${v.y.toFixed(2)}`).join(' ') + ' Z';
  }

  // Smooth rounded polygon using cubic bezier curves.
  // curvature controls how much the control points pull toward center.
  const tensionFactor = curvature * 0.38;
  let d = '';

  for (let i = 0; i < vertices.length; i++) {
    const prev = vertices[(i - 1 + vertices.length) % vertices.length];
    const curr = vertices[i];
    const next = vertices[(i + 1) % vertices.length];

    const cp1x = curr.x + (prev.x - curr.x) * tensionFactor;
    const cp1y = curr.y + (prev.y - curr.y) * tensionFactor;
    const cp2x = curr.x + (next.x - curr.x) * tensionFactor;
    const cp2y = curr.y + (next.y - curr.y) * tensionFactor;

    if (i === 0) {
      d += `M ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}`;
    } else {
      d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${curr.x.toFixed(2)} ${curr.y.toFixed(2)}`;
      d += ` C ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}`;
    }
  }
  const first = vertices[0];
  const last = vertices[vertices.length - 1];
  const cp1x = first.x + (last.x - first.x) * tensionFactor;
  const cp1y = first.y + (last.y - first.y) * tensionFactor;
  d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${first.x.toFixed(2)} ${first.y.toFixed(2)} Z`;

  return d;
}

// A static (non-animated) SVG path for one cycle-run of a sine/triangle/
// sawtooth wave — the same waveform math WaveformCanvas animates live for
// the Soundscape tab, but rendered once as a path string so it can be used
// as a background texture pattern. `phase` shifts the start point (radians)
// so multiple lines drawn with the same params don't all coincide.
export function generateWavePath(
  waveType: 'sine' | 'triangle' | 'sawtooth',
  width: number,
  height: number,
  cycles: number,
  amplitude: number,
  phase = 0,
  samples = 48
): string {
  const midY = height / 2;
  let d = '';
  for (let i = 0; i <= samples; i++) {
    const x = (i / samples) * width;
    const t = (i / samples) * cycles * Math.PI * 2 + phase;
    let y: number;
    if (waveType === 'sine') {
      y = midY + amplitude * Math.sin(t);
    } else {
      const n = (((t / (Math.PI * 2)) % 1) + 1) % 1;
      y = waveType === 'triangle'
        ? midY + amplitude * (n < 0.5 ? 4 * n - 1 : 3 - 4 * n)
        : midY + amplitude * (2 * n - 1);
    }
    d += `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)} `;
  }
  return d.trim();
}

// Small deterministic PRNG (mulberry32) — used to seed reproducible jitter
// per selection without needing per-frame randomness.
export function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
