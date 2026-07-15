import React, { useState, useRef, useCallback } from 'react';
import { EMOTIONS, DYADS, IntensityLevel } from '../data/emotions';

// Ring-centre radii normalised to outer wheel edge (r = 220)
const RING_R = { high: 0.364, mid: 0.614, low: 0.875 } as const;

interface EmotionWheelProps {
  onSelect: (angleDeg: number, radius: number) => void;
  selected: { emotionId: string; intensity: IntensityLevel } | null;
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

function textArcPosition(cx: number, cy: number, r: number, angleDeg: number) {
  return polarToCartesian(cx, cy, r, angleDeg);
}

export default function EmotionWheel({ onSelect, selected }: EmotionWheelProps) {
  const [hovered, setHovered] = useState<{ emotionId: string; intensity: IntensityLevel } | null>(null);
  const svgRef   = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const cx = 250;
  const cy = 250;

  const pointerToAngleRadius = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect   = svg.getBoundingClientRect();
    const scaleX = 500 / rect.width;
    const scaleY = 500 / rect.height;
    const svgX   = (e.clientX - rect.left)  * scaleX;
    const svgY   = (e.clientY - rect.top)   * scaleY;
    const dx = svgX - cx;
    const dy = svgY - cy;
    const pxR = Math.sqrt(dx * dx + dy * dy);
    if (pxR < 20) return null;   // ignore the neutral centre
    const normR = Math.min(1.0, pxR / 220);
    // atan2 returns standard math angle; convert to wheel convention: wheelDeg = mathDeg + 90
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

  // Pixel ring radii
  const innerR1 = 55;
  const innerR2 = 105;
  const midR1 = 105;
  const midR2 = 165;
  const outerR1 = 165;
  const outerR2 = 220;
  const dyadR1 = 220;
  const dyadR2 = 242;

  const getHoveredLabel = () => {
    if (hovered) {
      const emotion = EMOTIONS.find(e => e.id === hovered.emotionId);
      if (emotion) return emotion[hovered.intensity].label;
    }
    if (selected) {
      const emotion = EMOTIONS.find(e => e.id === selected.emotionId);
      if (emotion) return emotion[selected.intensity].label;
    }
    return null;
  };

  const isSelected = (emotionId: string, intensity: IntensityLevel) =>
    selected?.emotionId === emotionId && selected?.intensity === intensity;
  const isHovered = (emotionId: string, intensity: IntensityLevel) =>
    hovered?.emotionId === emotionId && hovered?.intensity === intensity;

  return (
    <div className="flex flex-col items-center select-none">
      <svg
        ref={svgRef}
        viewBox="0 0 500 500"
        width="500"
        height="500"
        style={{ maxWidth: '100%', maxHeight: '100%', cursor: 'crosshair', touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Outer ring segments (low intensity) */}
        {EMOTIONS.map((emotion) => {
          const startAngle = emotion.angle - 22.5;
          const endAngle = emotion.angle + 22.5;
          const d = arcPath(cx, cy, outerR1, outerR2, startAngle, endAngle);
          const midAngle = emotion.angle;
          const textPos = textArcPosition(cx, cy, (outerR1 + outerR2) / 2, midAngle);
          const fill = `hsl(${emotion.hue}, 45%, 65%)`;
          const sel = isSelected(emotion.id, 'low');
          const hov = isHovered(emotion.id, 'low');
          return (
            <g key={`outer-${emotion.id}`}>
              <path
                d={d}
                fill={fill}
                opacity={hov ? 0.85 : 1}
                stroke={sel ? 'white' : 'rgba(13,13,15,0.6)'}
                strokeWidth={sel ? 2 : 0.8}
                cursor="pointer"
                onClick={() => onSelect(emotion.angle, RING_R.low)}
                onMouseEnter={() => setHovered({ emotionId: emotion.id, intensity: 'low' })}
                onMouseLeave={() => setHovered(null)}
              />
              <text
                x={textPos.x}
                y={textPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="7"
                fill="rgba(255,255,255,0.85)"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
                transform={`rotate(${midAngle > 90 && midAngle < 270 ? midAngle + 180 : midAngle}, ${textPos.x}, ${textPos.y})`}
              >
                {emotion.low.label}
              </text>
            </g>
          );
        })}

        {/* Mid ring segments (primary emotions) */}
        {EMOTIONS.map((emotion) => {
          const startAngle = emotion.angle - 22.5;
          const endAngle = emotion.angle + 22.5;
          const d = arcPath(cx, cy, midR1, midR2, startAngle, endAngle);
          const midAngle = emotion.angle;
          const textPos = textArcPosition(cx, cy, (midR1 + midR2) / 2, midAngle);
          const fill = `hsl(${emotion.hue}, 80%, 50%)`;
          const sel = isSelected(emotion.id, 'mid');
          const hov = isHovered(emotion.id, 'mid');
          return (
            <g key={`mid-${emotion.id}`}>
              <path
                d={d}
                fill={fill}
                opacity={hov ? 0.85 : 1}
                stroke={sel ? 'white' : 'rgba(13,13,15,0.6)'}
                strokeWidth={sel ? 2 : 0.8}
                cursor="pointer"
                onClick={() => onSelect(emotion.angle, RING_R.mid)}
                onMouseEnter={() => setHovered({ emotionId: emotion.id, intensity: 'mid' })}
                onMouseLeave={() => setHovered(null)}
              />
              <text
                x={textPos.x}
                y={textPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="8.5"
                fontWeight="500"
                fill="rgba(255,255,255,0.95)"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
                transform={`rotate(${midAngle > 90 && midAngle < 270 ? midAngle + 180 : midAngle}, ${textPos.x}, ${textPos.y})`}
              >
                {emotion.label}
              </text>
            </g>
          );
        })}

        {/* Inner ring segments (high intensity) */}
        {EMOTIONS.map((emotion) => {
          const startAngle = emotion.angle - 22.5;
          const endAngle = emotion.angle + 22.5;
          const d = arcPath(cx, cy, innerR1, innerR2, startAngle, endAngle);
          const midAngle = emotion.angle;
          const textPos = textArcPosition(cx, cy, (innerR1 + innerR2) / 2, midAngle);
          const fill = `hsl(${emotion.hue}, 100%, 35%)`;
          const sel = isSelected(emotion.id, 'high');
          const hov = isHovered(emotion.id, 'high');
          return (
            <g key={`inner-${emotion.id}`}>
              <path
                d={d}
                fill={fill}
                opacity={hov ? 0.85 : 1}
                stroke={sel ? 'white' : 'rgba(13,13,15,0.6)'}
                strokeWidth={sel ? 2 : 0.8}
                cursor="pointer"
                onClick={() => onSelect(emotion.angle, RING_R.high)}
                onMouseEnter={() => setHovered({ emotionId: emotion.id, intensity: 'high' })}
                onMouseLeave={() => setHovered(null)}
              />
              <text
                x={textPos.x}
                y={textPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="6.5"
                fill="rgba(255,255,255,0.8)"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
                transform={`rotate(${midAngle > 90 && midAngle < 270 ? midAngle + 180 : midAngle}, ${textPos.x}, ${textPos.y})`}
              >
                {emotion.high.label}
              </text>
            </g>
          );
        })}

        {/* Dyad wedge markers */}
        {DYADS.map((dyad) => {
          const startAngle = dyad.angle - 11.25;
          const endAngle = dyad.angle + 11.25;
          const d = arcPath(cx, cy, dyadR1, dyadR2, startAngle, endAngle);
          const textPos = textArcPosition(cx, cy, dyadR2 + 10, dyad.angle);
          return (
            <g key={`dyad-${dyad.id}`}>
              <path
                d={d}
                fill="rgba(255,255,255,0.12)"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={0.5}
              />
              <text
                x={textPos.x}
                y={textPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="6"
                fill="rgba(255,255,255,0.45)"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
                transform={`rotate(${dyad.angle > 90 && dyad.angle < 270 ? dyad.angle + 180 : dyad.angle}, ${textPos.x}, ${textPos.y})`}
              >
                {dyad.label}
              </text>
            </g>
          );
        })}

        {/* Center neutral zone */}
        <circle
          cx={cx}
          cy={cy}
          r={innerR1}
          fill="rgba(255,255,255,0.06)"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={1}
        />
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="8"
          fill="rgba(255,255,255,0.4)"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          neutral
        </text>

        {/* Seam lines between segments */}
        {EMOTIONS.map((emotion) => {
          const angle = emotion.angle - 22.5;
          const p1 = polarToCartesian(cx, cy, innerR1, angle);
          const p2 = polarToCartesian(cx, cy, dyadR2, angle);
          return (
            <line
              key={`seam-${emotion.id}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="rgba(13,13,15,0.5)"
              strokeWidth={0.8}
              style={{ pointerEvents: 'none' }}
            />
          );
        })}
      </svg>

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
