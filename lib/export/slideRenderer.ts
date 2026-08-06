import { Deck, Slide, SlideElement } from "../types";
import { SLIDE_WIDTH, SLIDE_HEIGHT } from "../layouts";
import { getTheme } from "../themes";
import { renderChartSVG } from "./chartRenderer";

export function fixColor(c: string | undefined): string | undefined {
  if (!c) return undefined;
  const t = c.trim();
  const hex = t.match(/^#([0-9a-fA-F]{3,8})$/);
  if (hex) {
    let h = hex[1];
    if (h.length === 3 || h.length === 4) h = h.split("").map((ch) => ch + ch).join("");
    if (h.length === 8) h = h.slice(0, 6);
    return "#" + h;
  }
  if (/^(rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch)\(/i.test(t) || /^[a-z0-9_-]+$/i.test(t)) return t;
  return undefined;
}

export function fontFor(el: SlideElement, theme: ReturnType<typeof getTheme>): string {
  const s = el.style as any;
  return s.fontFamily || (el.type === "heading" || el.type === "subtitle" ? theme.headingFont : theme.bodyFont);
}

export function isGradient(s: string): boolean {
  return /(linear|radial|conic)-gradient/i.test(s);
}

export function resolveBackground(slide: Slide, deck: Deck): string {
  const theme = getTheme(deck.themeId);
  if (slide.backgroundImage) return `url("${slide.backgroundImage}") center / cover no-repeat, ${slide.background ?? theme.background}`;
  const bg = slide.background && slide.background !== "var(--t-background)" ? slide.background : theme.background;
  if (isGradient(bg)) return bg;
  return fixColor(bg) ?? bg;
}

export function backgroundAnimationStyle(slide: Slide): string {
  return slide.backgroundAnimated ? ";background-size:400% 400%;animation:bg-shift 16s ease infinite" : "";
}

export function renderElement(el: SlideElement, host: HTMLElement, theme: ReturnType<typeof getTheme>) {
  const s = el.style as any;
  const primary = fixColor(theme.primary) ?? theme.primary;
  const text = fixColor(theme.text) ?? theme.text;
  const muted = fixColor(theme.textMuted) ?? theme.textMuted;
  const surface = fixColor(theme.surface) ?? theme.surface;
  const border = fixColor(theme.border) ?? theme.border;

  switch (el.type) {
    case "heading":
    case "subtitle":
    case "text": {
      const p = document.createElement("div");
      p.textContent = el.content ?? "";
      p.style.cssText = `white-space:pre-wrap;width:100%;height:100%;overflow:hidden;color:${fixColor(s.color) || text};font-size:${s.fontSize ?? 20}px;font-family:${fontFor(el, theme)};font-weight:${s.fontWeight ?? 400};line-height:${s.lineHeight ?? 1.5};text-align:${s.textAlign ?? "left"};opacity:${s.opacity ?? 1};`;
      host.appendChild(p);
      break;
    }
    case "image":
    case "gif": {
      const img = document.createElement("img");
      img.src = el.src;
      img.alt = el.alt ?? "";
      img.loading = "lazy";
      img.style.cssText = `width:100%;height:100%;object-fit:${el.objectFit ?? "cover"};border-radius:${s.borderRadius ?? 0}px;box-shadow:${s.shadow ? "0 12px 32px rgba(0,0,0,0.25)" : "none"};`;
      host.appendChild(img);
      break;
    }
    case "icon": {
      const svg = document.createElement("div");
      svg.textContent = "◆";
      svg.style.cssText = `width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:${el.size ?? 32}px;color:${fixColor(s.color) || primary};`;
      host.appendChild(svg);
      break;
    }
    case "shape": {
      const sh = document.createElement("div");
      const fill = fixColor(s.fill) || primary;
      sh.style.cssText = `width:100%;height:100%;background:${fill};border-radius:${el.shape === "circle" ? "50%" : el.shape === "rect" ? (s.borderRadius ?? 0) : 0}px;border:${s.borderWidth ? `${s.borderWidth}px solid ${fixColor(s.borderColor) || "transparent"}` : "none"};`;
      if (el.shape === "triangle") {
        sh.style.cssText = `width:0;height:0;border-left:${el.position.width / 2}px solid transparent;border-right:${el.position.width / 2}px solid transparent;border-bottom:${el.position.height}px solid ${fill};background:transparent;`;
      }
      if (el.shape === "diamond") {
        sh.style.cssText = `width:100%;height:100%;background:${fill};transform:rotate(45deg);border-radius:6px;`;
      }
      if (el.shape === "line") {
        sh.style.cssText = `width:100%;height:2px;background:${fill};`;
      }
      if (el.shape === "arrow") {
        sh.style.cssText = `width:100%;height:3px;background:${fill};position:relative;`;
        const head = document.createElement("div");
        head.style.cssText = `position:absolute;right:-6px;top:-6px;width:0;height:0;border-top:7px solid transparent;border-bottom:7px solid transparent;border-left:12px solid ${fill};`;
        sh.appendChild(head);
      }
      host.appendChild(sh);
      break;
    }
    case "chart": {
      const svg = renderChartSVG({
        chartType: el.chartType,
        data: el.data,
        datasets: el.datasets,
        title: el.title,
        legend: el.legend,
        axisLabels: el.axisLabels,
        width: el.position.width,
        height: el.position.height,
        dark: theme.isDark,
      });
      host.appendChild(svg);
      break;
    }
    case "table": {
      const table = document.createElement("table");
      table.style.cssText = `width:100%;height:100%;border-collapse:collapse;font-size:${s.fontSize ?? 15}px;color:${fixColor(s.color) || text};`;
      const thead = document.createElement("thead");
      const hr = document.createElement("tr");
      hr.style.cssText = `background:${primary};color:#fff;`;
      el.headers.forEach((h) => {
        const th = document.createElement("th");
        th.textContent = h;
        th.style.cssText = "padding:10px 14px;text-align:left;font-weight:600;";
        hr.appendChild(th);
      });
      thead.appendChild(hr);
      table.appendChild(thead);
      const tb = document.createElement("tbody");
      el.cells.forEach((row, ri) => {
        const tr = document.createElement("tr");
        tr.style.cssText = `background:${ri % 2 ? surface : "transparent"};border-bottom:1px solid ${border};`;
        row.forEach((c) => {
          const td = document.createElement("td");
          td.textContent = c;
          td.style.cssText = "padding:9px 14px;";
          tr.appendChild(td);
        });
        tb.appendChild(tr);
      });
      table.appendChild(tb);
      host.appendChild(table);
      break;
    }
    case "code": {
      const pre = document.createElement("pre");
      pre.textContent = el.code ?? "";
      pre.style.cssText = `width:100%;height:100%;margin:0;padding:16px;background:#0d1117;color:#e6edf3;border-radius:${s.borderRadius ?? 12}px;font-family:monospace;font-size:${s.fontSize ?? 14}px;overflow:auto;white-space:pre-wrap;box-sizing:border-box;`;
      host.appendChild(pre);
      break;
    }
    case "formula": {
      const f = document.createElement("div");
      f.textContent = el.latex ?? "";
      f.style.cssText = `width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:${s.fontSize ?? 40}px;font-style:italic;color:${fixColor(s.color) || text};`;
      host.appendChild(f);
      break;
    }
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
      const startX = Math.max(0, (SLIDE_WIDTH - total) / 2);
      nodes.slice(0, 5).forEach((nd, i) => {
        const x = startX + i * (nodeW + gap);
        const dot = document.createElement("div");
        dot.style.cssText = `position:absolute;left:${x + (nodeW / 2 - 22)}px;top:24px;width:44px;height:44px;border-radius:50%;background:${primary};color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;box-shadow:0 4px 14px rgba(0,0,0,0.25);`;
        dot.textContent = String(i + 1);
        host.appendChild(dot);
        if (i < n - 1) {
          const line = document.createElement("div");
          line.style.cssText = `position:absolute;left:${x + nodeW / 2 + 22}px;top:45px;width:${gap}px;height:2px;background:${border};`;
          host.appendChild(line);
        }
        const label = document.createElement("div");
        label.textContent = nd.label ?? "";
        label.style.cssText = `position:absolute;left:${x}px;top:84px;width:${nodeW}px;text-align:center;font-size:15px;font-weight:600;color:${text};`;
        host.appendChild(label);
      });
      break;
    }
    case "button": {
      const b = document.createElement("div");
      b.textContent = el.label ?? "Button";
      b.style.cssText = `width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:${primary};color:#fff;border-radius:${s.borderRadius ?? 10}px;font-weight:600;font-size:${s.fontSize ?? 18}px;`;
      host.appendChild(b);
      break;
    }
    case "qr": {
      const q = document.createElement("div");
      q.textContent = "QR";
      q.style.cssText = `width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#fff;color:#000;font-weight:700;`;
      host.appendChild(q);
      break;
    }
    case "video": {
      const v = document.createElement("div");
      v.textContent = "▶ Video";
      v.style.cssText = `width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#0f172a;color:#fff;border-radius:${s.borderRadius ?? 12}px;font-weight:600;`;
      host.appendChild(v);
      break;
    }
    default: {
      const d = document.createElement("div");
      d.textContent = (el as any).content ?? (el as any).label ?? "";
      d.style.cssText = `color:${text};`;
      host.appendChild(d);
    }
  }
}

export function renderSlideToHTML(slide: Slide, deck: Deck, container: HTMLElement) {
  const theme = getTheme(deck.themeId);
  const bg = resolveBackground(slide, deck);
  container.style.cssText = `width:${SLIDE_WIDTH}px;height:${SLIDE_HEIGHT}px;position:relative;overflow:hidden;background:${bg};background-size:cover;background-position:center;font-family:${theme.bodyFont},sans-serif${backgroundAnimationStyle(slide)};`;
  container.innerHTML = "";
  const sorted = [...slide.elements].sort((a, b) => a.zIndex - b.zIndex);
  for (const el of sorted) {
    const div = document.createElement("div");
    div.style.cssText = `position:absolute;left:${el.position.x}px;top:${el.position.y}px;width:${el.position.width}px;height:${el.position.height}px;transform:rotate(${el.position.rotation}deg);transform-origin:center;opacity:${el.style.opacity ?? 1};`;
    div.setAttribute("data-el", el.id);
    renderElement(el, div, theme);
    container.appendChild(div);
  }
}

/**
 * Renders a slide into a standalone HTML string (used by the self-contained
 * HTML / Reveal exports so the exported file needs no external scripts).
 */
export function renderSlideToString(slide: Slide, deck: Deck): string {
  const host = document.createElement("div");
  renderSlideToHTML(slide, deck, host);
  return host.outerHTML;
}
