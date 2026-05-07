# FinanceAI Backend

FastAPI backend for the FinanceAI portfolio app.

## Current Scope

- Auth with password hashing and bearer sessions
- Profile, dashboard, uploads, transactions, risk, recommendations, and reports APIs
- SQLite persistence for local/demo use
- AI insight endpoints with OpenAI Responses API support
- Local rule-based AI fallback when `OPENAI_API_KEY` is not configured
- CSV and Excel transaction imports
- Generated PDF, Excel, and CSV report files
- Optional Resend email delivery hook

## AI Endpoints

- `POST /api/ai/portfolio-summary`
- `POST /api/ai/risk-explanation`
- `POST /api/ai/recommendations`
- `POST /api/ai/report-insights`
- `POST /api/ai/chat`

AI output is educational only. The backend always returns a disclaimer and does not claim guaranteed returns.

## Environment

Copy `.env.example` and configure values in your host:

```env
FINANCEAI_DB_PATH=./financeai.db
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
SEED_DEMO_DATA=true
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.2
SESSION_TTL_HOURS=24
FINANCEAI_REPORTS_DIR=./generated_reports
RESEND_API_KEY=
REPORT_FROM_EMAIL=reports@financeai.local
```

For production, set `ALLOWED_ORIGINS` to the deployed frontend URL and keep `OPENAI_API_KEY` only on the backend.

Set `RESEND_API_KEY` only if you want email delivery to call Resend. Without it, report email requests are recorded as log-only queued deliveries.

## Run Locally

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Open:

- API root: `http://127.0.0.1:8000/`
- Health: `http://127.0.0.1:8000/api/health`
- Swagger docs: `http://127.0.0.1:8000/docs`

## Test

```powershell
cd backend
pytest
```

## Deployment Gaps That Still Need Real Accounts

- Live market prices require a market data provider/API key.
- Brokerage imports require provider-specific CSV mapping or brokerage OAuth access.
- Real email sending requires `RESEND_API_KEY` or another provider integration.
- SQLite is acceptable for a demo; use Postgres plus migrations for real users.

## Deploy Backend on Render

Use a Web Service with:

- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

Set environment variables:

- `ALLOWED_ORIGINS=https://your-frontend-domain`
- `OPENAI_API_KEY=...`
- `OPENAI_MODEL=gpt-5.2`
- `SEED_DEMO_DATA=true`

SQLite is fine for demo deployment. For real users, move to Postgres and add migrations.
