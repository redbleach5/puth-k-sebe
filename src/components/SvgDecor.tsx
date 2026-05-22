"use client";

// ─── Relaxing SVG Decorative Components ──────────────────────────────────────
// Minimalist, meditative SVG elements that fill space and create atmosphere
// without distracting from content.

/** Soft flowing wave — placed at bottom of screens */
export function WaveBottom({ color = "#C9A96E", opacity = 0.06 }: { color?: string; opacity?: number }) {
  return (
    <svg
      className="absolute bottom-0 left-0 right-0 w-full pointer-events-none"
      viewBox="0 0 1440 180"
      preserveAspectRatio="none"
      style={{ opacity }}
    >
      <path
        d="M0,80 C360,160 720,0 1080,80 C1260,120 1380,60 1440,80 L1440,180 L0,180 Z"
        fill={color}
      />
    </svg>
  );
}

/** Soft flowing wave — placed at top of screens */
export function WaveTop({ color = "#7A8B6F", opacity = 0.05 }: { color?: string; opacity?: number }) {
  return (
    <svg
      className="absolute top-0 left-0 right-0 w-full pointer-events-none"
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      style={{ opacity }}
    >
      <path
        d="M0,40 C240,100 480,0 720,40 C960,80 1200,10 1440,40 L1440,0 L0,0 Z"
        fill={color}
      />
    </svg>
  );
}

/** Minimalist mandala ring — decorative accent */
export function MandalaRing({
  size = 200,
  color = "#C9A96E",
  opacity = 0.07,
  className = "",
}: {
  size?: number;
  color?: string;
  opacity?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={`pointer-events-none ${className}`}
      style={{ opacity }}
    >
      <circle cx="100" cy="100" r="90" fill="none" stroke={color} strokeWidth="0.8" />
      <circle cx="100" cy="100" r="70" fill="none" stroke={color} strokeWidth="0.5" />
      <circle cx="100" cy="100" r="50" fill="none" stroke={color} strokeWidth="0.3" />
      {/* Petals */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <line
          key={i}
          x1="100"
          y1="10"
          x2="100"
          y2="190"
          stroke={color}
          strokeWidth="0.3"
          transform={`rotate(${angle} 100 100)`}
        />
      ))}
      {/* Dots at intersections */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <circle
          key={`d${i}`}
          cx="100"
          cy="30"
          r="2"
          fill={color}
          transform={`rotate(${angle} 100 100)`}
        />
      ))}
    </svg>
  );
}

/** Flowing curves — organic background element */
export function FlowingCurves({
  color = "#C9A96E",
  opacity = 0.04,
  className = "",
}: {
  color?: string;
  opacity?: number;
  className?: string;
}) {
  return (
    <svg
      className={`pointer-events-none ${className}`}
      viewBox="0 0 400 600"
      preserveAspectRatio="none"
      style={{ opacity }}
    >
      <path
        d="M350,0 C380,100 300,200 340,300 C380,400 280,500 350,600"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
      />
      <path
        d="M380,0 C350,120 320,180 360,280 C400,380 300,480 370,600"
        fill="none"
        stroke={color}
        strokeWidth="0.8"
      />
      <path
        d="M320,0 C280,80 340,160 300,260 C260,360 330,460 290,600"
        fill="none"
        stroke={color}
        strokeWidth="0.5"
      />
    </svg>
  );
}

/** Lotus-like SVG for breathing screen */
export function LotusSVG({
  size = 120,
  color = "#C9A96E",
  opacity = 0.12,
  className = "",
}: {
  size?: number;
  color?: string;
  opacity?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={`pointer-events-none ${className}`}
      style={{ opacity }}
    >
      {/* Center */}
      <circle cx="60" cy="60" r="8" fill={color} opacity="0.4" />
      {/* Petals */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <ellipse
          key={i}
          cx="60"
          cy="30"
          rx="8"
          ry="22"
          fill="none"
          stroke={color}
          strokeWidth="0.8"
          transform={`rotate(${angle} 60 60)`}
        />
      ))}
      {/* Outer petals */}
      {[30, 90, 150, 210, 270, 330].map((angle, i) => (
        <ellipse
          key={`o${i}`}
          cx="60"
          cy="25"
          rx="5"
          ry="18"
          fill="none"
          stroke={color}
          strokeWidth="0.5"
          transform={`rotate(${angle} 60 60)`}
        />
      ))}
    </svg>
  );
}

/** Leaf/branch accent — nature motif */
export function LeafAccent({
  color = "#7A8B6F",
  opacity = 0.08,
  className = "",
}: {
  color?: string;
  opacity?: number;
  className?: string;
}) {
  return (
    <svg
      className={`pointer-events-none ${className}`}
      viewBox="0 0 80 160"
      style={{ opacity }}
    >
      {/* Stem */}
      <path d="M40,0 C40,40 35,80 40,160" fill="none" stroke={color} strokeWidth="1" />
      {/* Leaves */}
      <path d="M40,30 C55,20 60,35 45,40" fill={color} opacity="0.5" />
      <path d="M40,60 C25,50 20,65 35,70" fill={color} opacity="0.4" />
      <path d="M40,90 C55,80 60,95 45,100" fill={color} opacity="0.3" />
      <path d="M40,120 C25,110 20,125 35,130" fill={color} opacity="0.2" />
    </svg>
  );
}

/** Concentric ripples — for breathing section header */
export function Ripples({
  size = 80,
  color = "#C9A96E",
  opacity = 0.08,
  className = "",
}: {
  size?: number;
  color?: string;
  opacity?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      className={`pointer-events-none ${className}`}
      style={{ opacity }}
    >
      <circle cx="40" cy="40" r="35" fill="none" stroke={color} strokeWidth="0.5" />
      <circle cx="40" cy="40" r="25" fill="none" stroke={color} strokeWidth="0.4" />
      <circle cx="40" cy="40" r="15" fill="none" stroke={color} strokeWidth="0.3" />
      <circle cx="40" cy="40" r="5" fill={color} opacity="0.3" />
    </svg>
  );
}

/** Horizontal decorative divider with SVG */
export function SvgDivider({ color = "#C9A96E", opacity = 0.15 }: { color?: string; opacity?: number }) {
  return (
    <svg className="w-full h-3 pointer-events-none" viewBox="0 0 200 3" preserveAspectRatio="none" style={{ opacity }}>
      <line x1="0" y1="1.5" x2="200" y2="1.5" stroke={color} strokeWidth="0.5" strokeDasharray="4 6" />
    </svg>
  );
}

/** Moon phases — decorative accent for evening screens */
export function MoonPhases({
  size = 60,
  color = "#C9A96E",
  opacity = 0.06,
  className = "",
}: {
  size?: number;
  color?: string;
  opacity?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      className={`pointer-events-none ${className}`}
      style={{ opacity }}
    >
      <circle cx="20" cy="30" r="10" fill="none" stroke={color} strokeWidth="0.8" />
      <circle cx="30" cy="30" r="10" fill={color} opacity="0.3" />
      <circle cx="25" cy="30" r="10" fill="none" stroke={color} strokeWidth="0.5" />
      <circle cx="40" cy="30" r="8" fill="none" stroke={color} strokeWidth="0.8" />
      <path d="M40,22 A8,8 0 0,1 40,38" fill={color} opacity="0.2" />
    </svg>
  );
}
