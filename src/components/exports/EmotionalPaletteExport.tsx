import React, { useRef } from 'react';
import { PalettePanelData } from '../../lib/deckDerive';
import { emotionToColor } from '../../lib/mappings';
import DownloadBar from './DownloadBar';

interface EmotionalPaletteExportProps {
  panels: PalettePanelData[];
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

export default function EmotionalPaletteExport({ panels }: EmotionalPaletteExportProps) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div>
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
              }}
            >
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
      <DownloadBar targetRef={ref} filename="emotional-palette" label="Emotional Palette" />
    </div>
  );
}
