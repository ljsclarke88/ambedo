import React from 'react';

interface TasteRadarProps {
  valence: number;
  arousal: number;
  color: string;
}

type TasteKey = 'sweet' | 'sour' | 'astringent' | 'bitter' | 'savory';

// Axes listed clockwise from top — arranged so positive-valence tastes
// (sweet, savory) sit on the left/top and negative-valence (sour, bitter)
// on the right/bottom, loosely mirroring the Russell circumplex.
const AXES: TasteKey[] = ['sweet', 'sour', 'astringent', 'bitter', 'savory'];

// Scores are in [0, 1]. Derived from Crisinel & Spence (2010) crossmodal
// correspondences: high-pitched (high arousal) ↔ sweet/sour; low-pitched
// (low arousal) ↔ bitter/savory; midrange + negative valence ↔ astringent.
function tasteScores(valence: number, arousal: number): Record<TasteKey, number> {
  const vPos  = Math.max(0, valence);
  const vNeg  = Math.max(0, -valence);
  const aHigh = Math.max(0, (arousal - 0.35) / 0.65);
  const aLow  = Math.max(0, (0.45 - arousal) / 0.45);
  const aMid  = Math.max(0, 1 - Math.abs(arousal - 0.5) * 4);
  return {
    sweet:      vPos * aHigh,
    sour:       vNeg * aHigh,
    bitter:     vNeg * aLow,
    savory:     vPos * aLow,
    astringent: vNeg * aMid,
  };
}

export default function TasteRadar({ valence, arousal, color }: TasteRadarProps) {
  const scores = tasteScores(valence, arousal);
  const size   = 130;
  const cx     = size / 2;
  const cy     = size / 2;
  const maxR   = size / 2 - 18;
  const n      = AXES.length;

  const angleOf = (i: number) => ((i * 360) / n - 90) * (Math.PI / 180);

  const axisTips = AXES.map((_, i) => {
    const a = angleOf(i);
    return { x: cx + maxR * Math.cos(a), y: cy + maxR * Math.sin(a) };
  });

  const dataPath =
    AXES.map((t, i) => {
      const a = angleOf(i);
      const r = scores[t] * maxR;
      return `${i === 0 ? 'M' : 'L'} ${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;
    }).join(' ') + ' Z';

  const gridPolygon = (scale: number) =>
    axisTips
      .map(p => `${(cx + (p.x - cx) * scale).toFixed(1)},${(cy + (p.y - cy) * scale).toFixed(1)}`)
      .join(' ');

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ overflow: 'visible' }}
    >
      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1].map((s) => (
        <polygon
          key={s}
          points={gridPolygon(s)}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={0.5}
        />
      ))}

      {/* Axis spokes */}
      {axisTips.map((p, i) => (
        <line
          key={i}
          x1={cx} y1={cy}
          x2={p.x} y2={p.y}
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={0.5}
        />
      ))}

      {/* Data polygon */}
      <path
        d={dataPath}
        fill={color}
        fillOpacity={0.22}
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />

      {/* Labels */}
      {AXES.map((t, i) => {
        const a   = angleOf(i);
        const lr  = maxR + 12;
        return (
          <text
            key={t}
            x={(cx + lr * Math.cos(a)).toFixed(1)}
            y={(cy + lr * Math.sin(a)).toFixed(1)}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="6.5"
            fill="rgba(255,255,255,0.38)"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {t}
          </text>
        );
      })}
    </svg>
  );
}
