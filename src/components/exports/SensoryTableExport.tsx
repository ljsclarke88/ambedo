import React, { useRef } from 'react';
import { SelectionEntry, topBlendEntry } from '../../lib/deckDerive';
import { BlendEntry, emotionToSensoryProfile } from '../../lib/mappings';
import DownloadBar from './DownloadBar';

interface SensoryTableExportProps {
  selections: SelectionEntry[];
}

const COLUMNS = ['Sound', 'Light', 'Scent', 'Touch', 'Space'] as const;

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
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
      {children}
    </div>
  );
}

function HeaderRow() {
  return (
    <>
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
    </>
  );
}

function LabelCell({ label, hue, italic = true }: { label: string; hue: number; italic?: boolean }) {
  return (
    <div
      style={{
        position: 'relative',
        paddingLeft: '12px',
        fontFamily: italic ? "'Cormorant Garamond', serif" : "'Inter', sans-serif",
        fontStyle: italic ? 'italic' : 'normal',
        fontWeight: 400,
        fontSize: italic ? '16px' : '11px',
        letterSpacing: italic ? undefined : '0.04em',
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
          background: `hsl(${hue}, 65%, 55%)`,
        }}
      />
      {label}
    </div>
  );
}

function SensoryCells({ profile }: { profile: ReturnType<typeof emotionToSensoryProfile> }) {
  const cells = [profile.sound, profile.light, profile.scent, profile.touch, profile.space];
  return (
    <>
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
    </>
  );
}

// The full per-emotion breakdown (up to 4 blend entries) — unchanged from
// the single-selection view, now repeated once per curated selection.
// Ref-forwardable so each selection's row can export itself individually.
const SelectionTable = React.forwardRef<HTMLDivElement, { blend: BlendEntry[] }>(function SelectionTable(
  { blend },
  ref
) {
  const rows = blend.filter((e) => e.weight > 0.03).slice(0, 4);
  return (
    <div
      ref={ref}
      style={{
        display: 'grid',
        gridTemplateColumns: '120px repeat(5, 1fr)',
        rowGap: '14px',
        columnGap: '16px',
        background: '#0d0d0f',
        padding: '12px',
        borderRadius: '4px',
      }}
    >
      <HeaderRow />
      {rows.map((entry) => {
        const profile = emotionToSensoryProfile(entry.node.valence, entry.node.arousal, entry.node.dominance);
        return (
          <React.Fragment key={entry.node.id}>
            <LabelCell label={entry.node.label} hue={entry.node.hue} />
            <SensoryCells profile={profile} />
          </React.Fragment>
        );
      })}
    </div>
  );
});

// One curated selection's heading + table + its own download — so a multi-
// selection deck can export a single row without needing the whole page.
function SelectionTableRow({ index, selection }: { index: number; selection: SelectionEntry }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div>
      <LabelCell label={`${index + 1} · ${selection.variant.label}`} hue={selection.baseHue} italic={false} />
      <div style={{ marginTop: '12px' }}>
        <SelectionTable ref={ref} blend={selection.blend} />
      </div>
      <DownloadBar targetRef={ref} filename={`multisensory-map-${index + 1}-${selection.variant.label.toLowerCase()}`} />
    </div>
  );
}

export default function SensoryTableExport({ selections }: SensoryTableExportProps) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div>
      <div ref={ref} style={{ background: '#0d0d0f', borderRadius: '4px', padding: '28px 24px' }}>
        <SectionHeading>Multisensory Map — Overview</SectionHeading>

        {/* One row per selection, using each selection's primary emotion only */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '120px repeat(5, 1fr)',
            rowGap: '14px',
            columnGap: '16px',
            marginBottom: '36px',
          }}
        >
          <HeaderRow />
          {selections.map((s) => {
            const top = topBlendEntry(s.blend);
            const profile = emotionToSensoryProfile(top.node.valence, top.node.arousal, top.node.dominance);
            return (
              <React.Fragment key={s.id}>
                <LabelCell label={top.node.label} hue={top.node.hue} />
                <SensoryCells profile={profile} />
              </React.Fragment>
            );
          })}
        </div>

        {/* Full breakdown per selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {selections.map((s, i) => (
            <SelectionTableRow key={s.id} index={i} selection={s} />
          ))}
        </div>
      </div>
      <DownloadBar targetRef={ref} filename="multisensory-map" label="Multisensory Map" />
    </div>
  );
}
