import React, { useState } from 'react';
import { downloadNodeAsImage } from '../../lib/exportImage';

interface DownloadBarProps {
  targetRef: React.RefObject<HTMLElement>;
  filename: string;
  label?: string;
}

export default function DownloadBar({ targetRef, filename, label }: DownloadBarProps) {
  const [busy, setBusy] = useState<'png' | 'jpeg' | null>(null);

  const handleDownload = async (format: 'png' | 'jpeg') => {
    if (!targetRef.current || busy) return;
    setBusy(format);
    try {
      await downloadNodeAsImage(targetRef.current, filename, format);
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
            color: 'rgba(232,228,222,0.35)',
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
            opacity: busy && busy !== fmt ? 0.4 : 1,
          }}
        >
          {busy === fmt ? '…' : `↓ ${fmt.toUpperCase()}`}
        </button>
      ))}
    </div>
  );
}
