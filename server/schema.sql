DROP TABLE IF EXISTS legal_glossary CASCADE;
DROP TABLE IF EXISTS divorce_timelines CASCADE;
DROP TABLE IF EXISTS child_support_cases CASCADE;
DROP TABLE IF EXISTS settlement_agreements CASCADE;
DROP TABLE IF EXISTS legal_rights CASCADE;
DROP TABLE IF EXISTS property_valuations CASCADE;
DROP TABLE IF EXISTS parenting_plans CASCADE;
DROP TABLE IF EXISTS financial_disclosures CASCADE;
DROP TABLE IF EXISTS court_filings CASCADE;
DROP TABLE IF EXISTS mediation_sessions CASCADE;
DROP TABLE IF EXISTS generated_documents CASCADE;
DROP TABLE IF EXISTS alimony_cases CASCADE;
DROP TABLE IF EXISTS custody_cases CASCADE;
DROP TABLE IF EXISTS marital_assets CASCADE;
DROP TABLE IF EXISTS legal_documents CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE legal_documents (
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

CREATE TABLE marital_assets (
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

CREATE TABLE custody_cases (
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

CREATE TABLE alimony_cases (
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

CREATE TABLE generated_documents (
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

CREATE TABLE mediation_sessions (
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

CREATE TABLE court_filings (
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

CREATE TABLE financial_disclosures (
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

CREATE TABLE parenting_plans (
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

CREATE TABLE property_valuations (
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

CREATE TABLE legal_rights (
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

CREATE TABLE settlement_agreements (
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

CREATE TABLE child_support_cases (
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

CREATE TABLE divorce_timelines (
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

CREATE TABLE legal_glossary (
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
