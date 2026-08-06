export const SPACING_GRID = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
  xxl: 64,
  hero: 96,
  section: 128,
};

export interface GridRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class DesignCompositionEngine {
  snapToGrid(val: number): number {
    return Math.round(val / 8) * 8;
  }

  calculateCardDimensions(columns: number, containerWidth = 1120, gap = 24): { cardWidth: number; gap: number } {
    const totalGap = gap * (columns - 1);
    const cardWidth = this.snapToGrid((containerWidth - totalGap) / columns);
    return { cardWidth, gap };
  }

  limitLineLength(text: string, maxChars = 70): string {
    if (!text || text.length <= maxChars) return text;
    const words = text.split(" ");
    let line = "";
    const lines: string[] = [];

    for (const w of words) {
      if ((line + " " + w).length > maxChars) {
        lines.push(line.trim());
        line = w;
      } else {
        line += (line ? " " : "") + w;
      }
    }
    if (line) lines.push(line.trim());
    return lines.join("\n");
  }
}

export const designComposition = new DesignCompositionEngine();
