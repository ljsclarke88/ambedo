import React, { useRef } from 'react';
import { BlendEntry, emotionToSensoryProfile } from '../../lib/mappings';
import DownloadBar from './DownloadBar';

interface SensoryTableExportProps {
  blend: BlendEntry[];
}

const COLUMNS = ['Sound', 'Light', 'Scent', 'Touch', 'Space'] as const;

export default function SensoryTableExport({ blend }: SensoryTableExportProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rows = blend.filter((e) => e.weight > 0.03).slice(0, 4);

  return (
    <div>
      <div
        ref={ref}
        style={{
          background: '#0d0d0f',
          borderRadius: '4px',
          padding: '28px 24px',
        }}
      >
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 400,
            fontSize: '10px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(232,228,222,0.4)',
            marginBottom: '18px',
          }}
        >
          Multisensory Map
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '120px repeat(5, 1fr)', rowGap: '14px', columnGap: '16px' }}>
          {/* Header row */}
          <div />
          {COLUMNS.map((col) => (
            <div
              key={col}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 400,
                fontSize: '11px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'rgba(232,228,222,0.55)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                paddingBottom: '6px',
              }}
            >
              {col}
            </div>
          ))}

          {/* Data rows */}
          {rows.map((entry, i) => {
            const profile = emotionToSensoryProfile(entry.node.valence, entry.node.arousal, entry.node.dominance);
            const cells = [profile.sound, profile.light, profile.scent, profile.touch, profile.space];
            return (
              <React.Fragment key={entry.node.id}>
                <div
                  style={{
                    position: 'relative',
                    paddingLeft: '12px',
                    fontFamily: "'Cormorant Garamond', serif",
                    fontStyle: 'italic',
                    fontSize: '16px',
                    color: 'rgba(232,228,222,0.85)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '3px',
                      background: `hsl(${entry.node.hue}, 65%, 55%)`,
                    }}
                  />
                  {entry.node.label}
                </div>
                {cells.map((cell, ci) => (
                  <div key={ci}>
                    <div
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 500,
                        fontSize: '11px',
                        color: 'rgba(232,228,222,0.85)',
                        marginBottom: '2px',
                      }}
                    >
                      {cell.title}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 300,
                        fontSize: '10px',
                        color: 'rgba(232,228,222,0.4)',
                      }}
                    >
                      {cell.detail}
                    </div>
                  </div>
                ))}
              </React.Fragment>
            );
          })}
        </div>
      </div>
      <DownloadBar targetRef={ref} filename="multisensory-map" label="Multisensory Map" />
    </div>
  );
}
