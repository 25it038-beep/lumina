"use client";

import { memo } from "react";
import { Deck, Slide, SlideElement } from "@/lib/types";
import { getTheme } from "@/lib/themes";
import { SLIDE_WIDTH, SLIDE_HEIGHT } from "@/lib/layouts";
import { fixColor, isGradient, resolveBackground } from "@/lib/export/slideRenderer";
import { backgroundStyle } from "@/lib/backgrounds";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { ChartSVG } from "./ChartSVG";

interface SlidePreviewProps {
  slide: Slide;
  deck: Deck;
  interactive?: boolean;
  scale?: number;
  showAnimations?: boolean;
  animateIndex?: number;
  className?: string;
  selectedIds?: string[];
  onSelectElement?: (id: string) => void;
  onElementPointerDown?: (e: React.PointerEvent, id: string) => void;
  onElementDoubleClick?: (id: string) => void;
}

function ElementView({
  el,
  deck,
  interactive,
  selected,
  onSelect,
  onPointerDown,
  onDoubleClick,
  showAnimations,
  animateIndex,
}: {
  el: SlideElement;
  deck: Deck;
  interactive?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onPointerDown?: (e: React.PointerEvent, id: string) => void;
  onDoubleClick?: (id: string) => void;
  showAnimations?: boolean;
  animateIndex?: number;
}) {
  const theme = getTheme(deck.themeId);
  const s = el.style as any;
  const primary = fixColor(theme.primary);
  const text = fixColor(theme.text);
  const muted = fixColor(theme.textMuted);
  const surface = fixColor(theme.surface);
  const border = fixColor(theme.border);

  const animClass = showAnimations && el.animation?.type && el.animation.type !== "none"
    ? `pres-anim-${el.animation.type}`
    : "";
  const delay = el.animation?.delay ?? 0;

  const commonStyle: React.CSSProperties = {
    position: "absolute",
    left: el.position.x,
    top: el.position.y,
    width: el.position.width,
    height: el.position.height,
    transform: `rotate(${el.position.rotation}deg)`,
    transformOrigin: "center",
    opacity: el.visible ? (el.style.opacity ?? 1) : 0,
    animationDelay: `${delay}s`,
    cursor: interactive ? "move" : undefined,
    zIndex: el.zIndex,
  };

  if (interactive) {
    commonStyle.touchAction = "none";
  }

  let content: React.ReactNode = null;

  switch (el.type) {
    case "heading":
    case "subtitle":
    case "text":
      content = (
        <div
          style={{
            whiteSpace: "pre-wrap",
            width: "100%",
            height: "100%",
            overflow: "hidden",
            color: fixColor(s.color) || text,
            fontSize: s.fontSize ?? 20,
            fontFamily: s.fontFamily || (el.type === "heading" || el.type === "subtitle" ? theme.headingFont : theme.bodyFont),
            fontWeight: s.fontWeight ?? 400,
            lineHeight: s.lineHeight ?? 1.5,
            textAlign: s.textAlign ?? "left",
          }}
        >
          {el.content}
        </div>
      );
      break;
    case "image":
    case "gif":
      content = (
        <div style={{ width: "100%", height: "100%", position: "relative", display: "flex", flexDirection: "column" }}>
          <img
            src={el.src}
            alt={el.alt ?? ""}
            loading="lazy"
            draggable={false}
            style={{
              width: "100%",
              height: el.caption ? "calc(100% - 24px)" : "100%",
              objectFit: el.objectFit ?? "cover",
              borderRadius: s.borderRadius ?? 0,
              boxShadow: s.shadow ? "0 12px 32px rgba(0,0,0,0.25)" : "none",
            }}
          />
          {el.caption && (
            <div
              style={{
                fontSize: 12,
                fontStyle: "italic",
                color: fixColor(s.color) || muted,
                marginTop: 4,
                textAlign: s.textAlign ?? "center",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {el.caption}
            </div>
          )}
        </div>
      );
      break;
    case "icon":
      content = (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: el.size ?? 32,
            color: fixColor(s.color) || primary,
          }}
        >
          ◆
        </div>
      );
      break;
    case "shape": {
      const fill = fixColor(s.fill) || primary;
      const radius = el.shape === "circle" ? "50%" : `${s.borderRadius ?? 0}px`;
      const borderStyle = s.borderWidth
        ? `${s.borderWidth}px solid ${fixColor(s.borderColor) || "transparent"}`
        : "none";
      content = (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: fill,
            borderRadius: radius,
            border: borderStyle,
            position: "relative",
            clipPath:
              el.shape === "triangle"
                ? "polygon(50% 0%, 0% 100%, 100% 100%)"
                : el.shape === "diamond"
                  ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)"
                  : el.shape === "hexagon"
                    ? "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)"
                    : el.shape === "star"
                      ? "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)"
                      : undefined,
          }}
        >
          {el.shape === "arrow" && (
            <div
              style={{
                position: "absolute",
                right: -6,
                top: "50%",
                transform: "translateY(-50%)",
                borderTop: "7px solid transparent",
                borderBottom: "7px solid transparent",
                borderLeft: `12px solid ${fill}`,
              }}
            />
          )}
        </div>
      );
      break;
    }
    case "chart":
      content = (
        <ChartSVG
          chartType={el.chartType}
          data={el.data}
          datasets={el.datasets}
          title={el.title}
          legend={el.legend}
          width={el.position.width}
          height={el.position.height}
          dark={theme.isDark}
        />
      );
      break;
    case "table":
      content = (
        <table
          style={{
            width: "100%",
            height: "100%",
            borderCollapse: "collapse",
            fontSize: s.fontSize ?? 15,
            color: fixColor(s.color) || text,
            borderRadius: s.borderRadius ?? 8,
            overflow: "hidden",
          }}
        >
          <thead>
            <tr style={{ background: primary, color: "#fff" }}>
              {(el.headers ?? []).map((h, i) => (
                <th key={i} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, border: `1px solid ${border}` }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(el.cells ?? []).map((row, ri) => (
              <tr
                key={ri}
                style={{ background: ri % 2 ? surface : "transparent", borderBottom: `1px solid ${border}` }}
              >
                {row.map((c, ci) => (
                  <td key={ci} style={{ padding: "9px 14px", border: `1px solid ${border}` }}>
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
      break;
    case "code":
      content = (
        <pre
          style={{
            width: "100%",
            height: "100%",
            margin: 0,
            padding: 16,
            background: "#0d1117",
            color: "#e6edf3",
            borderRadius: s.borderRadius ?? 12,
            fontFamily: "monospace",
            fontSize: s.fontSize ?? 14,
            overflow: "auto",
            whiteSpace: "pre-wrap",
            boxSizing: "border-box",
          }}
        >
          {el.code}
        </pre>
      );
      break;
    case "formula":
      content = (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: s.fontSize ?? 40,
            fontStyle: "italic",
            color: fixColor(s.color) || text,
          }}
        >
          {el.latex}
        </div>
      );
      break;
    case "timeline":
    case "roadmap":
    case "mindmap":
    case "flowchart":
    case "architecture": {
      const nodes = el.nodes ?? [];
      const n = Math.max(nodes.length, 1);
      const nodeW = 200;
      const gap = 40;
      const total = n * nodeW + (n - 1) * gap;
      const startX = Math.max(0, (el.position.width - total) / 2);
      content = (
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
          {nodes.slice(0, 5).map((nd, i) => {
            const x = startX + i * (nodeW + gap);
            return (
              <div key={nd.id}>
                <div
                  style={{
                    position: "absolute",
                    left: x + nodeW / 2 - 22,
                    top: 24,
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: primary,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    fontWeight: 700,
                    boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
                  }}
                >
                  {i + 1}
                </div>
                {i < n - 1 && (
                  <div
                    style={{
                      position: "absolute",
                      left: x + nodeW / 2 + 22,
                      top: 45,
                      width: gap,
                      height: 2,
                      background: border,
                    }}
                  />
                )}
                <div
                  style={{
                    position: "absolute",
                    left: x,
                    top: 84,
                    width: nodeW,
                    textAlign: "center",
                    fontSize: 15,
                    fontWeight: 600,
                    color: text,
                  }}
                >
                  {nd.label}
                </div>
              </div>
            );
          })}
        </div>
      );
      break;
    }
    case "button":
      content = (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: primary,
            color: "#fff",
            borderRadius: s.borderRadius ?? 10,
            fontWeight: 600,
            fontSize: s.fontSize ?? 18,
            cursor: "pointer",
          }}
        >
          {el.label}
        </div>
      );
      break;
    case "qr":
      content = (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#fff",
            color: "#000",
            fontWeight: 700,
          }}
        >
          QR
        </div>
      );
      break;
    case "video":
      content = (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0f172a",
            color: "#fff",
            borderRadius: s.borderRadius ?? 12,
            fontWeight: 600,
          }}
        >
          ▶ Video
        </div>
      );
      break;
    default:
      content = (
        <div style={{ color: text }}>
          {(el as any).content ?? (el as any).label ?? ""}
        </div>
      );
  }

  return (
    <div
      data-el-id={el.id}
      className={[
        "editor-el",
        selected && "selected",
        animClass,
      ].filter(Boolean).join(" ")}
      style={commonStyle}
      onClick={(e) => {
        e.stopPropagation();
        if (interactive) onSelect?.(el.id);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (interactive) onDoubleClick?.(el.id);
      }}
      onPointerDown={(e) => interactive && onPointerDown?.(e, el.id)}
    >
      {content}
    </div>
  );
}

function SlidePreviewInner({
  slide,
  deck,
  interactive,
  scale = 1,
  showAnimations,
  animateIndex,
  className,
  selectedIds,
  onSelectElement,
  onElementPointerDown,
  onElementDoubleClick,
}: SlidePreviewProps & {
  selectedIds?: string[];
  onSelectElement?: (id: string) => void;
  onElementPointerDown?: (e: React.PointerEvent, id: string) => void;
  onElementDoubleClick?: (id: string) => void;
}) {
  const theme = getTheme(deck.themeId);
  const bgStyle = backgroundStyle(slide.background, slide.backgroundImage, slide.backgroundAnimated);

  const elements = [...slide.elements].sort((a, b) => a.zIndex - b.zIndex);
  const animateStart = Math.max(0, (animateIndex ?? 0));

  return (
    <div
      className={className}
      style={{
        width: SLIDE_WIDTH * scale,
        height: SLIDE_HEIGHT * scale,
        position: "relative",
        overflow: "hidden",
        ...bgStyle,
        fontFamily: `${theme.bodyFont}, sans-serif`,
        flexShrink: 0,
      }}
    >
      {slide.backgroundVideo && (
        <video
          src={slide.backgroundVideo}
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            pointerEvents: "none",
          }}
        />
      )}
      {slide.backgroundEffect && (
        <AnimatedBackground
          effect={slide.backgroundEffect}
          primary={theme.primary}
          secondary={theme.secondary}
          accent={theme.accent}
        />
      )}
      {elements.map((el, i) => (
        <ElementView
          key={el.id}
          el={el}
          deck={deck}
          interactive={interactive}
          selected={interactive && selectedIds?.includes(el.id)}
          onSelect={onSelectElement}
          onPointerDown={onElementPointerDown}
          onDoubleClick={onElementDoubleClick}
          showAnimations={showAnimations && i >= animateStart}
        />
      ))}
    </div>
  );
}

export const SlidePreview = memo(SlidePreviewInner, (prev, next) => {
  return (
    prev.slide === next.slide &&
    prev.deck?.themeId === next.deck?.themeId &&
    prev.interactive === next.interactive &&
    prev.scale === next.scale &&
    prev.animateIndex === next.animateIndex &&
    prev.className === next.className &&
    prev.selectedIds === next.selectedIds
  );
});

export { SLIDE_WIDTH, SLIDE_HEIGHT };
