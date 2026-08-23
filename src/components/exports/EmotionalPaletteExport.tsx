import React, { useRef } from 'react';
import { PalettePanelData, SelectionEntry, derivePaletteRoles } from '../../lib/deckDerive';
import { emotionToColor } from '../../lib/mappings';
import DownloadBar from './DownloadBar';
import GeneratedTexture from '../GeneratedTexture';

interface EmotionalPaletteExportProps {
  selections: SelectionEntry[];
}

const ROLE_LABEL: Record<PalettePanelData['role'], string> = {
  primary: 'Emotion 1',
  secondary: 'Emotion 2',
  tertiary: 'Emotion 3',
  complementary: 'Emotion 4',
  contrast: 'Emotion 5',
};

function roleCaption(p: PalettePanelData): string {
  switch (p.role) {
    case 'primary':
      return `Primary · ${p.weightPct}% of blend`;
    case 'secondary':
      return `Secondary · ${p.weightPct}% of blend`;
    case 'tertiary':
      return `Tertiary · ${p.weightPct}% of blend`;
    case 'complementary':
      return 'Complementary — extends the core, no contradiction';
    case 'contrast':
      return 'Contrast — same field, opposite intensity';
  }
}

// The primary/secondary/tertiary + complementary/contrast row — unchanged
// from the single-selection view, now reused once per curated selection.
// Ref-forwardable so the single-selection case below can attach the export
// ref directly to it, with no extra wrapper around what this tab used to render.
const PaletteRoleRow = React.forwardRef<HTMLDivElement, { panels: PalettePanelData[] }>(function PaletteRoleRow(
  { panels },
  ref
) {
  return (
    <div
      ref={ref}
      style={{
        display: 'flex',
        width: '100%',
        aspectRatio: '16 / 6',
        background: '#0d0d0f',
        overflow: 'hidden',
        borderRadius: '4px',
      }}
    >
      {panels.map((p) => {
        const color = emotionToColor(p.valence, p.arousal, p.hue, p.dominance);
        return (
          <div
            key={p.role}
            style={{
              flex: 1,
              position: 'relative',
              background: color.gradient,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '18px 16px',
              borderLeft: '1px solid rgba(0,0,0,0.25)',
              overflow: 'hidden',
            }}
          >
            {/* Generated background art — one of 24 science-derived node
                textures, tinted to this panel's exact computed hue */}
            <GeneratedTexture
              nodeId={p.nodeId}
              hue={color.hue}
              valence={p.valence}
              arousal={p.arousal}
              dominance={p.dominance}
            />

            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.0) 55%, rgba(0,0,0,0.55) 100%)',
              }}
            />
            <span
              style={{
                position: 'relative',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 400,
                fontSize: '10px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.55)',
                marginBottom: '6px',
              }}
            >
              {ROLE_LABEL[p.role]}
            </span>
            <span
              style={{
                position: 'relative',
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: 'clamp(18px, 2.4vw, 26px)',
                color: 'rgba(255,255,255,0.95)',
                lineHeight: 1.1,
                textShadow: '0 2px 12px rgba(0,0,0,0.4)',
              }}
            >
              {p.label}
            </span>
            <span
              style={{
                position: 'relative',
                marginTop: '6px',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 300,
                fontSize: '10px',
                color: 'rgba(255,255,255,0.55)',
                letterSpacing: '0.02em',
              }}
            >
              {roleCaption(p)}
            </span>
          </div>
        );
      })}
    </div>
  );
});

// The summary/overview row — one condensed swatch per selected emotion,
// now carrying the same generated texture and info (index, label, weight)
// as the full rows below, plus its own download. This is the row most
// people will export, since it's the whole selection set at a glance.
function OverviewRow({ selections }: { selections: SelectionEntry[] }) {
  const ref = useRef<HTMLDivElement>(null);
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
      <div
        ref={ref}
        style={{
          display: 'flex',
          borderRadius: '4px',
          overflow: 'hidden',
          background: '#0d0d0f',
        }}
      >
        {selections.map((s, i) => {
          const primary = derivePaletteRoles(s.angleDeg, s.radius, s.blend)[0];
          const color = emotionToColor(primary.valence, primary.arousal, primary.hue, primary.dominance);
          return (
            <div
              key={s.id}
              style={{
                flex: 1,
                minWidth: 0,
                aspectRatio: '3 / 2',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '10px 10px',
                overflow: 'hidden',
                borderLeft: i > 0 ? '1px solid rgba(0,0,0,0.25)' : undefined,
              }}
            >
              <GeneratedTexture
                nodeId={primary.nodeId}
                hue={color.hue}
                valence={primary.valence}
                arousal={primary.arousal}
                dominance={primary.dominance}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.0) 55%, rgba(0,0,0,0.55) 100%)',
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
                  marginBottom: '4px',
                }}
              >
                {i + 1}
              </span>
              <span
                style={{
                  position: 'relative',
                  fontFamily: "'Cormorant Garamond', serif",
                  fontStyle: 'italic',
                  fontWeight: 400,
                  fontSize: 'clamp(12px, 1.6vw, 16px)',
                  color: 'rgba(255,255,255,0.95)',
                  lineHeight: 1.1,
                  textShadow: '0 2px 10px rgba(0,0,0,0.4)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {primary.label}
              </span>
              <span
                style={{
                  position: 'relative',
                  marginTop: '3px',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 300,
                  fontSize: '9px',
                  color: 'rgba(255,255,255,0.55)',
                  letterSpacing: '0.02em',
                }}
              >
                {primary.weightPct}% of blend
              </span>
            </div>
          );
        })}
      </div>
      <DownloadBar targetRef={ref} filename="emotional-palette-overview" label="Overview" />
    </div>
  );
}

// One curated selection's heading + row + its own download — so a multi-
// selection deck can export a single row without needing the whole page.
function SelectionPaletteRow({ index, selection }: { index: number; selection: SelectionEntry }) {
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
        }}
      >
        {index + 1} · {selection.variant.label}
      </div>
      <PaletteRoleRow ref={ref} panels={derivePaletteRoles(selection.angleDeg, selection.radius, selection.blend)} />
      <DownloadBar targetRef={ref} filename={`emotional-palette-${index + 1}-${selection.variant.label.toLowerCase()}`} />
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
    return (
      <div>
        <PaletteRoleRow ref={ref} panels={derivePaletteRoles(s.angleDeg, s.radius, s.blend)} />
        <DownloadBar targetRef={ref} filename="emotional-palette" label="Emotional Palette" />
      </div>
    );
  }

  return (
    <div>
      <div ref={ref} style={{ background: '#0d0d0f', borderRadius: '4px', padding: '20px' }}>
        <OverviewRow selections={selections} />

        {/* One full primary/secondary/tertiary + complementary/contrast row per selection */}
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
