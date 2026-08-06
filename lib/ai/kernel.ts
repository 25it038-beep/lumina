import { Deck, Slide, SlideElement, GenerationRequest } from "../types";

export type KernelEventType =
  | "AST_UPDATED"
  | "SLIDE_CHANGED"
  | "ELEMENT_MUTATED"
  | "AI_REASONING_STARTED"
  | "AI_REASONING_COMPLETED"
  | "DESIGN_RULES_EVALUATED"
  | "LIVE_COCREATION_TRIGGERED"
  | "COLLABORATION_PRESENCE_UPDATED"
  | "QUALITY_AUDIT_COMPLETED";

export interface KernelEvent<T = any> {
  type: KernelEventType;
  timestamp: number;
  payload: T;
  source: "user" | "ai" | "kernel" | "plugin";
}

type KernelEventListener<T = any> = (event: KernelEvent<T>) => void;

export class PresentationKernel {
  private listeners: Map<KernelEventType, Set<KernelEventListener>> = new Map();
  private activeDeck: Deck | null = null;
  private telemetryLogs: Array<{ timestamp: number; action: string; duration: number }> = [];

  constructor() {
    // Initialize default event channels
  }

  public setDeck(deck: Deck) {
    this.activeDeck = deck;
    this.emit({
      type: "AST_UPDATED",
      timestamp: Date.now(),
      payload: deck,
      source: "kernel",
    });
  }

  public getDeck(): Deck | null {
    return this.activeDeck;
  }

  public subscribe<T = any>(eventType: KernelEventType, listener: KernelEventListener<T>): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);

    return () => {
      this.listeners.get(eventType)?.delete(listener);
    };
  }

  public emit<T = any>(event: KernelEvent<T>) {
    const channel = this.listeners.get(event.type);
    if (channel) {
      channel.forEach((listener) => {
        try {
          listener(event);
        } catch (err) {
          console.error(`Kernel Event Listener Error [${event.type}]:`, err);
        }
      });
    }
  }

  public logTelemetry(action: string, duration: number) {
    this.telemetryLogs.push({ timestamp: Date.now(), action, duration });
    if (this.telemetryLogs.length > 500) {
      this.telemetryLogs.shift();
    }
  }

  public getTelemetryLogs() {
    return [...this.telemetryLogs];
  }
}

export const kernel = new PresentationKernel();
