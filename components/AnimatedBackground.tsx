"use client";

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

export interface AnimatedBackgroundProps {
  effect: string;
  primary: string;
  secondary: string;
  accent: string;
}

/**
 * Premium animated slide backgrounds — pure CSS/SVG, deterministic per effect.
 * Rendered behind slide content; no interaction or JS animation loops needed.
 */
export function AnimatedBackground({ effect, primary, secondary, accent }: AnimatedBackgroundProps) {
  const rnd = mulberry32(hashStr(effect));

  if (effect === "blobs") {
    const colors = [primary, secondary, accent, primary, secondary];
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {colors.map((c, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${8 + rnd() * 70}%`,
              top: `${8 + rnd() * 70}%`,
              width: 180 + rnd() * 260,
              height: 180 + rnd() * 260,
              background: `${c}${[35, 30, 28, 32, 26][i]}`,
              filter: "blur(70px)",
              animation: `bg-blob ${9 + rnd() * 8}s ease-in-out ${rnd() * 4}s infinite`,
            }}
          />
        ))}
      </div>
    );
  }

  if (effect === "particles" || effect === "stars") {
    const count = effect === "stars" ? 26 : 18;
    const colors = effect === "stars" ? [primary, "#ffffff", secondary] : [primary, secondary, accent, "#ffffff"];
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${rnd() * 100}%`,
              top: `${rnd() * 100}%`,
              width: effect === "stars" ? 2 + rnd() * 2.5 : 3 + rnd() * 3,
              height: effect === "stars" ? 2 + rnd() * 2.5 : 3 + rnd() * 3,
              background: colors[i % colors.length],
              boxShadow: effect === "stars" ? `0 0 6px ${colors[i % colors.length]}` : "none",
              opacity: effect === "stars" ? 0.5 : 0.8,
              animation:
                effect === "stars"
                  ? `bg-twinkle ${2.4 + rnd() * 3.6}s ease-in-out ${rnd() * 4}s infinite`
                  : `bg-particle ${8 + rnd() * 9}s linear ${rnd() * 10}s infinite`,
            }}
          />
        ))}
      </div>
    );
  }

  if (effect === "waves") {
    const wavePath = (y: number, amp: number, step: number) => {
      let d = `M 0 ${y}`;
      for (let x = 0; x < 1600; x += 100) {
        const offset = ((x / step) % 2 === 0 ? -1 : 1) * amp;
        d += ` Q ${x + 50} ${y + offset} ${x + 100} ${y}`;
      }
      return d;
    };
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <svg className="absolute bottom-0 left-0 h-64 w-[200%] bg-wave" preserveAspectRatio="none" viewBox="0 0 1600 300">
          <path d={wavePath(200, 46, 100)} fill="none" stroke={primary} strokeOpacity={0.35} strokeWidth={22} />
          <path d={wavePath(240, 30, 60)} fill="none" stroke={secondary} strokeOpacity={0.28} strokeWidth={16} />
        </svg>
      </div>
    );
  }

  if (effect === "neural") {
    const nodes = Array.from({ length: 14 }).map(() => ({
      x: 6 + rnd() * 88,
      y: 6 + rnd() * 84,
      r: 2.2 + rnd() * 2.8,
    }));
    const lines: { x1: number; y1: number; x2: number; y2: number; d: number }[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = (nodes[i].x - nodes[j].x) * 12.8;
        const dy = (nodes[i].y - nodes[j].y) * 7.2;
        if (dx * dx + dy * dy < 2800) lines.push({ x1: nodes[i].x, y1: nodes[i].y, x2: nodes[j].x, y2: nodes[j].y, d: rnd() * 4 });
      }
    }
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {lines.map((l, i) => (
            <line
              key={i}
              x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke={i % 2 ? secondary : primary}
              strokeOpacity={0.16}
              strokeWidth={0.22}
              style={{ animation: `bg-pulse ${3 + l.d}s ease-in-out ${l.d}s infinite` }}
            />
          ))}
          {nodes.map((n, i) => (
            <circle
              key={i}
              cx={n.x} cy={n.y} r={n.r}
              fill={i % 3 === 0 ? accent : i % 2 ? secondary : primary}
              fillOpacity={0.55}
              style={{ animation: `bg-twinkle ${2.6 + rnd() * 3}s ease-in-out ${rnd() * 4}s infinite` }}
            />
          ))}
        </svg>
      </div>
    );
  }

  if (effect === "ribbon") {
    const path = (o: number) =>
      `M 0 ${180 + o} C 300 ${60 + o}, 500 ${340 + o}, 800 ${140 + o} C 1050 -20 + ${o}, 1180 ${280 + o}, 1280 ${180 + o}`;
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <svg className="absolute inset-0 h-full w-full bg-ribbon" viewBox="0 0 1280 720" preserveAspectRatio="none">
          <path d={path(0)} fill="none" stroke={primary} strokeOpacity={0.3} strokeWidth={90} strokeLinecap="round" />
          <path d={path(60)} fill="none" stroke={secondary} strokeOpacity={0.22} strokeWidth={70} strokeLinecap="round" />
          <path d={path(-40)} fill="none" stroke={accent} strokeOpacity={0.18} strokeWidth={55} strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (effect === "noise") {
    return (
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{
          background: "repeating-conic-gradient(rgba(255,255,255,0.05) 0% 1.2%, transparent 1.2% 2.6%) 0 0/120px 120px",
          animation: "bg-noise 2.6s steps(6) infinite",
        }}
      />
    );
  }

  if (effect === "aurora-drift") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -inset-1/2"
          style={{
            background: `radial-gradient(40% 40% at 30% 30%, ${primary}55 0px, transparent 60%), radial-gradient(40% 40% at 70% 60%, ${secondary}4d 0px, transparent 60%), radial-gradient(35% 35% at 50% 85%, ${accent}40 0px, transparent 60%)`,
            animation: "bg-aurora 18s ease-in-out infinite alternate",
          }}
        />
      </div>
    );
  }

  if (effect === "geometric-grid" || effect === "cyber-glow") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(to right, ${primary}20 1px, transparent 1px), linear-gradient(to bottom, ${primary}20 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle 500px at 50% 50%, ${secondary}30, transparent 80%)`,
          }}
        />
      </div>
    );
  }

  if (effect === "glass-orbs") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-20 -top-20 h-96 w-96 rounded-full blur-3xl"
          style={{ background: `${primary}40` }}
        />
        <div
          className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full blur-3xl"
          style={{ background: `${secondary}35` }}
        />
        <div
          className="absolute top-1/2 left-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{ background: `${accent}25` }}
        />
      </div>
    );
  }

  if (effect === "glowing-constellations") {
    const points = [
      { x: "15%", y: "20%" },
      { x: "35%", y: "60%" },
      { x: "65%", y: "25%" },
      { x: "85%", y: "70%" },
      { x: "50%", y: "80%" },
    ];
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {points.map((p, idx) => (
          <div
            key={idx}
            className="absolute h-3 w-3 rounded-full"
            style={{
              left: p.x,
              top: p.y,
              background: idx % 2 === 0 ? primary : accent,
              boxShadow: `0 0 16px 4px ${idx % 2 === 0 ? primary : accent}`,
              animation: `bg-twinkle ${3 + idx}s ease-in-out infinite alternate`,
            }}
          />
        ))}
      </div>
    );
  }

  // ── Haikei-style generative scenes (Phase 3) ──────────────────────
  if (effect === "blob-morph") {
    const blobs = Array.from({ length: 4 }).map(() => ({
      size: 220 + rnd() * 360,
      x: 5 + rnd() * 70,
      y: 5 + rnd() * 70,
      c: [primary, secondary, accent][Math.floor(rnd() * 3)],
      delay: rnd() * 6,
      dur: 14 + rnd() * 10,
    }));
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {blobs.map((b, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: b.size,
              height: b.size,
              background: `radial-gradient(circle at 30% 30%, ${b.c}aa, ${b.c}33 70%)`,
              filter: "blur(30px)",
              animation: `bg-blob-morph ${b.dur}s ease-in-out ${b.delay}s infinite`,
            }}
          />
        ))}
      </div>
    );
  }

  if (effect === "layered-waves") {
    const wave = (color: string, opacity: number, top: string) => (
      <svg
        className="absolute w-[200%]"
        style={{ top, animation: "bg-wave-drift 16s linear infinite" }}
        viewBox="0 0 1600 200"
        preserveAspectRatio="none"
      >
        <path
          d="M0 100 Q 200 0 400 100 T 800 100 T 1200 100 T 1600 100 V 200 H 0 Z"
          fill={color}
          opacity={opacity}
        />
      </svg>
    );
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(180deg, ${secondary}22, transparent 60%, ${primary}2e)` }}
        />
        {wave(primary, 0.28, "60%")}
        {wave(secondary, 0.2, "52%")}
        {wave(accent, 0.14, "44%")}
      </div>
    );
  }

  if (effect === "contour") {
    const layers = Array.from({ length: 6 }).map((_, i) => ({
      x: 20 + rnd() * 60,
      y: 20 + rnd() * 60,
      width: 320 + rnd() * 420,
      height: 320 + rnd() * 420,
      c: i % 2 === 0 ? primary : i % 3 === 0 ? accent : secondary,
      dur: 22 + rnd() * 18,
      delay: rnd() * 8,
    }));
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, ${accent}18, transparent 55%)`,
          }}
        />
        {layers.map((l, i) => (
          <div
            key={i}
            className="absolute rounded-full border"
            style={{
              left: `${l.x}%`,
              top: `${l.y}%`,
              width: l.width,
              height: l.height,
              borderColor: l.c,
              opacity: 0.35,
              animation: `bg-contour ${l.dur}s ease-in-out ${l.delay}s infinite alternate`,
            }}
          />
        ))}
      </div>
    );
  }

  if (effect === "neon-rings" || effect === "rings") {
    const rings = Array.from({ length: 5 }).map(() => ({
      size: 140 + rnd() * 320,
      x: 10 + rnd() * 60,
      y: 10 + rnd() * 60,
      c: [primary, secondary, accent][Math.floor(rnd() * 3)],
      delay: rnd() * 4,
      dur: 6 + rnd() * 5,
    }));
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {rings.map((r, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${r.x}%`,
              top: `${r.y}%`,
              width: r.size,
              height: r.size,
              border: `1.5px solid ${r.c}`,
              boxShadow: `0 0 24px ${r.c}40, inset 0 0 24px ${r.c}22`,
              animation: `bg-rings ${r.dur}s ease-in-out ${r.delay}s infinite`,
            }}
          />
        ))}
      </div>
    );
  }

  if (effect === "confetti" || effect === "petals") {
    const count = 14;
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${rnd() * 100}%`,
              top: "-5%",
              width: effect === "petals" ? 8 + rnd() * 8 : 5 + rnd() * 5,
              height: effect === "petals" ? 8 + rnd() * 8 : 5 + rnd() * 5,
              background: [primary, secondary, accent][i % 3],
              borderRadius: effect === "petals" ? "50% 0 50% 50%" : "3px",
              opacity: 0.75,
              animation: `bg-fall ${9 + rnd() * 8}s linear ${rnd() * 8}s infinite`,
            }}
          />
        ))}
      </div>
    );
  }

  if (effect === "metaballs") {
    const balls = Array.from({ length: 5 }).map((_, i) => ({
      size: 60 + rnd() * 120,
      x: 14 + rnd() * 72,
      y: 18 + rnd() * 60,
      c: [primary, secondary, accent][i % 3],
      delay: rnd() * 6,
    }));
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(160deg, ${primary}1f, ${accent}1f)` }}
        />
        {balls.map((b, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: b.size,
              height: b.size,
              background: `radial-gradient(circle at 35% 30%, ${b.c}b3, ${b.c}40)`,
              filter: "blur(14px)",
              animation: `bg-blob-morph 12s ease-in-out ${b.delay}s infinite`,
            }}
          />
        ))}
      </div>
    );
  }

  if (effect === "orbit") {
    const colors = [primary, secondary, accent];
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {colors.map((c, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: "50%",
              top: "50%",
              width: 1,
              height: 1,
            }}
          >
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ width: 8 + rnd() * 6, height: 8 + rnd() * 6, background: c, boxShadow: `0 0 18px 4px ${c}80` }}
            />
            <div
              className="absolute"
              style={{
                left: -140 - rnd() * 120,
                top: -140 - rnd() * 120,
              }}
            >
              <div
                className="rounded-full"
                style={{
                  width: 280 + rnd() * 240,
                  height: 280 + rnd() * 240,
                  border: `1px solid ${c}${i === 2 ? "55" : "35"}`,
                  animation: `bg-spin-slow ${30 + rnd() * 25}s linear infinite`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (effect === "spin-mesh") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute h-[120%] w-full"
          style={{
            top: "-10%",
            background: `conic-gradient(from 0deg at 50% 50%, ${primary}55, transparent 25%, ${secondary}44 50%, transparent 75%, ${accent}55)`,
            filter: "blur(50px)",
            animation: "bg-mesh-rotate 40s linear infinite",
          }}
        />
      </div>
    );
  }

  if (effect === "pulse-ring") {
    const rings = Array.from({ length: 4 }).map(() => ({
      x: 15 + rnd() * 60,
      y: 20 + rnd() * 55,
      size: 90 + rnd() * 120,
      c: [primary, secondary, accent][Math.floor(rnd() * 3)],
      delay: rnd() * 3.5,
    }));
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {rings.map((r, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${r.x}%`,
              top: `${r.y}%`,
              width: r.size,
              height: r.size,
              border: `2px solid ${r.c}`,
              animation: `bg-pulse-ring ${3.4 + rnd() * 2.5}s ease-out ${r.delay}s infinite`,
            }}
          />
        ))}
      </div>
    );
  }

  if (effect === "aurora-blobs") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-[70%] w-[70%] rounded-full blur-3xl" style={{ background: `${primary}59`, animation: "bg-float-y 9s ease-in-out infinite" }} />
        <div className="absolute -right-1/4 top-1/3 h-[70%] w-[70%] rounded-full blur-3xl" style={{ background: `${secondary}52`, animation: "bg-float-y 11s ease-in-out 1s infinite" }} />
        <div className="absolute -bottom-1/4 left-1/4 h-[70%] w-[70%] rounded-full blur-3xl" style={{ background: `${accent}4d`, animation: "bg-float-y 13s ease-in-out 2s infinite" }} />
      </div>
    );
  }

  return null;
}
