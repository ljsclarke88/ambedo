import React, { useRef, useEffect } from 'react';

interface TextureLayerProps {
  hue: number;
  arousal: number;   // 0–1: higher = finer grain + faster refresh
  dominance: number; // 0–1: higher = slightly denser grain
}

export default function TextureLayer({ hue, arousal, dominance }: TextureLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // Grain density scales with arousal and dominance
    const grainOpacity = 0.022 + arousal * 0.018 + dominance * 0.012;
    // How often to regenerate the grain (ms): high arousal = faster churn
    const interval = Math.round(80 + (1 - arousal) * 180);

    let lastRefresh = 0;

    const draw = (timestamp: number) => {
      if (timestamp - lastRefresh >= interval) {
        lastRefresh = timestamp;

        const imageData = ctx.createImageData(W, H);
        const data = imageData.data;

        // Parse the emotion hue into an approximate RGB for tinting
        // Use a simple hsl→rgb approximation for the grain tint
        const r_tint = Math.round(128 + 64 * Math.cos((hue - 0)   * Math.PI / 180));
        const g_tint = Math.round(128 + 64 * Math.cos((hue - 120) * Math.PI / 180));
        const b_tint = Math.round(128 + 64 * Math.cos((hue - 240) * Math.PI / 180));

        for (let i = 0; i < data.length; i += 4) {
          const n = Math.random();
          const alpha = n < grainOpacity ? Math.round(n / grainOpacity * 38) : 0;
          data[i]     = r_tint;
          data[i + 1] = g_tint;
          data[i + 2] = b_tint;
          data[i + 3] = alpha;
        }

        ctx.putImageData(imageData, 0, 0);
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [hue, arousal, dominance]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={600}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        mixBlendMode: 'overlay',
        opacity: 0.45,
      }}
    />
  );
}
