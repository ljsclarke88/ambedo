import { useRef, useCallback } from 'react';
import { Voice, Reverb, ChordNote, buildReverb, buildVoice, connectVoice, scheduleChord } from '../lib/synthEngine';

export type { ChordNote };

// ---------------------------------------------------------------------------
// The interactive half of the synth: a live AudioContext, a cached reverb
// bus, and the three playback shapes the app uses (a single sustained tone,
// a frequency sweep, and a full chord). The actual DSP graph lives in
// lib/synthEngine.ts, shared with the offline WAV renderer in
// lib/renderSoundscape.ts — this hook is just the live-context wiring.
// ---------------------------------------------------------------------------

export function useAudioSynth() {
  const ctxRef = useRef<AudioContext | null>(null);
  const reverbRef = useRef<Reverb | null>(null);
  const activeRef = useRef<Voice[]>([]);

  const getCtx = () => {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    return ctxRef.current;
  };

  const getReverb = (ctx: AudioContext) => {
    if (!reverbRef.current) reverbRef.current = buildReverb(ctx);
    return reverbRef.current;
  };

  // A single sustained tone with a soft attack/release envelope.
  const play = useCallback((frequency: number, waveType: OscillatorType, harmonics = 3, duration = 2.5, peak = 0.16) => {
    const ctx = getCtx();
    const voice = buildVoice(ctx, frequency, waveType, harmonics);
    connectVoice(ctx, voice, getReverb(ctx));

    const now = ctx.currentTime;
    voice.gain.gain.setValueAtTime(0, now);
    voice.gain.gain.linearRampToValueAtTime(peak, now + 0.18);
    voice.gain.gain.setTargetAtTime(0, now + duration - 0.6, 0.4);
    voice.oscs.forEach((o) => {
      o.start(now);
      o.stop(now + duration + 0.6);
    });

    activeRef.current = [voice];
  }, []);

  // A slow exponential frequency glide from fromFreq → toFreq, filtered the
  // same way as `play` so a wide sweep stays smooth rather than sweeping
  // through a raw, ear-catching buzz.
  const sweep = useCallback((fromFreq: number, toFreq: number, waveType: OscillatorType, harmonics = 3, duration = 3) => {
    const ctx = getCtx();
    const f0 = Math.max(20, fromFreq);
    const f1 = Math.max(20, toFreq);
    const voice = buildVoice(ctx, f0, waveType, harmonics);
    connectVoice(ctx, voice, getReverb(ctx));

    const now = ctx.currentTime;
    voice.oscs.forEach((o) => {
      // The sparkle layer (if present) sits an octave above the core/unison
      // pair — preserve that ratio through the glide instead of collapsing
      // everything onto the same sweep.
      const ratio = Math.round(o.frequency.value / f0) || 1;
      o.frequency.setValueAtTime(f0 * ratio, now);
      o.frequency.exponentialRampToValueAtTime(f1 * ratio, now + duration * 0.8);
    });
    voice.gain.gain.setValueAtTime(0, now);
    voice.gain.gain.linearRampToValueAtTime(0.13, now + 0.2);
    voice.gain.gain.setTargetAtTime(0, now + duration - 0.7, 0.45);
    voice.oscs.forEach((o) => {
      o.start(now);
      o.stop(now + duration + 0.6);
    });

    activeRef.current = [voice];
  }, []);

  // Several notes arpeggiating in and sustaining together — the basis of the
  // soundscape export: each blend entry becomes one voice in a shared chord.
  const playChord = useCallback((notes: ChordNote[], duration = 6) => {
    const ctx = getCtx();
    activeRef.current = scheduleChord(ctx, getReverb(ctx), notes, duration, ctx.currentTime);
  }, []);

  const stop = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    activeRef.current.forEach(({ gain }) => {
      try {
        gain.gain.cancelScheduledValues(ctx.currentTime);
        gain.gain.setTargetAtTime(0, ctx.currentTime, 0.12);
      } catch {
        /* voice already stopped */
      }
    });
    activeRef.current = [];
  }, []);

  return { play, sweep, playChord, stop };
}
