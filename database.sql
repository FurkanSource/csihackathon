-- ============================================================
--  SmartLead — database.sql
--  Person 3 (Overall) can run this to set up the database
--  
--  Run with SQLite:
--    sqlite3 smartlead.db < database.sql
--
--  Or open in DB Browser for SQLite to view visually
-- ============================================================


-- ── SCHEMA ────────────────────────────────────────────────────────────

-- Drop existing tables (clean slate)
DROP TABLE IF EXISTS saved_leads;
DROP TABLE IF EXISTS leads;
DROP TABLE IF EXISTS searches;
DROP TABLE IF EXISTS users;

-- Users (for future multi-user support)
CREATE TABLE users (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT    NOT NULL,
    email        TEXT    NOT NULL UNIQUE,
    company      TEXT,
    plan         TEXT    DEFAULT 'free',   -- free | pro | enterprise
    created_at   TEXT    DEFAULT (datetime('now')),
    last_login   TEXT
);

-- Searches: every time someone runs a lead search
CREATE TABLE searches (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER REFERENCES users(id),
    biz_type     TEXT    NOT NULL,
    target       TEXT    NOT NULL,
    service      TEXT    NOT NULL,
    location     TEXT,
    deal_size    TEXT    DEFAULT 'medium',
    leads_found  INTEGER DEFAULT 0,
    created_at   TEXT    DEFAULT (datetime('now'))
);

-- Leads: individual lead records from each search
CREATE TABLE leads (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    search_id       INTEGER NOT NULL REFERENCES searches(id) ON DELETE CASCADE,
    company_name    TEXT    NOT NULL,
    industry        TEXT,
    city            TEXT,
    size            TEXT,
    decision_maker  TEXT,
    score           INTEGER CHECK(score BETWEEN 0 AND 100),
    monthly_value   INTEGER,
    annual_value    INTEGER,
    reason          TEXT,
    pain_point      TEXT,
    signals         TEXT,   -- JSON array stored as string
    outreach        TEXT,   -- JSON array stored as string
    saved           INTEGER DEFAULT 0,
    created_at      TEXT    DEFAULT (datetime('now'))
);

-- Saved leads: leads a user pinned for follow-up
CREATE TABLE saved_leads (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id     INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id     INTEGER REFERENCES users(id),
    notes       TEXT,
    status      TEXT    DEFAULT 'new',  -- new | contacted | qualified | closed | lost
    saved_at    TEXT    DEFAULT (datetime('now')),
    updated_at  TEXT    DEFAULT (datetime('now'))
);


-- ── INDEXES ───────────────────────────────────────────────────────────

CREATE INDEX idx_leads_search    ON leads(search_id);
CREATE INDEX idx_leads_score     ON leads(score DESC);
CREATE INDEX idx_leads_saved     ON leads(saved);
CREATE INDEX idx_searches_user   ON searches(user_id);
CREATE INDEX idx_saved_lead      ON saved_leads(lead_id);
CREATE INDEX idx_saved_user      ON saved_leads(user_id);
CREATE INDEX idx_saved_status    ON saved_leads(status);


-- ── SEED DATA ─────────────────────────────────────────────────────────

-- Demo user
INSERT INTO users (name, email, company, plan) VALUES
    ('Demo User', 'demo@smartlead.ai', 'SmartLead Inc.', 'pro');

-- Sample search
INSERT INTO searches (user_id, biz_type, target, service, location, deal_size, leads_found) VALUES
    (1, 'Digital Marketing Agency', 'Small restaurants and cafés', 'Social media management & paid ads', 'Miami, FL', 'medium', 5);

-- Sample leads from that search
INSERT INTO leads (search_id, company_name, industry, city, size, decision_maker, score, monthly_value, annual_value, reason, pain_point, signals, saved) VALUES
    (1, 'Apex Ventures',      'Hospitality',    'Miami, FL',        '11–50 employees',   'CMO',                      92, 4800, 57600,
     'Apex Ventures is a growing hospitality company in Miami currently struggling with inconsistent social media presence. Their recent funding round signals active budget allocation for marketing services.',
     'lacking a strong digital presence', '["Recently raised funding","Actively hiring","New product launched"]', 1),

    (1, 'Sterling Group',     'Food & Beverage','Miami Beach, FL',  '2–10 employees',    'Founder',                  87, 3200, 38400,
     'Sterling Group is an independent F&B operator expanding to new locations and urgently needs consistent brand presence across social channels.',
     'losing customers to competitors', '["Expanding to new markets","High review volume"]', 0),

    (1, 'Nexus Collective',   'Retail',         'Fort Lauderdale, FL','51–200 employees','Marketing Director',        78, 5600, 67200,
     'Nexus Collective is a mid-size retailer that is currently spending too much on traditional advertising with low measurable ROI.',
     'spending too much time on manual processes', '["Rebranding underway","Actively hiring"]', 0),

    (1, 'Meridian Co',        'Hospitality',    'Coral Gables, FL', '2–10 employees',    'CEO',                      71, 2800, 33600,
     'Meridian Co is a boutique hospitality business with strong in-person reviews but minimal digital footprint.',
     'unable to scale operations', '["High review volume","New product launched"]', 0),

    (1, 'Cascade Studio',     'Food & Beverage','Miami, FL',        '11–50 employees',   'Head of Growth',           63, 2200, 26400,
     'Cascade Studio is a growing food concept with ambitions to franchise, currently lacking the marketing infrastructure to support that growth.',
     'struggling with inconsistent lead generation', '["Expanding to new markets"]', 0);

-- Save the top lead
INSERT INTO saved_leads (lead_id, user_id, notes, status) VALUES
    (1, 1, 'Great fit — spoke to CMO at networking event. Follow up Monday.', 'contacted');


-- ── VIEWS ─────────────────────────────────────────────────────────────

-- Hot leads view (score >= 85)
CREATE VIEW hot_leads AS
    SELECT l.*, s.biz_type, s.service
    FROM leads l
    JOIN searches s ON s.id = l.search_id
    WHERE l.score >= 85
    ORDER BY l.score DESC;

-- Pipeline summary view
CREATE VIEW pipeline_summary AS
    SELECT
        s.biz_type,
        s.location,
        COUNT(l.id)             AS total_leads,
        ROUND(AVG(l.score), 1) AS avg_score,
        SUM(l.annual_value)    AS total_pipeline,
        MAX(l.annual_value)    AS top_deal,
        COUNT(CASE WHEN l.score >= 85 THEN 1 END) AS hot_leads,
        s.created_at
    FROM searches s
    LEFT JOIN leads l ON l.search_id = s.id
    GROUP BY s.id
    ORDER BY s.created_at DESC;

-- Saved leads with full details
CREATE VIEW saved_with_details AS
    SELECT
        sl.id        AS saved_id,
        sl.status,
        sl.notes,
        sl.saved_at,
        l.company_name,
        l.industry,
        l.city,
        l.decision_maker,
        l.score,
        l.monthly_value,
        l.annual_value,
        l.pain_point,
        s.biz_type,
        s.service
    FROM saved_leads sl
    JOIN leads l    ON l.id  = sl.lead_id
    JOIN searches s ON s.id  = l.search_id
    ORDER BY l.score DESC;


-- ── USEFUL QUERIES ─────────────────────────────────────────────────────

-- Get all hot leads:
--   SELECT * FROM hot_leads;

-- Get pipeline summary:
--   SELECT * FROM pipeline_summary;

-- Get saved leads ready to contact:
--   SELECT * FROM saved_with_details WHERE status = 'new';

-- Get total pipeline value across all searches:
--   SELECT SUM(annual_value) as total_pipeline FROM leads;

-- Get top 10 leads by score:
--   SELECT company_name, score, city, monthly_value FROM leads ORDER BY score DESC LIMIT 10;

-- Update a lead status after contacting:
--   UPDATE saved_leads SET status = 'contacted', updated_at = datetime('now') WHERE lead_id = 1;
