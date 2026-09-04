import { EMOTIONS, EMOTION_NODES, EmotionNode } from '../data/emotions';

export interface LexiconGroup {
  id: string;
  label: string;
  angle: number;
  hue: number;
  words: EmotionNode[];
}

// Every word the app can actually be asked for — every ring1 (family),
// ring2 (category), and ring3 (specific word) node, already flattened by
// the data model itself.
export function getSearchableEmotions(): EmotionNode[] {
  return EMOTION_NODES;
}

// Same set, grouped under the 6 core families for browsing — each family's
// ring2 + ring3 descendants, alphabetised. The family's own ring1 entry is
// skipped since it's redundant with the group header.
export function groupLexiconByFamily(): LexiconGroup[] {
  return EMOTIONS.map((family) => {
    const words = EMOTION_NODES
      .filter((n) => n.sourceId === family.id && n.intensity !== 'ring1')
      .slice()
      .sort((a, b) => a.label.localeCompare(b.label));
    return { id: family.id, label: family.label, angle: family.angle, hue: family.hue, words };
  });
}
