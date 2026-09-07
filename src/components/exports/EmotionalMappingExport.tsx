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

// Dark ink on a white chart — same opacity ladder the dark theme used,
// just inverted, so relative emphasis is unchanged.
const INK_STRONG = 'rgba(20,18,16,0.85)';
const INK_MED = 'rgba(20,18,16,0.55)';
const INK_FAINT = 'rgba(20,18,16,0.4)';
const INK_LINE = 'rgba(20,18,16,0.14)';
const INK_LINE_FAINT = 'rgba(20,18,16,0.10)';

function toXY(angleDeg: number, radiusNorm: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [CX + Math.cos(rad) * radiusNorm * MAX_R, CY + Math.sin(rad) * radiusNorm * MAX_R];
}

function ChartRings() {
  const rings = [0.33, 0.66, 1];
  return (
    <>
      {rings.map((r) => (
        <circle key={r} cx={CX} cy={CY} r={r * MAX_R} fill="none" stroke={INK_LINE} strokeWidth={1} />
      ))}
      <line x1={CX} y1={CY - MAX_R} x2={CX} y2={CY + MAX_R} stroke={INK_LINE_FAINT} />
      <line x1={CX - MAX_R} y1={CY} x2={CX + MAX_R} y2={CY} stroke={INK_LINE_FAINT} />
      <circle cx={CX} cy={CY} r={3} fill={INK_MED} />
    </>
  );
}

// Compact left-hand text column for the overview, where a full selection-
// by-selection breakdown (like the per-selection PointList below) would run
// to dozens of rows — every complementary/opposing emotion across every
// selection, deduplicated, read as one wrapped line per heading rather than
// one row per item, so the full list fits without turning into a wall of
// bullets.
function FlowList({ title, points }: { title: string; points: RadarPoint[] }) {
  return (
    <div style={{ marginBottom: '22px' }}>
      <div
        style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 700,
          fontSize: '13px',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: INK_STRONG,
          paddingBottom: '6px',
          marginBottom: '8px',
          borderBottom: `1.5px solid ${INK_STRONG}`,
        }}
      >
        {title}
      </div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', lineHeight: 1.8 }}>
        {points.length === 0 ? (
          <span style={{ color: INK_FAINT, fontStyle: 'italic' }}>none</span>
        ) : (
          points.map((p, i) => (
            <span key={p.label}>
              <span style={{ color: `hsl(${p.hue}, 60%, 36%)`, fontWeight: 500 }}>{p.label}</span>
              {i < points.length - 1 && <span style={{ color: INK_FAINT }}>, </span>}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

// The combined field — every selection's dominant "choice" as a large,
// labelled bubble, with a couple of small unlabelled bubbles per selection
// gesturing at the rest of that blend, plus a compact text column reading
// out the full complementary/opposing set across every selection (see
// FlowList). The chart itself stays spare — with up to 8 selections, full
// per-selection detail plotted here would be unreadable — that detail lives
// in the per-selection charts below instead. Self-contained with its own
// download, same as the other export tabs' overview sections.
const OverviewChart = React.forwardRef<
  HTMLDivElement,
  { points: OverviewRadarPoint[]; complementary: RadarPoint[]; opposing: RadarPoint[] }
>(function OverviewChart({ points, complementary, opposing }, ref) {
  return (
    <div
      ref={ref}
      style={{
        display: 'flex',
        gap: '28px',
        width: '100%',
        maxWidth: `${SIZE + 200}px`,
        background: '#ffffff',
        borderRadius: '4px',
        padding: '20px',
        margin: '0 auto',
      }}
    >
      <div style={{ width: '180px', flexShrink: 0, paddingTop: '4px' }}>
        <FlowList title="Complementary" points={complementary} />
        <FlowList title="Opposing" points={opposing} />
      </div>

      <div style={{ flex: '1 1 0', minWidth: 0, aspectRatio: '1 / 1' }}>
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
                fill={`hsl(${p.hue}, 55%, 45%)`}
                opacity={0.45}
              />
            );
          })}
          {points.filter((p) => p.isChoice).map((p) => {
            const [x, y] = toXY(p.angleDeg, p.radiusNorm);
            const r = 14 + (p.weightPct ?? 0) * 0.22;
            return (
              <g key={`choice-${p.selectionId}`}>
                <circle cx={x} cy={y} r={r} fill={`hsl(${p.hue}, 65%, 45%)`} stroke={`hsl(${p.hue}, 75%, 32%)`} strokeWidth={1.5} opacity={0.92} />
                <text
                  x={x}
                  y={y - r - 8}
                  textAnchor="middle"
                  fontFamily="'Cormorant Garamond', serif"
                  fontStyle="italic"
                  fontSize={15}
                  fill={INK_STRONG}
                >
                  {p.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
});

// Pools every selection's complementary/opposing points into one
// deduplicated set each — the full list the overview needs, without
// repeating an emotion once per selection that happens to share it. Ties
// go to the highest weight seen for that label.
function aggregateComplementaryOpposing(selections: SelectionEntry[]): { complementary: RadarPoint[]; opposing: RadarPoint[] } {
  const compMap = new Map<string, RadarPoint>();
  const oppMap = new Map<string, RadarPoint>();
  for (const s of selections) {
    for (const p of deriveRadarData(s.blend)) {
      const map = p.kind === 'complementary' ? compMap : oppMap;
      const existing = map.get(p.label);
      if (!existing || (p.weightPct ?? 0) > (existing.weightPct ?? 0)) {
        map.set(p.label, p);
      }
    }
  }
  return {
    complementary: [...compMap.values()].sort((a, b) => (b.weightPct ?? 0) - (a.weightPct ?? 0)),
    opposing: [...oppMap.values()].sort((a, b) => a.label.localeCompare(b.label)),
  };
}

// Left-hand text column — the same complementary/opposing points the chart
// plots, read out as two plain lists rather than requiring the chart's
// bubbles/dashes to be decoded.
function PointList({ title, points }: { title: string; points: RadarPoint[] }) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <div
        style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 700,
          fontSize: '13px',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: INK_STRONG,
          paddingBottom: '6px',
          marginBottom: '10px',
          borderBottom: `1.5px solid ${INK_STRONG}`,
        }}
      >
        {title}
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {points.map((p) => (
          <li
            key={p.label}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '7px',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
              fontSize: '12px',
              color: INK_MED,
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: `hsl(${p.hue}, 60%, 45%)`, flexShrink: 0 }} />
            <span>{p.label}</span>
            {p.weightPct !== null && (
              <span style={{ color: INK_FAINT, fontSize: '10px', marginLeft: 'auto' }}>{p.weightPct}%</span>
            )}
          </li>
        ))}
        {points.length === 0 && (
          <li style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: INK_FAINT, fontStyle: 'italic' }}>none</li>
        )}
      </ul>
    </div>
  );
}

// The original single-selection chart — a text column reading out the same
// complementary/opposing points to the left of the radar plot, matching the
// reference layout. Ref-forwardable so the single-selection case below can
// attach the export ref directly to it.
const SelectionChart = React.forwardRef<HTMLDivElement, { points: RadarPoint[] }>(function SelectionChart(
  { points },
  ref
) {
  const complementary = points.filter((p) => p.kind === 'complementary');
  const opposing = points.filter((p) => p.kind === 'opposing');
  return (
    <div
      ref={ref}
      style={{
        display: 'flex',
        gap: '28px',
        width: '100%',
        maxWidth: `${SIZE + 200}px`,
        background: '#ffffff',
        borderRadius: '4px',
        padding: '20px',
        margin: '0 auto',
      }}
    >
      <div style={{ width: '180px', flexShrink: 0, paddingTop: '4px' }}>
        <PointList title="Complementary" points={complementary} />
        <PointList title="Opposing" points={opposing} />
      </div>

      <div style={{ flex: '1 1 0', minWidth: 0 }}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width="100%" height="100%" style={{ aspectRatio: '1 / 1', display: 'block' }}>
          <ChartRings />
          {points.map((p) => {
            const [x, y] = toXY(p.angleDeg, p.radiusNorm);
            const isComp = p.kind === 'complementary';
            const r = isComp ? 10 + (p.weightPct ?? 0) * 0.35 : 9;
            const fill = isComp ? `hsl(${p.hue}, 65%, 45%)` : 'rgba(20,18,16,0.05)';
            const stroke = isComp ? `hsl(${p.hue}, 75%, 32%)` : 'rgba(20,18,16,0.4)';
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
                  opacity={isComp ? 0.92 : 0.85}
                />
                <text
                  x={x}
                  y={y - r - 8}
                  textAnchor="middle"
                  fontFamily="'Cormorant Garamond', serif"
                  fontStyle="italic"
                  fontSize={isComp ? 15 : 12}
                  fill={isComp ? INK_STRONG : INK_MED}
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
                    fill={INK_FAINT}
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
            color: INK_FAINT,
          }}
        >
          <span>● complementary</span>
          <span>◌ opposing</span>
        </div>
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
          color: INK_FAINT,
          marginBottom: '8px',
          textAlign: 'center',
        }}
      >
        {index + 1} · {selection.variant.label}
      </div>
      <SelectionChart ref={ref} points={deriveRadarData(selection.blend)} />
      <DownloadBar
        targetRef={ref}
        filename={`emotional-mapping-${index + 1}-${selection.variant.label.toLowerCase()}`}
        theme="light"
      />
    </div>
  );
}

// The combined overview field, self-contained with its own download —
// mirrors Emotional Palette's overview row, which already had one.
function OverviewSection({ selections }: { selections: SelectionEntry[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const overviewPoints = deriveOverviewRadarData(selections);
  const { complementary, opposing } = aggregateComplementaryOpposing(selections);
  return (
    <div>
      <OverviewChart ref={ref} points={overviewPoints} complementary={complementary} opposing={opposing} />
      <DownloadBar targetRef={ref} filename="emotional-mapping-overview" label="Overview" theme="light" />
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

  return (
    <div>
      <div ref={ref} style={{ background: '#ffffff', borderRadius: '4px', padding: '20px' }}>
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 400,
            fontSize: '10px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: INK_FAINT,
            marginBottom: '12px',
          }}
        >
          Overview
        </div>
        <OverviewSection selections={selections} />

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
