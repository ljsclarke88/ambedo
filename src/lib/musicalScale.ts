// ---------------------------------------------------------------------------
// Quantises the raw, continuously-derived frequencies from emotionToSound
// onto a musical scale. The affect science still picks the register
// (arousal → pitch height, dominance → harmonic content) — this layer only
// snaps the result onto consonant intervals so that (a) a single tone reads
// as a note rather than an arbitrary lab-tone frequency, and (b) multiple
// blend frequencies sounding together (the sweep, the soundscape chord)
// share a key and don't clash.
//
// All scales are built with no adjacent semitones, which is what keeps
// simultaneous notes from beating against each other — the actual source of
// "abrasiveness" when several raw frequencies play at once.
// ---------------------------------------------------------------------------

const ROOT_HZ = 110; // A2 — anchors the low end of the app's existing 110–880Hz range

// Semitone offsets from the root, within one octave.
const MAJOR_PENTATONIC = [0, 2, 4, 7, 9];   // bright, positive valence
const MINOR_PENTATONIC = [0, 3, 5, 7, 10];  // moodier but still consonant, negative valence
const SUSPENDED = [0, 2, 5, 7, 9];          // ambiguous middle ground, near-neutral valence

export function scaleForValence(valence: number): number[] {
  if (valence > 0.15) return MAJOR_PENTATONIC;
  if (valence < -0.15) return MINOR_PENTATONIC;
  return SUSPENDED;
}

// Human-readable name for the scale a given (blended) valence resolves to —
// used to caption the soundscape with the key it's actually playing in.
export function scaleNameForValence(valence: number): string {
  if (valence > 0.15) return 'A major pentatonic';
  if (valence < -0.15) return 'A minor pentatonic';
  return 'A suspended (neutral)';
}

// Snaps an arbitrary frequency to the nearest degree of the scale implied by
// `keyValence` (kept as a separate parameter from the tone's own valence so
// a whole chord can share one key even when its notes come from emotions
// with different individual valence values).
export function quantizeToScale(freqHz: number, keyValence: number): number {
  const scale = scaleForValence(keyValence);
  const semitonesFromRoot = 12 * Math.log2(freqHz / ROOT_HZ);
  const octave = Math.floor(semitonesFromRoot / 12);
  const within = semitonesFromRoot - octave * 12;

  let best = scale[0];
  let bestDist = Infinity;
  for (const degree of scale) {
    const dist = Math.abs(within - degree);
    if (dist < bestDist) {
      bestDist = dist;
      best = degree;
    }
  }

  const snappedSemitone = octave * 12 + best;
  return ROOT_HZ * Math.pow(2, snappedSemitone / 12);
}

const NOTE_NAMES = ['A', 'A♯', 'B', 'C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯'];

// Human-readable note name for a frequency already on the A2-rooted grid
// (e.g. "A3", "E4") — used to give the sound a legible, musical identity
// in the UI instead of just a raw Hz figure.
export function frequencyToNoteName(freqHz: number): string {
  const semitonesFromRoot = Math.round(12 * Math.log2(freqHz / ROOT_HZ));
  const name = NOTE_NAMES[((semitonesFromRoot % 12) + 12) % 12];
  const octave = 2 + Math.floor(semitonesFromRoot / 12);
  return `${name}${octave}`;
}
