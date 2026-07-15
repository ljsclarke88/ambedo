import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { EMOTIONS, IntensityLevel, EmotionVariant } from './data/emotions';
import { coordinateToBlend, blendToAffect, BlendEntry, AffectVector } from './lib/mappings';
import EmotionWheel from './components/EmotionWheel';
import EmotionSearch from './components/EmotionSearch';
import PalettePanel from './components/PalettePanel';
import InfoPanel from './components/InfoPanel';

interface SelectedState {
  // Raw polar coordinates — drives the animated indicator dot
  angleDeg: number;
  radius: number;
  // Wheel highlight — derived from the dominant blend entry
  emotionId: string;
  intensity: IntensityLevel;
  // Palette inputs — constructed from blended affect
  variant: EmotionVariant;
  baseHue: number;
  // Full blend data — used by the palette panel for multi-stop gradient etc.
  blend: BlendEntry[];
  affect: AffectVector;
}

export default function App() {
  const [selected, setSelected] = useState<SelectedState | null>(null);
  const [muted, setMuted] = useState(true);
  const [showInfo, setShowInfo] = useState(true);

  const handleSelect = (angleDeg: number, radius: number) => {
    const blend = coordinateToBlend(angleDeg, radius);
    const affect = blendToAffect(blend);
    const top = blend[0].node;

    const intensity: IntensityLevel =
      top.intensity === 'dyad' ? 'mid' : top.intensity;

    const parentEmotion = EMOTIONS.find((e) => e.id === top.sourceId);
    const emotionId = parentEmotion?.id ?? top.sourceId;

    const variant: EmotionVariant = {
      label: top.label,
      valence: affect.valence,
      arousal: affect.arousal,
      dominance: affect.dominance,
    };

    setSelected({ angleDeg, radius, emotionId, intensity, variant, baseHue: affect.hue, blend, affect });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        minHeight: '100%',
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
      </header>

      {/* Main content: wheel + palette panel */}
      <main
        className="flex flex-col lg:flex-row"
        style={{ flex: 1, gap: '0', overflow: 'hidden' }}
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
            flexShrink: 0,
            gap: '12px',
          }}
        >
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
          />

          {/* Lexicon search */}
          <EmotionSearch onSelect={handleSelect} />
        </div>

        {/* Right/bottom: Palette Panel */}
        <div
          className="lg:w-[50%]"
          style={{
            flex: 1,
            padding: '24px 24px 16px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <PalettePanel
            emotionId={selected?.emotionId ?? null}
            intensity={selected?.intensity ?? 'mid'}
            variant={selected?.variant ?? null}
            baseHue={selected?.baseHue ?? 0}
            muted={muted}
            onToggleMute={() => setMuted((m) => !m)}
            blend={selected?.blend ?? null}
            affect={selected?.affect ?? null}
          />
        </div>
      </main>

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
