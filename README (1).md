# ⚡ SmartLead
### Built at Dolphin Hacks 2025

> AI-powered business lead discovery and qualification engine.

Input your business profile. Get 5 scored, qualified leads with outreach strategies and deal valuations — instantly.

---

## 🚀 What It Does

| Feature | Description |
|---|---|
| 🔍 **Lead Discovery** | Generates 5 qualified leads matching your business profile |
| 📊 **Lead Scoring** | AI scores each lead 0–100 based on buying intent signals |
| 💰 **Deal Valuation** | Estimates monthly and annual deal value per lead |
| 🎯 **Outreach Strategy** | 4-step personalised contact plan per lead |
| 💾 **Save to DB** | Persist leads to SQLite database via Python backend |
| 📥 **Export CSV** | Download all leads as a spreadsheet |
| 🔎 **Filter & Sort** | Filter by Hot/Strong/Warm, sort by score or deal value |

---

## 📁 File Structure & Team Ownership

```
SmartLead/
├── index.html      ← Person 1 (Frontend)  — page structure & all screens
├── style.css       ← Person 1 (Frontend)  — full design system & animations
├── app.js          ← Person 2 (Backend)   — lead engine, scoring, rendering, canvas
├── server.py       ← Person 2 (Backend)   — Flask API + Claude AI integration
├── database.sql    ← Person 3 (Overall)   — SQLite schema, seed data, views
└── README.md       ← Person 3 (Overall)   — documentation
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3 (custom design system), Vanilla JavaScript |
| Backend | Python 3, Flask, Flask-CORS |
| Database | SQLite3 (via Python) |
| AI | Claude API (Haiku) — optional enhancement |
| Fonts | Bebas Neue, Cabinet Grotesk, JetBrains Mono |

---

## ⚙️ Setup — Frontend Only (no install needed)

Just open `index.html` in any browser. Works instantly with no server.

```bash
open index.html       # Mac
start index.html      # Windows
```

---

## ⚙️ Setup — Full Stack (Python backend + DB)

### 1. Install dependencies
```bash
pip install flask flask-cors anthropic
```

### 2. Set up the database
```bash
sqlite3 smartlead.db < database.sql
```

### 3. Add your API key (optional — for AI-powered leads)
Edit `server.py` line 20:
```python
API_KEY = "sk-ant-your-key-here"
```
Get your key at [console.anthropic.com](https://console.anthropic.com)

### 4. Run the server
```bash
python server.py
```
API will be live at `http://localhost:5000`

---

## 🌿 Git Workflow

```bash
# Each person works on their branch
git checkout -b frontend    # Person 1
git checkout -b backend     # Person 2
git checkout -b database    # Person 3

# Daily push routine
git add .
git commit -m "describe your change"
git push origin your-branch

# Merge at Hour 6 and Hour 10 — Person 3 coordinates
```

---

## 🎯 Demo Script (for the pitch)

**Setup:** Open `index.html` in Chrome, full screen

**Step 1:** Fill in:
- Business: `Digital Marketing Agency`
- Target: `Small restaurants and cafés`
- Service: `Social media management & paid ads`
- Location: `Miami, FL`
- Deal Size: `$2K–$10K/mo`

**Step 2:** Click "Discover Leads" — show the animated radar scan

**Step 3:** Point out the lead score rings filling up, the pipeline total, hot leads count

**Step 4:** Click a lead card to expand — show outreach strategy + deal value

**Step 5:** Click "Export CSV" — a real file downloads

**Step 6:** Click "Save to DB" — show the database panel appear

---

## 📡 API Endpoints (when server.py is running)

| Method | Endpoint | Description |
|---|---|---|
| GET  | `/` | Health check |
| POST | `/api/generate` | Generate leads for a business profile |
| GET  | `/api/leads` | Get all leads from DB |
| POST | `/api/save` | Save a lead for follow-up |
| GET  | `/api/saved` | Get all saved leads |
| GET  | `/api/stats` | Aggregate pipeline statistics |
| GET  | `/api/search/:id` | Get a specific search + its leads |

---

## 👥 Team

| Person | Role | Files |
|---|---|---|
| Person 1 | Frontend / UI | `index.html`, `style.css` |
| Person 2 | Backend / AI Logic | `app.js`, `server.py` |
| Person 3 | Overall / Pitch | `database.sql`, `README.md`, demo |

---

## 🏁 Hackathon Info

- **Event:** Dolphin Hacks 2025
- **Track:** Business
- **Duration:** 12 hours
