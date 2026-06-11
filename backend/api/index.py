import os
import httpx
import json
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.requests import Request
from pydantic import BaseModel, Field
from typing import List, Optional

app = FastAPI(title="BelieversFlow API", version="3.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")

OSIS_NAMES = {
    "Genesis": "Gen", "Exodus": "Exod", "Leviticus": "Lev", "Numbers": "Num",
    "Deuteronomy": "Deut", "Joshua": "Josh", "Judges": "Judg", "Ruth": "Ruth",
    "1 Samuel": "1Sam", "2 Samuel": "2Sam", "1 Kings": "1Kgs", "2 Kings": "2Kgs",
    "1 Chronicles": "1Chr", "2 Chronicles": "2Chr", "Ezra": "Ezra", "Nehemiah": "Neh",
    "Esther": "Esth", "Job": "Job", "Psalm": "Ps", "Proverbs": "Prov",
    "Ecclesiastes": "Eccl", "Song of Solomon": "Song", "Isaiah": "Isa", "Jeremiah": "Jer",
    "Lamentations": "Lam", "Ezekiel": "Ezek", "Daniel": "Dan", "Hosea": "Hos",
    "Joel": "Joel", "Amos": "Amos", "Obadiah": "Obad", "Jonah": "Jonah",
    "Micah": "Mic", "Nahum": "Nah", "Habakkuk": "Hab", "Zephaniah": "Zeph",
    "Haggai": "Hag", "Zechariah": "Zech", "Malachi": "Mal",
    "Matthew": "Matt", "Mark": "Mark", "Luke": "Luke", "John": "John",
    "Acts": "Acts", "Romans": "Rom", "1 Corinthians": "1Cor", "2 Corinthians": "2Cor",
    "Galatians": "Gal", "Ephesians": "Eph", "Philippians": "Phil", "Colossians": "Col",
    "1 Thessalonians": "1Thess", "2 Thessalonians": "2Thess", "1 Timothy": "1Tim",
    "2 Timothy": "2Tim", "Titus": "Titus", "Philemon": "Phlm", "Hebrews": "Heb",
    "James": "Jas", "1 Peter": "1Pet", "2 Peter": "2Pet", "1 John": "1John",
    "2 John": "2John", "3 John": "3John", "Jude": "Jude", "Revelation": "Rev",
}

class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    taskContext: str = ""

class ExplainVerseRequest(BaseModel):
    reference: str
    text: str
    version: str = "KJV"

class CommentaryRequest(BaseModel):
    book: str
    chapter: int
    verses: Optional[List[dict]] = None

class ConcordanceRequest(BaseModel):
    query: str
    version: str = "KJV"

async def call_groq(system_prompt: str, user_message: str, temperature: float = 0.7) -> str:
    if not GROQ_API_KEY:
        raise HTTPException(status_code=503, detail="GROQ API key not configured on server")
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        "temperature": temperature,
    }
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]
    except httpx.HTTPStatusError as e:
        detail = f"GROQ API error: {e.response.status_code}"
        raise HTTPException(status_code=e.response.status_code, detail=detail)
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Failed to reach GROQ API")

async def fetch_bible_kjv(book: str, chapter: int) -> dict:
    url = f"https://bible-api.com/{book.replace(' ', '+')}+{chapter}"
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        data = resp.json()
    return {
        "reference": data.get("reference", f"{book} {chapter}"),
        "verses": [{"verse": v["verse"], "text": v["text"]} for v in data.get("verses", [])],
        "version": "KJV",
        "chapter": f"{book} {chapter}",
    }

async def fetch_bible_groq(book: str, chapter: int, version: str) -> dict:
    system = (
        "You are a Bible text provider. Your only job is to output the exact text of the requested "
        "Bible chapter in the specified translation. Output ONLY valid JSON in this exact format:\n"
        '{"verses": [{"verse": <number>, "text": "<verse text>"}]}\n'
        "Do not include any other text, commentary, or formatting outside the JSON."
    )
    prompt = f"Provide the text of {book} Chapter {chapter} from the {version} Bible translation. Output ONLY the JSON array of verses with 'verse' number and 'text' fields."
    raw = await call_groq(system, prompt, temperature=0.1)
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[-1]
        raw = raw.rsplit("```", 1)[0]
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        lines = raw.strip().split("\n")
        verses = []
        for line in lines:
            parts = line.split(". ", 1)
            if len(parts) == 2 and parts[0].isdigit():
                verses.append({"verse": int(parts[0]), "text": parts[1]})
        data = {"verses": verses} if verses else {"verses": []}
    return {
        "reference": f"{book} {chapter}",
        "verses": data.get("verses", []),
        "version": version,
        "chapter": f"{book} {chapter}",
    }

class HymnRequest(BaseModel):
    title: str
    author: str = ""
    lyrics: str = ""
    question: str = "Explain the meaning of this hymn"

class DevotionalRequest(BaseModel):
    topic: str = ""
    verse: str = ""
    theme: str = "faith"

@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "3.1.0", "groq_configured": bool(GROQ_API_KEY)}

@app.get("/api/bible/versions")
async def list_versions():
    return {
        "versions": [
            {"id": "KJV", "name": "King James Version"},
            {"id": "NKJV", "name": "New King James Version"},
            {"id": "NIV", "name": "New International Version"},
            {"id": "ESV", "name": "English Standard Version"},
            {"id": "NASB", "name": "New American Standard Bible"},
            {"id": "NLT", "name": "New Living Translation"},
            {"id": "CSB", "name": "Christian Standard Bible"},
            {"id": "AMP", "name": "Amplified Bible"},
            {"id": "ASV", "name": "American Standard Version"},
            {"id": "RSV", "name": "Revised Standard Version"},
            {"id": "GNB", "name": "Good News Bible"},
            {"id": "WEB", "name": "World English Bible"},
        ]
    }

@app.get("/api/bible")
async def get_bible(book: str = Query(...), chapter: int = Query(...), version: str = Query("KJV")):
    try:
        if version == "KJV":
            return await fetch_bible_kjv(book, chapter)
        return await fetch_bible_groq(book, chapter, version)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def chat(req: ChatRequest):
    if not GROQ_API_KEY:
        raise HTTPException(status_code=503, detail="GROQ API key not configured on server")
    system = (
        "You are a compassionate Christian mentor and life coach. "
        "Respond with warmth, scripture wisdom, and practical advice. "
        "Write in plain natural language. Use only punctuation marks for formatting. "
        "Do not use emojis, asterisks, hash symbols, tildes, or any special characters. "
        "Do not use markdown formatting of any kind. "
        "Use plain English sentences only. "
        "Keep responses concise, 2-4 sentences."
    )
    if req.taskContext:
        system += f"\nThe user's current tasks are: {req.taskContext}"
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": system},
            *[{"role": m.role, "content": m.content} for m in req.messages],
        ],
    }
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
            return {"message": data["choices"][0]["message"]["content"]}
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail="GROQ API error")
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Failed to reach GROQ API")

@app.post("/api/bible/explain")
async def explain_verse(req: ExplainVerseRequest):
    system = (
        "You are a Bible scholar and teacher. Explain the given verse in simple, clear language. "
        "Write in plain natural language. Use only punctuation marks for formatting. "
        "Do not use emojis, asterisks, hash symbols, tildes, or any special characters. "
        "Do not use markdown formatting. Use plain paragraphs and sentences. "
        "Where appropriate, use bullet points introduced with a dash."
    )
    prompt = (
        f"Explain this verse ({req.reference}, {req.version}):\n"
        f"'{req.text}'\n\n"
        f"Provide:\n"
        f"- Simple meaning: What this verse means in plain language\n"
        f"- Historical context: The background and cultural setting\n"
        f"- Key lessons: What we can learn from this verse\n"
        f"- Practical application: How to apply this today\n"
        f"Format with clear section headings. Keep each section to 2-3 sentences."
    )
    explanation = await call_groq(system, prompt, temperature=0.5)
    return {"reference": req.reference, "version": req.version, "explanation": explanation}

@app.post("/api/bible/commentary")
async def get_commentary(req: CommentaryRequest):
    verses_text = ""
    if req.verses:
        verses_text = "\n".join([f"Verse {v.get('verse', '?')}: {v.get('text', '')}" for v in req.verses[:30]])
    system = (
        "You are a Bible commentary writer. Provide insightful, faithful commentary. "
        "Write in plain natural language. Use only punctuation marks for formatting. "
        "Do not use emojis, asterisks, hash symbols, tildes, or any special characters. "
        "Do not use markdown formatting. Use plain paragraphs with clear section headings."
    )
    prompt = (
        f"Provide a Bible commentary on {req.book} Chapter {req.chapter}:\n\n"
        f"{verses_text}\n\n"
        f"Include:\n"
        f"- Chapter overview: The main theme and structure of this chapter\n"
        f"- Key themes: Major theological themes present\n"
        f"- Verse-by-verse insights: Important observations on key verses\n"
        f"- Cross-references: Related passages elsewhere in Scripture\n"
        f"- Practical application: How this chapter applies to daily Christian living\n"
        f"Make it accessible for everyday readers."
    )
    commentary = await call_groq(system, prompt, temperature=0.4)
    return {"book": req.book, "chapter": req.chapter, "commentary": commentary}

@app.post("/api/bible/concordance")
async def search_concordance(req: ConcordanceRequest):
    system = (
        "You are a Bible concordance expert. Find relevant Bible passages for any topic or word. "
        "Write in plain natural language. Use only punctuation marks for formatting. "
        "Do not use emojis, asterisks, hash symbols, tildes, or any special characters. "
        f"{f'Use the {req.version} translation for all verses.' if req.version else ''}"
    )
    prompt = (
        f"Search the Bible for the topic or word: '{req.query}'\n\n"
        f"Provide:\n"
        f"- Key verses: List 8-10 significant Bible verses related to this topic, with full verse text\n"
        f"- Old Testament references: Key OT passages\n"
        f"- New Testament references: Key NT passages\n"
        f"- Major themes connected to this topic\n"
        f"Format each verse as: BOOK CHAPTER:VERSE - TEXT"
    )
    results = await call_groq(system, prompt, temperature=0.3)
    return {"query": req.query, "version": req.version, "results": results}

@app.post("/api/hymns/explain")
async def explain_hymn(req: HymnRequest):
    system = (
        "You are a hymn historian and worship expert. Explain the meaning, history, and significance "
        "of the given hymn. Write in plain natural language. Do not use emojis, asterisks, "
        "hash symbols, tildes, or markdown formatting. Use only plain English paragraphs."
    )
    prompt = (
        f"Hymn: {req.title}\n"
        f"Author: {req.author or 'Unknown'}\n\n"
        f"Lyrics extract:\n{req.lyrics[:1000]}\n\n"
        f"Question: {req.question}\n\n"
        f"Provide:\n"
        f"- The historical background of this hymn\n"
        f"- The meaning of its key lyrics and themes\n"
        f"- Its significance in Christian worship\n"
        f"- How it can encourage believers today\n"
        f"Keep each section to 2-3 sentences."
    )
    explanation = await call_groq(system, prompt, temperature=0.5)
    return {"title": req.title, "explanation": explanation}

@app.post("/api/devotional/generate")
async def generate_devotional(req: DevotionalRequest):
    system = (
        "You are a Christian devotional writer. Generate a short, encouraging devotional "
        "based on the given topic, verse, or theme. Write in plain natural language. "
        "Do not use emojis, asterisks, hash symbols, tildes, or markdown formatting. "
        "Use only plain English paragraphs."
    )
    prompt = (
        f"Topic: {req.topic or req.theme}\n"
        f"Verse: {req.verse or 'None provided'}\n\n"
        f"Write a short devotional (2-3 paragraphs) that includes:\n"
        f"- A relevant Bible verse with reference\n"
        f"- An encouraging reflection on the topic\n"
        f"- Practical application for daily life\n"
        f"- A brief closing prayer"
    )
    devotional = await call_groq(system, prompt, temperature=0.6)
    return {"topic": req.topic or req.theme, "devotional": devotional}

@app.get("/api/hymns/tune/{hymn_id}")
async def get_hymn_tune(hymn_id: int):
    try:
        from api.hymn_tunes import HYMN_TUNES
        tune = HYMN_TUNES.get(hymn_id)
        if not tune:
            raise HTTPException(status_code=404, detail="No tune data for this hymn")
        return {"id": hymn_id, "tune": tune}
    except ImportError as e:
        raise HTTPException(status_code=500, detail=f"Tune data not available: {str(e)}")

@app.post("/api/bible/compare")
async def compare_versions(req: CommentaryRequest):
    system = (
        "You are a Bible translation expert. Compare translations of the same passage. "
        "Write in plain natural language. Use only punctuation marks for formatting. "
        "Do not use emojis, asterisks, hash symbols, tildes, or any special characters. "
        "Do not use markdown formatting."
    )
    prompt = (
        f"Provide a verse-by-verse comparison for {req.book} Chapter {req.chapter}:\n\n"
        f"For each verse, show the text in key translations (KJV, NIV, ESV, NLT) "
        f"and explain notable differences in translation choices.\n\n"
        f"Focus on:\n"
        f"- Key differences: Where translations diverge significantly\n"
        f"- Translation philosophy: How formal vs dynamic equivalence affects meaning\n"
        f"- Original language: What the Hebrew or Greek actually says\n"
        f"- Which is most accurate: Guidance on which translation captures the original best\n\n"
        f"Keep each verse comparison to 2-3 sentences. Focus on the most interesting verses."
    )
    comparison = await call_groq(system, prompt, temperature=0.4)
    return {"book": req.book, "chapter": req.chapter, "comparison": comparison}
