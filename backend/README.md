# BelieversFlow API

FastAPI backend for the BelieversFlow Christian task manager (v3.0.1).

## Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fecoinboxhub%2FChristian_task_manager&root-directory=backend&env=GROQ_API_KEY)

Or manually:
1. Go to https://vercel.com/import
2. Select `ecoinboxhub/Christian_task_manager`
3. Root Directory: `backend`
4. Add env: `GROQ_API_KEY` = your GROQ key
5. Deploy

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/chat` | POST | AI chat via GROQ |
| `/api/bible` | GET | Bible chapter proxy (non-KJV via GROQ) |
| `/api/bible/versions` | GET | List all supported Bible versions (12) |
| `/api/bible/explain` | POST | AI verse explanation |
| `/api/bible/commentary` | POST | AI verse-by-verse commentary |
| `/api/bible/concordance` | POST | AI word/topic concordance search |
| `/api/bible/compare` | POST | AI side-by-side translation comparison |

## Local Dev

```bash
cd backend
pip install -r requirements.txt
GROQ_API_KEY=your_key uvicorn api.index:app --reload
```
