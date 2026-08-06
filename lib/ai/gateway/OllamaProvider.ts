export const OLLAMA_URL = "http://127.0.0.1:11434/api/generate";

export interface OllamaConfig {
  baseUrl: string;
  model: string;
}

export class OllamaProvider {
  providerId = "ollama";
  model: string;
  private baseUrl: string;

  constructor(config?: Partial<OllamaConfig>) {
    this.model = config?.model || "qwen3.5:latest";
    this.baseUrl = config?.baseUrl || OLLAMA_URL;
  }

  async askOllama(prompt: string): Promise<string> {
    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: this.model, prompt, stream: false }),
    });
    if (!res.ok) throw new Error(`Ollama API Error (${res.status}): ${await res.text()}`);
    const data = await res.json();
    return data.response;
  }

  async chat(
    messages: { role: string; content: string }[],
    _options?: { signal?: AbortSignal }
  ): Promise<string> {
    const prompt = messages
      .map((m) => `${m.role.toUpperCase()}:\n${m.content}`)
      .join("\n\n");
    return this.askOllama(prompt);
  }
}

export const ollamaProvider = new OllamaProvider();