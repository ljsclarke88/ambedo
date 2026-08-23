import { ChordNote, buildReverb, scheduleChord } from './synthEngine';
import { audioBufferToWav } from './wavEncoder';

const SAMPLE_RATE = 44100;

// Renders the exact same chord graph `playChord` plays live, but on an
// OfflineAudioContext (which runs faster than real time and captures the
// output as a buffer instead of sending it to speakers) — so the WAV file
// you download is identical to what you hear when you press play.
export async function renderSoundscapeToWav(notes: ChordNote[], duration = 6): Promise<Blob> {
  const length = Math.ceil(SAMPLE_RATE * (duration + 1.5));
  const offlineCtx = new OfflineAudioContext(2, length, SAMPLE_RATE);
  const reverb = buildReverb(offlineCtx);
  scheduleChord(offlineCtx, reverb, notes, duration, 0);
  const rendered = await offlineCtx.startRendering();
  return audioBufferToWav(rendered);
}
