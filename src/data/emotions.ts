export type IntensityLevel = 'low' | 'mid' | 'high';

export interface EmotionVariant {
  label: string;
  valence: number;  // -1 to 1
  arousal: number;  // 0 to 1
}

export interface PrimaryEmotion {
  id: string;
  label: string;
  hue: number;           // 0-360, Plutchik's color association
  angle: number;         // center angle in degrees (0 = right, clockwise)
  low: EmotionVariant;   // mildest intensity
  mid: EmotionVariant;   // primary/mid intensity
  high: EmotionVariant;  // most intense
}

export interface Dyad {
  id: string;
  label: string;
  between: [string, string];  // ids of the two adjacent emotions
  angle: number;              // center angle in degrees (midpoint of seam)
  valence: number;
  arousal: number;
}

export const EMOTIONS: PrimaryEmotion[] = [
  {
    id: 'joy',
    label: 'Joy',
    hue: 55,
    angle: -90,
    low: { label: 'serenity', valence: 0.70, arousal: 0.25 },
    mid: { label: 'joy', valence: 0.88, arousal: 0.60 },
    high: { label: 'ecstasy', valence: 0.98, arousal: 0.92 },
  },
  {
    id: 'trust',
    label: 'Trust',
    hue: 110,
    angle: -45,
    low: { label: 'acceptance', valence: 0.50, arousal: 0.18 },
    mid: { label: 'trust', valence: 0.62, arousal: 0.32 },
    high: { label: 'admiration', valence: 0.75, arousal: 0.52 },
  },
  {
    id: 'fear',
    label: 'Fear',
    hue: 82,
    angle: 0,
    low: { label: 'apprehension', valence: -0.38, arousal: 0.48 },
    mid: { label: 'fear', valence: -0.72, arousal: 0.78 },
    high: { label: 'terror', valence: -0.92, arousal: 0.96 },
  },
  {
    id: 'surprise',
    label: 'Surprise',
    hue: 185,
    angle: 45,
    low: { label: 'distraction', valence: 0.08, arousal: 0.45 },
    mid: { label: 'surprise', valence: 0.20, arousal: 0.82 },
    high: { label: 'amazement', valence: 0.28, arousal: 0.96 },
  },
  {
    id: 'sadness',
    label: 'Sadness',
    hue: 220,
    angle: 90,
    low: { label: 'pensiveness', valence: -0.52, arousal: 0.18 },
    mid: { label: 'sadness', valence: -0.78, arousal: 0.28 },
    high: { label: 'grief', valence: -0.96, arousal: 0.38 },
  },
  {
    id: 'disgust',
    label: 'Disgust',
    hue: 285,
    angle: 135,
    low: { label: 'boredom', valence: -0.42, arousal: 0.12 },
    mid: { label: 'disgust', valence: -0.72, arousal: 0.48 },
    high: { label: 'loathing', valence: -0.94, arousal: 0.68 },
  },
  {
    id: 'anger',
    label: 'Anger',
    hue: 5,
    angle: 180,
    low: { label: 'annoyance', valence: -0.42, arousal: 0.48 },
    mid: { label: 'anger', valence: -0.72, arousal: 0.82 },
    high: { label: 'rage', valence: -0.92, arousal: 0.98 },
  },
  {
    id: 'anticipation',
    label: 'Anticipation',
    hue: 32,
    angle: 225,
    low: { label: 'interest', valence: 0.38, arousal: 0.38 },
    mid: { label: 'anticipation', valence: 0.52, arousal: 0.65 },
    high: { label: 'vigilance', valence: 0.62, arousal: 0.86 },
  },
];

export const DYADS: Dyad[] = [
  {
    id: 'love',
    label: 'Love',
    between: ['joy', 'trust'],
    angle: -67.5,
    valence: 0.75,
    arousal: 0.45,
  },
  {
    id: 'submission',
    label: 'Submission',
    between: ['trust', 'fear'],
    angle: -22.5,
    valence: -0.05,
    arousal: 0.55,
  },
  {
    id: 'awe',
    label: 'Awe',
    between: ['fear', 'surprise'],
    angle: 22.5,
    valence: -0.25,
    arousal: 0.87,
  },
  {
    id: 'disapproval',
    label: 'Disapproval',
    between: ['surprise', 'sadness'],
    angle: 67.5,
    valence: -0.45,
    arousal: 0.55,
  },
  {
    id: 'remorse',
    label: 'Remorse',
    between: ['sadness', 'disgust'],
    angle: 112.5,
    valence: -0.85,
    arousal: 0.33,
  },
  {
    id: 'contempt',
    label: 'Contempt',
    between: ['disgust', 'anger'],
    angle: 157.5,
    valence: -0.80,
    arousal: 0.65,
  },
  {
    id: 'aggressiveness',
    label: 'Aggressiveness',
    between: ['anger', 'anticipation'],
    angle: 202.5,
    valence: -0.30,
    arousal: 0.83,
  },
  {
    id: 'optimism',
    label: 'Optimism',
    between: ['anticipation', 'joy'],
    angle: 247.5,
    valence: 0.72,
    arousal: 0.62,
  },
];

export const NEUTRAL: EmotionVariant = { label: 'neutral', valence: 0, arousal: 0.3 };
