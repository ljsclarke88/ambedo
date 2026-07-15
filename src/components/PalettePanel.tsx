import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IntensityLevel, EmotionVariant } from '../data/emotions';
import {
  emotionToColor,
  emotionToSound,
  emotionToTaste,
  emotionToGeometry,
  emotionToMotion,
} from '../lib/mappings';
import MorphShape from './MorphShape';
import WaveformCanvas from './WaveformCanvas';
import { useAudioSynth } from '../hooks/useAudioSynth';

interface PalettePanelProps {
  emotionId: string | null;
  intensity: IntensityLevel;
  variant: EmotionVariant | null;
  baseHue: number;
  muted: boolean;
  onToggleMute: () => void;
}

export default function PalettePanel({
  emotionId,
  intensity,
  variant,
  baseHue,
  muted,
  onToggleMute,
}: PalettePanelProps) {
  const { play } = useAudioSynth();

  const d = variant?.dominance ?? 0.5;
  const colorData = variant ? emotionToColor(variant.valence, variant.arousal, baseHue, d) : null;
  const soundData = variant ? emotionToSound(variant.valence, variant.arousal, d) : null;
  const tasteData = variant ? emotionToTaste(variant.valence, variant.arousal, d) : null;
  const geoData = variant ? emotionToGeometry(variant.valence, variant.arousal, d) : null;
  const motionData = variant ? emotionToMotion(variant.valence, variant.arousal, d) : null;

  useEffect(() => {
    if (variant && soundData && !muted) {
      play(soundData.frequency, soundData.waveformType as OscillatorType, 2.5);
    }
  }, [variant?.label, muted]);

  const waveColor = colorData
    ? `hsl(${colorData.hue}, ${colorData.saturation}%, ${Math.min(colorData.lightness + 30, 90)}%)`
    : 'rgba(255,255,255,0.3)';

  const morphColor = colorData
    ? `hsl(${colorData.hue}, ${colorData.saturation}%, ${colorData.lightness + 15}%)`
    : 'rgba(255,255,255,0.2)';

  if (!variant || !colorData || !soundData || !tasteData || !geoData || !motionData) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          minHeight: '400px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '4px',
        }}
      >
        <span
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: '18px',
            color: 'rgba(232,228,222,0.3)',
            letterSpacing: '0.04em',
          }}
        >
          select an emotion to reveal its palette
        </span>
      </div>
    );
  }

  const sign = variant.valence >= 0 ? '+' : '';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={variant.label}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.45, ease: 'easeInOut' }}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          minHeight: '400px',
          background: colorData.gradient,
          borderRadius: '4px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* Dark overlay for text legibility */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(10,10,12,0.35) 0%, rgba(10,10,12,0.0) 40%, rgba(10,10,12,0.55) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Mute button */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 10,
          }}
        >
          <button
            onClick={onToggleMute}
            aria-label={muted ? 'Unmute' : 'Mute'}
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '4px',
              color: 'rgba(255,255,255,0.75)',
              fontSize: '16px',
              cursor: 'pointer',
              padding: '6px 10px',
              lineHeight: 1,
              backdropFilter: 'blur(8px)',
            }}
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </div>

        {/* Valence / arousal / dominance readout */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            zIndex: 10,
            fontFamily: "'Inter', sans-serif",
            fontWeight: 300,
            fontSize: '10px',
            letterSpacing: '0.1em',
            color: 'rgba(255,255,255,0.45)',
          }}
        >
          <div>&#8596; {sign}{variant.valence.toFixed(2)}</div>
          <div>&#8593; {variant.arousal.toFixed(2)}</div>
          <div>&#8644; {variant.dominance.toFixed(2)}</div>
        </div>

        {/* Central MorphShape */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -52%)',
            zIndex: 2,
            opacity: 0.82,
          }}
        >
          <MorphShape
            points={geoData.points}
            curvature={geoData.curvature}
            size={geoData.size}
            spikiness={geoData.spikiness}
            color={morphColor}
            animate={true}
          />
        </div>

        {/* Emotion label */}
        <div
          style={{
            position: 'absolute',
            bottom: '90px',
            left: '0',
            right: '0',
            textAlign: 'center',
            zIndex: 5,
          }}
        >
          <div
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: 'clamp(28px, 5vw, 48px)',
              color: 'rgba(255,255,255,0.92)',
              letterSpacing: '0.06em',
              lineHeight: 1,
              textShadow: '0 2px 24px rgba(0,0,0,0.5)',
            }}
          >
            {variant.label}
          </div>

          {/* Taste descriptor */}
          <div
            style={{
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 300,
                fontSize: '13px',
                color: 'rgba(255,255,255,0.55)',
                letterSpacing: '0.1em',
              }}
            >
              {tasteData.icon} {tasteData.intensity !== 'moderate' ? `${tasteData.intensity} ` : ''}{tasteData.descriptor}
            </span>
          </div>

          <div
            style={{
              marginTop: '6px',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 300,
              fontSize: '10px',
              color: 'rgba(255,255,255,0.35)',
              letterSpacing: '0.06em',
              maxWidth: '280px',
              margin: '6px auto 0',
              lineHeight: 1.5,
            }}
          >
            {tasteData.note}
          </div>
        </div>

        {/* Waveform at the bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 4,
            opacity: 0.65,
          }}
        >
          <WaveformCanvas
            frequency={soundData.frequency}
            waveType={soundData.waveformType}
            color={waveColor}
            width={600}
            height={72}
          />
        </div>

        {/* Sound info subtle label */}
        <div
          style={{
            position: 'absolute',
            bottom: '76px',
            right: '16px',
            zIndex: 6,
            fontFamily: "'Inter', sans-serif",
            fontWeight: 300,
            fontSize: '9px',
            letterSpacing: '0.08em',
            color: 'rgba(255,255,255,0.3)',
            textAlign: 'right',
            lineHeight: 1.6,
          }}
        >
          <div>{soundData.frequency}Hz</div>
          <div>{soundData.waveformType}</div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
