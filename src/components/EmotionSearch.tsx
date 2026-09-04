import React, { useMemo, useState } from 'react';
import { EmotionNode } from '../data/emotions';
import { getSearchableEmotions, groupLexiconByFamily } from '../lib/lexiconGroups';

interface EmotionSearchProps {
  onSelect: (angleDeg: number, radius: number) => void;
}

export default function EmotionSearch({ onSelect }: EmotionSearchProps) {
  const [query, setSuggestions_query] = useState('');
  const [suggestions, setSuggestions] = useState<EmotionNode[]>([]);
  const [browsing, setBrowsing] = useState(false);

  // Every family, category, and specific word on the wheel — so searching
  // "Fear" or "Envy" finds the wheel's own core/category labels too, not
  // just the most specific ring3 words.
  const searchable = useMemo(() => getSearchableEmotions(), []);
  const groups = useMemo(() => groupLexiconByFamily(), []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSuggestions_query(q);
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    const lower = q.toLowerCase();
    setSuggestions(
      searchable.filter((w) => w.label.toLowerCase().includes(lower)).slice(0, 6)
    );
  };

  const handleSelect = (entry: EmotionNode) => {
    onSelect(entry.angle, entry.radius);
    setSuggestions_query('');
    setSuggestions([]);
  };

  // Browsing stays open after a pick, so you can try several words in a row
  // without re-opening the panel each time.
  const handleBrowseSelect = (entry: EmotionNode) => {
    onSelect(entry.angle, entry.radius);
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
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          type="text"
          value={query}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="search an emotion…"
          autoComplete="off"
          style={{
            flex: 1,
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
        <button
          onClick={() => setBrowsing((b) => !b)}
          title="Browse all emotions by family"
          style={{
            flexShrink: 0,
            background: browsing ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: '3px',
            padding: '7px 10px',
            color: 'rgba(232,228,222,0.65)',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 400,
            fontSize: '10px',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {browsing ? 'close' : 'browse'}
        </button>
      </div>

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
              key={entry.id}
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

      {browsing && (
        <div
          style={{
            marginTop: '8px',
            maxHeight: '280px',
            overflowY: 'auto',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '3px',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {groups.map((g) => (
            <div key={g.label}>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 400,
                  fontSize: '9px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'rgba(232,228,222,0.4)',
                  marginBottom: '5px',
                }}
              >
                {g.label}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {g.words.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => handleBrowseSelect(w)}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      borderRadius: '2px',
                      padding: '3px 7px',
                      cursor: 'pointer',
                      fontFamily: "'Cormorant Garamond', serif",
                      fontStyle: 'italic',
                      fontSize: '12px',
                      color: 'rgba(232,228,222,0.75)',
                      letterSpacing: '0.02em',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.10)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                    }}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
