# Governance Hub — Usage_Monitor

Enterprise AI governance and usage monitoring platform. Control and track how teams use AI (OpenAI, Gemini, etc.) through a single proxy, with budgets, audit trails, and PII redaction.

## What it does

- **Single proxy** for all AI API calls — teams call your backend instead of providers directly.
- **Role-based dashboards** — Admin (full control), Team Lead (unit view), Member (personal usage).
- **Budget enforcement** — Per-team token budgets; requests blocked when exhausted.
- **Audit trail** — Logs of usage (team, model, tokens, cost, time).
- **PII redaction** — Scans and redacts emails, phones, credit-card-like patterns before sending to AI; logs policy violations.
- **Model catalog** — Admin-managed list of models, API keys, and pricing used for routing and cost calculation.

## Tech stack

| Part      | Stack                          |
|-----------|---------------------------------|
| Frontend  | React 19, Vite, Tailwind, Recharts |
| Backend   | FastAPI (Python), SQLModel      |
| Database  | SQLite                         |

## Project structure

```
governance_hub/
├── frontend/          # React app (Vite)
├── backend/           # FastAPI app
│   ├── app/
│   │   ├── api/       # admin, proxy, lead, member routes
│   │   ├── models/    # DB models
│   │   ├── services/  # pricing, redactor
│   │   └── db/        # database
│   ├── init_db.py
│   ├── seed_user.py
│   ├── seed_models.py
│   └── simulate_usage.py
└── README.md
```

## Getting started

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
# Create DB and seed (if needed): python init_db.py, python seed_user.py, python seed_models.py
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

- Frontend: http://localhost:5173  
- Backend API: http://localhost:8000  

### AI usage (via proxy)

Send requests to `POST http://localhost:8000/proxy/chat` with:

- `x-team-key`: team ingestion key (from Admin or Lead dashboard)
- `x-user-email`: user email
- Body: e.g. `{ "model": "gpt-4o", "messages": [...] }`

Use `backend/simulate_usage.py` (with your team key) to test the proxy.

## Roles

| Role       | Route              | Access                          |
|------------|--------------------|----------------------------------|
| admin      | /admin-dashboard   | Stats, teams, catalog, violations, audit |
| team_lead  | /lead-dashboard    | Team stats, credentials, unit audit      |
| member     | /member-dashboard  | Personal stats, credentials, own audit   |

Login at `/login`; redirect depends on role.
