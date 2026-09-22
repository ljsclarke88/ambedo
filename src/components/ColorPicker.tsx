import React, { useState } from 'react';
import { findClosestEmotionPosition } from '../lib/colorMatch';

interface ColorPickerProps {
  onSelect: (angleDeg: number, radius: number) => void;
}

const HEX_RE = /^#?[0-9a-f]{3}([0-9a-f]{3})?$/i;

function normalizeHex(raw: string): string | null {
  const trimmed = raw.trim();
  if (!HEX_RE.test(trimmed)) return null;
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}

// Enter an exact hex colour (typed, or picked with the native swatch) and
// land on whichever emotion — or blend between two — computes the closest
// perceptual match, via the same emotionToColor science that drives every
// other colour in the app, just run in reverse.
export default function ColorPicker({ onSelect }: ColorPickerProps) {
  const [text, setText] = useState('');
  const [result, setResult] = useState<{ label: string; hex: string } | null>(null);
  const [invalid, setInvalid] = useState(false);

  const resolve = (raw: string) => {
    const hex = normalizeHex(raw);
    if (!hex) {
      setInvalid(true);
      setResult(null);
      return;
    }
    const match = findClosestEmotionPosition(hex);
    if (!match) {
      setInvalid(true);
      setResult(null);
      return;
    }
    setInvalid(false);
    setResult({ label: match.label, hex: match.hex });
    onSelect(match.angleDeg, match.radius);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    setInvalid(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') resolve(text);
  };

  const handleSwatchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    resolve(e.target.value);
  };

  return (
    <div style={{ width: '100%', maxWidth: '300px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <label
          title="Pick a colour"
          style={{
            position: 'relative',
            flexShrink: 0,
            width: '32px',
            height: '32px',
            borderRadius: '3px',
            border: '1px solid rgba(255,255,255,0.14)',
            background: result?.hex ?? 'rgba(255,255,255,0.04)',
            cursor: 'pointer',
            overflow: 'hidden',
          }}
        >
          <input
            type="color"
            value={result?.hex ?? '#808080'}
            onChange={handleSwatchChange}
            style={{
              position: 'absolute',
              inset: '-4px',
              width: 'calc(100% + 8px)',
              height: 'calc(100% + 8px)',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
          />
        </label>
        <input
          type="text"
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onBlur={() => text && resolve(text)}
          placeholder="#hex colour…"
          autoComplete="off"
          spellCheck={false}
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${invalid ? 'rgba(220,80,80,0.6)' : 'rgba(255,255,255,0.10)'}`,
            borderRadius: '3px',
            padding: '7px 14px',
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: 'italic',
            fontSize: '15px',
            color: 'rgba(232,228,222,0.82)',
            outline: 'none',
            letterSpacing: '0.04em',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ height: '20px', marginTop: '4px', textAlign: 'center' }}>
        {invalid && (
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '10px',
              letterSpacing: '0.06em',
              color: 'rgba(220,120,120,0.75)',
            }}
          >
            not a valid hex colour
          </span>
        )}
        {!invalid && result && (
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '10px',
              letterSpacing: '0.06em',
              color: 'rgba(232,228,222,0.4)',
            }}
          >
            closest match — <span style={{ color: 'rgba(232,228,222,0.7)' }}>{result.label}</span>
          </span>
        )}
      </div>
    </div>
  );
}
