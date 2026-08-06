from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import os

from extractor import extract_bytes, extract_url

app = FastAPI(title="Lumina AI Presentation API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerateRequest(BaseModel):
    input: str
    sourceType: str = "prompt"
    slideCount: int = 12
    tone: str = "Professional"
    theme: Optional[str] = None
    provider: Optional[str] = "openai"
    model: Optional[str] = "gpt-4o"
    apiKey: Optional[str] = None

class RewriteRequest(BaseModel):
    text: str
    mode: str = "improve"
    provider: Optional[str] = "openai"
    model: Optional[str] = "gpt-4o"
    apiKey: Optional[str] = None

@app.get("/")
def health_check():
    return {"status": "ok", "service": "lumina-backend"}


@app.post("/api/extract")
async def extract_file_endpoint(
    file: UploadFile = File(...),
    ocr: bool = Form(True),
):
    """Strong OCR / document extraction. Returns clean text from any file.

    Accepts PDF, DOCX, PPTX, XLSX, CSV, TXT, MD, HTML, RTF and image files
    (PNG/JPG/WEBP/BMP/TIFF). PDFs get embedded-text extraction first, with
    automatic OCR fallback for scanned pages.
    """
    try:
        data = await file.read()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not read upload: {exc}")

    if not data:
        raise HTTPException(status_code=400, detail="Empty file uploaded")

    if len(data) > 200 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (max 200 MB)")

    res = extract_bytes(file.filename or "upload.bin", data, ocr=ocr)
    if res.method == "error":
        raise HTTPException(status_code=422, detail=res.warnings[0] if res.warnings else "Extraction failed")
    return res.to_dict()


@app.post("/api/extract-url")
async def extract_url_endpoint(
    req: GenerateRequest,
    ocr: bool = True,
):
    """Extract text from a remote URL (PDF, HTML, image)."""
    if not req.input.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="Provide a valid http(s) URL")
    try:
        res = extract_url(req.input, ocr=ocr)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Could not fetch URL: {exc}")
    if res.method == "error":
        raise HTTPException(status_code=422, detail=res.warnings[0] if res.warnings else "Extraction failed")
    return res.to_dict()


@app.post("/api/research")
def research_topic(req: GenerateRequest):
    return {
        "summary": f"Comprehensive research data on {req.input}",
        "citations": [
            {"id": "1", "title": f"Latest insights on {req.input}", "url": "https://wikipedia.org", "source": "Wikipedia", "snippet": f"Overview of {req.input}"}
        ],
        "facts": [
            {"claim": f"{req.input} is transforming modern workflows.", "source": "Industry Research"}
        ]
    }

@app.post("/api/rewrite")
def rewrite_text(req: RewriteRequest):
    txt = req.text
    if req.mode == "shorter":
        txt = " ".join(txt.split()[:15]) + "..."
    elif req.mode == "professional":
        txt = f"From a strategic perspective, {txt.lower()}"
    return {"result": txt}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
