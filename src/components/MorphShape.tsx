import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { generatePolygonPath } from '../lib/geometryPath';

interface MorphShapeProps {
  points: number;
  curvature: number;
  size: number;
  spikiness: number;
  color: string;
  animate?: boolean;
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
