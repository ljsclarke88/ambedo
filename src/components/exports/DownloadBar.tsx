import React, { useState } from 'react';
import { downloadNodeAsImage } from '../../lib/exportImage';

interface DownloadBarProps {
  targetRef: React.RefObject<HTMLElement>;
  filename: string;
  label?: string;
  // 'dark' (default) is light-ink-on-dark, for the app's usual dark
  // surroundings. 'light' is dark-ink-on-light, for the white/cream export
  // rows (Multisensory Map, Emotional Mapping, Emotional Palette cards) —
  // the default styling disappears against a white background otherwise.
  theme?: 'dark' | 'light';
  // When the caller already knows targetRef's exact intended CSS size,
  // pass it here so html-to-image renders at that size instead of
  // auto-detecting it — see the note in exportImage.ts.
  size?: { width: number; height: number };
}

export default function DownloadBar({ targetRef, filename, label, theme = 'dark', size }: DownloadBarProps) {
  const [busy, setBusy] = useState<'png' | 'jpeg' | null>(null);
  const isLight = theme === 'light';

  const handleDownload = async (format: 'png' | 'jpeg') => {
    if (!targetRef.current || busy) return;
    setBusy(format);
    try {
      await downloadNodeAsImage(targetRef.current, filename, format, size);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 2px',
      }}
    >
      {label && (
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 300,
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: isLight ? 'rgba(20,18,16,0.4)' : 'rgba(232,228,222,0.35)',
            marginRight: 'auto',
          }}
        >
          {label}
        </span>
      )}
      {(['png', 'jpeg'] as const).map((fmt) => (
        <button
          key={fmt}
          onClick={() => handleDownload(fmt)}
          disabled={busy !== null}
          style={{
            background: isLight ? 'rgba(20,18,16,0.05)' : 'rgba(255,255,255,0.05)',
            border: isLight ? '1px solid rgba(20,18,16,0.18)' : '1px solid rgba(255,255,255,0.14)',
            borderRadius: '3px',
            padding: '7px 14px',
            color: isLight ? 'rgba(20,18,16,0.8)' : 'rgba(232,228,222,0.75)',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 400,
            fontSize: '11px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: busy ? 'wait' : 'pointer',
            opacity: busy && busy !== fmt ? 0.4 : 1,
          }}
        >
          {busy === fmt ? '…' : `↓ ${fmt.toUpperCase()}`}
        </button>
      ))}
    </div>
  );
}
