import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface MorphShapeProps {
  points: number;
  curvature: number;
  size: number;
  spikiness: number;
  color: string;
  animate?: boolean;
}

function generatePolygonPath(
  points: number,
  curvature: number,
  size: number,
  spikiness: number
): string {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 * 0.88;
  const innerR = outerR * (1 - spikiness * 0.5);

  // For a star-like shape, alternate outer/inner radius vertices
  // When spikiness is 0, inner = outer so it's a regular polygon
  const totalPoints = spikiness > 0.05 ? points * 2 : points;
  const angleStep = (Math.PI * 2) / totalPoints;

  const vertices: { x: number; y: number }[] = [];
  for (let i = 0; i < totalPoints; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const r = spikiness > 0.05 ? (i % 2 === 0 ? outerR : innerR) : outerR;
    vertices.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    });
  }

  if (curvature < 0.1 || vertices.length < 3) {
    // Sharp polygon
    return vertices.map((v, i) => `${i === 0 ? 'M' : 'L'} ${v.x.toFixed(2)} ${v.y.toFixed(2)}`).join(' ') + ' Z';
  }

  // Smooth rounded polygon using cubic bezier curves
  // curvature controls how much the control points pull toward center
  const tensionFactor = curvature * 0.38;
  let d = '';

  for (let i = 0; i < vertices.length; i++) {
    const prev = vertices[(i - 1 + vertices.length) % vertices.length];
    const curr = vertices[i];
    const next = vertices[(i + 1) % vertices.length];

    // Control points pulled along the edges toward current vertex
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
  // Close path back to start
  const first = vertices[0];
  const last = vertices[vertices.length - 1];
  const cp1x = first.x + (last.x - first.x) * tensionFactor;
  const cp1y = first.y + (last.y - first.y) * tensionFactor;
  d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${first.x.toFixed(2)} ${first.y.toFixed(2)} Z`;

  return d;
}

export default function MorphShape({
  points,
  curvature,
  size,
  spikiness,
  color,
  animate = true,
}: MorphShapeProps) {
  const pathData = useMemo(
    () => generatePolygonPath(points, curvature, size, spikiness),
    [points, curvature, size, spikiness]
  );

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ overflow: 'visible' }}
      animate={
        animate
          ? {
              scale: [1, 1.04, 0.96, 1.02, 1],
            }
          : { scale: 1 }
      }
      transition={
        animate
          ? {
              duration: 4,
              ease: 'easeInOut',
              repeat: Infinity,
              repeatType: 'mirror',
            }
          : {}
      }
    >
      <defs>
        <filter id="morphGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <motion.path
        d={pathData}
        fill={color}
        fillOpacity={0.55}
        stroke={color}
        strokeWidth={1.5}
        strokeOpacity={0.8}
        filter="url(#morphGlow)"
        animate={{ d: pathData }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      />
    </motion.svg>
  );
}
