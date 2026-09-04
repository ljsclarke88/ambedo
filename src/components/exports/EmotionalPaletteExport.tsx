import React, { useRef } from 'react';
import { PalettePanelData, SelectionEntry, derivePaletteRoles } from '../../lib/deckDerive';
import { emotionToColor } from '../../lib/mappings';
import { IntensityLevel } from '../../data/emotions';
import DownloadBar from './DownloadBar';
import GeneratedTexture from '../GeneratedTexture';

interface EmotionalPaletteExportProps {
  selections: SelectionEntry[];
}

function roleCaption(p: PalettePanelData): string {
  switch (p.role) {
    case 'primary':
      return p.weightPct !== null ? `Primary · ${p.weightPct}% of blend` : 'Primary';
    case 'secondary':
      return p.weightPct !== null ? `Secondary · ${p.weightPct}% of blend` : 'Secondary';
    case 'tertiary':
      return p.weightPct !== null ? `Tertiary · ${p.weightPct}% of blend` : 'Tertiary';
    case 'complementary':
      return 'Complementary — extends the core, no contradiction';
    case 'contrast':
      return 'Contrast — same field, opposite intensity';
  }
}

interface EmotionCardData {
  eyebrow: string;
  label: string;
  caption: string;
  nodeId: string;
  hue: number;
  valence: number;
  arousal: number;
  dominance: number;
  intensity: IntensityLevel;
  sourceId: string;
}

// A single tall, textured card — label bottom-aligned over the generated
// art. `half` renders it as one cell of a stacked pair (no fixed aspect
// ratio of its own — it fills whatever height its stacked column gives it).
function EmotionCard({
  eyebrow,
  label,
  caption,
  nodeId,
  hue,
  valence,
  arousal,
  dominance,
  intensity,
  sourceId,
  half,
}: EmotionCardData & { half?: boolean }) {
  const color = emotionToColor(valence, arousal, hue, dominance);
  return (
    <div
      style={{
        flex: '1 1 0',
        minWidth: 0,
        minHeight: 0,
        aspectRatio: half ? undefined : '3 / 5',
        position: 'relative',
        background: color.gradient,
        borderRadius: '2px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: half ? '10px 12px' : '16px 14px',
      }}
    >
      <GeneratedTexture
        nodeId={nodeId}
        hue={color.hue}
        valence={valence}
        arousal={arousal}
        dominance={dominance}
        intensity={intensity}
        familyId={sourceId}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.0) 45%, rgba(0,0,0,0.62) 100%)',
        }}
      />
      <span
        style={{
          position: 'relative',
          fontFamily: "'Inter', sans-serif",
          fontWeight: 400,
          fontSize: '9px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.5)',
          marginBottom: '6px',
        }}
      >
        {eyebrow}
      </span>
      <span
        style={{
          position: 'relative',
          fontFamily: "'Inter', sans-serif",
          fontWeight: 700,
          fontSize: half ? 'clamp(12px, 1.3vw, 15px)' : 'clamp(13px, 1.5vw, 18px)',
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.96)',
          lineHeight: 1.15,
          textShadow: '0 2px 12px rgba(0,0,0,0.4)',
        }}
      >
        {label}
      </span>
      {caption && (
        <span
          style={{
            position: 'relative',
            marginTop: '4px',
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: '12px',
            color: 'rgba(255,255,255,0.7)',
            letterSpacing: '0.01em',
          }}
        >
          {caption}
        </span>
      )}
    </div>
  );
}

// One deck-ready row of gapped, textured cards on a light backing — the
// last two cards always stack into one column instead of running full
// height, matching the reference layout. Self-contained, so downloading any
// single row drops straight into a slide looking the same way.
const PaletteCardRow = React.forwardRef<HTMLDivElement, { cards: EmotionCardData[] }>(function PaletteCardRow(
  { cards },
  ref
) {
  const stackCount = cards.length > 2 ? 2 : 0;
  const fullCards = stackCount ? cards.slice(0, cards.length - stackCount) : cards;
  const stackedCards = stackCount ? cards.slice(cards.length - stackCount) : [];
  return (
    <div
      ref={ref}
      style={{
        background: '#f4f1ec',
        padding: '30px 26px',
        borderRadius: '2px',
      }}
    >
      <div style={{ display: 'flex', gap: '14px' }}>
        {fullCards.map((c, i) => (
          <EmotionCard key={`${c.nodeId}-${i}`} {...c} />
        ))}
        {stackedCards.length > 0 && (
          <div
            style={{
              flex: '1 1 0',
              minWidth: 0,
              aspectRatio: '3 / 5',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {stackedCards.map((c, i) => (
              <EmotionCard key={`${c.nodeId}-s${i}`} {...c} half />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

// Ordinal role a selection plays purely by the order it was picked in —
// mirrors the same ordinal naming a single blend's top entries use.
function overviewEyebrow(index: number): string {
  const ORDINALS = ['Primary', 'Secondary', 'Tertiary', 'Quaternary', 'Quinary'];
  const ordinal = ORDINALS[index] ?? `${index + 1}th`;
  return `${ordinal} Emotion`;
}

function panelsToCards(panels: PalettePanelData[]): EmotionCardData[] {
  return panels.map((p, i) => ({
    eyebrow: `Emotion ${i + 1}`,
    label: p.label,
    caption: roleCaption(p),
    nodeId: p.nodeId,
    hue: p.hue,
    valence: p.valence,
    arousal: p.arousal,
    dominance: p.dominance,
    intensity: p.intensity,
    sourceId: p.sourceId,
  }));
}

// The summary/overview row — one card per selected emotion (its primary
// blend entry), ordered as it was picked.
function OverviewRow({ selections }: { selections: SelectionEntry[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const cards: EmotionCardData[] = selections.map((s, i) => {
    const primary = derivePaletteRoles(s.angleDeg, s.radius, s.blend)[0];
    return {
      eyebrow: overviewEyebrow(i),
      label: primary.label,
      caption: '',
      nodeId: primary.nodeId,
      hue: primary.hue,
      valence: primary.valence,
      arousal: primary.arousal,
      dominance: primary.dominance,
      intensity: primary.intensity,
      sourceId: primary.sourceId,
    };
  });
  return (
    <div style={{ marginBottom: '32px' }}>
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
      <PaletteCardRow ref={ref} cards={cards} />
      <DownloadBar targetRef={ref} filename="emotional-palette-overview" label="Overview" />
    </div>
  );
}

// One curated selection's full breakdown row + its own download — primary/
// secondary/tertiary + complementary/contrast when the selection is a real
// blend, or the primary plus its two nearest complementary and two nearest
// contrasting neighbours when it's a pure/100% pick (see derivePaletteRoles).
function SelectionPaletteRow({ index, selection }: { index: number; selection: SelectionEntry }) {
  const ref = useRef<HTMLDivElement>(null);
  const panels = derivePaletteRoles(selection.angleDeg, selection.radius, selection.blend);
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
        }}
      >
        {index + 1} · {selection.variant.label}
      </div>
      <PaletteCardRow ref={ref} cards={panelsToCards(panels)} />
      <DownloadBar
        targetRef={ref}
        filename={`emotional-palette-${index + 1}-${selection.variant.label.toLowerCase()}`}
      />
    </div>
  );
}

export default function EmotionalPaletteExport({ selections }: EmotionalPaletteExportProps) {
  const ref = useRef<HTMLDivElement>(null);

  // A single selection shows exactly what this tab always showed: one
  // primary/secondary/tertiary + complementary/contrast row, no summary
  // wrapper. The summary row + repeated rows only kick in once there's
  // something to compare across.
  if (selections.length === 1) {
    const s = selections[0];
    const panels = derivePaletteRoles(s.angleDeg, s.radius, s.blend);
    return (
      <div>
        <PaletteCardRow ref={ref} cards={panelsToCards(panels)} />
        <DownloadBar targetRef={ref} filename="emotional-palette" label="Emotional Palette" />
      </div>
    );
  }

  return (
    <div>
      <div ref={ref} style={{ background: '#0d0d0f', borderRadius: '4px', padding: '20px' }}>
        <OverviewRow selections={selections} />

        {/* One full breakdown row per selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {selections.map((s, i) => (
            <SelectionPaletteRow key={s.id} index={i} selection={s} />
          ))}
        </div>
      </div>
      <DownloadBar targetRef={ref} filename="emotional-palette" label="Emotional Palette" />
    </div>
  );
}
