import React, { useState, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { EMOTIONS, EMOTION_NODES, IntensityLevel, RING_RADIUS } from '../data/emotions';

interface EmotionWheelProps {
  onSelect: (angleDeg: number, radius: number) => void;
  selected: { emotionId: string; intensity: IntensityLevel } | null;
  indicatorPos: { angleDeg: number; radius: number } | null;
  complementPos: { angleDeg: number; radius: number } | null;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r1: number, r2: number, startAngle: number, endAngle: number): string {
  const p1 = polarToCartesian(cx, cy, r1, startAngle);
  const p2 = polarToCartesian(cx, cy, r1, endAngle);
  const p3 = polarToCartesian(cx, cy, r2, endAngle);
  const p4 = polarToCartesian(cx, cy, r2, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${p1.x} ${p1.y} A ${r1} ${r1} 0 ${largeArc} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${r2} ${r2} 0 ${largeArc} 0 ${p4.x} ${p4.y} Z`;
}

function textRotation(angleDeg: number): number {
  return angleDeg > 90 && angleDeg < 270 ? angleDeg + 180 : angleDeg;
}

const FAMILY_SPAN = 60;

// Pixel geometry — cx/cy/viewBox sized to comfortably fit the busiest
// family's ring3 word count without needing multiple stacked rings (unlike
// the old 8-family layout, this is always exactly 3 rings deep).
const R_NEUTRAL = 40;
const R1_IN = 40, R1_OUT = 150;
const R2_IN = 150, R2_OUT = 260;
const R3_IN = 260, R3_OUT = 420;
const MARGIN = 20;
const HALF = R3_OUT + MARGIN;
const SIZE = HALF * 2;

interface WedgeNode {
  id: string;
  label: string;
  angle: number;
  hue: number;
  valence: number;
  arousal: number;
  dominance: number;
  radius: number; // the actual (angle,radius) this node selects, in the 0–1 blend-engine scale
}

// Every ring1/ring2/ring3 node for one family, in the same order the data
// model built them — so slice width can be derived as (60° / count) without
// duplicating the angle math that produced EMOTION_NODES in the first place.
function familyTier(familyId: string, tier: IntensityLevel): WedgeNode[] {
  return EMOTION_NODES.filter((n) => n.sourceId === familyId && n.intensity === tier);
}

export default function EmotionWheel({ onSelect, selected, indicatorPos, complementPos }: EmotionWheelProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
  const svgRef   = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const cx = HALF;
  const cy = HALF;

  const pointerToAngleRadius = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return null;
    // Convert client (mouse) coordinates to SVG user-space via the element's
    // own screen transform matrix, rather than manually scaling by
    // getBoundingClientRect() width/height — the manual approach breaks
    // whenever the rendered box isn't perfectly square (e.g. any
    // letterboxing introduced by maxWidth/maxHeight constraints), producing
    // a subtle click/indicator mismatch. getScreenCTM() accounts for
    // viewBox scaling, preserveAspectRatio letterboxing, and CSS transforms
    // automatically.
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const p = pt.matrixTransform(ctm.inverse());
    const dx = p.x - cx;
    const dy = p.y - cy;
    const pxR = Math.sqrt(dx * dx + dy * dy);
    if (pxR < 20) return null;   // ignore the neutral centre
    const normR = Math.min(1.0, pxR / R3_OUT);
    const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    return { angleDeg, radius: normR };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    dragging.current = true;
    (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
    const pos = pointerToAngleRadius(e);
    if (pos) onSelect(pos.angleDeg, pos.radius);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging.current) return;
    const pos = pointerToAngleRadius(e);
    if (pos) onSelect(pos.angleDeg, pos.radius);
  };

  const handlePointerUp = () => {
    dragging.current = false;
  };

  const families = useMemo(
    () => EMOTIONS.map((f) => ({
      ...f,
      ring2: familyTier(f.id, 'ring2'),
      ring3: familyTier(f.id, 'ring3'),
    })),
    []
  );

  const getHoveredLabel = () => {
    if (hoveredLabel) return hoveredLabel;
    if (selected) {
      const node = EMOTION_NODES.find((n) => n.sourceId === selected.emotionId && n.intensity === selected.intensity);
      if (node) return node.label;
    }
    return null;
  };

  return (
    <div className="flex flex-col items-center select-none" style={{ width: '100%', height: '100%', minHeight: 0 }}>
      {/* This wrapper — not the svg itself — is what needs a genuinely
          definite height for the svg's width/height:100% to resolve
          against; a plain "auto"-sized ancestor makes percentage sizing on
          the svg silently no-op, so it renders at its full intrinsic 880px
          regardless of available space. flex:1 + minHeight:0 here gives it
          one. */}
      <div style={{ flex: '1 1 auto', minHeight: 0, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width={SIZE}
        height={SIZE}
        style={{ width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%', cursor: 'crosshair', touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {families.map((family) => {
          const familyStart = family.angle - FAMILY_SPAN / 2;
          const familyEnd = family.angle + FAMILY_SPAN / 2;

          const catSpan = FAMILY_SPAN / family.ring2.length;
          const wordSpan = FAMILY_SPAN / family.ring3.length;

          const hue = family.hue;

          return (
            <g key={family.id}>
              {/* Ring1 — the core family */}
              <path
                d={arcPath(cx, cy, R1_IN, R1_OUT, familyStart, familyEnd)}
                fill={`hsl(${hue}, 78%, 50%)`}
                opacity={hoveredId === family.id ? 0.85 : 1}
                stroke={selected?.emotionId === family.id && selected.intensity === 'ring1' ? 'white' : 'rgba(13,13,15,0.6)'}
                strokeWidth={selected?.emotionId === family.id && selected.intensity === 'ring1' ? 2 : 0.8}
                cursor="pointer"
                onClick={() => onSelect(family.angle, RING_RADIUS.ring1)}
                onMouseEnter={() => { setHoveredId(family.id); setHoveredLabel(family.label); }}
                onMouseLeave={() => { setHoveredId(null); setHoveredLabel(null); }}
              />
              <text
                x={polarToCartesian(cx, cy, (R1_IN + R1_OUT) / 2, family.angle).x}
                y={polarToCartesian(cx, cy, (R1_IN + R1_OUT) / 2, family.angle).y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="13"
                fontWeight="600"
                fill="rgba(255,255,255,0.95)"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
                transform={`rotate(${textRotation(family.angle)}, ${polarToCartesian(cx, cy, (R1_IN + R1_OUT) / 2, family.angle).x}, ${polarToCartesian(cx, cy, (R1_IN + R1_OUT) / 2, family.angle).y})`}
              >
                {family.label}
              </text>

              {/* Ring2 — sub-categories */}
              {family.ring2.map((cat, ci) => {
                const start = familyStart + catSpan * ci;
                const end = start + catSpan;
                const mid = start + catSpan / 2;
                const textPos = polarToCartesian(cx, cy, (R2_IN + R2_OUT) / 2, mid);
                const hov = hoveredId === cat.id;
                const sel = selected?.emotionId === family.id && selected.intensity === 'ring2' && getHoveredLabel() === cat.label;
                return (
                  <g key={cat.id}>
                    <path
                      d={arcPath(cx, cy, R2_IN, R2_OUT, start, end)}
                      fill={`hsl(${hue}, 58%, 58%)`}
                      opacity={hov ? 0.85 : 1}
                      stroke={sel ? 'white' : 'rgba(13,13,15,0.5)'}
                      strokeWidth={sel ? 1.6 : 0.6}
                      cursor="pointer"
                      onClick={() => onSelect(mid, RING_RADIUS.ring2)}
                      onMouseEnter={() => { setHoveredId(cat.id); setHoveredLabel(cat.label); }}
                      onMouseLeave={() => { setHoveredId(null); setHoveredLabel(null); }}
                    />
                    <text
                      x={textPos.x}
                      y={textPos.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="8"
                      fontWeight="500"
                      fill="rgba(20,20,22,0.85)"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                      transform={`rotate(${textRotation(mid) + 90}, ${textPos.x}, ${textPos.y})`}
                    >
                      {cat.label}
                    </text>
                  </g>
                );
              })}

              {/* Ring3 — specific words, evenly spaced across the family's
                  full span (not nested per-category) so busy categories
                  don't collapse into unreadable slivers */}
              {family.ring3.map((word, wi) => {
                const start = familyStart + wordSpan * wi;
                const end = start + wordSpan;
                const mid = start + wordSpan / 2;
                const textPos = polarToCartesian(cx, cy, (R3_IN + R3_OUT) / 2, mid);
                const hov = hoveredId === word.id;
                return (
                  <g key={word.id}>
                    <path
                      d={arcPath(cx, cy, R3_IN, R3_OUT, start, end)}
                      fill={`hsl(${hue}, 40%, 72%)`}
                      opacity={hov ? 0.8 : 1}
                      stroke="rgba(13,13,15,0.4)"
                      strokeWidth={0.4}
                      cursor="pointer"
                      onClick={() => onSelect(mid, RING_RADIUS.ring3)}
                      onMouseEnter={() => { setHoveredId(word.id); setHoveredLabel(word.label); }}
                      onMouseLeave={() => { setHoveredId(null); setHoveredLabel(null); }}
                    />
                    <text
                      x={textPos.x}
                      y={textPos.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="6.5"
                      fill="rgba(18,18,20,0.78)"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                      transform={`rotate(${textRotation(mid) + 90}, ${textPos.x}, ${textPos.y})`}
                    >
                      {word.label}
                    </text>
                  </g>
                );
              })}

              {/* Seam lines at family boundaries, through all 3 rings */}
              {(() => {
                const p1 = polarToCartesian(cx, cy, R1_IN, familyStart);
                const p2 = polarToCartesian(cx, cy, R3_OUT, familyStart);
                return (
                  <line
                    x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                    stroke="rgba(13,13,15,0.55)"
                    strokeWidth={0.9}
                    style={{ pointerEvents: 'none' }}
                  />
                );
              })()}
            </g>
          );
        })}

        {/* Ring seam circles */}
        {[R1_OUT, R2_OUT].map((r) => (
          <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="rgba(13,13,15,0.35)" strokeWidth={0.6} style={{ pointerEvents: 'none' }} />
        ))}

        {/* Center neutral zone */}
        <circle
          cx={cx}
          cy={cy}
          r={R_NEUTRAL}
          fill="rgba(255,255,255,0.06)"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={1}
        />
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="9"
          fill="rgba(255,255,255,0.4)"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          neutral
        </text>

        {/* Ghost indicator — complement position (dimmer, no pulse) */}
        {complementPos && (() => {
          const rad = (complementPos.angleDeg - 90) * (Math.PI / 180);
          const gx  = cx + complementPos.radius * R3_OUT * Math.cos(rad);
          const gy  = cy + complementPos.radius * R3_OUT * Math.sin(rad);
          return (
            <g style={{ pointerEvents: 'none' }}>
              <motion.circle
                cx={gx} cy={gy} r={7}
                fill="none"
                stroke="rgba(255,255,255,0.28)"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                animate={{ cx: gx, cy: gy }}
                transition={{ type: 'spring', stiffness: 220, damping: 28 }}
              />
              <motion.circle
                cx={gx} cy={gy} r={3}
                fill="rgba(255,255,255,0.35)"
                animate={{ cx: gx, cy: gy }}
                transition={{ type: 'spring', stiffness: 220, damping: 28 }}
              />
            </g>
          );
        })()}

        {/* Animated indicator dot — follows (angleDeg, radius) of the selection */}
        {indicatorPos && (() => {
          const rad  = (indicatorPos.angleDeg - 90) * (Math.PI / 180);
          const ix   = cx + indicatorPos.radius * R3_OUT * Math.cos(rad);
          const iy   = cy + indicatorPos.radius * R3_OUT * Math.sin(rad);
          return (
            <g style={{ pointerEvents: 'none' }}>
              <motion.circle
                cx={ix} cy={iy} r={12}
                fill="none"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth={1}
                animate={{ cx: ix, cy: iy, r: [10, 14, 10] }}
                transition={{
                  cx: { type: 'spring', stiffness: 220, damping: 28 },
                  cy: { type: 'spring', stiffness: 220, damping: 28 },
                  r:  { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
                }}
              />
              <motion.circle
                cx={ix} cy={iy} r={5}
                fill="rgba(255,255,255,0.9)"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth={1.5}
                animate={{ cx: ix, cy: iy }}
                transition={{ type: 'spring', stiffness: 220, damping: 28 }}
                style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.5))' }}
              />
            </g>
          );
        })()}
      </svg>
      </div>

      {/* Tooltip below wheel */}
      <div
        style={{
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '8px',
        }}
      >
        {getHoveredLabel() ? (
          <span
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: '18px',
              color: 'rgba(232,228,222,0.75)',
              letterSpacing: '0.04em',
            }}
          >
            {getHoveredLabel()}
          </span>
        ) : (
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '11px',
              color: 'rgba(232,228,222,0.3)',
              letterSpacing: '0.08em',
            }}
          >
            click a segment to explore
          </span>
        )}
      </div>
    </div>
  );
}
