# FinanceAI Backend

Basic FastAPI backend for tomorrow's presentation.

## What it covers

- Auth: signup and login demo endpoints
- Profile: view and update profile
- Dashboard: portfolio summary, performance, allocation
- Uploads: upload requirements, recent uploads, CSV/Excel upload endpoint
- Risk analysis: score, alerts, trend, sector breakdown, recommendations
- Recommendations: stock picks, fit analysis, watchlist action
- Reports: templates, recent reports, generate and email report actions

## Run locally

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Open:

- API root: `http://127.0.0.1:8000/`
- Swagger docs: `http://127.0.0.1:8000/docs`

## Demo notes

- The backend uses in-memory demo data, so it is simple to explain in a presentation.
- CSV uploads are actually parsed and returned with preview rows.
- Excel uploads are accepted as demo metadata uploads.
- Generated reports are added to the in-memory recent reports list for the current server session.
