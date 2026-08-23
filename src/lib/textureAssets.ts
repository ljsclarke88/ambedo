import joyLow from '../assets/textures/nodes/joy-low.jpg';
import joyMid from '../assets/textures/nodes/joy-mid.jpg';
import joyHigh from '../assets/textures/nodes/joy-high.jpg';
import trustLow from '../assets/textures/nodes/trust-low.jpg';
import trustMid from '../assets/textures/nodes/trust-mid.jpg';
import trustHigh from '../assets/textures/nodes/trust-high.jpg';
import fearLow from '../assets/textures/nodes/fear-low.jpg';
import fearMid from '../assets/textures/nodes/fear-mid.jpg';
import fearHigh from '../assets/textures/nodes/fear-high.jpg';
import surpriseLow from '../assets/textures/nodes/surprise-low.jpg';
import surpriseMid from '../assets/textures/nodes/surprise-mid.jpg';
import surpriseHigh from '../assets/textures/nodes/surprise-high.jpg';
import sadnessLow from '../assets/textures/nodes/sadness-low.jpg';
import sadnessMid from '../assets/textures/nodes/sadness-mid.jpg';
import sadnessHigh from '../assets/textures/nodes/sadness-high.jpg';
import disgustLow from '../assets/textures/nodes/disgust-low.jpg';
import disgustMid from '../assets/textures/nodes/disgust-mid.jpg';
import disgustHigh from '../assets/textures/nodes/disgust-high.jpg';
import angerLow from '../assets/textures/nodes/anger-low.jpg';
import angerMid from '../assets/textures/nodes/anger-mid.jpg';
import angerHigh from '../assets/textures/nodes/anger-high.jpg';
import anticipationLow from '../assets/textures/nodes/anticipation-low.jpg';
import anticipationMid from '../assets/textures/nodes/anticipation-mid.jpg';
import anticipationHigh from '../assets/textures/nodes/anticipation-high.jpg';

// One generated texture per primary emotion-wheel node (8 branches × 3
// intensities = 24 "sections"). Each was prompted from that node's own
// computed cross-modal science — not just colour, but frequency (grain
// scale/detail density), waveform (smooth-sine vs jagged-sawtooth edges),
// geometry (curvature/spikiness → rounded vs fractured forms), motion
// (duration/amplitude → calm drift vs explosive turbulence), taste (surface
// quality: glossy/matte/dry), and scent (atmosphere: airy/hazy/mineral) —
// see the brief computed in dev notes from src/lib/mappings.ts's own
// emotionToColor/Sound/Taste/Scent/Geometry/Motion functions. So the image
// itself is a rendering of the same science the rest of the app already
// derives, not a separate decorative layer.
export const NODE_TEXTURES: Record<string, string> = {
  'joy-low': joyLow,
  'joy-mid': joyMid,
  'joy-high': joyHigh,
  'trust-low': trustLow,
  'trust-mid': trustMid,
  'trust-high': trustHigh,
  'fear-low': fearLow,
  'fear-mid': fearMid,
  'fear-high': fearHigh,
  'surprise-low': surpriseLow,
  'surprise-mid': surpriseMid,
  'surprise-high': surpriseHigh,
  'sadness-low': sadnessLow,
  'sadness-mid': sadnessMid,
  'sadness-high': sadnessHigh,
  'disgust-low': disgustLow,
  'disgust-mid': disgustMid,
  'disgust-high': disgustHigh,
  'anger-low': angerLow,
  'anger-mid': angerMid,
  'anger-high': angerHigh,
  'anticipation-low': anticipationLow,
  'anticipation-mid': anticipationMid,
  'anticipation-high': anticipationHigh,
};
