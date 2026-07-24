-- Adds ai_results JSONB to every entity table for structured AI output storage.
-- Idempotent: uses IF NOT EXISTS guards.

ALTER TABLE IF EXISTS legal_documents ADD COLUMN IF NOT EXISTS ai_results JSONB;
ALTER TABLE IF EXISTS marital_assets ADD COLUMN IF NOT EXISTS ai_results JSONB;
ALTER TABLE IF EXISTS custody_cases ADD COLUMN IF NOT EXISTS ai_results JSONB;
ALTER TABLE IF EXISTS alimony_cases ADD COLUMN IF NOT EXISTS ai_results JSONB;
ALTER TABLE IF EXISTS generated_documents ADD COLUMN IF NOT EXISTS ai_results JSONB;
ALTER TABLE IF EXISTS mediation_sessions ADD COLUMN IF NOT EXISTS ai_results JSONB;
ALTER TABLE IF EXISTS court_filings ADD COLUMN IF NOT EXISTS ai_results JSONB;
ALTER TABLE IF EXISTS financial_disclosures ADD COLUMN IF NOT EXISTS ai_results JSONB;
ALTER TABLE IF EXISTS parenting_plans ADD COLUMN IF NOT EXISTS ai_results JSONB;
ALTER TABLE IF EXISTS property_valuations ADD COLUMN IF NOT EXISTS ai_results JSONB;
ALTER TABLE IF EXISTS legal_rights ADD COLUMN IF NOT EXISTS ai_results JSONB;
ALTER TABLE IF EXISTS settlement_agreements ADD COLUMN IF NOT EXISTS ai_results JSONB;
ALTER TABLE IF EXISTS child_support_cases ADD COLUMN IF NOT EXISTS ai_results JSONB;
ALTER TABLE IF EXISTS divorce_timelines ADD COLUMN IF NOT EXISTS ai_results JSONB;
ALTER TABLE IF EXISTS legal_glossary ADD COLUMN IF NOT EXISTS ai_results JSONB;

-- New: documents uploaded for AI review
CREATE TABLE IF NOT EXISTS uploaded_documents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(500) NOT NULL,
  document_type VARCHAR(100),
  size_bytes INTEGER,
  mime_type VARCHAR(100),
  text_content TEXT,
  ai_analysis TEXT,
  ai_results JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- New: multi-turn conversation thread per case
CREATE TABLE IF NOT EXISTS case_conversations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  case_table VARCHAR(64),
  case_id INTEGER,
  title VARCHAR(255),
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- New: state-specific legal facts cache (community vs equitable, waiting periods)
CREATE TABLE IF NOT EXISTS state_legal_facts (
  id SERIAL PRIMARY KEY,
  state_code VARCHAR(2) UNIQUE NOT NULL,
  property_regime VARCHAR(40),
  mandatory_waiting_period_days INTEGER,
  residency_requirement_months INTEGER,
  notes TEXT,
  source VARCHAR(255),
  updated_at TIMESTAMP DEFAULT NOW()
);
