import React, { useRef } from 'react';
import { RadarPoint, OverviewRadarPoint, SelectionEntry, deriveRadarData, deriveOverviewRadarData } from '../../lib/deckDerive';
import DownloadBar from './DownloadBar';

interface EmotionalMappingExportProps {
  selections: SelectionEntry[];
}

const SIZE = 440;
const CX = SIZE / 2;
const CY = SIZE / 2;
const MAX_R = 180;

function toXY(angleDeg: number, radiusNorm: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [CX + Math.cos(rad) * radiusNorm * MAX_R, CY + Math.sin(rad) * radiusNorm * MAX_R];
}

function ChartRings() {
  const rings = [0.33, 0.66, 1];
  return (
    <>
      {rings.map((r) => (
        <circle key={r} cx={CX} cy={CY} r={r * MAX_R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
      ))}
      <line x1={CX} y1={CY - MAX_R} x2={CX} y2={CY + MAX_R} stroke="rgba(255,255,255,0.06)" />
      <line x1={CX - MAX_R} y1={CY} x2={CX + MAX_R} y2={CY} stroke="rgba(255,255,255,0.06)" />
      <circle cx={CX} cy={CY} r={3} fill="rgba(255,255,255,0.3)" />
    </>
  );
}

// The combined field — every selection's dominant "choice" as a large,
// labelled bubble, with a couple of small unlabelled bubbles per selection
// gesturing at the rest of that blend. Deliberately spare: with up to 8
// selections, full per-selection detail here would be unreadable — that
// detail lives in the per-selection charts below instead.
function OverviewChart({ points }: { points: OverviewRadarPoint[] }) {
  return (
    <div
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
        <ChartRings />
        {/* Minor bubbles first, so choice bubbles + labels always sit on top */}
        {points.filter((p) => !p.isChoice).map((p, i) => {
          const [x, y] = toXY(p.angleDeg, p.radiusNorm);
          return (
            <circle
              key={`minor-${p.selectionId}-${i}`}
              cx={x}
              cy={y}
              r={4}
              fill={`hsl(${p.hue}, 55%, 55%)`}
              opacity={0.35}
            />
          );
        })}
        {points.filter((p) => p.isChoice).map((p) => {
          const [x, y] = toXY(p.angleDeg, p.radiusNorm);
          const r = 14 + (p.weightPct ?? 0) * 0.22;
          return (
            <g key={`choice-${p.selectionId}`}>
              <circle cx={x} cy={y} r={r} fill={`hsl(${p.hue}, 70%, 55%)`} stroke={`hsl(${p.hue}, 80%, 70%)`} strokeWidth={1.5} opacity={0.9} />
              <text
                x={x}
                y={y - r - 8}
                textAnchor="middle"
                fontFamily="'Cormorant Garamond', serif"
                fontStyle="italic"
                fontSize={15}
                fill="rgba(255,255,255,0.9)"
              >
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// The original single-selection chart, unchanged — repeated once per
// selection underneath the overview. Ref-forwardable so the single-selection
// case below can attach the export ref directly to it.
const SelectionChart = React.forwardRef<HTMLDivElement, { points: RadarPoint[] }>(function SelectionChart(
  { points },
  ref
) {
  return (
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
        <ChartRings />
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
    </div>
  );
});

// One curated selection's heading + chart + its own download — so a multi-
// selection deck can export a single row without needing the whole page.
function SelectionMappingRow({ index, selection }: { index: number; selection: SelectionEntry }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div>
      <div
        style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 400,
          fontSize: '10px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'rgba(232,228,222,0.4)',
          marginBottom: '8px',
          textAlign: 'center',
        }}
      >
        {index + 1} · {selection.variant.label}
      </div>
      <SelectionChart ref={ref} points={deriveRadarData(selection.blend)} />
      <DownloadBar targetRef={ref} filename={`emotional-mapping-${index + 1}-${selection.variant.label.toLowerCase()}`} />
    </div>
  );
}

export default function EmotionalMappingExport({ selections }: EmotionalMappingExportProps) {
  const ref = useRef<HTMLDivElement>(null);

  // A single selection shows exactly what this tab always showed: one radar
  // chart, no overview wrapper. The combined overview only kicks in once
  // there's something to compare across.
  if (selections.length === 1) {
    return (
      <div>
        <SelectionChart ref={ref} points={deriveRadarData(selections[0].blend)} />
        <DownloadBar targetRef={ref} filename="emotional-mapping" label="Emotional Mapping" />
      </div>
    );
  }

  const overviewPoints = deriveOverviewRadarData(selections);

  return (
    <div>
      <div ref={ref} style={{ background: '#0d0d0f', borderRadius: '4px', padding: '20px' }}>
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 400,
            fontSize: '10px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(232,228,222,0.4)',
            marginBottom: '12px',
          }}
        >
          Overview
        </div>
        <OverviewChart points={overviewPoints} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '36px', marginTop: '32px' }}>
          {selections.map((s, i) => (
            <SelectionMappingRow key={s.id} index={i} selection={s} />
          ))}
        </div>
      </div>

      <DownloadBar targetRef={ref} filename="emotional-mapping" label="Emotional Mapping" />
    </div>
  );
}
