import React, { useState } from 'react';
import { EMOTION_LEXICON, LexiconEntry } from '../data/emotions';

interface EmotionSearchProps {
  onSelect: (angleDeg: number, radius: number) => void;
}

export default function EmotionSearch({ onSelect }: EmotionSearchProps) {
  const [query, setSuggestions_query] = useState('');
  const [suggestions, setSuggestions] = useState<LexiconEntry[]>([]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSuggestions_query(q);
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    const lower = q.toLowerCase();
    setSuggestions(
      EMOTION_LEXICON.filter((w) => w.label.toLowerCase().includes(lower)).slice(0, 6)
    );
  };

  const handleSelect = (entry: LexiconEntry) => {
    onSelect(entry.angle, entry.radius);
    setSuggestions_query('');
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSuggestions_query('');
      setSuggestions([]);
    }
    if (e.key === 'Enter' && suggestions.length > 0) {
      handleSelect(suggestions[0]);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '300px', margin: '0 auto' }}>
      <input
        type="text"
        value={query}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="search an emotion…"
        autoComplete="off"
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.10)',
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

      {suggestions.length > 0 && (
        <ul
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 30,
            background: '#17171b',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: '3px',
            padding: '4px 0',
            margin: 0,
            listStyle: 'none',
          }}
        >
          {suggestions.map((entry) => (
            <li
              key={entry.label}
              onClick={() => handleSelect(entry)}
              style={{
                padding: '7px 14px',
                cursor: 'pointer',
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: 'italic',
                fontSize: '15px',
                color: 'rgba(232,228,222,0.72)',
                letterSpacing: '0.04em',
                transition: 'background 0.12s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              {entry.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
