import { Deck, Slide, SlideElement, LayoutType } from "../types";

export interface ASTSectionNode {
  id: string;
  title: string;
  slides: Slide[];
}

export interface PresentationAST {
  version: string;
  metadata: {
    id: string;
    title: string;
    description: string;
    topic: string;
    aspectRatio: string;
    themeId: string;
    author: string;
    createdAt: number;
    updatedAt: number;
  };
  sections: ASTSectionNode[];
}

export class PresentationASTEngine {
  public static deckToAST(deck: Deck): PresentationAST {
    const sections: ASTSectionNode[] = [];
    let currentSection: ASTSectionNode = {
      id: "sec-main",
      title: "Main Presentation",
      slides: [],
    };

    deck.slides.forEach((slide, idx) => {
      if (slide.layout === "section" || idx === 0) {
        if (currentSection.slides.length > 0) {
          sections.push(currentSection);
        }
        currentSection = {
          id: `sec-${slide.id}`,
          title: slide.title || `Section ${sections.length + 1}`,
          slides: [slide],
        };
      } else {
        currentSection.slides.push(slide);
      }
    });

    if (currentSection.slides.length > 0) {
      sections.push(currentSection);
    }

    return {
      version: "1.0.0",
      metadata: {
        id: deck.id,
        title: deck.title,
        description: deck.description,
        topic: deck.topic,
        aspectRatio: deck.aspectRatio,
        themeId: deck.themeId,
        author: deck.author,
        createdAt: deck.createdAt,
        updatedAt: deck.updatedAt,
      },
      sections,
    };
  }

  public static astToDeck(ast: PresentationAST): Deck {
    const slides: Slide[] = [];
    ast.sections.forEach((sec) => {
      slides.push(...sec.slides);
    });

    return {
      id: ast.metadata.id,
      title: ast.metadata.title,
      description: ast.metadata.description,
      topic: ast.metadata.topic,
      themeId: ast.metadata.themeId,
      aspectRatio: (ast.metadata.aspectRatio as any) || "16:9",
      slides,
      createdAt: ast.metadata.createdAt,
      updatedAt: Date.now(),
      author: ast.metadata.author,
      tags: [],
    };
  }

  public static validateAST(ast: PresentationAST): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!ast.metadata.title) errors.push("Presentation AST missing root title.");
    if (!ast.sections || ast.sections.length === 0) errors.push("Presentation AST contains zero sections.");
    
    ast.sections.forEach((sec, sIdx) => {
      if (!sec.slides || sec.slides.length === 0) {
        errors.push(`Section index ${sIdx} (${sec.title}) has zero slides.`);
      }
      sec.slides.forEach((slide, slIdx) => {
        if (!slide.id) errors.push(`Slide [${sIdx}, ${slIdx}] missing unique ID.`);
      });
    });

    return { valid: errors.length === 0, errors };
  }
}
