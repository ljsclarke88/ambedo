import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface InfoPanelProps {
  onDismiss: () => void;
}

export default function InfoPanel({ onDismiss }: InfoPanelProps) {
  return (
    <AnimatePresence>
      <motion.div
        key="info-panel"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          position: 'relative',
          background: 'rgba(255,255,255,0.04)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          padding: '20px 28px',
          maxWidth: '860px',
          margin: '0 auto',
        }}
      >
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          style={{
            position: 'absolute',
            top: '14px',
            right: '18px',
            background: 'none',
            border: 'none',
            color: 'rgba(232,228,222,0.4)',
            fontSize: '18px',
            cursor: 'pointer',
            lineHeight: 1,
            padding: '4px 8px',
          }}
        >
          ×
        </button>

        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 300,
            fontSize: '11px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(232,228,222,0.35)',
            marginBottom: '12px',
          }}
        >
          About crossmodal correspondences
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px 28px',
          }}
        >
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 300,
              fontSize: '12px',
              lineHeight: 1.75,
              color: 'rgba(232,228,222,0.6)',
            }}
          >
            Our senses are not isolated. Research by Spence (2011) demonstrates systematic
            "crossmodal correspondences" — non-arbitrary mappings between features in one
            sensory modality and features in another — linking pitch, colour, shape, taste, and
            emotion into a coherent perceptual space.{' '}
            <span style={{ color: 'rgba(232,228,222,0.35)', fontSize: '10px' }}>
              Spence, C. (2011). Crossmodal correspondences: A tutorial review.{' '}
              <em>Attention, Perception, &amp; Psychophysics</em>, 73(4), 971-995.
            </span>
          </p>

          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 300,
              fontSize: '12px',
              lineHeight: 1.75,
              color: 'rgba(232,228,222,0.6)',
            }}
          >
            Taste and pitch share a common axis: Crisinel &amp; Spence (2010) found that even
            non-synesthetes reliably map high-pitched tones to sweet and sour flavours, and
            low-pitched tones to bitter ones. Köhler's (1929) bouba/kiki effect — confirmed
            across cultures by Ramachandran &amp; Hubbard (2001) — shows that soft rounded sounds
            feel round, and sharp jagged sounds feel angular.{' '}
            <span style={{ color: 'rgba(232,228,222,0.35)', fontSize: '10px' }}>
              Crisinel &amp; Spence (2010).{' '}
              <em>Perception &amp; Psychophysics</em>, 72(7), 1994-2002.
            </span>
          </p>

          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 300,
              fontSize: '12px',
              lineHeight: 1.75,
              color: 'rgba(232,228,222,0.6)',
            }}
          >
            Colour and emotion form equally reliable cross-cultural bonds. Jonauskaite et al.
            (2023) surveyed 4,598 participants across 47 countries and found strong universal
            associations — yellow with joy, blue with sadness, red with anger — alongside
            cultural nuances. Ambedo layers all these correspondences into a single navigable
            wheel rooted in Russell's (1980) circumplex model of affect.{' '}
            <span style={{ color: 'rgba(232,228,222,0.35)', fontSize: '10px' }}>
              Jonauskaite et al. (2023).{' '}
              <em>Psychological Science</em>.
            </span>
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
