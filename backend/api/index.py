import os
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List

app = FastAPI(title="BelieversFlow API", version="2.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")

class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    taskContext: str = ""

class ChatResponse(BaseModel):
    message: str

class HealthResponse(BaseModel):
    status: str
    version: str
    groq_configured: bool

@app.get("/api/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="ok",
        version="2.3.0",
        groq_configured=bool(GROQ_API_KEY),
    )

@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    if not GROQ_API_KEY:
        raise HTTPException(status_code=503, detail="GROQ API key not configured on server")

    system_content = (
        "You are a compassionate Christian mentor and life coach. "
        "Respond with warmth, scripture wisdom, and practical advice. "
        "Keep responses concise (2-4 sentences). Use 1 relevant emoji."
    )
    if req.taskContext:
        system_content += f"\nThe user's current tasks are: {req.taskContext}"

    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": system_content},
            *[{"role": m.role, "content": m.content} for m in req.messages],
        ],
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
            return ChatResponse(message=data["choices"][0]["message"]["content"])
    except httpx.HTTPStatusError as e:
        detail = f"GROQ API error: {e.response.status_code}"
        try: detail += f" - {e.response.json()}"
        except: detail += f" - {e.response.text[:200]}"
        raise HTTPException(status_code=e.response.status_code, detail=detail)
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Failed to reach GROQ API")
