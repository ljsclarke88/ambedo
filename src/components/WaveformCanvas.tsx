import React, { useRef, useEffect } from 'react';

interface WaveformCanvasProps {
  frequency: number;
  waveType: 'sine' | 'triangle' | 'sawtooth';
  color: string;
  width?: number;
  height?: number;
}

export default function WaveformCanvas({
  frequency,
  waveType,
  color,
  width = 400,
  height = 80,
}: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const phaseRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const phaseIncrement = (frequency / 880) * 0.08;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;

      const amplitude = height * 0.35;
      const midY = height / 2;
      const cycles = 3; // number of full waveform cycles across canvas

      for (let x = 0; x <= width; x++) {
        const t = (x / width) * cycles * Math.PI * 2 + phaseRef.current;
        let y: number;

        if (waveType === 'sine') {
          y = midY + amplitude * Math.sin(t);
        } else if (waveType === 'triangle') {
          // triangle wave via arcsin approach
          const normalized = ((t / (Math.PI * 2)) % 1 + 1) % 1;
          y = midY + amplitude * (normalized < 0.5 ? 4 * normalized - 1 : 3 - 4 * normalized);
        } else {
          // sawtooth
          const normalized = ((t / (Math.PI * 2)) % 1 + 1) % 1;
          y = midY + amplitude * (2 * normalized - 1);
        }

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
      phaseRef.current += phaseIncrement;
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [frequency, waveType, color, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ display: 'block', width: '100%', height: `${height}px` }}
    />
  );
}
