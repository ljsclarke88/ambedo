import React, { useState } from 'react';
import { ChordNote } from '../../lib/synthEngine';
import { renderSoundscapeToWav } from '../../lib/renderSoundscape';
import { downloadBlob } from '../../lib/wavEncoder';

interface AudioDownloadBarProps {
  notes: ChordNote[];
  duration: number;
  filename: string;
  label?: string;
}

export default function AudioDownloadBar({ notes, duration, filename, label }: AudioDownloadBarProps) {
  const [busy, setBusy] = useState(false);

  const handleDownload = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const blob = await renderSoundscapeToWav(notes, duration);
      downloadBlob(blob, `${filename}.wav`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 2px' }}>
      {label && (
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 300,
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(232,228,222,0.35)',
            marginRight: 'auto',
          }}
        >
          {label}
        </span>
      )}
      <button
        onClick={handleDownload}
        disabled={busy}
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.14)',
          borderRadius: '3px',
          padding: '7px 14px',
          color: 'rgba(232,228,222,0.75)',
          fontFamily: "'Inter', sans-serif",
          fontWeight: 400,
          fontSize: '11px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          cursor: busy ? 'wait' : 'pointer',
        }}
      >
        {busy ? 'rendering…' : '↓ WAV'}
      </button>
    </div>
  );
}
