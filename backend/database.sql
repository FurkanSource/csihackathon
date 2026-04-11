-- ============================================================
--  SmartLead — backend/database.sql
--  Full schema, indexes, views, and seed data
--
--  Run: sqlite3 smartlead.db < database.sql
-- ============================================================

DROP TABLE IF EXISTS saved_leads;
DROP TABLE IF EXISTS leads;
DROP TABLE IF EXISTS searches;

-- Searches: every time a user runs a lead scan
CREATE TABLE searches (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    biz_type    TEXT    NOT NULL,
    target      TEXT    NOT NULL,
    service     TEXT    NOT NULL,
    location    TEXT,
    deal_size   TEXT    DEFAULT 'medium',
    created_at  TEXT    DEFAULT (datetime('now'))
);

-- Leads: individual lead records per search
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
    signals         TEXT,
    outreach        TEXT,
    saved           INTEGER DEFAULT 0,
    created_at      TEXT    DEFAULT (datetime('now'))
);

-- Saved leads: pinned for follow-up
CREATE TABLE saved_leads (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id   INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    notes     TEXT,
    status    TEXT DEFAULT 'new',
    saved_at  TEXT DEFAULT (datetime('now'))
);

-- ── INDEXES ───────────────────────────────────────────────
CREATE INDEX idx_leads_search ON leads(search_id);
CREATE INDEX idx_leads_score  ON leads(score DESC);
CREATE INDEX idx_leads_saved  ON leads(saved);
CREATE INDEX idx_saved_lead   ON saved_leads(lead_id);
CREATE INDEX idx_saved_status ON saved_leads(status);

-- ── SEED DATA ─────────────────────────────────────────────
INSERT INTO searches (biz_type, target, service, location, deal_size)
VALUES ('Digital Marketing Agency', 'Small restaurants and cafés', 'Social media & paid ads', 'Miami, FL', 'medium');

INSERT INTO leads (search_id, company_name, industry, city, size, decision_maker, score, monthly_value, annual_value, reason, pain_point, signals, saved)
VALUES
(1,'Apex Ventures','Hospitality','Miami, FL','11–50 employees','CMO',92,4800,57600,'Apex Ventures is a fast-growing hospitality company in Miami with a recent funding round, signaling active budget allocation. They are currently lacking a strong digital presence making them a perfect fit for social media management.','lacking digital presence','["Recently raised funding","Actively hiring"]',1),
(1,'Sterling Group','Food & Beverage','Miami Beach, FL','2–10 employees','Founder',87,3200,38400,'Sterling Group is an independent F&B operator expanding to new locations and urgently needs consistent brand presence. Their high review volume shows customer engagement that paid ads can amplify.','inconsistent lead generation','["Expanding to new markets","High review volume"]',0),
(1,'Nexus Collective','Retail','Fort Lauderdale, FL','51–200 employees','Marketing Director',78,5600,67200,'Nexus Collective is a mid-size retailer currently rebranding with low measurable ROI on traditional ads. A shift to social media management could dramatically improve their conversion rates.','spending too much on manual processes','["Rebranding underway","Actively hiring"]',0),
(1,'Meridian Co','Hospitality','Coral Gables, FL','2–10 employees','CEO',71,2800,33600,'Meridian Co is a boutique hospitality business with strong in-person reviews but minimal digital footprint. Social media presence would directly translate their existing reputation into new customers.','losing customers to competitors','["High review volume","New product launched"]',0),
(1,'Cascade Studio','Food & Beverage','Miami, FL','11–50 employees','Head of Growth',63,2200,26400,'Cascade Studio is a growing food concept with franchise ambitions but lacking the marketing infrastructure to support that growth. A consistent social strategy is their most immediate need.','unable to scale operations','["Expanding to new markets"]',0);

INSERT INTO saved_leads (lead_id, notes, status)
VALUES (1, 'Spoke to CMO at networking event. Follow up Monday.', 'contacted');

-- ── VIEWS ─────────────────────────────────────────────────
CREATE VIEW hot_leads AS
    SELECT l.*, s.biz_type, s.service
    FROM leads l JOIN searches s ON s.id = l.search_id
    WHERE l.score >= 85 ORDER BY l.score DESC;

CREATE VIEW pipeline_summary AS
    SELECT
        s.biz_type, s.location,
        COUNT(l.id)             AS total_leads,
        ROUND(AVG(l.score), 1) AS avg_score,
        SUM(l.annual_value)    AS total_pipeline,
        MAX(l.annual_value)    AS top_deal,
        COUNT(CASE WHEN l.score >= 85 THEN 1 END) AS hot_leads,
        s.created_at
    FROM searches s LEFT JOIN leads l ON l.search_id = s.id
    GROUP BY s.id ORDER BY s.created_at DESC;

-- ── USEFUL QUERIES ────────────────────────────────────────
-- SELECT * FROM hot_leads;
-- SELECT * FROM pipeline_summary;
-- SELECT company_name, score, monthly_value FROM leads ORDER BY score DESC LIMIT 10;
-- UPDATE saved_leads SET status = 'contacted' WHERE lead_id = 1;
