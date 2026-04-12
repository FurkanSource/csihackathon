<<<<<<< HEAD
# ⚡ SmartLead
### Built at Dolphin Hacks 2026 — Business Track

> AI-powered business lead discovery, scoring, and outreach platform.

---

## 🚀 What It Does

Input your business profile → get 5 scored, qualified leads with outreach strategies and deal valuations in seconds.

| Output | Description |
|---|---|
| 🔍 Lead Discovery | 5 qualified leads matching your profile |
| 📊 Lead Scoring | AI scores each lead 0–100 |
| 💰 Deal Valuation | Monthly + annual deal estimate |
| 🎯 Outreach Strategy | 4-step personalized contact plan |
| 💾 Save to DB | Persist leads to SQLite via Flask |
| 📥 Export CSV | Download leads as spreadsheet |

---

## 📁 File Structure

```
csihackathon/
├── client/                      ← React + Vite frontend
│   ├── public/index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx       ← Top navigation bar
│   │   │   ├── Navbar.css
│   │   │   ├── LeadCard.jsx     ← Expandable lead card
│   │   │   ├── LeadCard.css
│   │   │   ├── SummaryCard.jsx  ← Dashboard stat card
│   │   │   ├── SummaryCard.css
│   │   │   ├── LoadingScreen.jsx← Animated loading state
│   │   │   ├── LoadingScreen.css
│   │   │   ├── FilterBar.jsx    ← Filter + sort controls
│   │   │   └── ResultsHeader.jsx← Results page header
│   │   ├── utils/
│   │   │   └── formatters.js    ← Shared utility functions
│   │   ├── data/
│   │   │   └── sampleData.js    ← Mock lead generator
│   │   ├── App.jsx              ← Main app + all screens
│   │   ├── App.css              ← App-level styles
│   │   ├── main.jsx             ← React entry point
│   │   └── index.css            ← Global CSS variables
│   ├── package.json
│   └── vite.config.js           ← Vite + Flask proxy config
│
├── backend/
│   ├── server.py                ← Flask API (7 endpoints)
│   ├── database.sql             ← Schema + seed data
│   ├── requirements.txt         ← Python dependencies
│   └── smartlead.db             ← SQLite database (auto-created)
│
├── .gitignore
└── README.md
```

---

## 👥 Team Roles

| Person | Role | Files |
|---|---|---|
| Person 1 | Frontend / UI | All files in `client/src/components/`, `App.css`, `index.css` |
| Person 2 | Backend / Logic | `App.jsx`, `backend/server.py`, `utils/formatters.js`, `data/sampleData.js` |
| Person 3 | Overall / Pitch | `backend/database.sql`, `README.md`, demo prep |

---

## ⚙️ Setup & Run

### Frontend
```bash
cd client
npm install
npm run dev
# Runs at http://localhost:3000
```

### Backend
```bash
cd backend
pip install -r requirements.txt
sqlite3 smartlead.db < database.sql
python server.py
# Runs at http://localhost:5000
```

> The frontend proxies `/api` calls to the Flask backend automatically via `vite.config.js`.
> If the backend is offline, the app falls back to mock data seamlessly.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET  | `/` | Health check |
| POST | `/api/generate` | Generate leads for a business profile |
| GET  | `/api/leads` | All leads from database |
| POST | `/api/save` | Save a lead for follow-up |
| GET  | `/api/saved` | All saved leads |
| GET  | `/api/stats` | Aggregate pipeline stats |

### POST `/api/generate` — Request body
```json
{
  "biz_type":  "Digital Marketing Agency",
  "target":    "Small restaurants",
  "service":   "Social media management",
  "location":  "Miami, FL",
  "deal_size": "medium"
}
```

---

## 🌿 Git Workflow

```bash
git checkout -b frontend    # Person 1
git checkout -b backend     # Person 2
git checkout -b database    # Person 3

git add .
git commit -m "your change"
git push origin your-branch
```
Merge into `main` at Hour 6 and Hour 10. Person 3 coordinates merges.

---

## 🎯 Demo Script

1. Open `http://localhost:3000`
2. Fill in: Agency / Restaurants / Social Media / Miami, FL
3. Click **Discover Leads** — show the radar scan animation
4. Point out: score rings filling up, pipeline total, hot leads count
5. Click a lead card to expand — show deal value + outreach steps
6. Click **Export CSV** — file downloads instantly
7. Click **Save to DB** — database panel appears

---

## 🏁 Hackathon Info
- **Event:** Dolphin Hacks 2025 · Business Track · 12 hours
=======
You are a startup product engineer.

Build a hackathon-winning web app called "SmartLead".

Concept:
A business lead discovery and qualification tool.

Inputs:
Business type
Target customer
Service offered
Location (optional)

Outputs:
List of 5 potential leads (simulated)
Lead score (0-100)
Reason they are a good lead
Suggested outreach strategy
Estimated deal value

UI:
Dark SaaS dashboard
Lead cards
Score badges
Clean modern design
Responsive

Technical:
HTML CSS JavaScript only
No backend
Use mock lead data
Simulate scoring logic

Make it visually impressive for judges.

Return full working code.
>>>>>>> eb0f96d58939b09595cf0fc01102059cb8085e68
