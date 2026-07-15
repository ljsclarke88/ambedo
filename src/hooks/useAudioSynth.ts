import { useRef, useCallback } from 'react';

export function useAudioSynth() {
  const ctxRef  = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ osc: OscillatorNode; gain: GainNode } | null>(null);

  const getCtx = () => {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    return ctxRef.current;
  };

  const teardown = (ctx: AudioContext) => {
    if (nodesRef.current) {
      try { nodesRef.current.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.04); } catch {}
    }
  };

  // Play a static tone with attack/decay envelope.
  const play = useCallback((frequency: number, waveType: OscillatorType, duration = 2.0) => {
    const ctx = getCtx();
    teardown(ctx);
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = waveType;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.08);
    gain.gain.setTargetAtTime(0, ctx.currentTime + duration - 0.3, 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
    nodesRef.current = { osc, gain };
  }, []);

  // Play an exponential frequency sweep from fromFreq → toFreq.
  // Useful when the blend spans emotionally-distant nodes.
  const sweep = useCallback((
    fromFreq: number,
    toFreq: number,
    waveType: OscillatorType,
    duration = 2.5,
  ) => {
    const ctx = getCtx();
    teardown(ctx);
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = waveType;
    // Exponential ramp requires both values > 0; clamp to 20 Hz min.
    const f0 = Math.max(20, fromFreq);
    const f1 = Math.max(20, toFreq);
    osc.frequency.setValueAtTime(f0, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(f1, ctx.currentTime + duration * 0.8);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.10);
    gain.gain.setTargetAtTime(0, ctx.currentTime + duration - 0.4, 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
    nodesRef.current = { osc, gain };
  }, []);

  const stop = useCallback(() => {
    if (!ctxRef.current || !nodesRef.current) return;
    teardown(ctxRef.current);
  }, []);

  return { play, sweep, stop };
}
