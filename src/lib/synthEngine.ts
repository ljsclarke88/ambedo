// ---------------------------------------------------------------------------
// Pure Web Audio graph builders, shared between the interactive hook
// (useAudioSynth, running on a live AudioContext) and the offline WAV
// renderer (renderSoundscape, running on an OfflineAudioContext). Both are
// BaseAudioContext, and every node type used here (oscillator, gain,
// biquad filter, delay) is defined on that common interface, so the same
// voice/reverb-building code produces identical audio in both places —
// what you hear when you press play is exactly what ends up in the
// downloaded file.
// ---------------------------------------------------------------------------

export interface Voice {
  oscs: OscillatorNode[];
  gain: GainNode;
}

export interface Reverb {
  input: GainNode;
  output: GainNode;
}

export interface ChordNote {
  frequency: number;
  waveType: OscillatorType;
  harmonics: number;
  gain?: number;  // relative level, 0–1, default 1
  delay?: number; // seconds after chord start — lets notes arpeggiate in
}

// A cheap Schroeder-style diffuse reverb: three staggered, damped delay
// lines summed together — enough to add "space" without the cost of a
// convolution reverb.
export function buildReverb(ctx: BaseAudioContext): Reverb {
  const input = ctx.createGain();
  const output = ctx.createGain();
  output.gain.value = 0.55;

  [0.029, 0.044, 0.071].forEach((delayTime) => {
    const delay = ctx.createDelay(1);
    delay.delayTime.value = delayTime;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.4;
    const damp = ctx.createBiquadFilter();
    damp.type = 'lowpass';
    damp.frequency.value = 3000;

    input.connect(delay);
    delay.connect(damp);
    damp.connect(feedback);
    feedback.connect(delay);
    damp.connect(output);
  });

  output.connect(ctx.destination);
  return { input, output };
}

// Core osc + a ~9-cent-detuned unison layer (chorus/warmth) + an optional
// soft sine octave-up "sparkle" for brighter/high-harmonic tones, all summed
// through a lowpass filter whose cutoff is driven by the emotion's
// `harmonics` value — what tames a raw sawtooth/triangle from a buzzsaw
// into something with edge but not abrasiveness.
export function buildVoice(ctx: BaseAudioContext, frequency: number, waveType: OscillatorType, harmonics: number): Voice {
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 0.6;
  filter.frequency.value = Math.min(6000, frequency * (1.7 + Math.min(8, harmonics) * 0.5));

  const gain = ctx.createGain();
  gain.gain.value = 0;

  const oscs: OscillatorNode[] = [];

  const core = ctx.createOscillator();
  core.type = waveType;
  core.frequency.value = frequency;
  core.connect(filter);
  oscs.push(core);

  const unison = ctx.createOscillator();
  unison.type = waveType;
  unison.frequency.value = frequency;
  unison.detune.value = 9;
  const unisonGain = ctx.createGain();
  unisonGain.gain.value = 0.45;
  unison.connect(unisonGain);
  unisonGain.connect(filter);
  oscs.push(unison);

  if (harmonics > 3) {
    const sparkle = ctx.createOscillator();
    sparkle.type = 'sine';
    sparkle.frequency.value = frequency * 2;
    const sparkleGain = ctx.createGain();
    sparkleGain.gain.value = 0.1 + Math.min(1, (harmonics - 3) / 5) * 0.12;
    sparkle.connect(sparkleGain);
    sparkleGain.connect(filter);
    oscs.push(sparkle);
  }

  filter.connect(gain);
  return { oscs, gain };
}

export function connectVoice(ctx: BaseAudioContext, voice: Voice, reverb: Reverb, wetAmount = 0.5): void {
  voice.gain.connect(ctx.destination);
  const wet = ctx.createGain();
  wet.gain.value = wetAmount;
  voice.gain.connect(wet);
  wet.connect(reverb.input);
}

// Schedules a full chord (arpeggiating notes sustaining together) onto any
// BaseAudioContext starting at `startTime` — shared by the live playChord
// and the offline renderer so they produce identical envelopes.
export function scheduleChord(ctx: BaseAudioContext, reverb: Reverb, notes: ChordNote[], duration: number, startTime: number): Voice[] {
  const voices: Voice[] = [];

  notes.forEach((note, i) => {
    const voice = buildVoice(ctx, note.frequency, note.waveType, note.harmonics);
    connectVoice(ctx, voice, reverb, 0.6);
    const startAt = startTime + (note.delay ?? i * 0.22);
    const peak = (note.gain ?? 1) * 0.13;

    voice.gain.gain.setValueAtTime(0, startAt);
    voice.gain.gain.linearRampToValueAtTime(peak, startAt + 0.9);
    voice.gain.gain.setTargetAtTime(0, startAt + duration - 1.2, 0.7);
    voice.oscs.forEach((o) => {
      o.start(startAt);
      o.stop(startAt + duration + 1);
    });
    voices.push(voice);
  });

  return voices;
}
