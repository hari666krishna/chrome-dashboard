import { useEffect, useRef } from 'react';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';
import { AnimationIntensity, ThemeMode } from '../../types/dashboard';

interface AtmosphericBackgroundProps {
  theme: ThemeMode;
  animationIntensity: AnimationIntensity;
  particlesEnabled: boolean;
  scanlinesEnabled: boolean;
  flickerEnabled: boolean;
}

interface DustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  phase: number;
  crimsonTint: boolean;
}

export function AtmosphericBackground({
  theme,
  animationIntensity,
  particlesEnabled,
  scanlinesEnabled,
  flickerEnabled,
}: AtmosphericBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prefersReduced = useReducedMotionPreference();

  const isUpsideDown = theme === 'upside-down';
  const effectiveIntensity = prefersReduced ? 'off' : animationIntensity;
  const shouldAnimateParticles =
    isUpsideDown && particlesEnabled && effectiveIntensity !== 'off';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!shouldAnimateParticles) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const count =
      effectiveIntensity === 'intense'
        ? 72
        : effectiveIntensity === 'medium'
          ? 46
          : 26;

    const speedMultiplier =
      effectiveIntensity === 'intense' ? 1.4 : effectiveIntensity === 'medium' ? 1.0 : 0.65;

    const particles: DustParticle[] = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.22 * speedMultiplier,
      vy: (-0.1 - Math.random() * 0.25) * speedMultiplier,
      size: 0.9 + Math.random() * 2.1,
      alpha: 0.14 + Math.random() * 0.36,
      phase: Math.random() * Math.PI * 2,
      crimsonTint: Math.random() < 0.32,
    }));

    let rafId = 0;
    let lastTime = performance.now();

    const render = (now: number) => {
      if (document.hidden) {
        lastTime = now;
        rafId = window.requestAnimationFrame(render);
        return;
      }

      const dt = Math.min(48, now - lastTime) / 16.67;
      lastTime = now;
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.phase += 0.016 * dt;
        p.x += (p.vx + Math.sin(p.phase) * 0.12) * dt;
        p.y += p.vy * dt;

        if (p.y < -12) {
          p.y = height + 12;
          p.x = Math.random() * width;
        }
        if (p.x < -12) p.x = width + 12;
        if (p.x > width + 12) p.x = -12;

        const flickerAlpha = p.alpha * (0.72 + 0.28 * Math.sin(p.phase * 1.7));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        if (p.crimsonTint) {
          ctx.fillStyle = `rgba(230, 57, 70, ${flickerAlpha.toFixed(3)})`;
        } else {
          ctx.fillStyle = `rgba(218, 212, 224, ${(flickerAlpha * 0.7).toFixed(3)})`;
        }
        ctx.fill();
      }

      rafId = window.requestAnimationFrame(render);
    };

    rafId = window.requestAnimationFrame(render);
    window.addEventListener('resize', resize);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [effectiveIntensity, shouldAnimateParticles]);

  const showFlicker = isUpsideDown && flickerEnabled && effectiveIntensity !== 'off';

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden select-none z-0"
    >
      {/* Deep dark base */}
      <div className="absolute inset-0 bg-[#08090D]" />

      {/* Crimson ambient atmosphere */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          background: isUpsideDown
            ? 'radial-gradient(ellipse 70% 45% at 50% -8%, rgba(165, 29, 45, 0.24) 0%, transparent 72%), radial-gradient(circle 520px at 88% 12%, rgba(100, 19, 31, 0.18) 0%, transparent 70%), radial-gradient(circle 540px at 12% 92%, rgba(100, 19, 31, 0.2) 0%, transparent 72%)'
            : 'radial-gradient(ellipse 65% 40% at 50% -10%, rgba(48, 32, 39, 0.2) 0%, transparent 70%)',
        }}
      />

      {/* Animated Upside Down Vines: Top-Left */}
      <div
        className={`absolute top-0 left-0 w-[340px] h-[220px] transition-opacity duration-700 ${
          isUpsideDown ? 'opacity-55' : 'opacity-0'
        } ${effectiveIntensity !== 'off' ? 'animate-vine-sway' : ''}`}
      >
        <svg viewBox="0 0 360 220" fill="none" className="w-full h-full">
          <path
            d="M-10,18 C48,34 86,12 138,48 C184,80 224,52 284,88"
            stroke="#64131F"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <path
            d="M22,-8 C44,52 18,98 62,146 C94,180 128,166 158,196"
            stroke="#A51D2D"
            strokeOpacity="0.45"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M108,36 C126,68 158,92 188,104"
            stroke="#64131F"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Animated Upside Down Vines: Bottom-Right */}
      <div
        className={`absolute bottom-0 right-0 w-[380px] h-[240px] transition-opacity duration-700 ${
          isUpsideDown ? 'opacity-55' : 'opacity-0'
        } ${effectiveIntensity !== 'off' ? 'animate-vine-sway' : ''}`}
      >
        <svg viewBox="0 0 380 240" fill="none" className="w-full h-full">
          <path
            d="M390,210 C328,176 284,202 222,166 C168,134 128,162 72,126"
            stroke="#64131F"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M352,248 C322,188 346,136 296,88 C264,56 232,74 198,42"
            stroke="#A51D2D"
            strokeOpacity="0.45"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Floating Spores Canvas */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 transition-opacity duration-700 ${
          shouldAnimateParticles ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Film Grain */}
      {isUpsideDown && (
        <div className="film-grain absolute inset-0 opacity-[0.045] mix-blend-overlay" />
      )}

      {/* Subtle CRT Scanlines */}
      {isUpsideDown && scanlinesEnabled && (
        <div
          className={`crt-scanlines absolute inset-0 opacity-[0.12] ${
            showFlicker ? 'animate-subtle-flicker' : ''
          }`}
        />
      )}

      {/* Dark edge vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, transparent 52%, rgba(4, 5, 8, 0.72) 100%)',
        }}
      />
    </div>
  );
}
