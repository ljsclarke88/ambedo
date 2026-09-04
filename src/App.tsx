import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { EMOTIONS, IntensityLevel, EmotionVariant } from './data/emotions';
import { coordinateToBlend, blendToAffect } from './lib/mappings';
import { SelectionEntry } from './lib/deckDerive';
import EmotionWheel from './components/EmotionWheel';
import EmotionSearch from './components/EmotionSearch';
import PalettePanel from './components/PalettePanel';
import InfoPanel from './components/InfoPanel';
import EmotionalPaletteExport from './components/exports/EmotionalPaletteExport';
import EmotionalMappingExport from './components/exports/EmotionalMappingExport';
import SensoryTableExport from './components/exports/SensoryTableExport';
import SoundscapeExport from './components/exports/SoundscapeExport';
import CatalogExport from './components/exports/CatalogExport';

type ExportTab = 'palette' | 'mapping' | 'table' | 'soundscape' | 'catalog';

const MAX_SELECTIONS = 8;
const MIN_SELECTIONS = 1;

// The point currently being explored on the wheel — a SelectionEntry without
// the id, since it isn't part of the curated set until "+ Add" is pressed.
type SelectedState = Omit<SelectionEntry, 'id'>;

function makeSelectionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function App() {
  const [selected, setSelected] = useState<SelectedState | null>(null);
  const [selections, setSelections] = useState<SelectionEntry[]>([]);
  const [muted, setMuted] = useState(true);
  const [showInfo, setShowInfo] = useState(true);
  // Stores the position before a complement jump so we can toggle back
  const [origin, setOrigin] = useState<{ angleDeg: number; radius: number } | null>(null);
  const [exportTab, setExportTab] = useState<ExportTab | null>(null);

  const handleAddSelection = () => {
    if (!selected || selections.length >= MAX_SELECTIONS) return;
    setSelections((prev) => [...prev, { ...selected, id: makeSelectionId() }]);
  };

  const handleRemoveSelection = (id: string) => {
    setSelections((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSelect = (angleDeg: number, radius: number) => {
    const blend = coordinateToBlend(angleDeg, radius);
    const affect = blendToAffect(blend);
    const top = blend[0].node;

    const intensity: IntensityLevel = top.intensity;

    const parentEmotion = EMOTIONS.find((e) => e.id === top.sourceId);
    const emotionId = parentEmotion?.id ?? top.sourceId;

    const variant: EmotionVariant = {
      label: top.label,
      valence: affect.valence,
      arousal: affect.arousal,
      dominance: affect.dominance,
    };

    setSelected({ angleDeg, radius, emotionId, intensity, variant, baseHue: affect.hue, blend, affect });
    setOrigin(null);  // any direct interaction clears the complement toggle
  };

  const handleComplement = () => {
    if (!selected) return;
    if (origin) {
      // Toggle back to original
      const { angleDeg, radius } = origin;
      const blend = coordinateToBlend(angleDeg, radius);
      const affect = blendToAffect(blend);
      const top = blend[0].node;
      const intensity: IntensityLevel = top.intensity;
      const emotionId = EMOTIONS.find((e) => e.id === top.sourceId)?.id ?? top.sourceId;
      const variant: EmotionVariant = { label: top.label, valence: affect.valence, arousal: affect.arousal, dominance: affect.dominance };
      setSelected({ angleDeg, radius, emotionId, intensity, variant, baseHue: affect.hue, blend, affect });
      setOrigin(null);
    } else {
      // Jump to complement (180° opposite, same radius)
      setOrigin({ angleDeg: selected.angleDeg, radius: selected.radius });
      const compAngle = selected.angleDeg + 180;
      const blend = coordinateToBlend(compAngle, selected.radius);
      const affect = blendToAffect(blend);
      const top = blend[0].node;
      const intensity: IntensityLevel = top.intensity;
      const emotionId = EMOTIONS.find((e) => e.id === top.sourceId)?.id ?? top.sourceId;
      const variant: EmotionVariant = { label: top.label, valence: affect.valence, arousal: affect.arousal, dominance: affect.dominance };
      setSelected({ angleDeg: compAngle, radius: selected.radius, emotionId, intensity, variant, baseHue: affect.hue, blend, affect });
    }
  };

  // Space = toggle mute
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        setMuted((m) => !m);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: '#0d0d0f',
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: '20px 32px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      >
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: '28px',
            color: 'rgba(232,228,222,0.9)',
            letterSpacing: '0.06em',
            lineHeight: 1,
          }}
        >
          Ambedo
        </h1>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 300,
            fontSize: '11px',
            letterSpacing: '0.12em',
            color: 'rgba(232,228,222,0.3)',
            marginTop: '4px',
            textTransform: 'lowercase',
          }}
        >
          a crossmodal correspondence explorer
        </p>

        {/* Deck export tabs */}
        <nav style={{ display: 'flex', gap: '6px', marginTop: '14px', flexWrap: 'wrap' }}>
          {(
            [
              { key: null, label: 'Explore' },
              { key: 'palette', label: 'Emotional Palette' },
              { key: 'mapping', label: 'Emotional Mapping' },
              { key: 'table', label: 'Multisensory Map' },
              { key: 'soundscape', label: 'Soundscape' },
              { key: 'catalog', label: 'Catalog' },
            ] as const
          ).map((t) => (
            <button
              key={t.label}
              onClick={() => setExportTab(t.key)}
              style={{
                background: exportTab === t.key ? 'rgba(255,255,255,0.10)' : 'transparent',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '3px',
                padding: '6px 12px',
                color: exportTab === t.key ? 'rgba(232,228,222,0.9)' : 'rgba(232,228,222,0.45)',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 400,
                fontSize: '10px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main content: wheel + palette panel — kept mounted (display:none when
          an export tab is active) so framer-motion's animated SVGs never get
          torn down mid-transition, which otherwise throws stray console
          errors from unmounted-but-still-animating circle/path elements. */}
      <main
        className="flex flex-col lg:flex-row"
        style={{ flex: 1, minHeight: 0, gap: '0', overflow: 'hidden', display: exportTab === null ? 'flex' : 'none' }}
      >
        {/* Left/top: wheel + search */}
        <div
          className="lg:w-[50%]"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 24px 16px',
            minHeight: 0,
            gap: '12px',
          }}
        >
          <div style={{ flex: '1 1 auto', minHeight: 0, width: '100%', display: 'flex', justifyContent: 'center' }}>
          <EmotionWheel
            onSelect={handleSelect}
            selected={
              selected
                ? { emotionId: selected.emotionId, intensity: selected.intensity }
                : null
            }
            indicatorPos={
              selected ? { angleDeg: selected.angleDeg, radius: selected.radius } : null
            }
            complementPos={
              selected && !origin
                ? { angleDeg: selected.angleDeg + 180, radius: selected.radius }
                : origin
                  ? { angleDeg: origin.angleDeg, radius: origin.radius }
                  : null
            }
          />
          </div>

          {/* Lexicon search + complement toggle */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%', maxWidth: '300px', margin: '0 auto' }}>
            <div style={{ flex: 1 }}>
              <EmotionSearch onSelect={handleSelect} />
            </div>
            {selected && (
              <button
                onClick={handleComplement}
                title={origin ? 'Return to original' : 'Navigate to complementary emotion'}
                style={{
                  flexShrink: 0,
                  background: origin ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  borderRadius: '3px',
                  padding: '7px 10px',
                  color: 'rgba(232,228,222,0.65)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  lineHeight: 1,
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                }}
              >
                {origin ? '← back' : '↔'}
              </button>
            )}
          </div>

          {/* Curated selection set — feeds the Palette/Mapping/Table deck
              views, which each require 2–8 of these. */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '300px', margin: '0 auto' }}>
            <button
              onClick={handleAddSelection}
              disabled={!selected || selections.length >= MAX_SELECTIONS}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: '3px',
                padding: '7px 10px',
                color: !selected || selections.length >= MAX_SELECTIONS ? 'rgba(232,228,222,0.25)' : 'rgba(232,228,222,0.7)',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 400,
                fontSize: '10px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: !selected || selections.length >= MAX_SELECTIONS ? 'default' : 'pointer',
              }}
            >
              + Add to selection ({selections.length}/{MAX_SELECTIONS})
            </button>

            {selections.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {selections.map((s) => (
                  <span
                    key={s.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: `hsla(${s.baseHue}, 50%, 25%, 0.4)`,
                      border: `1px solid hsla(${s.baseHue}, 60%, 55%, 0.4)`,
                      borderRadius: '2px',
                      padding: '3px 6px 3px 9px',
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 300,
                      fontSize: '10px',
                      letterSpacing: '0.04em',
                      color: `hsl(${s.baseHue}, 70%, 82%)`,
                    }}
                  >
                    {s.variant.label}
                    <button
                      onClick={() => handleRemoveSelection(s.id)}
                      aria-label={`Remove ${s.variant.label} from selection`}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'inherit',
                        opacity: 0.7,
                        cursor: 'pointer',
                        fontSize: '12px',
                        lineHeight: 1,
                        padding: 0,
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right/bottom: Palette Panel */}
        <div
          className="lg:w-[50%]"
          style={{
            flex: 1,
            minHeight: 0,
            padding: '24px 24px 16px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <PalettePanel
            emotionId={selected?.emotionId ?? null}
            intensity={selected?.intensity ?? 'ring1'}
            variant={selected?.variant ?? null}
            baseHue={selected?.baseHue ?? 0}
            muted={muted}
            onToggleMute={() => setMuted((m) => !m)}
            blend={selected?.blend ?? null}
            affect={selected?.affect ?? null}
          />
        </div>
      </main>

      {/* Deck export views */}
      {exportTab !== null && (
        <main style={{ flex: 1, overflow: 'auto', padding: '24px 32px 40px' }}>
          {exportTab !== 'catalog' && selections.length < MIN_SELECTIONS && (
            <div
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: '18px',
                color: 'rgba(232,228,222,0.4)',
                textAlign: 'center',
                marginTop: '80px',
              }}
            >
              add an emotion to your selection in Explore, then come back here
            </div>
          )}

          {exportTab === 'palette' && selections.length >= MIN_SELECTIONS && (
            <EmotionalPaletteExport selections={selections} />
          )}

          {exportTab === 'mapping' && selections.length >= MIN_SELECTIONS && (
            <EmotionalMappingExport selections={selections} />
          )}

          {exportTab === 'table' && selections.length >= MIN_SELECTIONS && (
            <SensoryTableExport selections={selections} />
          )}

          {exportTab === 'soundscape' && selections.length >= MIN_SELECTIONS && (
            <SoundscapeExport selections={selections} />
          )}

          {exportTab === 'catalog' && <CatalogExport />}
        </main>
      )}

      {/* Info panel at bottom */}
      <AnimatePresence>
        {showInfo && (
          <footer style={{ flexShrink: 0 }}>
            <InfoPanel onDismiss={() => setShowInfo(false)} />
          </footer>
        )}
      </AnimatePresence>
    </div>
  );
}
