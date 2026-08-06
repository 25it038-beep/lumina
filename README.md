# Lumina — Production-Grade AI Presentation Platform

Lumina is an AI-powered presentation platform that generates complete, beautiful presentations with editable elements, real-time preview, animations, 19 design themes, charts, icons, images, and professional export capabilities.

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, Framer Motion
- **Editor**: DOM-based interactive canvas with drag, resize, rotate, and layering
- **AI Engine**: Multi-model support (OpenAI, Claude, Gemini, OpenRouter, DeepSeek, Ollama, and offline local engine) with simulated research & citation generation
- **Export System**: PowerPoint (.pptx via PptxGenJS), PDF (via jsPDF & html2canvas), HTML, PNG, JPEG, SVG, Markdown, and Reveal.js
- **Backend (Python)**: FastAPI, LangGraph, LiteLLM

---

## Quick Start (Frontend)

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Quick Start (Backend)

```bash
cd backend
pip install -r requirements.txt
python main.py
```
