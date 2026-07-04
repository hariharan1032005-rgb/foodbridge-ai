# 🍱 FoodBridge AI — Multi-Agent Food Waste Redistribution Platform

> A production-ready AI platform connecting food donors with NGOs using an 8-agent LangGraph + Gemini architecture.

![Tech Stack](https://img.shields.io/badge/FastAPI-0.104-green) ![React](https://img.shields.io/badge/React-19-blue) ![Gemini](https://img.shields.io/badge/Gemini-AI-orange) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)

---

## 🏗️ Architecture

```
foodbridge_ai/
├── backend/                    # FastAPI + Python
│   ├── app/
│   │   ├── agents/             # 8 AI Agents
│   │   │   ├── food_analysis_agent.py     # Gemini food freshness scoring
│   │   │   ├── shelf_life_agent.py        # ML shelf-life prediction
│   │   │   ├── matching_agent.py          # Smart NGO matching
│   │   │   ├── demand_prediction_agent.py # Demand forecasting
│   │   │   ├── route_optimization_agent.py # OpenStreetMap routing
│   │   │   ├── notification_agent.py      # Auto notifications
│   │   │   ├── recommendation_agent.py    # AI recommendations
│   │   │   ├── analytics_agent.py         # Impact analytics
│   │   │   └── workflow.py                # LangGraph orchestrator
│   │   ├── api/v1/endpoints/   # REST API routes
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic validators
│   │   ├── services/           # Business logic
│   │   ├── core/               # Config, Security (JWT)
│   │   └── db/                 # Async PostgreSQL
│   └── requirements.txt
└── frontend/                   # React + Vite
    └── src/
        ├── pages/              # 9 page components
        ├── components/         # Sidebar, etc.
        ├── context/            # AuthContext (JWT)
        └── api/                # Axios client
```

## 🤖 8-Agent AI Pipeline

| Agent | Role | Technology |
|-------|------|-----------|
| `FoodAnalysisAgent` | Freshness + quality scoring | Google Gemini |
| `ShelfLifeAgent` | Predict remaining shelf life | ML + rules |
| `SmartMatchingAgent` | NGO matching (7 factors) | Gemini + scoring |
| `DemandPredictionAgent` | NGO demand forecasting | Statistical ML |
| `RouteOptimizationAgent` | Pickup route planning | OSRM / OpenStreetMap |
| `NotificationAgent` | Auto alerts for users | FastAPI + DB |
| `RecommendationAgent` | Pickup time + NGO suggestions | Gemini |
| `AnalyticsAgent` | Impact metrics + CO₂ tracking | Pure Python |

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone and start everything
cd foodbridge_ai
docker-compose up -d
```

- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs

### Option 2: Manual Setup

#### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env with your DB URL and GEMINI_API_KEY

# Run server
uvicorn app.main:app --reload --port 8000
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:3000

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@foodbridge.ai | admin123 |
| Donor | donor@foodbridge.ai | donor123 |
| NGO | ngo@foodbridge.ai | ngo123 |
| Volunteer | volunteer@foodbridge.ai | volunteer123 |

> ⚠️ These are only available if you seed the database. The backend auto-creates tables on startup.

## 🌐 API Endpoints

| Module | Endpoint | Description |
|--------|----------|-------------|
| Auth | `POST /api/v1/auth/register` | Register user |
| Auth | `POST /api/v1/auth/login` | Get JWT token |
| Donations | `POST /api/v1/donations/` | Post donation (triggers AI pipeline) |
| Donations | `GET /api/v1/donations/` | List donations |
| NGO | `GET /api/v1/ngo/matches` | Get AI-matched donations |
| NGO | `GET /api/v1/ngo/demand-prediction` | AI demand forecast |
| Volunteer | `GET /api/v1/volunteer/assignments` | Get pickup tasks |
| Dashboard | `GET /api/v1/dashboard/stats` | Platform statistics |
| Reports | `GET /api/v1/reports/analytics` | Impact report |

Full interactive docs: **http://localhost:8000/docs**

## 🔧 Environment Variables

```env
# .env (copy from .env.example)
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/foodbridge_db
SECRET_KEY=your-super-secret-jwt-key
GEMINI_API_KEY=your-gemini-api-key-here
```

## 📊 Tech Stack

**Backend:** FastAPI, SQLAlchemy 2.0 (async), PostgreSQL, asyncpg, Pydantic v2, python-jose (JWT), Passlib (bcrypt), aiofiles

**AI/ML:** Google Gemini API, LangGraph, scikit-learn, NumPy, Pandas

**Frontend:** React 19, Vite 8, React Router v7, Recharts, React Leaflet, Lucide React, Axios, React Hot Toast

**Infrastructure:** Docker, Docker Compose, Alembic (migrations)

## 📁 Key Features

- ✅ Role-based access (Admin, Donor, NGO, Volunteer)
- ✅ JWT authentication with auto-refresh
- ✅ AI freshness scoring with Gemini
- ✅ Automated NGO matching with explanations
- ✅ Interactive route map with React Leaflet
- ✅ Real-time dashboard with Recharts
- ✅ CSV/JSON report generation
- ✅ Notification system
- ✅ Image upload for food donations
- ✅ Docker ready for deployment
