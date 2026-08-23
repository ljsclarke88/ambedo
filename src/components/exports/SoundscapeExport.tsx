import React, { useMemo, useRef, useState } from 'react';
import { BlendEntry, emotionToSound } from '../../lib/mappings';
import { SelectionEntry, topBlendEntry } from '../../lib/deckDerive';
import { quantizeToScale, frequencyToNoteName, scaleNameForValence } from '../../lib/musicalScale';
import { useAudioSynth, ChordNote } from '../../hooks/useAudioSynth';
import WaveformCanvas from '../WaveformCanvas';
import AudioDownloadBar from './AudioDownloadBar';

interface SoundscapeExportProps {
  selections: SelectionEntry[];
}

const CHORD_DURATION = 6;

export default function SoundscapeExport({ selections }: SoundscapeExportProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { playChord, stop } = useAudioSynth();
  const [playing, setPlaying] = useState(false);
  const timeoutRef = useRef<number | undefined>(undefined);

  const multi = selections.length > 1;

  // A single selection: every significant entry within its own blend
  // becomes a layer, quantised against that selection's own blended
  // valence — exactly what this tab always did. Multiple selections: each
  // curated pick contributes only its own dominant note, quantised against
  // a key shared across the whole set, so the chord represents the set as
  // a group rather than exploding into every sub-blend.
  const keyValence = useMemo(() => {
    if (selections.length === 0) return 0;
    if (!multi) return selections[0].affect.valence;
    return selections.reduce((sum, s) => sum + s.affect.valence, 0) / selections.length;
  }, [selections, multi]);

  const sourceEntries: BlendEntry[] = useMemo(() => {
    if (selections.length === 0) return [];
    if (!multi) {
      const sig = selections[0].blend.filter((e) => e.weight > 0.04).slice(0, 5);
      return sig.length > 0 ? sig : selections[0].blend.slice(0, 1);
    }
    return selections.map((s) => topBlendEntry(s.blend));
  }, [selections, multi]);

  const layers = useMemo(
    () =>
      sourceEntries.map((e) => {
        const sound = emotionToSound(e.node.valence, e.node.arousal, e.node.dominance);
        const keyedFrequency = Math.round(quantizeToScale(sound.frequency, keyValence));
        return {
          entry: e,
          waveformType: sound.waveformType,
          harmonics: sound.harmonics,
          frequency: keyedFrequency,
          noteName: frequencyToNoteName(keyedFrequency),
        };
      }),
    [sourceEntries, keyValence]
  );

  const notes: ChordNote[] = useMemo(
    () =>
      layers.map((l, i) => ({
        frequency: l.frequency,
        waveType: l.waveformType,
        harmonics: l.harmonics,
        gain: 0.55 + l.entry.weight * 0.9,
        delay: i * 0.28,
      })),
    [layers]
  );

  const handlePlay = () => {
    playChord(notes, CHORD_DURATION);
    setPlaying(true);
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setPlaying(false), CHORD_DURATION * 1000);
  };

  const handleStop = () => {
    stop();
    setPlaying(false);
    window.clearTimeout(timeoutRef.current);
  };

  const keyName = scaleNameForValence(keyValence);

  return (
    <div>
      <div
        ref={ref}
        style={{
          background: '#0d0d0f',
          borderRadius: '4px',
          padding: '28px 24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
              fontSize: '10px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(232,228,222,0.4)',
            }}
          >
            Soundscape
          </div>
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 300,
              fontSize: '10px',
              letterSpacing: '0.08em',
              color: 'rgba(232,228,222,0.3)',
            }}
          >
            key · {keyName}
          </div>
        </div>

        {/* One layer per source entry — a blend's own composition when a
            single emotion is selected, or one note per curated selection
            when several are — the "tracks" that merge into the played chord */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {layers.map((l, i) => {
            const color = `hsl(${l.entry.node.hue}, 62%, 62%)`;
            return (
              <div
                key={`${l.entry.node.id}-${i}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '3px',
                  padding: '10px 14px',
                }}
              >
                <div style={{ width: '104px', flexShrink: 0 }}>
                  <div
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontStyle: 'italic',
                      fontSize: '15px',
                      color: 'rgba(232,228,222,0.85)',
                      lineHeight: 1.2,
                    }}
                  >
                    {multi ? `${i + 1} · ${l.entry.node.label}` : l.entry.node.label}
                  </div>
                  <div
                    style={{
                      marginTop: '2px',
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 300,
                      fontSize: '9px',
                      letterSpacing: '0.06em',
                      color: 'rgba(232,228,222,0.35)',
                    }}
                  >
                    {l.noteName} · {Math.round(l.entry.weight * 100)}%
                  </div>
                </div>
                <div style={{ flex: 1, opacity: 0.75 }}>
                  <WaveformCanvas
                    frequency={l.frequency}
                    waveType={l.waveformType}
                    color={color}
                    width={480}
                    height={36}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 2px' }}>
        <button
          onClick={playing ? handleStop : handlePlay}
          style={{
            background: playing ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: '3px',
            padding: '7px 14px',
            color: 'rgba(232,228,222,0.85)',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 400,
            fontSize: '11px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          {playing ? '■ Stop' : '▶ Play Soundscape'}
        </button>
        <AudioDownloadBar notes={notes} duration={CHORD_DURATION} filename="soundscape" label="Soundscape" />
      </div>
    </div>
  );
}
