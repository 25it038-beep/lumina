/**
 * Conversation Memory — short-lived, capped dialogue history for the
 * Planning Layer. Lets Llama reason over the full conversation thread
 * (previous prompts, refinements, user corrections) with bounded context.
 */

export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: number;
}

const DEFAULT_CAPACITY = 50;

class ConversationMemoryStore {
  private history: ConversationMessage[] = [];
  private capacity: number;

  constructor(capacity = DEFAULT_CAPACITY) {
    this.capacity = capacity;
  }

  get maxMessages(): number {
    return this.capacity;
  }

  add(role: ConversationMessage["role"], content: string) {
    this.history.push({ role, content, createdAt: Date.now() });
    if (this.history.length > this.capacity) {
      this.history = this.history.slice(this.history.length - this.capacity);
    }
  }

  all(): ConversationMessage[] {
    return [...this.history];
  }

  last(n: number): ConversationMessage[] {
    return this.history.slice(-n);
  }

  lastPrompt(): string {
    const users = this.history.filter((m) => m.role === "user");
    return users.length ? users[users.length - 1].content : "";
  }

  clear() {
    this.history = [];
  }

  setCapacity(capacity: number) {
    this.capacity = Math.max(2, capacity);
    if (this.history.length > this.capacity) this.history = this.history.slice(-this.capacity);
  }

  /** Compact conversation context with a bounded token budget. */
  summarize(maxMessages = 12): string {
    const recent = this.last(maxMessages);
    if (!recent.length) return "";
    return recent
      .map((m) => `[${m.role.toUpperCase()}]: ${m.content.slice(0, 800)}`)
      .join("\n");
  }
}

export const conversationMemoryStore = new ConversationMemoryStore();