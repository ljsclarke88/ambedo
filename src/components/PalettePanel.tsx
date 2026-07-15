import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IntensityLevel, EmotionVariant, EMOTIONS } from '../data/emotions';
import { BlendEntry, AffectVector } from '../lib/mappings';
import {
  emotionToColor,
  emotionToSound,
  emotionToTaste,
  emotionToGeometry,
  emotionToMotion,
} from '../lib/mappings';
import MorphShape from './MorphShape';
import WaveformCanvas from './WaveformCanvas';
import TasteRadar from './TasteRadar';
import TextureLayer from './TextureLayer';
import { useAudioSynth } from '../hooks/useAudioSynth';

// Converts V/A/D scalars to a short categorical dossier string
function padDossier(valence: number, arousal: number, dominance: number): string {
  const v = valence  >  0.35 ? 'pleasant'    : valence  < -0.35 ? 'unpleasant' : 'ambivalent';
  const a = arousal  >  0.60 ? 'energised'   : arousal  <  0.35 ? 'calm'       : 'moderate';
  const d = dominance > 0.62 ? 'powerful'    : dominance < 0.38 ? 'submissive' : 'balanced';
  return `${v} · ${a} · ${d}`;
}

interface PalettePanelProps {
  emotionId: string | null;
  intensity: IntensityLevel;
  variant: EmotionVariant | null;
  baseHue: number;
  muted: boolean;
  onToggleMute: () => void;
  blend: BlendEntry[] | null;
  affect: AffectVector | null;
}

export default function PalettePanel({
  emotionId,
  intensity,
  variant,
  baseHue,
  muted,
  onToggleMute,
  blend,
  affect,
}: PalettePanelProps) {
  const { play, sweep } = useAudioSynth();

  const d = variant?.dominance ?? 0.5;
  const colorData  = variant ? emotionToColor(variant.valence, variant.arousal, baseHue, d) : null;
  const soundData  = variant ? emotionToSound(variant.valence, variant.arousal, d) : null;
  const tasteData  = variant ? emotionToTaste(variant.valence, variant.arousal, d) : null;
  const geoData    = variant ? emotionToGeometry(variant.valence, variant.arousal, d) : null;
  const motionData = variant ? emotionToMotion(variant.valence, variant.arousal, d) : null;

  useEffect(() => {
    if (!variant || !soundData || muted) return;
    // Use a frequency sweep when the blend spans a meaningful range (>80 Hz spread)
    if (blend && blend.length >= 2) {
      const sig  = blend.filter((e) => e.weight > 0.05);
      const freqs = sig.map((e) => Math.round(110 + e.node.arousal * 770));
      const lo = Math.min(...freqs);
      const hi = Math.max(...freqs);
      if (hi - lo > 80) {
        sweep(lo, hi, soundData.waveformType as OscillatorType, 2.8);
        return;
      }
    }
    play(soundData.frequency, soundData.waveformType as OscillatorType, 2.5);
  }, [variant?.label, muted]);

  // Multi-stop gradient from top blend entries
  const backgroundGradient = useMemo(() => {
    if (!blend || !colorData) return colorData?.gradient ?? '';
    const sig = blend.filter((e) => e.weight > 0.05).slice(0, 3);
    if (sig.length < 2) return colorData.gradient;
    const stops = sig.map((e, i) => {
      const pct = Math.round((i / (sig.length - 1)) * 100);
      const h   = e.node.hue;
      const sat = Math.min(92, Math.round(28 + e.node.arousal * 52 + d * 16));
      const lig = Math.min(62, Math.round(22 + ((e.node.valence + 1) / 2) * 38 - d * 5));
      return `hsl(${h}, ${sat}%, ${lig}%) ${pct}%`;
    });
    return `linear-gradient(135deg, ${stops.join(', ')})`;
  }, [blend, colorData, d]);

  // Frequency range across significant blend entries
  const freqRange = useMemo(() => {
    if (!blend) return null;
    const sig = blend.filter((e) => e.weight > 0.05);
    if (sig.length < 2) return null;
    const freqs = sig.map((e) => Math.round(110 + e.node.arousal * 770));
    const lo = Math.min(...freqs);
    const hi = Math.max(...freqs);
    return lo === hi ? null : { lo, hi };
  }, [blend]);

  // Top 3 blend entries for composition chips
  const topBlend = useMemo(
    () => (blend ? blend.filter((e) => e.weight > 0.04).slice(0, 3) : []),
    [blend]
  );

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
          background: backgroundGradient,
          borderRadius: '4px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* Animated grain texture */}
        <TextureLayer
          hue={colorData.hue}
          arousal={variant.arousal}
          dominance={variant.dominance}
        />

        {/* Dark overlay for text legibility */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(10,10,12,0.35) 0%, rgba(10,10,12,0.0) 40%, rgba(10,10,12,0.60) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Mute button */}
        <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10 }}>
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

        {/* Emotion label + blend chips + taste descriptor */}
        <div
          style={{
            position: 'absolute',
            bottom: '92px',
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

          {/* Mini-dossier: PAD category + primary emotion family */}
          {(() => {
            const family = EMOTIONS.find((e) => e.id === emotionId)?.label ?? '';
            const dossier = padDossier(variant.valence, variant.arousal, variant.dominance);
            return (
              <div
                style={{
                  marginTop: '6px',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 300,
                  fontSize: '9px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.30)',
                }}
              >
                {family && <span style={{ marginRight: '8px', color: 'rgba(255,255,255,0.22)' }}>{family}</span>}
                {dossier}
              </div>
            );
          })()}

          {/* Blend composition chips */}
          {topBlend.length > 1 && (
            <div
              style={{
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                flexWrap: 'wrap',
              }}
            >
              {topBlend.map((e) => (
                <span
                  key={e.node.id}
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 300,
                    fontSize: '9px',
                    letterSpacing: '0.08em',
                    color: `hsl(${e.node.hue}, 70%, 80%)`,
                    background: `hsla(${e.node.hue}, 50%, 20%, 0.4)`,
                    border: `1px solid hsla(${e.node.hue}, 60%, 50%, 0.3)`,
                    borderRadius: '2px',
                    padding: '2px 6px',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  {e.node.label} {Math.round(e.weight * 100)}%
                </span>
              ))}
            </div>
          )}

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
              {tasteData.icon}{' '}
              {tasteData.intensity !== 'moderate' ? `${tasteData.intensity} ` : ''}
              {tasteData.descriptor}
            </span>
          </div>

          <div
            style={{
              marginTop: '4px',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 300,
              fontSize: '10px',
              color: 'rgba(255,255,255,0.32)',
              letterSpacing: '0.06em',
              maxWidth: '280px',
              margin: '4px auto 0',
              lineHeight: 1.5,
            }}
          >
            {tasteData.note}
          </div>
        </div>

        {/* Taste radar — bottom left */}
        <div
          style={{
            position: 'absolute',
            bottom: '72px',
            left: '12px',
            zIndex: 6,
          }}
        >
          <TasteRadar
            valence={variant.valence}
            arousal={variant.arousal}
            color={waveColor}
          />
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

        {/* Sound info label — frequency range when blend spans multiple emotions */}
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
          {freqRange
            ? <div>{freqRange.lo}–{freqRange.hi}Hz</div>
            : <div>{soundData.frequency}Hz</div>}
          <div>{soundData.waveformType}</div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
