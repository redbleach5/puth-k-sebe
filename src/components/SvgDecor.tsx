"use client";

// ─── Relaxing SVG Decorative Components ──────────────────────────────────────
// Minimalist, meditative SVG elements that fill space and create atmosphere
// without distracting from content.

/** Soft flowing wave — placed at bottom of screens */
export function WaveBottom({ color = "#C9A96E", opacity = 0.12 }: { color?: string; opacity?: number }) {
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
export function WaveTop({ color = "#7A8B6F", opacity = 0.10 }: { color?: string; opacity?: number }) {
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
  opacity = 0.18,
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
  opacity = 0.14,
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
  opacity = 0.14,
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

/** Zen garden sand lines — relaxing horizontal pattern */
export function ZenLines({
  color = "#C9A96E",
  opacity = 0.06,
  className = "",
}: {
  color?: string;
  opacity?: number;
  className?: string;
}) {
  return (
    <svg
      className={`pointer-events-none ${className}`}
      viewBox="0 0 200 400"
      preserveAspectRatio="none"
      style={{ opacity }}
    >
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
        <path
          key={i}
          d={`M0,${30 + i * 32} C50,${26 + i * 32} 80,${34 + i * 32} 120,${30 + i * 32} C160,${26 + i * 32} 180,${34 + i * 32} 200,${30 + i * 32}`}
          fill="none"
          stroke={color}
          strokeWidth="0.5"
          opacity={0.4 + (i % 3) * 0.15}
        />
      ))}
    </svg>
  );
}

/** Concentric circles pattern — expands like ripples in water */
export function WaterRipples({
  size = 300,
  color = "#7A8B6F",
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
      viewBox="0 0 300 300"
      className={`pointer-events-none ${className}`}
      style={{ opacity }}
    >
      {[40, 65, 90, 115, 140].map((r, i) => (
        <circle
          key={i}
          cx="150"
          cy="150"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={0.8 - i * 0.1}
          strokeDasharray={i % 2 === 0 ? "4 8" : "none"}
        />
      ))}
      <circle cx="150" cy="150" r="8" fill={color} opacity="0.15" />
    </svg>
  );
}

/** Abstract landscape silhouette — mountains/hills for horizon feel */
export function MountainSilhouette({
  color = "#8B7D6B",
  opacity = 0.05,
  className = "",
}: {
  color?: string;
  opacity?: number;
  className?: string;
}) {
  return (
    <svg
      className={`pointer-events-none ${className}`}
      viewBox="0 0 1200 200"
      preserveAspectRatio="none"
      style={{ opacity }}
    >
      <path
        d="M0,200 L0,120 C100,80 200,100 300,70 C400,40 450,60 550,50 C650,40 700,70 800,55 C900,40 1000,80 1100,65 C1150,58 1180,70 1200,60 L1200,200 Z"
        fill={color}
      />
      <path
        d="M0,200 L0,140 C150,110 250,130 400,100 C550,70 600,90 750,80 C900,70 1000,100 1200,90 L1200,200 Z"
        fill={color}
        opacity="0.5"
      />
    </svg>
  );
}

/** Sacred geometry — overlapping circles forming flower of life pattern */
export function SacredGeometry({
  size = 250,
  color = "#C9A96E",
  opacity = 0.05,
  className = "",
}: {
  size?: number;
  color?: string;
  opacity?: number;
  className?: string;
}) {
  const cx = 125;
  const cy = 125;
  const r = 40;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 250 250"
      className={`pointer-events-none ${className}`}
      style={{ opacity }}
    >
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="0.5" />
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const nx = cx + r * Math.cos(rad);
        const ny = cy + r * Math.sin(rad);
        return (
          <circle key={i} cx={nx} cy={ny} r={r} fill="none" stroke={color} strokeWidth="0.4" />
        );
      })}
      <circle cx={cx} cy={cy} r={r * 2} fill="none" stroke={color} strokeWidth="0.3" />
    </svg>
  );
}

/** Dot grid — subtle pointillism background */
export function DotGrid({
  color = "#C9A96E",
  opacity = 0.08,
  className = "",
}: {
  color?: string;
  opacity?: number;
  className?: string;
}) {
  const dots: { x: number; y: number; r: number }[] = [];
  for (let row = 0; row < 12; row++) {
    for (let col = 0; col < 8; col++) {
      dots.push({ x: 25 + col * 50, y: 25 + row * 50, r: 0.8 + Math.random() * 0.8 });
    }
  }
  return (
    <svg
      className={`pointer-events-none ${className}`}
      viewBox="0 0 400 600"
      style={{ opacity }}
    >
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={color} />
      ))}
    </svg>
  );
}

/** Organic blob — soft amoeba-like shape for atmosphere */
export function OrganicBlob({
  color = "#7A8B6F",
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
      viewBox="0 0 400 400"
      style={{ opacity }}
    >
      <path
        d="M200,50 C280,30 350,100 360,180 C370,260 330,340 260,360 C190,380 100,350 60,280 C20,210 40,120 100,70 C140,40 170,55 200,50 Z"
        fill={color}
      />
    </svg>
  );
}
