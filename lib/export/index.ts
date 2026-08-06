import { Deck, SlideElement } from "../types";
import { getTheme } from "../themes";
import { SLIDE_WIDTH, SLIDE_HEIGHT } from "../layouts";
import { renderSlideToHTML, renderSlideToString } from "./slideRenderer";
import { fixColor } from "./slideRenderer";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

const imageCache = new Map<string, Promise<string | null>>();

/** Download an image to a data URL so it is embedded in the PPTX reliably. */
function fetchDataUrl(url: string): Promise<string | null> {
  if (!url) return Promise.resolve(null);
  const key = url;
  if (imageCache.has(key)) return imageCache.get(key)!;
  const promise = (async (): Promise<string | null> => {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch(url, { mode: "cors", signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) return null;
      const blob = await res.blob();
      if (!blob.type.startsWith("image/")) return null;
      return await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? null));
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  })();
  imageCache.set(key, promise);
  return promise;
}

export type ExportFormat = "pptx" | "pdf" | "html" | "png" | "jpeg" | "svg" | "markdown" | "reveal";

export async function exportDeck(deck: Deck, format: ExportFormat, onProgress?: (p: number) => void): Promise<void> {
  const safeName = (deck.title || "presentation").replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").toLowerCase();

  switch (format) {
    case "markdown": {
      const md = deckToMarkdown(deck);
      downloadBlob(new Blob([md], { type: "text/markdown" }), `${safeName}.md`);
      break;
    }
    case "reveal":
    case "html": {
      const html = format === "reveal" ? deckToRevealHTML(deck) : deckToStaticHTML(deck);
      downloadBlob(new Blob([html], { type: "text/html" }), `${safeName}.html`);
      break;
    }
    case "pptx":
      await exportPPTX(deck, onProgress);
      break;
    case "pdf":
    case "png":
    case "jpeg":
    case "svg": {
      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-99999px";
      container.style.top = "0";
      document.body.appendChild(container);
      try {
        const slides: Blob[] = [];
        for (let i = 0; i < deck.slides.length; i++) {
          const div = document.createElement("div");
          container.appendChild(div);
          renderSlideToHTML(deck.slides[i], deck, div);
          await new Promise((r) => setTimeout(r, 120));
          onProgress?.(Math.round((i / deck.slides.length) * 90));
          if (format === "pdf") {
            const { default: html2canvas } = await import("html2canvas");
            const canvas = await html2canvas(div, { scale: 1.5, useCORS: true, backgroundColor: null });
            const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.92));
            if (blob) slides.push(blob);
          } else {
            const svg = divToSVG(div, deck.slides[i]);
            if (format === "svg") {
              slides.push(new Blob([svg], { type: "image/svg+xml" }));
            } else {
              const img = new Image();
              const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
              await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject(new Error("SVG render failed"));
                img.src = dataUrl;
              });
              const canvas = document.createElement("canvas");
              canvas.width = SLIDE_WIDTH * 2;
              canvas.height = SLIDE_HEIGHT * 2;
              const ctx = canvas.getContext("2d")!;
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, format === "jpeg" ? "image/jpeg" : "image/png", 0.95));
              if (blob) slides.push(blob);
            }
          }
        }
        if (format === "pdf") {
          const { jsPDF } = await import("jspdf");
          const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [SLIDE_WIDTH, SLIDE_HEIGHT] });
          for (let i = 0; i < slides.length; i++) {
            const buf = await slides[i].arrayBuffer();
            pdf.addImage(new Uint8Array(buf) as unknown as string, "JPEG", 0, 0, SLIDE_WIDTH, SLIDE_HEIGHT, undefined, "FAST");
            if (i < slides.length - 1) pdf.addPage();
          }
          pdf.save(`${safeName}.pdf`);
        } else {
          for (let i = 0; i < slides.length; i++) {
            downloadBlob(slides[i], `${safeName}-slide-${i + 1}.${format === "jpeg" ? "jpg" : format}`);
          }
        }
      } finally {
        container.remove();
      }
      break;
    }
  }
  onProgress?.(100);
}

function divToSVG(div: HTMLElement, _slide: unknown): string {
  const clone = div.cloneNode(true) as HTMLElement;
  const rect = div.getBoundingClientRect();
  const cs = getComputedStyle(div);
  clone.style.width = `${rect.width}px`;
  clone.style.height = `${rect.height}px`;
  clone.style.left = "0";
  clone.style.top = "0";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}" viewBox="0 0 ${rect.width} ${rect.height}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${rect.width}px;height:${rect.height}px;overflow:hidden;background:${cs.backgroundColor || "#ffffff"}">${clone.outerHTML}</div></foreignObject></svg>`;
}

export function deckToMarkdown(deck: Deck): string {
  const theme = getTheme(deck.themeId);
  const lines: string[] = [];
  lines.push(`# ${deck.title}`);
  lines.push("");
  lines.push(`> ${deck.description}`);
  lines.push("");
  deck.slides.forEach((slide, i) => {
    lines.push(`## Slide ${i + 1}: ${slide.title}`);
    lines.push("");
    slide.elements
      .filter((e) => "content" in e)
      .forEach((e: any) => {
        if (e.type === "heading" || e.type === "subtitle") lines.push(`### ${e.content}`);
        else lines.push(`- ${e.content}`);
      });
    const chartEls = slide.elements.filter((e) => e.type === "chart") as any[];
    chartEls.forEach((c) => {
      if (c.data?.length) {
        lines.push("");
        lines.push("| Label | Value |");
        lines.push("| --- | --- |");
        c.data.forEach((d: any) => lines.push(`| ${d.label} | ${d.value} |`));
      }
    });
    lines.push("");
    lines.push(`> Notes: ${slide.notes || "—"}`);
    lines.push("");
    lines.push("---");
  });
  if (deck.aiMeta?.citations?.length) {
    lines.push("## References");
    deck.aiMeta.citations.forEach((c) => lines.push(`- [${c.title}](${c.url})`));
  }
  lines.push("");
  lines.push(`*Generated with Lumina · Theme: ${theme.name}*`);
  return lines.join("\n");
}

export function deckToStaticHTML(deck: Deck): string {
  const theme = getTheme(deck.themeId);
  const textMuted = fixColor(theme.textMuted) ?? theme.textMuted;
  const slides = deck.slides
    .map((s) => {
      const inner = renderSlideToString(s, deck);
      return `<div class="slide-host"><div class="slide">${inner}</div></div>`;
    })
    .join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${deck.title}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${fixColor(theme.background)}; font-family: ${theme.bodyFont}, sans-serif; padding: 48px 24px; }
  .deck { max-width: ${SLIDE_WIDTH}px; margin: 0 auto; display: flex; flex-direction: column; gap: 48px; }
  .slide-host { width: 100%; position: relative; }
  .slide { width: ${SLIDE_WIDTH}px; height: ${SLIDE_HEIGHT}px; transform-origin: top left; box-shadow: 0 24px 64px rgba(0,0,0,.25); border-radius: 8px; overflow: hidden; }
  .deck-head { color: ${textMuted}; font-size: 14px; text-align: center; padding-bottom: 8px; }
  @media print { .deck { gap: 0; } .slide { box-shadow: none; border-radius: 0; page-break-after: always; } }
</style>
</head>
<body>
  <div class="deck">
    <p class="deck-head">${deck.title} — exported from Lumina</p>
    ${slides}
  </div>
<script>
  function luminaFit(){
    var deck = document.querySelector('.deck');
    var vw = Math.min(deck.clientWidth, ${SLIDE_WIDTH});
    document.querySelectorAll('.slide-host').forEach(function(host){
      var slide = host.querySelector('.slide');
      var s = Math.min(1, vw / ${SLIDE_WIDTH});
      slide.style.transform = 'scale(' + s + ')';
      host.style.height = (${SLIDE_HEIGHT} * s) + 'px';
    });
  }
  window.addEventListener('resize', luminaFit);
  luminaFit();
</script>
</body>
</html>`;
}

export function deckToRevealHTML(deck: Deck): string {
  const theme = getTheme(deck.themeId);
  const slidesHtml = deck.slides
    .map((s) => `<section data-transition="${s.transition ?? "fade"}">${renderSlideToString(s, deck)}</section>`)
    .join("\n");
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${deck.title}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5/dist/reveal.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5/dist/theme/black.css">
<style>body{background:${fixColor(theme.background)}}</style>
</head>
<body><div class="reveal"><div class="slides">
${slidesHtml}
</div></div>
<script src="https://cdn.jsdelivr.net/npm/reveal.js@5/dist/reveal.js"></script>
<script>Reveal.initialize({hash:true,slideNumber:true,width:${SLIDE_WIDTH},height:${SLIDE_HEIGHT}});</script>
</body></html>`;
}

export async function exportPPTX(deck: Deck, onProgress?: (p: number) => void): Promise<void> {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  const theme = getTheme(deck.themeId);
  pptx.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
  pptx.layout = "WIDE";
  pptx.author = "Lumina";
  pptx.company = "Lumina";
  pptx.title = deck.title;
  pptx.subject = deck.description;

  const toIn = (px: number, total: number) => (px / total) * 13.333;
  const toInH = (px: number) => (px / SLIDE_HEIGHT) * 7.5;
  const pptColor = (c?: string) => {
    const f = fixColor(c);
    return f?.startsWith("#") ? f.slice(1).toUpperCase() : undefined;
  };
  const fontFor = (el: SlideElement) =>
    (el.style as any).fontFamily || (el.type === "heading" || el.type === "subtitle" ? theme.headingFont : theme.bodyFont);

  for (let si = 0; si < deck.slides.length; si++) {
    const slide = deck.slides[si];
    const s = pptx.addSlide();
    const bg = slide.background && slide.background !== "var(--t-background)" ? slide.background : theme.background;
    if (slide.backgroundImage) {
      const bgData = await fetchDataUrl(slide.backgroundImage);
      if (bgData) {
        s.background = { image: { path: bgData, sizing: { type: "cover", w: 13.333, h: 7.5 } } } as any;
      } else if (!/gradient/.test(bg)) {
        const solid = (bg.match(/#[0-9a-fA-F]{6}/)?.[0] ?? bg.match(/#[0-9a-fA-F]{3}/)?.[0]) ?? (bg.startsWith("#") ? bg : undefined);
        s.background = { color: pptColor(solid) ?? (theme.isDark ? "0B0D12" : "FFFFFF") };
      } else {
        s.background = { color: theme.isDark ? "0B0D12" : "FFFFFF" };
      }
    } else if (!/gradient/.test(bg)) {
      const solid = (bg.match(/#[0-9a-fA-F]{6}/)?.[0] ?? bg.match(/#[0-9a-fA-F]{3}/)?.[0]) ?? (bg.startsWith("#") ? bg : undefined);
      s.background = { color: pptColor(solid) ?? (theme.isDark ? "0B0D12" : "FFFFFF") };
    } else {
      s.background = { color: theme.isDark ? "0B0D12" : "FFFFFF" };
    }
    for (const el of [...slide.elements].sort((a, b) => a.zIndex - b.zIndex)) {
      const x = toIn(el.position.x, SLIDE_WIDTH);
      const y = toInH(el.position.y);
      const w = toIn(el.position.width, SLIDE_WIDTH);
      const h = toInH(el.position.height);
      const st = el.style as any;
      try {
        if (el.type === "heading" || el.type === "subtitle" || el.type === "text") {
          s.addText((el as any).content ?? "", {
            x, y, w, h,
            fontSize: Math.round((st.fontSize ?? 20) * 0.75),
            color: pptColor(st.color) ?? pptColor(el.type === "heading" ? theme.text : theme.textMuted) ?? "FFFFFF",
            bold: !!st.fontWeight && st.fontWeight >= 700,
            fontFace: fontFor(el),
            align: st.textAlign ?? "left",
            breakLine: false,
            fit: "shrink",
            rotate: el.position.rotation,
          });
        } else if (el.type === "image" || el.type === "gif") {
          const data = await fetchDataUrl((el as any).src);
          if (data) {
            s.addImage({ path: data, x, y, w, h, sizing: { type: "cover", w, h } } as any);
          } else {
            s.addShape("rect", { x, y, w, h, fill: { color: pptColor(theme.surface) ?? "334155" }, rectRadius: 0.1 } as any);
            s.addText("Image unavailable", { x, y, w, h, align: "center", valign: "middle", color: "94A3B8", fontSize: 12, italic: true } as any);
          }
        } else if (el.type === "shape") {
          const kind = (el as any).shape;
          const fill = pptColor(st.fill) ?? pptColor(theme.primary) ?? "6366F1";
          if (kind === "circle") s.addShape("ellipse", { x, y, w, h, fill: { color: fill }, rotate: el.position.rotation } as any);
          else if (kind === "triangle") s.addShape("triangle", { x, y, w, h, fill: { color: fill }, rotate: el.position.rotation } as any);
          else if (kind === "line") s.addShape("line", { x, y, w, h, line: { color: fill, width: 2 }, rotate: el.position.rotation } as any);
          else if (kind === "arrow") s.addShape("rightArrow", { x, y, w, h, fill: { color: fill }, rotate: el.position.rotation } as any);
          else if (kind === "diamond") s.addShape("diamond", { x, y, w, h, fill: { color: fill }, rotate: el.position.rotation } as any);
          else s.addShape("rect", { x, y, w, h, fill: { color: fill }, rectRadius: st.borderRadius ? st.borderRadius / 100 : 0, rotate: el.position.rotation } as any);
        } else if (el.type === "chart") {
          const data = (el as any).data ?? [];
          if (data.length) {
            const rows: any[] = [{ text: "Label", options: { bold: true } }, { text: "Value", options: { bold: true } }];
            data.forEach((d: any) => rows.push([{ text: d.label }, { text: String(d.value) }]));
            const ctype = (el as any).chartType;
            const chartType =
              ctype === "bar" || ctype === "stacked-bar" ? "bar" :
              ctype === "line" ? "line" :
              ctype === "area" ? "area" :
              ctype === "pie" || ctype === "doughnut" || ctype === "donut" ? "pie" :
              ctype === "scatter" ? "scatter" :
              ctype === "radar" ? "radar" : "bar";
            s.addChart(chartType as any, rows, { x, y, w, h, barDir: ctype === "horizontal-bar" ? "bar" : "col", barGapWidthPct: 40, chartColors: ["6366F1", "8B5CF6", "22D3EE", "F59E0B", "EC4899"], showTitle: false, legendPos: el.legend ? "b" : "n" } as any);
          }
        } else if (el.type === "table") {
          const rows: any[] = [(el as any).headers];
          (el as any).cells.forEach((r: string[]) => rows.push(r));
          s.addTable(rows, {
            x, y, w, h,
            border: { pt: 0.5, color: pptColor(theme.border) ?? "E2E8F0" },
            fill: { color: pptColor(theme.surface) ?? "FFFFFF" },
            fontSize: 11,
            color: pptColor(theme.text) ?? "334155",
            rowH: h / rows.length,
          } as any);
        } else if (el.type === "button") {
          s.addShape("roundRect", { x, y, w, h, fill: { color: pptColor(theme.primary) ?? "6366F1" }, rectRadius: 0.5 } as any);
          s.addText((el as any).label ?? "", { x, y, w, h, align: "center", valign: "middle", color: "FFFFFF", bold: true, fontSize: 16 } as any);
        } else if (el.type === "code") {
          s.addShape("rect", { x, y, w, h, fill: { color: "0D1117" }, rectRadius: 0.1 } as any);
          s.addText((el as any).code ?? "", { x: x + 0.1, y: y + 0.1, w: w - 0.2, h: h - 0.2, color: "E6EDF3", fontFace: "Consolas", fontSize: 10, valign: "t" } as any);
        }
      } catch {
        // skip element that failed to export (e.g. cross-origin image)
      }
    }
    onProgress?.(Math.round(((si + 1) / deck.slides.length) * 90));
  }
  await pptx.writeFile({ fileName: `${(deck.title || "presentation").replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").toLowerCase()}.pptx` });
}
