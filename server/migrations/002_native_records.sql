-- Additive native domain storage. No DROP, no seeded identities, no legal/AI evidence.
BEGIN;
CREATE TABLE IF NOT EXISTS legal_documents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  description TEXT,
  content TEXT,
  parties VARCHAR(500),
  status VARCHAR(50) DEFAULT 'pending',
  ai_analysis TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marital_assets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(500) NOT NULL,
  asset_type VARCHAR(100) NOT NULL,
  estimated_value DECIMAL(15,2),
  ownership VARCHAR(100),
  acquisition_date DATE,
  description TEXT,
  notes TEXT,
  ai_analysis TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS custody_cases (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  child_name VARCHAR(255) NOT NULL,
  child_age INTEGER,
  current_arrangement VARCHAR(255),
  desired_arrangement VARCHAR(255),
  special_needs TEXT,
  parent_situation TEXT,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'active',
  ai_analysis TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alimony_cases (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  requesting_income DECIMAL(12,2),
  paying_income DECIMAL(12,2),
  marriage_duration INTEGER,
  standard_of_living VARCHAR(255),
  health_conditions TEXT,
  employment_status VARCHAR(255),
  state VARCHAR(50),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'active',
  ai_analysis TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generated_documents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  party1_name VARCHAR(255),
  party2_name VARCHAR(255),
  jurisdiction VARCHAR(255),
  key_terms TEXT,
  special_provisions TEXT,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  ai_analysis TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mediation_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  topic VARCHAR(500) NOT NULL,
  dispute_type VARCHAR(100),
  party1_position TEXT,
  party2_position TEXT,
  previous_attempts TEXT,
  key_concerns TEXT,
  desired_outcome TEXT,
  scheduled_date DATE,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'scheduled',
  ai_analysis TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS court_filings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  filing_type VARCHAR(100) NOT NULL,
  jurisdiction VARCHAR(255),
  case_type VARCHAR(100),
  description TEXT,
  urgency VARCHAR(50) DEFAULT 'normal',
  filing_date DATE,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  ai_analysis TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS financial_disclosures (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  disclosure_type VARCHAR(100),
  annual_income DECIMAL(12,2),
  monthly_expenses DECIMAL(12,2),
  total_assets DECIMAL(15,2),
  total_debts DECIMAL(15,2),
  employment_type VARCHAR(100),
  description TEXT,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  ai_analysis TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS parenting_plans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  children_details TEXT,
  schedule_type VARCHAR(100),
  holiday_plan TEXT,
  communication_method VARCHAR(255),
  special_considerations TEXT,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  ai_analysis TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS property_valuations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  property_name VARCHAR(500) NOT NULL,
  property_type VARCHAR(100),
  address TEXT,
  estimated_value DECIMAL(15,2),
  mortgage_balance DECIMAL(15,2),
  ownership_type VARCHAR(100),
  acquisition_date DATE,
  description TEXT,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  ai_analysis TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS legal_rights (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  category VARCHAR(100),
  state VARCHAR(50),
  description TEXT,
  situation TEXT,
  notes TEXT,
  ai_analysis TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settlement_agreements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  agreement_type VARCHAR(100),
  party1_name VARCHAR(255),
  party2_name VARCHAR(255),
  key_terms TEXT,
  asset_division TEXT,
  support_terms TEXT,
  custody_terms TEXT,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  ai_analysis TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS child_support_cases (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  custodial_income DECIMAL(12,2),
  non_custodial_income DECIMAL(12,2),
  num_children INTEGER,
  children_ages VARCHAR(255),
  custody_arrangement VARCHAR(255),
  healthcare_costs DECIMAL(10,2),
  childcare_costs DECIMAL(10,2),
  state VARCHAR(50),
  special_needs TEXT,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'active',
  ai_analysis TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS divorce_timelines (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  divorce_type VARCHAR(100),
  state VARCHAR(50),
  filing_date DATE,
  is_contested BOOLEAN DEFAULT FALSE,
  has_children BOOLEAN DEFAULT FALSE,
  has_property BOOLEAN DEFAULT FALSE,
  current_phase VARCHAR(100),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'planning',
  ai_analysis TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS legal_glossary (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  term VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  definition TEXT,
  context TEXT,
  ai_analysis TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS court_dates (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  case_type VARCHAR(100),
  case_id INTEGER,
  title VARCHAR(500) NOT NULL,
  date TIMESTAMP NOT NULL,
  description TEXT,
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS state_law_research_templates (
 id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 state_code VARCHAR(2) NOT NULL, research_question TEXT NOT NULL, notes TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS parenting_exchange_incidents (
 id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 child TEXT NOT NULL, exchange_date DATE NOT NULL, location TEXT, category TEXT NOT NULL,
 severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low','medium','high')), follow_up TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS navigation_operations_records (
 id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 task TEXT NOT NULL, owner TEXT NOT NULL DEFAULT 'User', priority TEXT NOT NULL DEFAULT 'Medium', status TEXT NOT NULL DEFAULT 'Queued',
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE legal_documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE legal_documents ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE legal_documents ADD COLUMN IF NOT EXISTS demo_key TEXT;
ALTER TABLE legal_documents ADD COLUMN IF NOT EXISTS demo_label TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS legal_documents_native_demo_key ON legal_documents(user_id,demo_key) WHERE demo_key IS NOT NULL;

ALTER TABLE marital_assets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE marital_assets ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE marital_assets ADD COLUMN IF NOT EXISTS demo_key TEXT;
ALTER TABLE marital_assets ADD COLUMN IF NOT EXISTS demo_label TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS marital_assets_native_demo_key ON marital_assets(user_id,demo_key) WHERE demo_key IS NOT NULL;

ALTER TABLE custody_cases ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE custody_cases ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE custody_cases ADD COLUMN IF NOT EXISTS demo_key TEXT;
ALTER TABLE custody_cases ADD COLUMN IF NOT EXISTS demo_label TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS custody_cases_native_demo_key ON custody_cases(user_id,demo_key) WHERE demo_key IS NOT NULL;

ALTER TABLE alimony_cases ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE alimony_cases ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE alimony_cases ADD COLUMN IF NOT EXISTS demo_key TEXT;
ALTER TABLE alimony_cases ADD COLUMN IF NOT EXISTS demo_label TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS alimony_cases_native_demo_key ON alimony_cases(user_id,demo_key) WHERE demo_key IS NOT NULL;

ALTER TABLE generated_documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE generated_documents ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE generated_documents ADD COLUMN IF NOT EXISTS demo_key TEXT;
ALTER TABLE generated_documents ADD COLUMN IF NOT EXISTS demo_label TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS generated_documents_native_demo_key ON generated_documents(user_id,demo_key) WHERE demo_key IS NOT NULL;

ALTER TABLE mediation_sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE mediation_sessions ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE mediation_sessions ADD COLUMN IF NOT EXISTS demo_key TEXT;
ALTER TABLE mediation_sessions ADD COLUMN IF NOT EXISTS demo_label TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS mediation_sessions_native_demo_key ON mediation_sessions(user_id,demo_key) WHERE demo_key IS NOT NULL;

ALTER TABLE court_filings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE court_filings ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE court_filings ADD COLUMN IF NOT EXISTS demo_key TEXT;
ALTER TABLE court_filings ADD COLUMN IF NOT EXISTS demo_label TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS court_filings_native_demo_key ON court_filings(user_id,demo_key) WHERE demo_key IS NOT NULL;

ALTER TABLE financial_disclosures ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE financial_disclosures ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE financial_disclosures ADD COLUMN IF NOT EXISTS demo_key TEXT;
ALTER TABLE financial_disclosures ADD COLUMN IF NOT EXISTS demo_label TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS financial_disclosures_native_demo_key ON financial_disclosures(user_id,demo_key) WHERE demo_key IS NOT NULL;

ALTER TABLE parenting_plans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE parenting_plans ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE parenting_plans ADD COLUMN IF NOT EXISTS demo_key TEXT;
ALTER TABLE parenting_plans ADD COLUMN IF NOT EXISTS demo_label TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS parenting_plans_native_demo_key ON parenting_plans(user_id,demo_key) WHERE demo_key IS NOT NULL;

ALTER TABLE property_valuations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE property_valuations ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE property_valuations ADD COLUMN IF NOT EXISTS demo_key TEXT;
ALTER TABLE property_valuations ADD COLUMN IF NOT EXISTS demo_label TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS property_valuations_native_demo_key ON property_valuations(user_id,demo_key) WHERE demo_key IS NOT NULL;

ALTER TABLE legal_rights ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE legal_rights ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE legal_rights ADD COLUMN IF NOT EXISTS demo_key TEXT;
ALTER TABLE legal_rights ADD COLUMN IF NOT EXISTS demo_label TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS legal_rights_native_demo_key ON legal_rights(user_id,demo_key) WHERE demo_key IS NOT NULL;

ALTER TABLE settlement_agreements ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE settlement_agreements ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE settlement_agreements ADD COLUMN IF NOT EXISTS demo_key TEXT;
ALTER TABLE settlement_agreements ADD COLUMN IF NOT EXISTS demo_label TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS settlement_agreements_native_demo_key ON settlement_agreements(user_id,demo_key) WHERE demo_key IS NOT NULL;

ALTER TABLE child_support_cases ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE child_support_cases ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE child_support_cases ADD COLUMN IF NOT EXISTS demo_key TEXT;
ALTER TABLE child_support_cases ADD COLUMN IF NOT EXISTS demo_label TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS child_support_cases_native_demo_key ON child_support_cases(user_id,demo_key) WHERE demo_key IS NOT NULL;

ALTER TABLE divorce_timelines ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE divorce_timelines ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE divorce_timelines ADD COLUMN IF NOT EXISTS demo_key TEXT;
ALTER TABLE divorce_timelines ADD COLUMN IF NOT EXISTS demo_label TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS divorce_timelines_native_demo_key ON divorce_timelines(user_id,demo_key) WHERE demo_key IS NOT NULL;

ALTER TABLE legal_glossary ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE legal_glossary ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE legal_glossary ADD COLUMN IF NOT EXISTS demo_key TEXT;
ALTER TABLE legal_glossary ADD COLUMN IF NOT EXISTS demo_label TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS legal_glossary_native_demo_key ON legal_glossary(user_id,demo_key) WHERE demo_key IS NOT NULL;

ALTER TABLE court_dates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE court_dates ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE court_dates ADD COLUMN IF NOT EXISTS demo_key TEXT;
ALTER TABLE court_dates ADD COLUMN IF NOT EXISTS demo_label TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS court_dates_native_demo_key ON court_dates(user_id,demo_key) WHERE demo_key IS NOT NULL;

ALTER TABLE uploaded_documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE uploaded_documents ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE uploaded_documents ADD COLUMN IF NOT EXISTS demo_key TEXT;
ALTER TABLE uploaded_documents ADD COLUMN IF NOT EXISTS demo_label TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS uploaded_documents_native_demo_key ON uploaded_documents(user_id,demo_key) WHERE demo_key IS NOT NULL;

ALTER TABLE case_conversations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE case_conversations ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE case_conversations ADD COLUMN IF NOT EXISTS demo_key TEXT;
ALTER TABLE case_conversations ADD COLUMN IF NOT EXISTS demo_label TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS case_conversations_native_demo_key ON case_conversations(user_id,demo_key) WHERE demo_key IS NOT NULL;

ALTER TABLE state_law_research_templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE state_law_research_templates ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE state_law_research_templates ADD COLUMN IF NOT EXISTS demo_key TEXT;
ALTER TABLE state_law_research_templates ADD COLUMN IF NOT EXISTS demo_label TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS state_law_research_templates_native_demo_key ON state_law_research_templates(user_id,demo_key) WHERE demo_key IS NOT NULL;

ALTER TABLE parenting_exchange_incidents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE parenting_exchange_incidents ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE parenting_exchange_incidents ADD COLUMN IF NOT EXISTS demo_key TEXT;
ALTER TABLE parenting_exchange_incidents ADD COLUMN IF NOT EXISTS demo_label TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS parenting_exchange_incidents_native_demo_key ON parenting_exchange_incidents(user_id,demo_key) WHERE demo_key IS NOT NULL;

ALTER TABLE navigation_operations_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE navigation_operations_records ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE navigation_operations_records ADD COLUMN IF NOT EXISTS demo_key TEXT;
ALTER TABLE navigation_operations_records ADD COLUMN IF NOT EXISTS demo_label TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS navigation_operations_records_native_demo_key ON navigation_operations_records(user_id,demo_key) WHERE demo_key IS NOT NULL;

ALTER TABLE legal_documents ADD COLUMN IF NOT EXISTS ai_results JSONB;

ALTER TABLE marital_assets ADD COLUMN IF NOT EXISTS ai_results JSONB;

ALTER TABLE custody_cases ADD COLUMN IF NOT EXISTS ai_results JSONB;

ALTER TABLE alimony_cases ADD COLUMN IF NOT EXISTS ai_results JSONB;

ALTER TABLE generated_documents ADD COLUMN IF NOT EXISTS ai_results JSONB;

ALTER TABLE mediation_sessions ADD COLUMN IF NOT EXISTS ai_results JSONB;

ALTER TABLE court_filings ADD COLUMN IF NOT EXISTS ai_results JSONB;

ALTER TABLE financial_disclosures ADD COLUMN IF NOT EXISTS ai_results JSONB;

ALTER TABLE parenting_plans ADD COLUMN IF NOT EXISTS ai_results JSONB;

ALTER TABLE property_valuations ADD COLUMN IF NOT EXISTS ai_results JSONB;

ALTER TABLE legal_rights ADD COLUMN IF NOT EXISTS ai_results JSONB;

ALTER TABLE settlement_agreements ADD COLUMN IF NOT EXISTS ai_results JSONB;

ALTER TABLE child_support_cases ADD COLUMN IF NOT EXISTS ai_results JSONB;

ALTER TABLE divorce_timelines ADD COLUMN IF NOT EXISTS ai_results JSONB;

ALTER TABLE legal_glossary ADD COLUMN IF NOT EXISTS ai_results JSONB;

COMMIT;
