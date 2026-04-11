"""
SmartLead — server.py
Person 2 (Backend) owns this file
Flask API server that connects frontend to SQLite DB and Claude AI

Install dependencies:
    pip install flask flask-cors anthropic

Run:
    python server.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import json
import os
import time
import random
import string
from datetime import datetime

# Optional: Claude AI integration
try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False

# ── CONFIG ────────────────────────────────────────────────────────────
API_KEY  = os.environ.get("ANTHROPIC_API_KEY", "YOUR_API_KEY_HERE")
DB_PATH  = "smartlead.db"
PORT     = 5000
DEBUG    = True

app = Flask(__name__)
CORS(app)  # Allow frontend to call this API

# ── DATABASE SETUP ────────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Create tables if they don't exist"""
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS searches (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            biz_type    TEXT NOT NULL,
            target      TEXT NOT NULL,
            service     TEXT NOT NULL,
            location    TEXT,
            deal_size   TEXT,
            created_at  TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS leads (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            search_id       INTEGER REFERENCES searches(id),
            company_name    TEXT NOT NULL,
            industry        TEXT,
            city            TEXT,
            size            TEXT,
            decision_maker  TEXT,
            score           INTEGER,
            monthly_value   INTEGER,
            annual_value    INTEGER,
            reason          TEXT,
            pain_point      TEXT,
            signals         TEXT,
            outreach        TEXT,
            saved           INTEGER DEFAULT 0,
            created_at      TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS saved_leads (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            lead_id     INTEGER REFERENCES leads(id),
            notes       TEXT,
            status      TEXT DEFAULT 'new',
            saved_at    TEXT DEFAULT (datetime('now'))
        );
    """)
    conn.commit()
    conn.close()
    print("[DB] Tables initialized")

# ── ROUTES ────────────────────────────────────────────────────────────

@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "service":  "SmartLead API",
        "version":  "2.0",
        "status":   "running",
        "endpoints": ["/api/generate", "/api/leads", "/api/save", "/api/saved", "/api/stats"]
    })


@app.route("/api/generate", methods=["POST"])
def generate_leads():
    """
    Generate leads for a given business profile.
    Optionally uses Claude AI if API key is set.
    """
    data      = request.get_json()
    biz       = data.get("biz_type", "").strip()
    target    = data.get("target", "").strip()
    service   = data.get("service", "").strip()
    location  = data.get("location", "").strip()
    deal_size = data.get("deal_size", "medium")

    if not biz or not target or not service:
        return jsonify({"error": "biz_type, target, and service are required"}), 400

    # Save search to DB
    conn = get_db()
    cur  = conn.execute(
        "INSERT INTO searches (biz_type, target, service, location, deal_size) VALUES (?,?,?,?,?)",
        (biz, target, service, location or None, deal_size)
    )
    search_id = cur.lastrowid
    conn.commit()

    # Generate leads
    if ANTHROPIC_AVAILABLE and API_KEY != "YOUR_API_KEY_HERE":
        leads = generate_with_ai(biz, target, service, location, deal_size)
    else:
        leads = generate_mock_leads(biz, target, service, location, deal_size)

    # Save leads to DB
    for lead in leads:
        conn.execute("""
            INSERT INTO leads
              (search_id, company_name, industry, city, size, decision_maker,
               score, monthly_value, annual_value, reason, pain_point, signals, outreach)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (
            search_id,
            lead["name"], lead["industry"], lead["city"], lead["size"], lead["decisionMaker"],
            lead["score"], lead["monthly"], lead["annual"],
            lead["reason"], lead["painPoint"],
            json.dumps(lead["signals"]), json.dumps(lead["outreach"])
        ))
    conn.commit()
    conn.close()

    return jsonify({ "search_id": search_id, "leads": leads })


@app.route("/api/leads", methods=["GET"])
def get_all_leads():
    """Return all leads from the database"""
    conn  = get_db()
    rows  = conn.execute("SELECT * FROM leads ORDER BY score DESC LIMIT 100").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/save", methods=["POST"])
def save_lead():
    """Save a lead to the saved_leads table"""
    data    = request.get_json()
    lead_id = data.get("lead_id")
    notes   = data.get("notes", "")
    status  = data.get("status", "new")

    if not lead_id:
        return jsonify({"error": "lead_id required"}), 400

    conn = get_db()
    conn.execute(
        "UPDATE leads SET saved = 1 WHERE id = ?", (lead_id,)
    )
    conn.execute(
        "INSERT INTO saved_leads (lead_id, notes, status) VALUES (?,?,?)",
        (lead_id, notes, status)
    )
    conn.commit()
    conn.close()
    return jsonify({"success": True, "lead_id": lead_id})


@app.route("/api/saved", methods=["GET"])
def get_saved_leads():
    """Return all saved leads with full details"""
    conn = get_db()
    rows = conn.execute("""
        SELECT l.*, s.notes, s.status, s.saved_at
        FROM saved_leads s
        JOIN leads l ON l.id = s.lead_id
        ORDER BY s.saved_at DESC
    """).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/stats", methods=["GET"])
def get_stats():
    """Return aggregate stats across all searches"""
    conn  = get_db()
    stats = conn.execute("""
        SELECT
          COUNT(DISTINCT s.id)    AS total_searches,
          COUNT(l.id)             AS total_leads,
          AVG(l.score)            AS avg_score,
          SUM(l.annual_value)     AS total_pipeline,
          MAX(l.annual_value)     AS top_deal,
          COUNT(CASE WHEN l.score >= 85 THEN 1 END) AS hot_leads
        FROM searches s
        LEFT JOIN leads l ON l.search_id = s.id
    """).fetchone()
    conn.close()
    return jsonify(dict(stats))


@app.route("/api/search/<int:search_id>", methods=["GET"])
def get_search(search_id):
    """Return a specific search and its leads"""
    conn   = get_db()
    search = conn.execute("SELECT * FROM searches WHERE id = ?", (search_id,)).fetchone()
    leads  = conn.execute("SELECT * FROM leads WHERE search_id = ? ORDER BY score DESC", (search_id,)).fetchall()
    conn.close()
    if not search:
        return jsonify({"error": "Search not found"}), 404
    return jsonify({ "search": dict(search), "leads": [dict(l) for l in leads] })


# ── MOCK DATA GENERATOR ───────────────────────────────────────────────
PREFIXES  = ['Apex','Summit','Pinnacle','Nexus','Vantage','Sterling','Crest','Meridian','Horizon','Zenith','Cascade','Vertex']
SUFFIXES  = ['Solutions','Group','Partners','Co','Ventures','Collective','Studio','Works','Labs','Agency','Consulting','Dynamics']
INDUSTRIES = ['Technology','Hospitality','Healthcare','Finance','Retail','Real Estate','Education','Manufacturing','Legal','Logistics']
SIZES     = ['2–10 employees','11–50 employees','51–200 employees','201–500 employees']
ROLES     = ['CEO','Founder','Marketing Director','COO','Head of Growth','VP of Operations','CMO','Managing Director']
CITIES    = ['New York, NY','Los Angeles, CA','Chicago, IL','Houston, TX','Miami, FL','Seattle, WA','Austin, TX','Boston, MA']
SIGNALS   = ['Recently raised funding','Actively hiring','New product launched','Rebranding underway','Expanding to new markets','High review volume']
PAINS     = [
    'struggling with inconsistent lead generation and client acquisition',
    'lacking a strong digital presence in an increasingly competitive market',
    'spending too much time on manual processes',
    'losing customers to competitors with stronger online visibility',
    'unable to scale operations without better systems',
]
DEAL_RANGES = {
    'small':      (500,    2000),
    'medium':     (2000,   10000),
    'large':      (10000,  50000),
    'enterprise': (50000,  200000)
}

def generate_mock_leads(biz, target, service, location, deal_size):
    used, leads = set(), []
    min_val, max_val = DEAL_RANGES.get(deal_size, DEAL_RANGES['medium'])

    for _ in range(5):
        name = f"{random.choice(PREFIXES)} {random.choice(SUFFIXES)}"
        while name in used:
            name = f"{random.choice(PREFIXES)} {random.choice(SUFFIXES)}"
        used.add(name)

        score    = random.randint(55, 97)
        industry = random.choice(INDUSTRIES)
        city     = location if location else random.choice(CITIES)
        size     = random.choice(SIZES)
        dm       = random.choice(ROLES)
        pain     = random.choice(PAINS)
        signals  = random.sample(SIGNALS, k=random.randint(2, 4))
        monthly  = round((min_val + (max_val - min_val) * (score / 100)) / 100) * 100
        annual   = monthly * 12

        leads.append({
            "name":          name,
            "score":         score,
            "industry":      industry,
            "city":          city,
            "size":          size,
            "decisionMaker": dm,
            "painPoint":     pain,
            "signals":       signals,
            "monthly":       monthly,
            "annual":        annual,
            "reason":        f"{name} is a {size} {industry.lower()} company in {city} that is currently {pain}. Their {signals[0].lower()} makes them an ideal candidate for {service}.",
            "outreach":      [
                f"Connect with their {dm} on LinkedIn referencing their {signals[0].lower()}",
                f"Send a personalised email highlighting ROI from similar {industry.lower()} clients",
                "Offer a free 20-minute strategy call to demonstrate immediate value",
                "Follow up in 3–5 days with a relevant case study"
            ]
        })

    return sorted(leads, key=lambda x: x["score"], reverse=True)


def generate_with_ai(biz, target, service, location, deal_size):
    """Use Claude API to generate intelligent leads"""
    client = anthropic.Anthropic(api_key=API_KEY)
    prompt = f"""You are a business intelligence engine. Generate 5 realistic potential business leads.

Business: {biz}
Target Customer: {target}  
Service: {service}
Location: {location or 'Anywhere'}
Deal Size: {deal_size}

Return ONLY a JSON array of 5 lead objects. Each object must have:
- name: string (company name)
- score: integer 55-97 (lead quality score)
- industry: string
- city: string
- size: string (employee range)
- decisionMaker: string (job title)
- painPoint: string (their current problem)
- signals: array of 2-4 strings (buying signals)
- monthly: integer (monthly deal value in USD)
- annual: integer (monthly * 12)
- reason: string (why they're a good lead, 2 sentences)
- outreach: array of 4 strings (step-by-step outreach plan)

No extra text. No markdown. Just the JSON array."""

    msg    = client.messages.create(model="claude-haiku-4-5-20251001", max_tokens=2000, messages=[{"role":"user","content":prompt}])
    raw    = msg.content[0].text.strip()
    clean  = raw.replace("```json","").replace("```","").strip()
    return json.loads(clean)


# ── ENTRY POINT ───────────────────────────────────────────────────────
if __name__ == "__main__":
    init_db()
    print(f"\n🚀 SmartLead API running at http://localhost:{PORT}")
    print(f"   AI Mode: {'ENABLED' if (ANTHROPIC_AVAILABLE and API_KEY != 'YOUR_API_KEY_HERE') else 'DISABLED (mock data)'}\n")
    app.run(debug=DEBUG, port=PORT)
