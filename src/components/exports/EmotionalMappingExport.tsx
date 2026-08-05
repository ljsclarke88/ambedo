import React, { useRef } from 'react';
import { RadarPoint } from '../../lib/deckDerive';
import DownloadBar from './DownloadBar';

interface EmotionalMappingExportProps {
  points: RadarPoint[];
}

const SIZE = 440;
const CX = SIZE / 2;
const CY = SIZE / 2;
const MAX_R = 180;

function toXY(angleDeg: number, radiusNorm: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [CX + Math.cos(rad) * radiusNorm * MAX_R, CY + Math.sin(rad) * radiusNorm * MAX_R];
}

export default function EmotionalMappingExport({ points }: EmotionalMappingExportProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rings = [0.33, 0.66, 1];

  return (
    <div>
      <div
        ref={ref}
        style={{
          width: '100%',
          maxWidth: `${SIZE}px`,
          aspectRatio: '1 / 1',
          background: '#0d0d0f',
          borderRadius: '4px',
          padding: '12px',
          margin: '0 auto',
        }}
      >
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width="100%" height="100%">
          {rings.map((r) => (
            <circle
              key={r}
              cx={CX}
              cy={CY}
              r={r * MAX_R}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={1}
            />
          ))}
          <line x1={CX} y1={CY - MAX_R} x2={CX} y2={CY + MAX_R} stroke="rgba(255,255,255,0.06)" />
          <line x1={CX - MAX_R} y1={CY} x2={CX + MAX_R} y2={CY} stroke="rgba(255,255,255,0.06)" />
          <circle cx={CX} cy={CY} r={3} fill="rgba(255,255,255,0.3)" />

          {points.map((p) => {
            const [x, y] = toXY(p.angleDeg, p.radiusNorm);
            const isComp = p.kind === 'complementary';
            const r = isComp ? 10 + (p.weightPct ?? 0) * 0.35 : 9;
            const fill = isComp ? `hsl(${p.hue}, 70%, 55%)` : 'rgba(255,255,255,0.06)';
            const stroke = isComp ? `hsl(${p.hue}, 80%, 70%)` : 'rgba(255,255,255,0.35)';
            return (
              <g key={p.label + p.kind}>
                <circle
                  cx={x}
                  cy={y}
                  r={r}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isComp ? 0 : 1}
                  strokeDasharray={isComp ? undefined : '2,2'}
                  opacity={isComp ? 0.85 : 0.7}
                />
                <text
                  x={x}
                  y={y - r - 8}
                  textAnchor="middle"
                  fontFamily="'Cormorant Garamond', serif"
                  fontStyle="italic"
                  fontSize={isComp ? 15 : 12}
                  fill={isComp ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)'}
                >
                  {p.label}
                </text>
                {p.weightPct !== null && (
                  <text
                    x={x}
                    y={y + r + 14}
                    textAnchor="middle"
                    fontFamily="'Inter', sans-serif"
                    fontSize={9}
                    letterSpacing="0.05em"
                    fill="rgba(255,255,255,0.4)"
                  >
                    {p.weightPct}%
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: '18px',
          justifyContent: 'center',
          marginTop: '6px',
          fontFamily: "'Inter', sans-serif",
          fontWeight: 300,
          fontSize: '10px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'rgba(232,228,222,0.4)',
        }}
      >
        <span>● complementary</span>
        <span>◌ opposing</span>
      </div>

      <DownloadBar targetRef={ref} filename="emotional-mapping" label="Emotional Mapping" />
    </div>
  );
}
