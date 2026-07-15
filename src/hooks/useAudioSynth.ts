import { useRef, useCallback } from 'react';

export function useAudioSynth() {
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ osc: OscillatorNode; gain: GainNode } | null>(null);

  const getCtx = () => {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    return ctxRef.current;
  };

  const play = useCallback((frequency: number, waveType: OscillatorType, duration = 2.0) => {
    const ctx = getCtx();
    // stop any existing
    if (nodesRef.current) {
      try { nodesRef.current.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.05); } catch {}
    }
    const osc = ctx.createOscillator();
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

  const stop = useCallback(() => {
    if (!ctxRef.current || !nodesRef.current) return;
    const ctx = ctxRef.current;
    nodesRef.current.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
  }, []);

  return { play, stop };
}
