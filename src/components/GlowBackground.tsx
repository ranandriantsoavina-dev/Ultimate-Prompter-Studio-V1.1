import React, { useEffect, useRef } from 'react';

interface GlowBackgroundProps {
  nsfwOn: boolean;
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

const ORANGE_PALETTE: { primary: RGB; secondary: RGB; tertiary: RGB } = {
  primary: { r: 255, g: 102, b: 0 },
  secondary: { r: 255, g: 140, b: 30 },
  tertiary: { r: 220, g: 65, b: 0 }
};

const RED_PALETTE: { primary: RGB; secondary: RGB; tertiary: RGB } = {
  primary: { r: 245, g: 25, b: 45 },
  secondary: { r: 255, g: 60, b: 80 },
  tertiary: { r: 190, g: 15, b: 35 }
};

export const GlowBackground: React.FC<GlowBackgroundProps> = ({ nsfwOn }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nsfwRef = useRef(nsfwOn);
  nsfwRef.current = nsfwOn;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Current interpolated RGB colors
    const currentPrimary = { ...(nsfwOn ? RED_PALETTE.primary : ORANGE_PALETTE.primary) };
    const currentSecondary = { ...(nsfwOn ? RED_PALETTE.secondary : ORANGE_PALETTE.secondary) };
    const currentTertiary = { ...(nsfwOn ? RED_PALETTE.tertiary : ORANGE_PALETTE.tertiary) };

    const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

    let t = 0;

    const render = () => {
      t += 0.008;

      // Smooth color transition (glide over ~500ms)
      const targetPalette = nsfwRef.current ? RED_PALETTE : ORANGE_PALETTE;
      const speed = 0.045;

      currentPrimary.r = lerp(currentPrimary.r, targetPalette.primary.r, speed);
      currentPrimary.g = lerp(currentPrimary.g, targetPalette.primary.g, speed);
      currentPrimary.b = lerp(currentPrimary.b, targetPalette.primary.b, speed);

      currentSecondary.r = lerp(currentSecondary.r, targetPalette.secondary.r, speed);
      currentSecondary.g = lerp(currentSecondary.g, targetPalette.secondary.g, speed);
      currentSecondary.b = lerp(currentSecondary.b, targetPalette.secondary.b, speed);

      currentTertiary.r = lerp(currentTertiary.r, targetPalette.tertiary.r, speed);
      currentTertiary.g = lerp(currentTertiary.g, targetPalette.tertiary.g, speed);
      currentTertiary.b = lerp(currentTertiary.b, targetPalette.tertiary.b, speed);

      // Clear with base pitch black
      ctx.fillStyle = '#07070a';
      ctx.fillRect(0, 0, width, height);

      // Node 1: Top-Left moving orb
      const x1 = width * (0.22 + Math.sin(t * 0.7) * 0.14);
      const y1 = height * (0.28 + Math.cos(t * 0.5) * 0.14);
      const r1 = Math.max(width, height) * 0.42;

      const grad1 = ctx.createRadialGradient(x1, y1, 0, x1, y1, r1);
      grad1.addColorStop(
        0,
        `rgba(${Math.round(currentPrimary.r)}, ${Math.round(currentPrimary.g)}, ${Math.round(currentPrimary.b)}, 0.22)`
      );
      grad1.addColorStop(
        0.5,
        `rgba(${Math.round(currentPrimary.r)}, ${Math.round(currentPrimary.g)}, ${Math.round(currentPrimary.b)}, 0.07)`
      );
      grad1.addColorStop(1, 'rgba(7, 7, 10, 0)');

      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      // Node 2: Bottom-Right moving orb
      const x2 = width * (0.76 + Math.cos(t * 0.6) * 0.15);
      const y2 = height * (0.72 + Math.sin(t * 0.8) * 0.15);
      const r2 = Math.max(width, height) * 0.46;

      const grad2 = ctx.createRadialGradient(x2, y2, 0, x2, y2, r2);
      grad2.addColorStop(
        0,
        `rgba(${Math.round(currentSecondary.r)}, ${Math.round(currentSecondary.g)}, ${Math.round(currentSecondary.b)}, 0.18)`
      );
      grad2.addColorStop(
        0.55,
        `rgba(${Math.round(currentSecondary.r)}, ${Math.round(currentSecondary.g)}, ${Math.round(currentSecondary.b)}, 0.05)`
      );
      grad2.addColorStop(1, 'rgba(7, 7, 10, 0)');

      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      // Node 3: Center floating ambient light
      const x3 = width * (0.50 + Math.sin(t * 0.9 + 1.2) * 0.18);
      const y3 = height * (0.45 + Math.cos(t * 0.65 + 0.8) * 0.14);
      const r3 = Math.max(width, height) * 0.35;

      const grad3 = ctx.createRadialGradient(x3, y3, 0, x3, y3, r3);
      grad3.addColorStop(
        0,
        `rgba(${Math.round(currentTertiary.r)}, ${Math.round(currentTertiary.g)}, ${Math.round(currentTertiary.b)}, 0.14)`
      );
      grad3.addColorStop(1, 'rgba(7, 7, 10, 0)');

      ctx.fillStyle = grad3;
      ctx.fillRect(0, 0, width, height);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-700"
      aria-hidden="true"
    />
  );
};
