import React, { useRef, useState } from 'react';
import DownloadBar from './DownloadBar';

// Generic divider/title-card generator for the deck's plain section slides
// (e.g. "Multisensory Map", "sound scape", "Dyad logic — design lever").
// These carry no emotion data, so the copy is left fully editable.
export default function TitleCardExport() {
  const [eyebrow, setEyebrow] = useState('MULTISENSORY MAP');
  const [title, setTitle] = useState('sound scape');
  const [subtitle, setSubtitle] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: '3px',
    padding: '7px 10px',
    color: 'rgba(232,228,222,0.85)',
    fontFamily: "'Inter', sans-serif",
    fontSize: '12px',
    width: '100%',
  };

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px', maxWidth: '420px' }}>
        <label style={{ fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(232,228,222,0.4)', textTransform: 'uppercase' }}>
          Eyebrow
          <input style={{ ...inputStyle, marginTop: '4px' }} value={eyebrow} onChange={(e) => setEyebrow(e.target.value)} />
        </label>
        <label style={{ fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(232,228,222,0.4)', textTransform: 'uppercase' }}>
          Title
          <input style={{ ...inputStyle, marginTop: '4px' }} value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label style={{ fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(232,228,222,0.4)', textTransform: 'uppercase' }}>
          Subtitle (optional)
          <input style={{ ...inputStyle, marginTop: '4px' }} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        </label>
      </div>

      <div
        ref={ref}
        style={{
          width: '100%',
          aspectRatio: '16 / 9',
          background: '#0d0d0f',
          borderRadius: '4px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '8% 10%',
        }}
      >
        {eyebrow && (
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
              fontSize: '12px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#c1502e',
              marginBottom: '20px',
            }}
          >
            {eyebrow}
          </div>
        )}
        <div
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 'clamp(28px, 5vw, 44px)',
            color: 'rgba(232,228,222,0.92)',
            letterSpacing: '0.02em',
            lineHeight: 1.1,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              marginTop: '12px',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 300,
              fontSize: '13px',
              letterSpacing: '0.03em',
              color: 'rgba(232,228,222,0.5)',
              maxWidth: '480px',
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      <DownloadBar targetRef={ref} filename="title-card" label="Title Card" />
    </div>
  );
}
