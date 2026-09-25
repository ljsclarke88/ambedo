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
// Wide gap between the text column and the chart — pushes the downloaded
// row's aspect ratio toward 16:9 (roughly matching the chart's own ~480px
// height) rather than the much narrower ratio a tight gap produces.
const TEXT_CHART_GAP = 210;
// Text column (180) + gap + chart (SIZE) + the row's own left/right
// padding (20 each) — matches the fixed-pixel columns exactly, so maxWidth
// never clips or leaves slack.
const ROW_WIDTH = 180 + TEXT_CHART_GAP + SIZE + 40;
const ROW_PADDING = 20;
// The legend row under the per-selection chart's svg ("complementary" /
// "opposing" key) — its own natural height, used so that chart's row can
// get an explicit total height too.
const LEGEND_HEIGHT = 30;
const OVERVIEW_ROW_HEIGHT = SIZE + ROW_PADDING * 2;
const SELECTION_ROW_HEIGHT = SIZE + LEGEND_HEIGHT + ROW_PADDING * 2;
const TEXT_COL_WIDTH = 180;
// Absolute pixel positions for the two columns, used instead of flexbox —
// flexbox inside the foreignObject html-to-image wraps this row in for
// capture has proven unreliable across several fix attempts (the chart
// column kept clipping regardless of explicit widths/heights). Plain
// absolute positioning with hardcoded offsets is a much simpler, more
// universally-supported layout primitive for that rendering path.
const TEXT_COL_X = ROW_PADDING;
const CHART_COL_X = ROW_PADDING + TEXT_COL_WIDTH + TEXT_CHART_GAP;

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

// Pure HTML/CSS chart primitives — no SVG. The radar chart used to be an
// <svg> nested inside the HTML row that html-to-image wraps in its own
// <svg><foreignObject> for capture; that SVG-inside-foreignObject-inside-SVG
// nesting survived six different fixes aimed at the surrounding HTML layout
// (flexbox, explicit sizing, a full flex-to-absolute-positioning rewrite),
// which means the nesting itself — not the layout technique — was always
// the actual cause of the chart rendering at the wrong scale and clipping.
// Rebuilding the rings/bubbles as plain positioned divs removes the nested
// SVG entirely.
function Ring({ r }: { r: number }) {
  const d = r * MAX_R * 2;
  return (
    <div
      style={{
        position: 'absolute',
        left: `${CX - r * MAX_R}px`,
        top: `${CY - r * MAX_R}px`,
        width: `${d}px`,
        height: `${d}px`,
        borderRadius: '50%',
        border: `1px solid ${INK_LINE}`,
        boxSizing: 'border-box',
      }}
    />
  );
}

function ChartRings() {
  return (
    <>
      {[0.33, 0.66, 1].map((r) => (
        <Ring key={r} r={r} />
      ))}
      <div style={{ position: 'absolute', left: `${CX}px`, top: `${CY - MAX_R}px`, width: '1px', height: `${MAX_R * 2}px`, background: INK_LINE_FAINT }} />
      <div style={{ position: 'absolute', left: `${CX - MAX_R}px`, top: `${CY}px`, width: `${MAX_R * 2}px`, height: '1px', background: INK_LINE_FAINT }} />
      <div style={{ position: 'absolute', left: `${CX - 3}px`, top: `${CY - 3}px`, width: '6px', height: '6px', borderRadius: '50%', background: INK_MED }} />
    </>
  );
}

// A single data-point circle — a div, not an SVG <circle>.
function Bubble({
  x,
  y,
  r,
  fill,
  stroke,
  strokeWidth = 0,
  dashed = false,
  opacity = 1,
}: {
  x: number;
  y: number;
  r: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  dashed?: boolean;
  opacity?: number;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x - r}px`,
        top: `${y - r}px`,
        width: `${r * 2}px`,
        height: `${r * 2}px`,
        borderRadius: '50%',
        background: fill,
        border: strokeWidth ? `${strokeWidth}px ${dashed ? 'dashed' : 'solid'} ${stroke}` : undefined,
        opacity,
        boxSizing: 'border-box',
      }}
    />
  );
}

// A label centred under/above a chart point — a fixed-width div with
// text-align:center rather than an SVG <text textAnchor="middle">, and no
// CSS transform (kept out of this capture path entirely, on the same
// belt-and-braces reasoning as the nested-SVG removal above).
function ChartLabel({
  x,
  y,
  children,
  style,
}: {
  x: number;
  y: number;
  children: React.ReactNode;
  style: React.CSSProperties;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x - 90}px`,
        top: `${y}px`,
        width: '180px',
        textAlign: 'center',
        whiteSpace: 'nowrap',
        overflow: 'visible',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// One selection's contribution to the overview's complementary/opposing
// text column — which emotion these words belong to, and the words
// themselves.
interface RadarGroup {
  source: string; // the selection's own label, e.g. "Joy"
  hue: number;
  points: RadarPoint[];
}

// Compact left-hand text column for the overview, where a full selection-
// by-selection breakdown (like the per-selection PointList below) would run
// to dozens of rows — every complementary/opposing emotion across every
// selection, grouped by which selection it belongs to (one wrapped line per
// selection) rather than one row per item, so the full list stays readable
// without turning into a wall of bullets.
function FlowList({ title, groups }: { title: string; groups: RadarGroup[] }) {
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {groups.length === 0 ? (
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: INK_FAINT, fontStyle: 'italic' }}>none</span>
        ) : (
          groups.map((g) => (
            <div key={g.source} style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', lineHeight: 1.7, whiteSpace: 'nowrap' }}>
              <span style={{ fontWeight: 700, color: `hsl(${g.hue}, 60%, 36%)` }}>{g.source}</span>
              <span style={{ color: INK_FAINT }}>: </span>
              {g.points.map((p, i) => (
                <span key={p.label}>
                  <span style={{ color: '#000000' }}>{p.label}</span>
                  {i < g.points.length - 1 && <span style={{ color: INK_FAINT }}>, </span>}
                </span>
              ))}
            </div>
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
  { points: OverviewRadarPoint[]; complementary: RadarGroup[]; opposing: RadarGroup[] }
>(function OverviewChart({ points, complementary, opposing }, ref) {
  return (
    <div
      ref={ref}
      style={{
        // Absolute-positioned children, not flexbox — see the note on
        // TEXT_COL_X/CHART_COL_X above. This row's own box is always a
        // fixed size regardless of its parent's width, so nothing needs to
        // shrink or overflow.
        position: 'relative',
        width: `${ROW_WIDTH}px`,
        height: `${OVERVIEW_ROW_HEIGHT}px`,
        background: '#ffffff',
        borderRadius: '4px',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ position: 'absolute', left: `${TEXT_COL_X}px`, top: `${ROW_PADDING}px`, width: `${TEXT_COL_WIDTH}px` }}>
        <FlowList title="Complementary" groups={complementary} />
        <FlowList title="Opposing" groups={opposing} />
      </div>

      <div style={{ position: 'absolute', left: `${CHART_COL_X}px`, top: `${ROW_PADDING}px`, width: `${SIZE}px`, height: `${SIZE}px` }}>
        <div style={{ position: 'relative', width: `${SIZE}px`, height: `${SIZE}px` }}>
          <ChartRings />
          {/* Minor bubbles first, so choice bubbles + labels always sit on top */}
          {points.filter((p) => !p.isChoice).map((p, i) => {
            const [x, y] = toXY(p.angleDeg, p.radiusNorm);
            return <Bubble key={`minor-${p.selectionId}-${i}`} x={x} y={y} r={4} fill={`hsl(${p.hue}, 55%, 45%)`} opacity={0.45} />;
          })}
          {points.filter((p) => p.isChoice).map((p) => {
            const [x, y] = toXY(p.angleDeg, p.radiusNorm);
            const r = 14 + (p.weightPct ?? 0) * 0.22;
            return (
              <React.Fragment key={`choice-${p.selectionId}`}>
                <Bubble x={x} y={y} r={r} fill={`hsl(${p.hue}, 65%, 45%)`} stroke={`hsl(${p.hue}, 75%, 32%)`} strokeWidth={1.5} opacity={0.92} />
                <ChartLabel
                  x={x}
                  y={y - r - 26}
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '15px', color: INK_STRONG }}
                >
                  {p.label}
                </ChartLabel>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
});

// Every selection's complementary/opposing words, grouped under the
// selection they belong to — so the overview's full list still says which
// picked emotion each word is complementary/opposing to, not just a flat
// pool of words with no origin.
function aggregateComplementaryOpposing(selections: SelectionEntry[]): { complementary: RadarGroup[]; opposing: RadarGroup[] } {
  const complementary: RadarGroup[] = [];
  const opposing: RadarGroup[] = [];
  for (const s of selections) {
    const points = deriveRadarData(s.angleDeg, s.radius);
    const comp = points.filter((p) => p.kind === 'complementary');
    const opp = points.filter((p) => p.kind === 'opposing');
    if (comp.length) complementary.push({ source: s.variant.label, hue: s.baseHue, points: comp });
    if (opp.length) opposing.push({ source: s.variant.label, hue: s.baseHue, points: opp });
  }
  return { complementary, opposing };
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
              color: '#000000',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: `hsl(${p.hue}, 60%, 45%)`, flexShrink: 0 }} />
            <span style={{ whiteSpace: 'nowrap' }}>{p.label}</span>
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
        // Absolute-positioned children, not flexbox — see the note on
        // TEXT_COL_X/CHART_COL_X above.
        position: 'relative',
        width: `${ROW_WIDTH}px`,
        height: `${SELECTION_ROW_HEIGHT}px`,
        background: '#ffffff',
        borderRadius: '4px',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ position: 'absolute', left: `${TEXT_COL_X}px`, top: `${ROW_PADDING}px`, width: `${TEXT_COL_WIDTH}px` }}>
        <PointList title="Complementary" points={complementary} />
        <PointList title="Opposing" points={opposing} />
      </div>

      <div style={{ position: 'absolute', left: `${CHART_COL_X}px`, top: `${ROW_PADDING}px`, width: `${SIZE}px`, height: `${SIZE + LEGEND_HEIGHT}px` }}>
        <div style={{ position: 'relative', width: `${SIZE}px`, height: `${SIZE}px` }}>
          <ChartRings />
          {points.map((p) => {
            const [x, y] = toXY(p.angleDeg, p.radiusNorm);
            const isComp = p.kind === 'complementary';
            const r = isComp ? 10 + (p.weightPct ?? 0) * 0.35 : 9;
            const fill = isComp ? `hsl(${p.hue}, 65%, 45%)` : 'rgba(20,18,16,0.05)';
            const stroke = isComp ? `hsl(${p.hue}, 75%, 32%)` : 'rgba(20,18,16,0.4)';
            return (
              <React.Fragment key={p.label + p.kind}>
                <Bubble x={x} y={y} r={r} fill={fill} stroke={stroke} strokeWidth={isComp ? 0 : 1} dashed={!isComp} opacity={isComp ? 0.92 : 0.85} />
                <ChartLabel
                  x={x}
                  y={y - r - 26}
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontStyle: 'italic',
                    fontSize: isComp ? '15px' : '12px',
                    color: isComp ? INK_STRONG : INK_MED,
                  }}
                >
                  {p.label}
                </ChartLabel>
                {p.weightPct !== null && (
                  <ChartLabel
                    x={x}
                    y={y + r + 8}
                    style={{ fontFamily: "'Inter', sans-serif", fontSize: '9px', letterSpacing: '0.05em', color: INK_FAINT }}
                  >
                    {p.weightPct}%
                  </ChartLabel>
                )}
              </React.Fragment>
            );
          })}
        </div>

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
      <SelectionChart ref={ref} points={deriveRadarData(selection.angleDeg, selection.radius)} />
      <DownloadBar
        targetRef={ref}
        filename={`emotional-mapping-${index + 1}-${selection.variant.label.toLowerCase()}`}
        theme="light"
        size={{ width: ROW_WIDTH, height: SELECTION_ROW_HEIGHT }}
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
      <DownloadBar
        targetRef={ref}
        filename="emotional-mapping-overview"
        label="Overview"
        theme="light"
        size={{ width: ROW_WIDTH, height: OVERVIEW_ROW_HEIGHT }}
      />
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
        <SelectionChart ref={ref} points={deriveRadarData(selections[0].angleDeg, selections[0].radius)} />
        <DownloadBar
          targetRef={ref}
          filename="emotional-mapping"
          label="Emotional Mapping"
          size={{ width: ROW_WIDTH, height: SELECTION_ROW_HEIGHT }}
        />
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
