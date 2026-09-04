import React from 'react';
import { EMOTIONS, EMOTION_NODES, EmotionNode } from '../../data/emotions';
import { emotionToColor, emotionToSound, emotionToTaste, emotionToScent } from '../../lib/mappings';
import GeneratedTexture from '../GeneratedTexture';

// A full reference catalog — every ring1 (family), ring2 (category), and
// ring3 (specific word) node on the wheel, each shown with its generated
// texture and its full cross-modal readout (colour/sound/taste/scent),
// grouped by family. Not a "selection" view like the other export tabs —
// a browsable ground-truth of the science behind every single label.

function CatalogCard({ node, big = false }: { node: EmotionNode; big?: boolean }) {
  const color = emotionToColor(node.valence, node.arousal, node.hue, node.dominance);
  const sound = emotionToSound(node.valence, node.arousal, node.dominance);
  const taste = emotionToTaste(node.valence, node.arousal, node.dominance);
  const scent = emotionToScent(node.valence, node.arousal, node.dominance);

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: '4px',
        overflow: 'hidden',
        aspectRatio: big ? '16 / 9' : '4 / 3',
        background: color.gradient,
      }}
    >
      <GeneratedTexture
        nodeId={node.id}
        hue={node.hue}
        valence={node.valence}
        arousal={node.arousal}
        dominance={node.dominance}
        intensity={node.intensity}
        familyId={node.sourceId}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.78) 100%)',
        }}
      />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: big ? '14px 16px' : '8px 10px' }}>
        <div
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: big ? '20px' : '13px',
            color: 'rgba(255,255,255,0.95)',
            lineHeight: 1.15,
            textShadow: '0 1px 8px rgba(0,0,0,0.5)',
          }}
        >
          {node.label}
        </div>
        <div
          style={{
            marginTop: '3px',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 300,
            fontSize: big ? '10px' : '8px',
            letterSpacing: '0.03em',
            color: 'rgba(255,255,255,0.55)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {sound.noteName} {sound.waveformType} · {taste.descriptor} · {scent.descriptor}
        </div>
      </div>
    </div>
  );
}

export default function CatalogExport() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '36px', maxWidth: '1100px', margin: '0 auto' }}>
      {EMOTIONS.map((family) => {
        const root = EMOTION_NODES.find((n) => n.id === family.id)!;
        const descendants = EMOTION_NODES.filter((n) => n.sourceId === family.id && n.intensity !== 'ring1');
        const ring2 = descendants.filter((n) => n.intensity === 'ring2').sort((a, b) => a.label.localeCompare(b.label));
        const ring3 = descendants.filter((n) => n.intensity === 'ring3').sort((a, b) => a.label.localeCompare(b.label));

        return (
          <div key={family.id}>
            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '16px', marginBottom: '14px' }}>
              <CatalogCard node={root} big />
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 300,
                  fontSize: '10px',
                  letterSpacing: '0.08em',
                  color: 'rgba(232,228,222,0.35)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {ring2.length} categories · {ring3.length} specific words
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '8px',
              }}
            >
              {[...ring2, ...ring3].map((node) => (
                <CatalogCard key={node.id} node={node} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
